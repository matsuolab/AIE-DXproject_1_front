# ALB + Cognito 認証フロー

## シーケンス図

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー (Browser)
    participant S3 as CloudFront + S3<br/>(Reactアプリ)
    participant ALB as ALB<br/>(門番)
    participant Cognito as Cognito<br/>(認証画面)
    participant API as ECS Fargate<br/>(FastAPI)

    Note over User, S3: 1. アプリへのアクセス (未認証)
    User->>S3: https://myapp.com/ へアクセス
    S3-->>User: Reactアプリをロード

    Note over User, ALB: 2. API取得試行と失敗 (自動ログイン判定)
    User->>ALB: [fetch] /api/v1/courses (Cookieなし)
    ALB-->>User: 302 Redirect (Cognitoへ)
    Note right of User: 【重要】fetchはリダイレクトを追跡できず<br/>CORSエラー等で失敗する

    Note over User, Cognito: 3. ログインフロー開始 (ブラウザ全体での遷移)
    User->>User: エラーを検知し JSで強制遷移<br/>window.location.href = "/api/v1/login"
    User->>ALB: /api/v1/login へアクセス
    ALB-->>User: 302 Redirect (Cognito Hosted UIへ)
    User->>Cognito: ID / Password を入力
    Cognito-->>User: 302 Redirect (ALBへ戻る + 認証コード)

    Note over User, API: 4. セッション確立と「クッション役」のリダイレクト
    User->>ALB: /api/v1/login (認証コードを持って再アクセス)
    ALB->>Cognito: トークン交換と検証 (バックチャネル)
    ALB->>API: リクエストを転送 (/api/v1/login)
    Note right of API: JSONは返さず、フロントに戻す指令を出す<br/>return RedirectResponse("/")
    API-->>User: 307 Redirect (フロントの "/" へ)
    Note left of User: この時、ブラウザに<br/>AWSELBAuthSessionCookie が保存される

    Note over User, S3: 5. 認証済み状態でのアプリ再開
    User->>S3: / へ自動リダイレクト (Cookieを保持)
    S3-->>User: Reactアプリを再表示

    Note over User, API: 6. 認証済みAPI通信
    User->>ALB: [fetch] /api/v1/courses (Cookieが自動で付く)
    ALB->>ALB: Cookieを検証 (OK)
    ALB->>API: リクエスト転送 (x-amzn-oidc-dataを付与)
    API-->>User: 正常なデータ返却 (JSON)

    Note over User, S3: 7. ログアウトフロー (セッションの完全破棄)
    User->>S3: ログアウトボタンをクリック
    S3->>User: window.location.href = "/api/v1/logout"

    User->>ALB: /api/v1/logout へアクセス (Cookieあり)
    ALB->>API: リクエスト転送
    Note right of API: ①Cookie削除のSet-Cookieを付与<br/>②Cognito設定あり: CognitoログアウトURLへ302<br/>③Cognito設定なし: "/" へ302
    API-->>User: 302 Redirect (Cognito Logout Endpoint または "/" へ)

    User->>Cognito: GET /logout?client_id=...&logout_uri=... (Cognito設定ありの場合のみ)
    Note right of Cognito: Cognito側のセッションを終了
    Cognito-->>User: 302 Redirect (アプリのTop "/" へ)

    Note over User, S3: 8. 未認証状態へ戻る
    User->>S3: / へリダイレクト (Cookieなし)
    S3-->>User: Reactアプリ（未認証状態）を表示
```

## フェーズ1：認証（ログインして「鍵」をもらう）

AWSのインフラ（ALB + Cognito）が複雑な認証処理を代行する。Reactアプリ側では、認証が必要な際に「ブラウザごと特定の場所へ移動させる」というシンプルな指示だけで完結する。

1. ログインの開始
    
    Reactアプリは、APIリクエストのエラー（認証切れ）を検知すると、ユーザーを ログイン専用エンドポイント（例: /api/v1/login） へブラウザごと遷移させる。
    
    > 注意：fetch や axios ではALBのリダイレクトを処理できないため、window.location.href を使用する。
    > 
2. ALBによる誘導
    
    ALBは /api/v1/login へのアクセスをインターセプトし、未認証であればCognitoのHosted UI（AWS標準のログイン画面）へリダイレクトする。
    
3. Cognitoでのユーザー認証
    
    ユーザーはAWSの画面でIDとパスワードを入力する。認証成功後、Cognitoは「認証コード」を付与してユーザーを再びALBへ戻す。
    
4. セッション確立と「クッション役」によるリダイレクト
    - ALBの処理：裏側でCognitoと通信してトークンを取得し、ブラウザにセッションCookie（`AWSELBAuthSessionCookie`）を発行・保存させる。
    - FastAPIの処理（重要）：ALBからリクエストを転送されたFastAPI（`/api/v1/login`）は、「フロントエンドのトップ画面（`/`）に戻れ」というリダイレクト命令（307）を返す。
    - これで、ブラウザのURLがAPIのパスからReactアプリのパスへ正常に戻る。

## フェーズ2：APIリクエスト（「鍵」を見せて通してもらう）

一度認証が完了すれば、ブラウザの標準機能とALBが連携するため、React側で認証を意識した特別なコードを書く必要はほとんどない。

### **ステップA：React側でのリクエスト作成**

Reactコード内では、`Authorization` ヘッダーなどを手動でセットする必要はない。ブラウザが自動的に、保存されている Cookie (`AWSELBAuthSessionCookie`) をリクエストに添付して送信する。

### **ステップB：ネットワーク通過（CloudFront & ALB）**

1. リクエストは `https://myapp.com/api/v1/...` へ送信される。
2. CloudFrontの役割：
    
    パスに基づいてALBへ転送する。この際、CloudFront側で Cookieを透過（Forward）する設定にしておく必要がある。そうしないと、ALBに届く前に「鍵」が捨てられ、無限ログインループに陥る。

### **ステップC：ALBでの検証とFastAPIへの引き渡し**

「門番」であるALBが、届いたCookieの有効性をチェックする。

1. 検証OK：Cookie内の情報を復号し、ユーザー属性（JWT）を `x-amzn-oidc-data` ヘッダーに格納してFastAPIへ転送する。
2. 検証NG（期限切れ等）：FastAPIには通さず、再度ログインフロー（ステップ1）へリダイレクトさせる。

### **ステップD：FastAPIでのデータ処理**

本番のALB経由通信では、FastAPIには「信頼できる門番（ALB）」がチェック済みのリクエストのみが届く。

- バックエンド側では、複雑な署名検証の実装は不要だが、ゼロトラストの観点で行うことも可能。
- ヘッダーの `x-amzn-oidc-data` からユーザーを特定し、ビジネスロジックを実行してJSONを返す。

## ALBが付与するヘッダー一覧

ALBは認証済みリクエストをバックエンドに転送する際、以下のヘッダーを付与する。

| ヘッダー名 | 説明 | 例 |
|-----------|------|-----|
| `x-amzn-oidc-identity` | ユーザー識別子（Cognito Sub） | `abcd-1234-efgh-5678` |
| `x-amzn-oidc-data` | ユーザー情報（JWT形式、Base64エンコード） | `eyJraWQ...` |
| `x-amzn-oidc-accesstoken` | アクセストークン（JWT） | `eyJraWQ...` |

### `x-amzn-oidc-data` のペイロード例

```json
{
  "sub": "abcd-1234-efgh-5678",
  "email": "user@example.com",
  "username": "user@example.com",
  "cognito:username": "user@example.com",
  "custom:role": "admin"
}
```
