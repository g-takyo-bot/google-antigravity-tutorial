# ☁️ クラウドデプロイ設定＆運用手順書

**構成概要**
* **フロントエンド (LP & ダッシュボード)**: Cloudflare Pages
* **バックエンド (Node.js API & 定期タスクエンジン)**: Render (Web Service)

---

## 🛠️ Step 1: Render へのバックエンドデプロイ手順

1. **GitHubリポジトリ作成＆プッシュ**:
   プロジェクトディレクトリ全体（`.gitignore` 含む）を GitHub にプッシュします。

2. **Render コンソールでサービス登録**:
   * [Render Dashboard](https://dashboard.render.com/) にログイン。
   * **[New +]** ➔ **[Web Service]** を選択。
   * GitHub リポジトリを連携（または `render.yaml` を使用して一括インポート）。
   * 以下の項目を設定：
     - **Name**: `google-antigravity-api`
     - **Environment**: `Node`
     - **Region**: `Singapore` (アジア圏推奨)
     - **Build Command**: `echo "No build"`
     - **Start Command**: `node server.js`
   * **[Create Web Service]** をクリック。

3. **発行されたバックエンドURLの確認**:
   * デプロイ完了後、画面上部にバックエンドURLが発行されます。
   * 例: `https://google-antigravity-api.onrender.com`

---

## ☁️ Step 2: Cloudflare Pages へのフロントエンドデプロイ手順

1. **`config.js` の設定更新**:
   * `config.js` を開き、Step 1 で取得した Render のURLを設定します：
     ```javascript
     PRODUCTION_API_BASE: 'https://google-antigravity-api.onrender.com',
     ```

2. **Cloudflare Pages コンソールでデプロイ**:
   * [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Workers & Pages** に移動。
   * **[Create application]** ➔ **[Pages]** ➔ **[Connect to Git]** を選択。
   * 対象の Git リポジトリを選択。
   * 以下のビルド設定を入力：
     - **Framework preset**: `None`
     - **Build output directory**: `/` (ルート直下)
   * **[Save and Deploy]** をクリック。

3. **動作確認**:
   * Cloudflare Pages より発行された `.pages.dev` URL（例: `https://google-antigravity-tutorial.pages.dev`）にアクセス。
   * LPの受講申し込み、および `dashboard.html` の定期タスク・市場トレンド監視ウィジェットが Render 経由で正常に動くか確認します。
