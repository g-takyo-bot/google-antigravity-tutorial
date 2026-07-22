const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3008;

// インメモリ・データベース
let memoryDb = {
    users: [
        { id: 'u-101', name: '山田 太郎', email: 'yamada.t@example.com', role: 'student', created_at: new Date('2026-07-20T10:00:00Z').toISOString() },
        { id: 'u-102', name: '佐藤 花子', email: 'sato.h@example.com', role: 'student', created_at: new Date('2026-07-21T14:30:00Z').toISOString() },
        { id: 'u-103', name: '鈴木 健太', email: 'suzuki.k@example.com', role: 'student', created_at: new Date().toISOString() }
    ],
    reservations: [
        { id: 'r-101', user_id: 'u-101', course_name: 'Google Antigravity 2.0 フルスタック開発チュートリアル', status: 'active', notes: '美容室のWeb予約システム構築希望', created_at: new Date('2026-07-20T10:00:00Z').toISOString() },
        { id: 'r-102', user_id: 'u-102', course_name: 'Google Antigravity 2.0 フルスタック開発チュートリアル', status: 'completed', notes: 'オンラインヨガの予約＆決済自動化', created_at: new Date('2026-07-21T14:30:00Z').toISOString() },
        { id: 'r-103', user_id: 'u-103', course_name: 'Google Antigravity 2.0 フルスタック開発チュートリアル', status: 'registered', notes: 'セミナー告知＆顧客管理DB希望', created_at: new Date().toISOString() }
    ],
    course_progress: [
        { id: 'p-101', user_id: 'u-101', current_step: 3, step1_completed: true, step2_completed: true, step3_completed: false, step4_completed: false, updated_at: new Date().toISOString() },
        { id: 'p-102', user_id: 'u-102', current_step: 4, step1_completed: true, step2_completed: true, step3_completed: true, step4_completed: true, updated_at: new Date().toISOString() },
        { id: 'p-103', user_id: 'u-103', current_step: 1, step1_completed: false, step2_completed: false, step3_completed: false, step4_completed: false, updated_at: new Date().toISOString() }
    ],
    ai_chat_logs: [
        { id: 'c-101', user_id: 'u-101', sender_type: 'user', message: 'サロンのWeb予約と顧客データベース、リマインドメール送信を連動させて', step_context: 1, created_at: new Date('2026-07-20T10:05:00Z').toISOString() },
        { id: 'c-102', user_id: 'u-101', sender_type: 'ai_instructor', message: '承知しました！Google Antigravity 2.0が要件を即座に解析し、予約フォーム・DB・通知ワークフローを生成します。', step_context: 1, created_at: new Date('2026-07-20T10:05:05Z').toISOString() }
    ],
    scheduled_tasks: [
        { id: 't-101', name: '市場トレンド自動監視 (デモ毎分実行)', cron_schedule: '* * * * *', action_type: 'market_trend_monitor', is_active: true, last_run_at: new Date().toISOString() },
        { id: 't-102', name: '予約前日自動リマインド通知 (LINE/Email)', cron_schedule: '0 9 * * *', action_type: 'send_reminders', is_active: true, last_run_at: new Date('2026-07-22T09:00:00Z').toISOString() },
        { id: 't-103', name: '未決済予約フォローアップ', cron_schedule: '0 18 * * *', action_type: 'followup_unpaid', is_active: true, last_run_at: new Date('2026-07-21T18:00:00Z').toISOString() },
        { id: 't-104', name: '日次受講進捗レポート生成', cron_schedule: '0 23 * * *', action_type: 'generate_report', is_active: false, last_run_at: null }
    ],
    task_execution_logs: [
        { id: 'l-1', task_name: '市場トレンド自動監視 (デモ毎分実行)', message: 'AI開発・予約システムの最新トレンドキーワード3件を取得・更新しました。', status: 'SUCCESS', executed_at: new Date().toISOString() }
    ],
    market_trends: {
        last_updated: new Date().toISOString(),
        keywords: [
            { term: 'Google Antigravity 2.0 連携', score: 98, change: '+14%' },
            { term: 'LINE公式アカウント 予約自動即時連携', score: 92, change: '+8%' },
            { term: 'ノーコードAI顧客決済フロー', score: 85, change: '+5%' }
        ]
    }
};

// ヘルパー: リクエストボディの取得
function getRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); } catch (err) { resolve({}); }
        });
    });
}

// ヘルパー: JSONレスポンス
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

