const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🟢 로컬 및 외부 연결 모두 허용 (CORS)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let db;

async function initDatabase() {
    try {
        db = await open({
            filename: './chat_history.db',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                senderType TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ [DB] SQLite 연결 및 테이블 준비 완료!');
    } catch (err) {
        console.error('❌ [DB] 연결 실패:', err);
    }
}

initDatabase();

io.on('connection', async (socket) => {
    console.log('👤 [소켓] 새로운 사용자 접속함! (ID:', socket.id, ')');

    // 1️⃣ 이전 채팅 기록 보내기
    if (db) {
        try {
            const history = await db.all('SELECT text, senderType FROM messages ORDER BY id ASC');
            socket.emit('loadHistory', history);
        } catch (err) {
            console.error('❌ 기록 불러오기 실패:', err);
        }
    }

    // 2️⃣ 메시지 수신 이벤트 (chatMessage)
    socket.on('chatMessage', async (data) => {
        console.log('📩 [소켓] 받은 메시지:', data);

        const text = typeof data === 'string' ? data : data.text;
        const senderType = data.senderType || 'user';

        if (!text) return;

        // DB에 저장
        if (db) {
            try {
                await db.run(
                    'INSERT INTO messages (text, senderType) VALUES (?, ?)',
                    [text, senderType]
                );
            } catch (err) {
                console.error('❌ DB 저장 실패:', err);
            }
        }

        // 연결된 모든 사용자에게 메시지 브로드캐스트
        io.emit('message', {
            text: text,
            senderType: senderType
        });
    });

    socket.on('disconnect', () => {
        console.log('👋 사용자 접속 종료');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 [로컬 서버 실행 중] http://localhost:${PORT}`);
});