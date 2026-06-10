# ☕ Cafe Games

Kafede QR okutularak erişilen, mobil uyumlu çok oyunlu oyun platformu.

## Tech Stack

- **Frontend**: React + Vite + Tailwind + PWA
- **Backend**: Node.js + Fastify + Socket.io
- **Database**: PostgreSQL (kalıcı) + Redis (anlık oyun state)
- **DevOps**: Docker Compose

---

## 🚀 Kurulum

### Gereksinimler
- Docker Desktop
- Node.js 20+

### Başlatma

```bash
# Projeyi klonla
git clone <repo>
cd cafe-games

# Docker ile tüm servisleri başlat
docker-compose up -d

# Frontend çalışıyor mu kontrol et
open http://localhost:5173

# Backend sağlıklı mı?
curl http://localhost:3000/health
```

### Geliştirme (Docker'sız)

```bash
# PostgreSQL ve Redis Docker'da, kod lokal çalışsın
docker-compose up postgres redis -d

# Backend
cd backend && npm install && npm run dev

# Frontend (ayrı terminal)
cd frontend && npm install && npm run dev
```

---

## 📱 QR Kod Üretimi

```bash
cd scripts
npm install qrcode
BASE_URL=https://senin-domain.com node generate-qr.js
# → scripts/qr-codes/table_01.png ... table_10.png
```

---

## 🎮 Oyunlar

| Oyun | Tür | URL |
|---|---|---|
| Snake | Tek kişilik | /play/snake |
| 2048 | Tek kişilik | /play/2048 |
| Flappy Bird | Tek kişilik | /play/flappy |
| Wordle TR | Tek kişilik | /play/wordle |
| Tic-Tac-Toe | Çok oyunculu | /lobby/tictactoe |
| Satranç | Çok oyunculu | /lobby/chess |

---

## 🌐 Deploy

```
Frontend  → Vercel (vercel.json gerekli)
Backend   → Railway (Dockerfile mevcut)
PostgreSQL → Neon.tech (ücretsiz)
Redis      → Upstash (ücretsiz)
```

### Environment Variables

**Backend:**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CORS_ORIGIN=https://senin-frontend.vercel.app
```

**Frontend:**
```
VITE_API_URL=https://senin-backend.railway.app
VITE_SOCKET_URL=https://senin-backend.railway.app
```

---

## 📁 Klasör Yapısı

```
cafe-games/
├── docker-compose.yml
├── postgres/
│   └── init.sql           # DB şeması + seed
├── backend/
│   └── src/
│       ├── index.js        # Fastify + Socket.io
│       ├── db/             # postgres.js, redis.js
│       ├── routes/         # tables, sessions, scores, lobbies
│       └── socket/         # index.js, lobby.js, game.js
├── frontend/
│   └── src/
│       ├── App.jsx         # Router
│       ├── pages/          # TableEntry, CafeMenu, NicknameEntry, GameMenu, GameLobby, Leaderboard
│       ├── games/          # Snake, 2048, Flappy, Wordle, TicTacToe, Chess
│       └── lib/            # api.js, socket.js, store.js
└── scripts/
    └── generate-qr.js     # QR üretici
```