// タスク実行ロジック
function executeTaskLogic(task) {
    task.last_run_at = new Date().toISOString();

    if (task.action_type === 'market_trend_monitor') {
        const sampleTerms = [
            [
                { term: 'Google Antigravity 2.0 連携', score: 99, change: '+18%' },
                { term: 'LINE公式アカウント 予約自動即時連携', score: 95, change: '+12%' },
                { term: 'ノーコードAI顧客決済フロー', score: 89, change: '+7%' }
            ],
            [
                { term: 'AIエージェント対話型店舗予約', score: 97, change: '+15%' },
                { term: 'Google Antigravity 2.0 連携', score: 96, change: '+11%' },
                { term: '自動リマインド通知マーケティング', score: 88, change: '+6%' }
            ],
            [
                { term: 'ノーコードフルスタックAI自動構築', score: 98, change: '+22%' },
                { term: 'Google Antigravity 2.0 連携', score: 95, change: '+10%' },
                { term: 'サロン・ジム向け即時Web予約', score: 91, change: '+9%' }
            ]
        ];
        const nextTerms = sampleTerms[Math.floor(Math.random() * sampleTerms.length)];

        memoryDb.market_trends = {
            last_updated: new Date().toISOString(),
            keywords: nextTerms
        };

        const logMsg = `[毎分自動実行] 市場トレンド監視完了: 新しいキーワード ${nextTerms.map(k=>k.term).join(', ')} を検出しました。`;
        memoryDb.task_execution_logs.unshift({
            id: `l-${Date.now()}`,
            task_name: task.name,
            message: logMsg,
            status: 'SUCCESS',
            executed_at: new Date().toISOString()
        });
    } else {
        const logMsg = `Task "${task.name}" 手動/定期トリガー実行完了`;
        memoryDb.task_execution_logs.unshift({
            id: `l-${Date.now()}`,
            task_name: task.name,
            message: logMsg,
            status: 'SUCCESS',
            executed_at: new Date().toISOString()
        });
    }
}

