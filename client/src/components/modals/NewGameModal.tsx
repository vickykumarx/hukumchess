import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Crown, Cpu, Globe, Award, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
// import { Chessboard } from "react-chessboard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Predefined positions for quick setup
const PREDEFINED_POSITIONS = [
  { 
    name: "Standard", 
    fen: STANDARD_FEN, 
    description: "Classic chess starting position."
  },
  { 
    name: "Queen & King vs Pawns", 
    fen: "8/8/8/8/8/8/PPPPPPPP/4K2Q w - - 0 1", 
    description: "Queen and King against 8 pawns."
  },
  { 
    name: "Endgame Practice", 
    fen: "4k3/4p3/8/8/8/8/4P3/4K3 w - - 0 1", 
    description: "Simple King & pawn endgame."
  },
  { 
    name: "Knights vs Bishops", 
    fen: "4k3/8/8/8/8/8/8/NNBK4 w - - 0 1", 
    description: "Practice piece coordination."
  }
];

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
  
  const [activeTab, setActiveTab] = useState<string>("general");
  const [selectedPosition, setSelectedPosition] = useState<number>(0);

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
  
  const selectPredefinedPosition = (index: number) => {
    setSelectedPosition(index);
    handleChange("fen", PREDEFINED_POSITIONS[index].fen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 mx-4 animate-slide-up">
        <DialogTitle className="font-sans font-bold text-2xl">Hukum Chess</DialogTitle>
        <DialogDescription>
          Configure your game settings. Each player has 6 moves, and the highest score wins!
        </DialogDescription>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general" className="flex items-center gap-1">
              <Crown className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="position" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Position</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Cpu className="h-4 w-4" />
              <span>AI Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="border rounded-md p-4">
            <h3 className="font-medium text-lg mb-4">Game Setup</h3>
            
            {/* Side Selection */}
            <div className="mb-6">
              <Label className="block text-sm font-medium text-gray-600 mb-2">
                Choose Your Side
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={gameOptions.playerSide === "white" ? "default" : "outline"}
                  className={`py-6 flex items-center justify-center gap-2`}
                  onClick={() => handleChange("playerSide", "white")}
                >
                  <div className="w-5 h-5 bg-white border border-gray-300 rounded-full"></div>
                  <span className="font-medium">White</span>
                </Button>
                
                <Button
                  type="button"
                  variant={gameOptions.playerSide === "black" ? "default" : "outline"}
                  className={`py-6 flex items-center justify-center gap-2`}
                  onClick={() => handleChange("playerSide", "black")}
                >
                  <div className="w-5 h-5 bg-gray-800 border border-gray-300 rounded-full"></div>
                  <span className="font-medium">Black</span>
                </Button>
              </div>
            </div>
            
            {/* Role Selection */}
            <div>
              <Label className="block text-sm font-medium text-gray-600 mb-2">
                Choose Your Role
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={gameOptions.playerRole === "player1" ? "default" : "outline"}
                        className="py-6"
                        onClick={() => handleChange("playerRole", "player1")}
                      >
                        Player 1 (Moves First)
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>You'll be the first to move in the game</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={gameOptions.playerRole === "player2" ? "default" : "outline"}
                        className="py-6"
                        onClick={() => handleChange("playerRole", "player2")}
                      >
                        Player 2 (Moves Second)
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI will move first, then you'll follow</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="position" className="border rounded-md p-4">
            <h3 className="font-medium text-lg mb-4">Board Position</h3>
            
            {/* Setup Type */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-600 mb-2">
                Choose Setup Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={gameOptions.boardSetup === "standard" ? "default" : "outline"}
                  className="py-3"
                  onClick={() => {
                    handleChange("boardSetup", "standard");
                    handleChange("fen", STANDARD_FEN);
                    setSelectedPosition(0);
                  }}
                >
                  Standard Setup
                </Button>
                
                <Button
                  type="button"
                  variant={gameOptions.boardSetup === "custom" ? "default" : "outline"}
                  className="py-3"
                  onClick={() => handleChange("boardSetup", "custom")}
                >
                  Custom Position
                </Button>
              </div>
            </div>
            
            {/* Position Preview */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-2">
                  Board Preview
                </Label>
                <div className="aspect-square w-full max-w-[200px] mx-auto border rounded overflow-hidden bg-gray-100 p-2 flex items-center justify-center">
                  <div className="text-sm text-gray-500 text-center">
                    <div className="font-medium mb-1">FEN Preview</div>
                    <div className="truncate max-w-40">{gameOptions.fen.substring(0, 20)}...</div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-600 mb-2">
                  Preset Positions
                </Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {PREDEFINED_POSITIONS.map((position, index) => (
                    <div 
                      key={index}
                      className={`p-2 border rounded cursor-pointer transition hover:bg-gray-50 ${
                        selectedPosition === index ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                      onClick={() => selectPredefinedPosition(index)}
                    >
                      <div className="font-medium">{position.name}</div>
                      <div className="text-xs text-gray-500">{position.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* FEN Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="fenInput" className="block text-sm font-medium text-gray-600">
                  FEN String
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">?</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        FEN (Forsyth-Edwards Notation) is a standard notation for describing chess positions.
                        It represents the board state, active color, castling availability, en passant targets, and move counts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="fenInput"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                value={gameOptions.fen}
                onChange={(e) => handleChange("fen", e.target.value)}
                disabled={isStandardSetup}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="border rounded-md p-4">
            <h3 className="font-medium text-lg mb-4">AI Difficulty</h3>
            
            <div className="grid grid-cols-1 gap-3 mb-4">
              <Card 
                className={`cursor-pointer transition ${
                  gameOptions.difficulty === "standard" ? "border-primary" : "border-gray-200"
                }`}
                onClick={() => handleChange("difficulty", "standard")}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Standard</h4>
                    <p className="text-sm text-gray-500">
                      Beginner-friendly AI that focuses on basic principles.
                    </p>
                  </div>
                  {gameOptions.difficulty === "standard" && (
                    <ChevronRight className="h-5 w-5 text-primary" />
                  )}
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition ${
                  gameOptions.difficulty === "grandmaster" ? "border-primary" : "border-gray-200"
                }`}
                onClick={() => handleChange("difficulty", "grandmaster")}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="bg-info/10 p-2 rounded-full">
                    <Award className="h-5 w-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Grandmaster</h4>
                    <p className="text-sm text-gray-500">
                      Advanced AI that makes strong tactical and strategic moves.
                    </p>
                  </div>
                  {gameOptions.difficulty === "grandmaster" && (
                    <ChevronRight className="h-5 w-5 text-primary" />
                  )}
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition ${
                  gameOptions.difficulty === "insane" ? "border-primary" : "border-gray-200"
                }`}
                onClick={() => handleChange("difficulty", "insane")}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="bg-danger/10 p-2 rounded-full">
                    <Zap className="h-5 w-5 text-danger" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Insane</h4>
                    <p className="text-sm text-gray-500">
                      Expert-level AI that plans several moves ahead. A serious challenge!
                    </p>
                  </div>
                  {gameOptions.difficulty === "insane" && (
                    <ChevronRight className="h-5 w-5 text-primary" />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Action Buttons */}
        <DialogFooter className="mt-6 flex gap-4">
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
            className="flex-1 py-6 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={handleSubmit}
          >
            Start Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGameModal;
