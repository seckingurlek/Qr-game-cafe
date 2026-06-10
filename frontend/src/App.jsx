import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
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
