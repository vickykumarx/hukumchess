import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const progressPercentage = ((playerMoves + aiMoves) / 12) * 100;

  return (
    <div className="w-full md:w-1/4 order-2 md:order-1">
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-sans font-semibold text-lg">Match Info</h2>
            <span className="px-2 py-1 bg-info/10 text-info text-sm rounded-md">
              In Progress
            </span>
          </div>
          
          {/* Players */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full"></div>
                <span className="font-medium">You</span>
              </div>
              <span className="font-sans font-bold text-xl">{playerScore}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-800 border border-gray-300 rounded-full"></div>
                <span className="font-medium">AI (Stockfish)</span>
              </div>
              <span className="font-sans font-bold text-xl">{aiScore}</span>
            </div>
          </div>
          
          {/* Move Counter */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-600 mb-1">Moves</h3>
            <div className="flex justify-between">
              <span className="font-sans font-semibold">{playerMoves}/6</span>
              <span className="font-sans font-semibold">{aiMoves}/6</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
          
          {/* Timer */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-600 mb-1">Timer</h3>
            <div className={cn(
              "font-sans font-bold text-3xl text-center py-2 rounded-md",
              isTimerLow ? "animate-pulse-red" : "bg-gray-100"
            )}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          {/* Game Log */}
          <div>
            <h3 className="font-medium text-gray-600 mb-1">Last Moves</h3>
            <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
              {moveHistory.length === 0 ? (
                <div className="py-2 text-center text-gray-400">No moves yet</div>
              ) : (
                moveHistory.map((log) => (
                  <div key={log.id} className="flex justify-between py-1 border-b border-gray-100">
                    <span>
                      {log.isPlayer ? 'You' : 'AI'} {log.capturedPiece ? `captured ${log.capturedPiece}` : `moved ${log.move}`}
                    </span>
                    <span className={log.isPlayer ? "text-success" : ""}>
                      {log.points > 0 ? `+${log.points}` : log.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full py-2 bg-gray-200 hover:bg-gray-300 transition rounded-md mb-2 font-medium"
            onClick={onResign}
          >
            Resign
          </Button>
          <Button
            variant="default"
            className="w-full py-2 bg-primary text-white hover:bg-primary/90 transition rounded-md font-medium"
            onClick={onNewGame}
          >
            New Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameInfoPanel;
