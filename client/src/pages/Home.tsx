import { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import GameInfoPanel from "../components/GameInfoPanel";
import NewGameModal from "../components/modals/NewGameModal";
import WinModal from "../components/modals/WinModal";
import PuzzleShootoutModal from "../components/modals/PuzzleShootoutModal";
import useChessGame from "../hooks/useChessGame";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  
  const { 
    game,
    gameState,
    playerSide,
    playerRole,
    playerScore,
    aiScore,
    playerMoves,
    aiMoves,
    currentTurn,
    fen,
    moveHistory,
    timeRemaining,
    selectedSquare,
    legalMoves,
    status,
    startNewGame,
    makeMove,
    selectSquare,
    handleCapture,
    resignGame,
    isTimerLow
  } = useChessGame();

  // Open win modal when game is over
  useEffect(() => {
    if (gameState === "player_win" || gameState === "ai_win") {
      setShowWinModal(true);
    } else if (gameState === "tie") {
      setShowPuzzleModal(true);
    }
  }, [gameState]);

  // Close modals when game starts
  useEffect(() => {
    if (gameState === "in_progress") {
      setShowNewGameModal(false);
      setShowWinModal(false);
      setShowPuzzleModal(false);
    }
  }, [gameState]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-secondary text-white p-3 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold font-sans">Hukum Chess</h1>
          <Button 
            onClick={() => setShowNewGameModal(true)}
            variant="default" 
            className="px-4 py-1 bg-primary rounded-md font-medium hover:bg-primary/90 transition"
          >
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Game Info Panel */}
        <GameInfoPanel 
          playerScore={playerScore}
          aiScore={aiScore}
          playerMoves={playerMoves}
          aiMoves={aiMoves}
          moveHistory={moveHistory}
          timeRemaining={timeRemaining}
          isTimerLow={isTimerLow}
          onNewGame={() => setShowNewGameModal(true)}
          onResign={resignGame}
        />
        
        {/* Chess Board */}
        <ChessBoard 
          fen={fen}
          playerSide={playerSide}
          currentTurn={currentTurn}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          remainingMoves={playerSide === currentTurn ? 6 - playerMoves : 6 - aiMoves}
          onSquareClick={selectSquare}
          onPieceDrop={makeMove}
          onCapture={handleCapture}
          status={status}
        />
      </main>

      {/* Modals */}
      <NewGameModal 
        isOpen={showNewGameModal} 
        onClose={() => setShowNewGameModal(false)}
        onStartGame={startNewGame}
        currentSide={playerSide}
        currentRole={playerRole}
      />
      
      <WinModal 
        isOpen={showWinModal} 
        onClose={() => setShowWinModal(false)}
        winner={gameState === "player_win" ? "player" : "ai"}
        playerScore={playerScore}
        aiScore={aiScore}
        onNewGame={() => setShowNewGameModal(true)}
      />
      
      <PuzzleShootoutModal 
        isOpen={showPuzzleModal} 
        onClose={() => setShowPuzzleModal(false)}
        gameId={game?.id}
      />
    </div>
  );
};

export default Home;