// 毎分スケジューラー（デモ用に20秒ごとにチェック＆更新）
function initTaskScheduler() {
    setInterval(() => {
        const marketTask = memoryDb.scheduled_tasks.find(t => t.action_type === 'market_trend_monitor');
        if (marketTask && marketTask.is_active) {
            executeTaskLogic(marketTask);
        }
    }, 20000); // 20秒ごとに自動更新（デモで即時体感できる速度）
}
initTaskScheduler();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
    const fullUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = fullUrl.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // ----------------------------------------------------
    // API エンドポイント
    // ----------------------------------------------------

    // 1. 受講予約登録 POST /api/reservations
    if (pathname === '/api/reservations' && method === 'POST') {
        const body = await getRequestBody(req);
        const { name, email, notes } = body;

        if (!name || !email) {
            return sendJson(res, 400, { success: false, message: 'お名前とメールアドレスは必須です。' });
        }

        let user = memoryDb.users.find(u => u.email === email);
        if (!user) {
            user = { id: `u-${Date.now()}`, name, email, role: 'student', created_at: new Date().toISOString() };
            memoryDb.users.push(user);
        }

        const reservation = {
            id: `r-${Date.now()}`,
            user_id: user.id,
            course_name: 'Google Antigravity 2.0 フルスタック開発チュートリアル',
            status: 'registered',
            notes: notes || 'LPからのお申し込み',
            created_at: new Date().toISOString()
        };
        memoryDb.reservations.push(reservation);

        const progress = {
            id: `p-${Date.now()}`, user_id: user.id, current_step: 1,
            step1_completed: false, step2_completed: false, step3_completed: false, step4_completed: false,
            updated_at: new Date().toISOString()
        };
        memoryDb.course_progress.push(progress);

        return sendJson(res, 201, { success: true, message: '受講予約が完了しました！', reservation, user });
    }

    // 2. 受講予約一覧 GET /api/reservations
    if (pathname === '/api/reservations' && method === 'GET') {
        const statusFilter = fullUrl.searchParams.get('status');
        const searchQuery = (fullUrl.searchParams.get('search') || '').toLowerCase();

        let results = memoryDb.reservations.map(r => {
            const user = memoryDb.users.find(u => u.id === r.user_id) || {};
            const progress = memoryDb.course_progress.find(p => p.user_id === r.user_id) || {};
            return { ...r, user_name: user.name, user_email: user.email, current_step: progress.current_step || 1 };
        });

        if (statusFilter && statusFilter !== 'all') results = results.filter(r => r.status === statusFilter);
        if (searchQuery) results = results.filter(r => (r.user_name && r.user_name.toLowerCase().includes(searchQuery)) || (r.user_email && r.user_email.toLowerCase().includes(searchQuery)));

        return sendJson(res, 200, { success: true, count: results.length, data: results });
    }

    // 3. アナリティクス統計 GET /api/dashboard/stats
    if (pathname === '/api/dashboard/stats' && method === 'GET') {
        const totalReservations = memoryDb.reservations.length;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayReservations = memoryDb.reservations.filter(r => r.created_at.startsWith(todayStr)).length;
        const completedUsers = memoryDb.course_progress.filter(p => p.step4_completed).length;
        const completionRate = totalReservations > 0 ? Math.round((completedUsers / totalReservations) * 100) : 0;
        const totalAiLogs = memoryDb.ai_chat_logs.length;

        return sendJson(res, 200, {
            success: true,
            stats: { totalReservations, todayReservations, completionRate: `${completionRate}%`, totalAiLogs }
        });
    }

    // 4. AIチャット POST /api/ai/chat
    if (pathname === '/api/ai/chat' && method === 'POST') {
        const body = await getRequestBody(req);
        const { userId = 'u-101', message, step = 1 } = body;
        if (!message) return sendJson(res, 400, { success: false, message: 'メッセージが必要です。' });

        const userLog = { id: `c-${Date.now()}-u`, user_id: userId, sender_type: 'user', message, step_context: step, created_at: new Date().toISOString() };
        memoryDb.ai_chat_logs.push(userLog);

        let aiReplyText = `「${message}」についての要件を受け取りました。Google Antigravity 2.0 エージェントがシステム構成を生成・適用します。`;
        if (message.includes('予約') || message.includes('カレンダー')) {
            aiReplyText = '予約カレンダーモジュールと重複防止ロジックを読み込みました。デザインプレビューを更新します！';
        } else if (message.includes('決済') || message.includes('カード')) {
            aiReplyText = 'クレジットカード決済APIとの接続設定を完了しました。テストモードで決済動作をご確認いただけます。';
        }

        const aiLog = { id: `c-${Date.now()}-ai`, user_id: userId, sender_type: 'ai_instructor', message: aiReplyText, step_context: step, created_at: new Date().toISOString() };
        memoryDb.ai_chat_logs.push(aiLog);

        return sendJson(res, 200, { success: true, userMessage: userLog, aiReply: aiLog });
    }

    // 5. AIチャットログ GET /api/ai/chat
    if (pathname === '/api/ai/chat' && method === 'GET') {
        return sendJson(res, 200, { success: true, logs: memoryDb.ai_chat_logs });
    }

    // 6. 定期タスク一覧 GET /api/scheduled-tasks
    if (pathname === '/api/scheduled-tasks' && method === 'GET') {
        return sendJson(res, 200, {
            success: true,
            tasks: memoryDb.scheduled_tasks,
            logs: memoryDb.task_execution_logs.slice(0, 10)
        });
    }

    // 7. 定期タスクのON/OFF切り替え POST /api/scheduled-tasks/toggle
    if (pathname === '/api/scheduled-tasks/toggle' && method === 'POST') {
        const body = await getRequestBody(req);
        const { taskId } = body;
        const task = memoryDb.scheduled_tasks.find(t => t.id === taskId);
        if (!task) return sendJson(res, 404, { success: false, message: 'タスクが見つかりません。' });

        task.is_active = !task.is_active;
        return sendJson(res, 200, { success: true, task });
    }

    // 8. 定期タスクの手動即時実行 POST /api/scheduled-tasks/run
    if (pathname === '/api/scheduled-tasks/run' && method === 'POST') {
        const body = await getRequestBody(req);
        const { taskId } = body;
        const task = memoryDb.scheduled_tasks.find(t => t.id === taskId);
        if (!task) return sendJson(res, 404, { success: false, message: 'タスクが見つかりません。' });

        executeTaskLogic(task);
        return sendJson(res, 200, { success: true, message: `タスク "${task.name}" を実行しました。`, task });
    }

    // 9. 市場トレンドデータ GET /api/market-trends
    if (pathname === '/api/market-trends' && method === 'GET') {
        return sendJson(res, 200, {
            success: true,
            trends: memoryDb.market_trends
        });
    }

    // ----------------------------------------------------
    // 静的ファイル配信
    // ----------------------------------------------------
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 Not Found</h1><p>指定されたファイルが見つかりません。</p>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

function startServer(port) {
    server.listen(port, () => {
        console.log(`=======================================================`);
        console.log(`🚀 Google Antigravity 2.0 API & Studio Server Running`);
        console.log(`📍 LP URL:        http://localhost:${port}/`);
        console.log(`📍 Dashboard URL: http://localhost:${port}/dashboard.html`);
        console.log(`=======================================================`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(PORT);
