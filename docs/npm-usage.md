# npm コマンド一覧

## 開発

| コマンド | 説明 |
|---------|------|
| `npm install` | 依存パッケージのインストール |
| `npm run dev` | 開発サーバーの起動（Vite） |
| `npm run preview` | 本番ビルド後のプレビュー |

## ビルド

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScriptコンパイル + 本番ビルド（`tsc -b && vite build`） |

## Lint

| コマンド | 説明 |
|---------|------|
| `npm run lint` | ESLintによる静的解析の実行 |
| `npm run lint:fix` | ESLintによる自動修正 |

## ESLint 設定概要

設定ファイル: `eslint.config.js`（Flat Config形式）

### 使用プラグイン

- `eslint-plugin-react-hooks` — React Hooksのルールチェック
- `eslint-plugin-react-refresh` — React Fast Refreshの互換性チェック
- `typescript-eslint` — TypeScript向けルール

### 主要ルール

| ルール | 設定 | 説明 |
|-------|------|------|
| `quotes` | `'single'` | シングルクォートを強制 |
| `semi` | `'always'` | セミコロン必須 |
| `indent` | `2` | インデント2スペース |
| `react-refresh/only-export-components` | `warn` | コンポーネント以外のexportを警告 |

### 対象ファイル

- `**/*.{ts,tsx,js,jsx}`

### 除外ディレクトリ

- `dist/`
- `build/`
