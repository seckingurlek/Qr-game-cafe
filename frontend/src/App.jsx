import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import TableEntry from './pages/TableEntry.jsx'
import CafeMenu from './pages/CafeMenu.jsx'
import NicknameEntry from './pages/NicknameEntry.jsx'
import GameMenu from './pages/GameMenu.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import GameLobby from './pages/GameLobby.jsx'
import SnakePage from './games/Snake/SnakePage.jsx'
import Game2048Page from './games/Game2048/Game2048Page.jsx'
import FlappyPage from './games/FlappyBird/FlappyPage.jsx'
import WordlePage from './games/Wordle/WordlePage.jsx'
import TicTacToePage from './games/TicTacToe/TicTacToePage.jsx'
import ChessPage from './games/Chess/ChessPage.jsx'
// Admin
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminTables from './pages/admin/AdminTables.jsx'
import AdminSessions from './pages/admin/AdminSessions.jsx'
import AdminLobbies from './pages/admin/AdminLobbies.jsx'
import AdminScores from './pages/admin/AdminScores.jsx'

function AppContent() {
  const location = useLocation()
  const isAdminPath = location.pathname.startsWith('/admin')

  if (isAdminPath) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tables" element={<AdminTables />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="lobbies" element={<AdminLobbies />} />
          <Route path="scores" element={<AdminScores />} />
        </Route>
      </Routes>
    )
  }

  return (
    <div className="app-container">
      <Routes>
        {/* QR okutunca buraya gelir → store'a table kaydeder → /menu'ye yönlendirir */}
        <Route path="/table/:qrCode" element={<TableEntry />} />

        {/* Kafe menüsü — direkt açılabilir */}
        <Route path="/menu" element={<CafeMenu />} />

        {/* Nick girişi */}
        <Route path="/nickname" element={<NicknameEntry />} />

        {/* Oyun seçimi */}
        <Route path="/games" element={<GameMenu />} />

        {/* Leaderboard */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/leaderboard/:gameSlug" element={<Leaderboard />} />

        {/* Multiplayer lobi */}
        <Route path="/lobby/:gameSlug" element={<GameLobby />} />

        {/* Oyunlar */}
        <Route path="/play/snake"              element={<SnakePage />} />
        <Route path="/play/2048"               element={<Game2048Page />} />
        <Route path="/play/flappy"             element={<FlappyPage />} />
        <Route path="/play/wordle"             element={<WordlePage />} />
        <Route path="/play/tictactoe/:lobbyId" element={<TicTacToePage />} />
        <Route path="/play/chess/:lobbyId"     element={<ChessPage />} />

        {/* Root → menüye git */}
        <Route path="/" element={<Navigate to="/menu" replace />} />

        {/* 404 → menüye git */}
        <Route path="*" element={<Navigate to="/menu" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<AppContent />} />
    </Routes>
  )
}
