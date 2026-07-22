-- =========================================================
-- Google Antigravity 2.0 Fullstack Tutorial Database Schema
-- =========================================================

-- 1. Users Table (受講者・管理者アカウント)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Reservations Table (受講予約・顧客管理)
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    course_name VARCHAR(150) NOT NULL DEFAULT 'Google Antigravity 2.0 フルスタック開発チュートリアル',
    status VARCHAR(30) DEFAULT 'registered', -- registered, active, completed
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Course Progress Table (4ステップ学習進捗)
CREATE TABLE IF NOT EXISTS course_progress (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    current_step INT DEFAULT 1,
    step1_completed BOOLEAN DEFAULT FALSE,
    step2_completed BOOLEAN DEFAULT FALSE,
    step3_completed BOOLEAN DEFAULT FALSE,
    step4_completed BOOLEAN DEFAULT FALSE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. AI Chat Logs Table (対話型AI講師メッセージログ)
CREATE TABLE IF NOT EXISTS ai_chat_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- user / ai_instructor
    message TEXT NOT NULL,
    step_context INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Scheduled Tasks Table (定期タスク自動化)
CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    cron_schedule VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Sample Initial Seed Data
-- =========================================================

-- Sample Users
INSERT INTO users (id, name, email, role) VALUES 
('u-101', '山田 太郎', 'yamada.t@example.com', 'student'),
('u-102', '佐藤 花子', 'sato.h@example.com', 'student');

INSERT INTO reservations (id, user_id, status, notes) VALUES 
('r-101', 'u-101', 'active', '美容室のWeb予約システム構築希望'),
('r-102', 'u-102', 'completed', 'オンラインヨガの月額レッスン予約');

INSERT INTO course_progress (id, user_id, current_step, step1_completed, step2_completed) VALUES 
('p-101', 'u-101', 3, TRUE, TRUE),
('p-102', 'u-102', 4, TRUE, TRUE);

INSERT INTO ai_chat_logs (id, user_id, sender_type, message, step_context) VALUES 
('c-101', 'u-101', 'user', 'サロンのWeb予約と顧客データベース、リマインドメール送信を連動させて', 1),
('c-102', 'u-101', 'ai_instructor', '承知しました！Google Antigravity 2.0が要件を即座に解析します。', 1);

-- Scheduled Tasks Seed Data (毎分実行の「市場トレンド自動監視」を含む)
INSERT INTO scheduled_tasks (id, name, cron_schedule, action_type, is_active, last_run_at) VALUES
('t-101', '市場トレンド自動監視 (デモ毎分実行)', '* * * * *', 'market_trend_monitor', TRUE, CURRENT_TIMESTAMP),
('t-102', '予約前日自動リマインド通知 (LINE/Email)', '0 9 * * *', 'send_reminders', TRUE, CURRENT_TIMESTAMP),
('t-103', '未決済予約フォローアップ', '0 18 * * *', 'followup_unpaid', TRUE, CURRENT_TIMESTAMP),
('t-104', '日次受講進捗レポート生成', '0 23 * * *', 'generate_report', FALSE, NULL);
