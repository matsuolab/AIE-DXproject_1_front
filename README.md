# AIE-DXプロジェクト１【フロントエンド】

## 動かし方

### 1. リポジトリのクローン
```bash
git clone https://github.com/matsuolab/AIE-DXproject_1_front.git
```

### 2. フォルダへ移動
```bash
cd AIE-DXproject_1_front
```

> **Note:** ダミーデータを使用したモックアップを動かしたい場合は、`mockup`ブランチに切り替えてください。
> ```bash
> git checkout mockup
> ```

### 3. 依存パッケージのインストール
```bash
npm install
```

### 4. 環境変数の設定
> **Note:** `mockup`ブランチを使用している場合は、環境変数の設定は不要です。

`.env.example`をコピーして`.env`ファイルを作成してください。
```bash
cp .env.example .env
```

`.env`ファイルを編集して、バックエンドAPIのURLを指定してください。
```bash
# API接続先（開発時のプロキシ先）
VITE_API_URL="https://your-api-domain.com"
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

### 6. ブラウザでURLにアクセス
既定では`http://localhost:5173/`が起動します。 <br>
もし 5173 ポートが使用中の場合は、別ポートに割り当てられることがあります。

## ドキュメント

`docs/`ディレクトリにバックエンド連携に関するドキュメントがあります。

| ファイル | 内容 |
|---------|------|
| [api_specification.md](docs/api_specification.md) | API入出力定義書（エンドポイント、リクエスト/レスポンス形式） |
| [backend_database.md](docs/backend_database.md) | バックエンドDB設計（ER図、テーブル定義） |
| [auth_flow.md](docs/auth_flow.md) | 認証フロー（ALB + Cognito連携） |
