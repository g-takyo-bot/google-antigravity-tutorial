/**
 * Google Antigravity 2.0 Client Configuration
 * Cloudflare Pages ＆ Render デプロイ対応設定
 */

const CONFIG = {
    // 【重要】Renderにデプロイ後、発行されたバックエンドURL（例: https://google-antigravity-api.onrender.com）をここに記述します。
    // 空文字 '' または同ドメインの場合は自動的にローカルまたはオリジンURLを参照します。
    PRODUCTION_API_BASE: 'https://google-antigravity-api.onrender.com',

    // 開発環境と本番環境の自動判定ロジック
    get API_BASE() {
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname === '';
        
        if (isLocalhost) {
            // ローカル環境実行時
            return '';
        } else {
            // 本番環境（Cloudflare Pagesなど）実行時
            return this.PRODUCTION_API_BASE;
        }
    }
};

window.CONFIG = CONFIG;
