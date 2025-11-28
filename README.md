# AIE-DXプロジェクト１（フロントエンド）

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
`.env.example`をコピーして`.env`ファイルを作成してください。
```bash
cp .env.example .env
```

`.env`ファイルを編集して、バックエンドAPIのURLを指定してください。
```bash
# API接続先（開発時のプロキシ先）
VITE_API_TARGET="https://your-api-domain.com"
```

> **Note:** `mockup`ブランチを使用する場合は、`.env`ファイルの設定は不要です。

### 5. 開発サーバーの起動
```bash
npm run dev
```

### 6. ブラウザでURLにアクセス
