import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, Timer, RotateCcw, Flag, XCircle, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MoveLog {
  id: number;
  gameId: number;
  move: string;
  isPlayer: boolean;
  capturedPiece?: string;
  points: number;
  moveNumber: number;
}

interface GameInfoPanelProps {
  playerScore: number;
  aiScore: number;
  playerMoves: number;
  aiMoves: number;
  moveHistory: MoveLog[];
  timeRemaining: number;
  isTimerLow: boolean;
  onNewGame: () => void;
  onResign: () => void;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const GameInfoPanel: React.FC<GameInfoPanelProps> = ({
  playerScore,
  aiScore,
  playerMoves,
  aiMoves,
  moveHistory,
  timeRemaining,
  isTimerLow,
  onNewGame,
  onResign
}) => {
  const [showHistory, setShowHistory] = useState(true);
  const progressPercentage = ((playerMoves + aiMoves) / 12) * 100;
  const playerLeading = playerScore > aiScore;
  const aiLeading = aiScore > playerScore;
  const tie = playerScore === aiScore;

  return (
    <div className="w-full md:w-1/4 order-2 md:order-1">
      <Card className="shadow-md mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Match Info</CardTitle>
            <Badge className="bg-info/90 hover:bg-info/80 text-white">In Progress</Badge>
          </div>
          <CardDescription>
            Hukum Chess: 6 moves per player
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-3">
          {/* Score Display */}
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="text-center mb-2">
              <h3 className="text-sm text-gray-500 mb-1">Score Difference</h3>
              <div className="flex items-center justify-center">
                {playerLeading && (
                  <Badge className="bg-success/90 hover:bg-success/80 text-white">
                    +{playerScore - aiScore} points
                  </Badge>
                )}
                {aiLeading && (
                  <Badge className="bg-danger/90 hover:bg-danger/80 text-white">
                    -{aiScore - playerScore} points
                  </Badge>
                )}
                {tie && (
                  <Badge className="bg-info/90 hover:bg-info/80 text-white">
                    Tied {playerScore} - {aiScore}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Players */}
            <div className="mb-1">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded-full"></div>
                  <span className="font-medium">You</span>
                </div>
                <span className={`font-sans font-bold text-xl ${playerLeading ? "text-success" : ""}`}>
                  {playerScore}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-800 border border-gray-300 rounded-full"></div>
                  <span className="font-medium">AI</span>
                </div>
                <span className={`font-sans font-bold text-xl ${aiLeading ? "text-danger" : ""}`}>
                  {aiScore}
                </span>
              </div>
            </div>
          </div>
          
          {/* Move Counter */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-600">Moves</h3>
              <div className="flex gap-2">
                <span className="font-sans font-semibold text-sm">{playerMoves}/6</span>
                <span className="text-gray-400">vs</span>
                <span className="font-sans font-semibold text-sm">{aiMoves}/6</span>
              </div>
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-primary rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>12 Moves Total</span>
            </div>
          </div>
          
          {/* Timer */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-medium text-gray-600">Timer</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{playerMoves === 0 || aiMoves === 0 ? "60s" : "30s"} per move</span>
              </div>
            </div>
            <div className={cn(
              "font-sans font-bold text-3xl text-center py-2 rounded-md flex items-center justify-center gap-2",
              isTimerLow ? "animate-pulse-red text-danger" : "bg-gray-100"
            )}>
              <Timer className={`h-6 w-6 ${isTimerLow ? "text-danger" : "text-gray-400"}`} />
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          {/* Game Log */}
          <div>
            <div 
              className="flex justify-between items-center mb-1 cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h3 className="font-medium text-gray-600">Move History</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {showHistory && (
              <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
                {moveHistory.length === 0 ? (
                  <div className="py-2 text-center text-gray-400">No moves yet</div>
                ) : (
                  moveHistory.map((log) => (
                    <div key={log.id} className={`flex justify-between py-1.5 px-1.5 border-b border-gray-100 ${log.isPlayer ? "bg-gray-50" : "bg-white"}`}>
                      <span className="flex items-center gap-1">
                        <Badge variant="outline" className={`text-xs py-0 px-1 ${log.isPlayer ? "border-success text-success" : "border-secondary text-secondary"}`}>
                          {log.isPlayer ? 'You' : 'AI'}
                        </Badge>
                        <span>
                          {log.capturedPiece ? (
                            <span className="font-medium">captured {log.capturedPiece}</span>
                          ) : (
                            <span>{log.move.slice(0, 2)} → {log.move.slice(2, 4)}</span>
                          )}
                        </span>
                      </span>
                      <span className={`font-medium ${log.points > 0 ? (log.isPlayer ? "text-success" : "text-danger") : ""}`}>
                        {log.points > 0 ? `+${log.points}` : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full py-2 transition rounded-md font-medium flex items-center justify-center gap-1"
                    onClick={onResign}
                  >
                    <Flag className="h-4 w-4" />
                    Resign
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Give up and end the game</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full py-2 transition rounded-md font-medium flex items-center justify-center gap-1"
                    onClick={() => window.location.reload()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restart the application</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <Button
            variant="default"
            className="w-full py-6 bg-primary text-white hover:bg-primary/90 transition rounded-md font-medium"
            onClick={onNewGame}
          >
            <Trophy className="h-5 w-5 mr-2" />
            New Game
          </Button>
        </CardContent>
      </Card>
      
      {/* Game Rules */}
      <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <h3 className="font-medium text-gray-700 mb-1">Rules &amp; Scoring</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Queen: 9 points</li>
          <li>Rook: 5 points</li>
          <li>Bishop/Knight: 3 points</li>
          <li>Pawn: 1 point</li>
          <li>Checkmate: Win</li>
        </ul>
      </div>
    </div>
  );
};

export default GameInfoPanel;
