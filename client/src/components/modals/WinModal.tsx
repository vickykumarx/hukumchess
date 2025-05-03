import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, XCircle } from "lucide-react";

interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: "player" | "ai";
  playerScore: number;
  aiScore: number;
  onNewGame: () => void;
}

const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  onClose,
  winner,
  playerScore,
  aiScore,
  onNewGame
}) => {
  const isPlayerWin = winner === "player";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 mx-4 animate-slide-up text-center">
        <div className={`w-20 h-20 mx-auto mb-4 ${isPlayerWin ? 'bg-success/20' : 'bg-danger/20'} rounded-full flex items-center justify-center`}>
          {isPlayerWin ? (
            <Trophy className="h-12 w-12 text-success" />
          ) : (
            <XCircle className="h-12 w-12 text-danger" />
          )}
        </div>
        
        <h2 className="font-sans font-bold text-2xl mb-2">
          {isPlayerWin ? "You Won!" : "You Lost!"}
        </h2>
        <p className="text-gray-600 mb-6">
          {isPlayerWin 
            ? "You outscored the AI by capturing more valuable pieces!" 
            : "The AI outscored you by capturing more valuable pieces!"}
        </p>
        
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Your Score</p>
              <p className={`font-sans font-bold text-2xl ${isPlayerWin ? 'text-success' : ''}`}>
                {playerScore}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">AI Score</p>
              <p className={`font-sans font-bold text-2xl ${!isPlayerWin ? 'text-danger' : ''}`}>
                {aiScore}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-100 transition"
            onClick={onClose}
          >
            Analysis
          </Button>
          <Button
            variant="default"
            className="flex-1 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            onClick={onNewGame}
          >
            New Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinModal;
