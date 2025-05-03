import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (options: GameOptions) => void;
  currentSide: "white" | "black";
  currentRole: "player1" | "player2";
}

interface GameOptions {
  playerSide: "white" | "black";
  playerRole: "player1" | "player2";
  fen: string;
  difficulty: "standard" | "grandmaster" | "insane";
  boardSetup: "standard" | "custom";
}

const STANDARD_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  currentSide,
  currentRole
}) => {
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    playerSide: currentSide,
    playerRole: currentRole,
    fen: STANDARD_FEN,
    difficulty: "grandmaster",
    boardSetup: "standard"
  });

  const handleChange = (key: keyof GameOptions, value: any) => {
    setGameOptions({
      ...gameOptions,
      [key]: value
    });
  };

  const handleSubmit = () => {
    onStartGame(gameOptions);
  };

  const isStandardSetup = gameOptions.boardSetup === "standard";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 mx-4 animate-slide-up">
        <DialogTitle className="font-sans font-bold text-2xl mb-4">New Game</DialogTitle>
        
        {/* Side & Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-medium mb-2">Choose Side</h3>
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                className={`flex-1 py-3 border border-gray-300 rounded-md flex items-center justify-center gap-2 ${
                  gameOptions.playerSide === "white" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => handleChange("playerSide", "white")}
              >
                <div className="w-4 h-4 bg-white rounded-full"></div>
                White
              </Button>
              <Button
                type="button"
                className={`flex-1 py-3 border border-gray-300 rounded-md flex items-center justify-center gap-2 ${
                  gameOptions.playerSide === "black" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => handleChange("playerSide", "black")}
              >
                <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                Black
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Choose Role</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                className={`flex-1 py-3 border border-gray-300 rounded-md ${
                  gameOptions.playerRole === "player1" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => handleChange("playerRole", "player1")}
              >
                Player 1
              </Button>
              <Button
                type="button"
                className={`flex-1 py-3 border border-gray-300 rounded-md ${
                  gameOptions.playerRole === "player2" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
                }`}
                onClick={() => handleChange("playerRole", "player2")}
              >
                Player 2
              </Button>
            </div>
          </div>
        </div>
        
        {/* Board Setup */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Board Setup</h3>
          <div className="flex items-center gap-4 mb-4">
            <Button
              type="button"
              className={`flex-1 py-3 border border-gray-300 rounded-md ${
                gameOptions.boardSetup === "standard" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => {
                handleChange("boardSetup", "standard");
                handleChange("fen", STANDARD_FEN);
              }}
            >
              Standard
            </Button>
            <Button
              type="button"
              className={`flex-1 py-3 border border-gray-300 rounded-md ${
                gameOptions.boardSetup === "custom" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => handleChange("boardSetup", "custom")}
            >
              Custom
            </Button>
          </div>
          
          {/* FEN Input */}
          <div className="mb-4">
            <Label htmlFor="fenInput" className="block text-sm font-medium text-gray-600 mb-1">
              FEN String
            </Label>
            <Input
              id="fenInput"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              value={gameOptions.fen}
              onChange={(e) => handleChange("fen", e.target.value)}
              disabled={isStandardSetup}
            />
          </div>
        </div>
        
        {/* Difficulty */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">AI Difficulty</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              className={`flex-1 py-2 border border-gray-300 rounded-md ${
                gameOptions.difficulty === "standard" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => handleChange("difficulty", "standard")}
            >
              Standard
            </Button>
            <Button
              type="button"
              className={`flex-1 py-2 border border-gray-300 rounded-md ${
                gameOptions.difficulty === "grandmaster" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => handleChange("difficulty", "grandmaster")}
            >
              Grandmaster
            </Button>
            <Button
              type="button"
              className={`flex-1 py-2 border border-gray-300 rounded-md ${
                gameOptions.difficulty === "insane" ? "bg-secondary text-white" : "bg-white hover:bg-gray-100"
              }`}
              onClick={() => handleChange("difficulty", "insane")}
            >
              Insane
            </Button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 py-3 border border-gray-300 rounded-md hover:bg-gray-100"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={handleSubmit}
          >
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
