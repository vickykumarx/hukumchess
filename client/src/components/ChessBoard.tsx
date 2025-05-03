import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Color } from "chess.js";
import { Check, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChessBoardProps {
  fen: string;
  playerSide: "white" | "black";
  currentTurn: "white" | "black";
  selectedSquare: Square | null;
  legalMoves: Square[];
  remainingMoves: number;
  status: string;
  onSquareClick: (square: Square) => void;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
  onCapture: (piece: string, square: Square) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  playerSide,
  currentTurn,
  selectedSquare,
  legalMoves,
  remainingMoves,
  status,
  onSquareClick,
  onPieceDrop,
  onCapture
}) => {
  const [boardWidth, setBoardWidth] = useState<number>(600);
  const [captureMove, setCaptureMove] = useState<{ piece: string, square: Square } | null>(null);

  // Resize board based on container size
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('board-container');
      if (container) {
        const width = Math.min(container.clientWidth, container.clientHeight);
        setBoardWidth(width);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Custom board colors
  const customSquareStyles = () => {
    const squares: Record<string, React.CSSProperties> = {};
    
    // Beige and brown colors
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const square = String.fromCharCode(97 + j) + (8 - i) as Square;
        squares[square] = {
          backgroundColor: (i + j) % 2 === 0 ? '#F5F5DC' : '#8B4513'
        };
      }
    }
    
    // Highlight selected square
    if (selectedSquare) {
      squares[selectedSquare] = {
        ...squares[selectedSquare],
        backgroundColor: 'rgba(249, 115, 22, 0.4)'
      };
    }
    
    // Highlight legal moves
    legalMoves.forEach(move => {
      squares[move] = {
        ...squares[move],
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.4) 25%, transparent 25%)'
      };
    });
    
    return squares;
  };

  return (
    <div className="w-full md:w-3/4 order-1 md:order-2 flex flex-col">
      {/* Game Status Banner */}
      <div className={`${
        currentTurn === playerSide ? 'bg-info/10 text-info' : 'bg-secondary/10 text-secondary'
      } p-2 rounded-md mb-3 text-sm font-medium text-center`}>
        {currentTurn === playerSide ? 'Your turn' : "AI's turn"} - {remainingMoves} moves remaining
      </div>
      
      {/* Chess Board */}
      <div 
        id="board-container"
        className="aspect-square w-full max-w-xl mx-auto bg-white rounded-lg shadow-md overflow-hidden"
      >
        <Chessboard
          id="hukum-chess"
          position={fen}
          boardWidth={boardWidth}
          customSquareStyles={customSquareStyles()}
          boardOrientation={playerSide === "white" ? "white" : "black"}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={currentTurn === playerSide}
        />
      </div>
      
      {/* Grid indicators */}
      <div className="w-full max-w-xl mx-auto grid grid-cols-8 text-center text-sm mt-1">
        <div>a</div><div>b</div><div>c</div><div>d</div><div>e</div><div>f</div><div>g</div><div>h</div>
      </div>
      
      {/* Capture Button */}
      {captureMove && (
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            onClick={() => {
              onCapture(captureMove.piece, captureMove.square);
              setCaptureMove(null);
            }}
            className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition flex items-center gap-2"
          >
            <Check className="h-5 w-5" />
            Capture {captureMove.piece.charAt(1).toUpperCase() + captureMove.piece.slice(2)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
