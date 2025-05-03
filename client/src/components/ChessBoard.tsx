import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Square, Color } from "chess.js";
import { Check, ArrowUp, RotateCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [flipBoard, setFlipBoard] = useState<boolean>(false);

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
        backgroundColor: 'rgba(249, 115, 22, 0.6)'
      };
    }
    
    // Highlight legal moves
    legalMoves.forEach(move => {
      squares[move] = {
        ...squares[move],
        background: `radial-gradient(circle, rgba(249, 115, 22, 0.5) 25%, ${(squares[move]?.backgroundColor as string) || 'transparent'} 25%)`
      };
    });
    
    return squares;
  };

  return (
    <div className="w-full md:w-3/4 order-1 md:order-2 flex flex-col">
      {/* Game Status Banner */}
      <Card className="mb-4 shadow-md">
        <div className="p-3">
          <div className="flex justify-between items-center">
            <Badge className={`${
              currentTurn === playerSide ? 'bg-success/90 hover:bg-success/80' : 'bg-secondary/90 hover:bg-secondary/80'
            } text-white px-3 py-1`}>
              {currentTurn === playerSide ? 'Your turn' : "AI's turn"}
            </Badge>
            
            <Badge className="bg-primary/90 hover:bg-primary/80 text-white">
              {remainingMoves} {remainingMoves === 1 ? 'move' : 'moves'} remaining
            </Badge>
          </div>
          
          <div className="mt-2 text-sm font-medium text-center bg-gray-50 rounded-md p-2">
            {status || "Make your move"}
          </div>
        </div>
      </Card>
      
      {/* Chess Board Controls */}
      <div className="flex justify-between mb-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFlipBoard(!flipBoard)}
                className="flex items-center gap-1"
              >
                <RotateCw className="h-4 w-4" />
                Flip
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Flip the board view</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => onSquareClick(selectedSquare as Square)}
              >
                <AlertCircle className="h-4 w-4" />
                Rules
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-60">
              <p>
                Hukum Chess: Each player has exactly 6 moves. 
                Win by scoring the most points through captures (Queen:9, Rook:5, Bishop/Knight:3, Pawn:1) 
                or by checkmate.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
          boardOrientation={flipBoard ? (playerSide === "white" ? "black" : "white") : (playerSide === "white" ? "white" : "black")}
          onSquareClick={onSquareClick}
          onPieceDrop={onPieceDrop}
          arePiecesDraggable={currentTurn === playerSide}
          areArrowsAllowed={true}
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
      
      {/* Game instructions */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {currentTurn === playerSide ? (
          <p>Click on a piece to see possible moves, then click on a destination square to move.</p>
        ) : (
          <p>AI is thinking about its next move...</p>
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
