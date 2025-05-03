import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PuzzleShootoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: number;
}

interface Puzzle {
  id: number;
  gameId: number;
  fen: string;
  solution: string;
  mateIn: number;
  aiSolved?: boolean;
}

const PuzzleShootoutModal: React.FC<PuzzleShootoutModalProps> = ({
  isOpen,
  onClose,
  gameId
}) => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [mateIn, setMateIn] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userWon, setUserWon] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Initialize chess instance for puzzle editor
  const [chess] = useState(new Chess());

  useEffect(() => {
    if (isOpen && gameId) {
      fetchPuzzles();
    }
  }, [isOpen, gameId]);

  const fetchPuzzles = async () => {
    if (!gameId) return;
    
    try {
      const res = await fetch(`/api/games/${gameId}/puzzles`);
      if (res.ok) {
        const data = await res.json();
        setPuzzles(data);
        if (data.length > 0) {
          setFen(data[0].fen);
          setMateIn(data[0].mateIn);
        }
      }
    } catch (error) {
      console.error("Error fetching puzzles:", error);
    }
  };

  const handleSquareClick = (square: string) => {
    // Handle square click for chess puzzle editor
    try {
      const moves = chess.moves({ square, verbose: true });
      if (moves.length > 0) {
        // Just make the first legal move
        chess.move(moves[0]);
        setFen(chess.fen());
      }
    } catch (error) {
      console.error("Error handling square click:", error);
    }
  };

  const resetPuzzle = () => {
    chess.reset();
    setFen(chess.fen());
  };

  const submitPuzzle = async () => {
    if (!gameId) return;
    
    try {
      setIsProcessing(true);
      
      // Create a new puzzle
      const puzzleData = {
        gameId,
        fen,
        solution: "", // Solution will be determined by the AI
        mateIn
      };
      
      const res = await apiRequest("POST", `/api/games/${gameId}/puzzles`, puzzleData);
      if (res.ok) {
        const puzzle = await res.json();
        setPuzzles([...puzzles, puzzle]);
        
        // Solve the puzzle with AI
        await solvePuzzle(puzzle.id);
      }
    } catch (error) {
      console.error("Error submitting puzzle:", error);
      toast({
        title: "Error",
        description: "Failed to submit puzzle",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const solvePuzzle = async (puzzleId: number) => {
    try {
      const res = await apiRequest("POST", `/api/puzzles/${puzzleId}/solve`, {
        timeLimit: 15000 // 15 seconds
      });
      
      if (res.ok) {
        const { puzzle, solved } = await res.json();
        
        // Update puzzles array
        setPuzzles(puzzles.map(p => p.id === puzzleId ? puzzle : p));
        
        // Set result state
        setPuzzleSolved(solved);
        
        // If AI didn't solve it, user wins
        if (!solved) {
          setUserWon(true);
        } else {
          // Move to next puzzle
          setCurrentPuzzleIndex(currentPuzzleIndex + 1);
          if (currentPuzzleIndex + 1 >= 5) {
            // User lost after 5 puzzles
            toast({
              title: "Game Over",
              description: "AI solved all puzzles. You lose!",
              variant: "destructive"
            });
          }
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error("Error solving puzzle:", error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to process puzzle",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 mx-4 animate-slide-up">
        <h2 className="font-sans font-bold text-2xl mb-2">Puzzle Shootout!</h2>
        <p className="text-gray-600 mb-4">The game ended in a tie. Create chess puzzles to challenge the AI!</p>
        
        <div className="bg-info/10 p-3 rounded-md mb-6 text-sm">
          <p className="font-medium text-info">Create mate-in-X puzzles. If AI fails any puzzle, you win!</p>
        </div>
        
        {userWon ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-16 w-16 text-success mb-4" />
            <h3 className="text-xl font-bold mb-2">You Win!</h3>
            <p className="text-gray-600 mb-6">AI failed to solve your puzzle!</p>
            <Button 
              onClick={onClose}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Continue
            </Button>
          </div>
        ) : (
          <>
            {/* Puzzle Editor */}
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="font-medium mb-2">Puzzle #{currentPuzzleIndex + 1}</h3>
              
              {/* Mini Chessboard */}
              <div className="aspect-square w-full max-w-sm mx-auto mb-4">
                <Chessboard
                  position={fen}
                  boardWidth={300}
                  onSquareClick={handleSquareClick}
                  customBoardStyle={{
                    borderRadius: "0.375rem",
                  }}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Label className="font-medium">Mate in:</Label>
                <select
                  className="border border-gray-300 rounded-md p-1"
                  value={mateIn}
                  onChange={(e) => setMateIn(parseInt(e.target.value))}
                  disabled={isProcessing}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetPuzzle}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="default"
                  onClick={submitPuzzle}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                >
                  Submit
                </Button>
              </div>
            </div>
            
            {/* AI Status */}
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Status</p>
                  <p className="text-sm text-gray-500">
                    {isProcessing 
                      ? "Processing puzzle..." 
                      : puzzleSolved === null 
                        ? "Waiting for puzzle" 
                        : puzzleSolved 
                          ? "Solved puzzle" 
                          : "Failed to solve puzzle"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
                  {isProcessing ? (
                    <Loader2 className="animate-spin h-5 w-5 text-info" />
                  ) : puzzleSolved === null ? (
                    <div className="h-5 w-5 text-info" />
                  ) : puzzleSolved ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-danger" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Puzzles Progress */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < currentPuzzleIndex 
                        ? "bg-success" 
                        : i === currentPuzzleIndex 
                          ? "bg-primary" 
                          : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">{currentPuzzleIndex + 1}/5 puzzles</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PuzzleShootoutModal;
