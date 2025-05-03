import { useState, useEffect, useCallback } from "react";
import { Chess, Square } from "chess.js";
import useTimer from "./useTimer";
import { createChessGame, calculateMoveScore, isCheckmate, getLegalMovesForSquare } from "../lib/chess";
import { getAIMove, isFoulCapture } from "../lib/stockfish";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UseChessGameReturn {
  game: any;
  gameState: string;
  playerSide: "white" | "black";
  playerRole: "player1" | "player2";
  playerScore: number;
  aiScore: number;
  playerMoves: number;
  aiMoves: number;
  currentTurn: "white" | "black";
  fen: string;
  moveHistory: any[];
  timeRemaining: number;
  selectedSquare: Square | null;
  legalMoves: Square[];
  status: string;
  startNewGame: (options: any) => void;
  makeMove: (from: Square, to: Square) => boolean;
  selectSquare: (square: Square) => void;
  handleCapture: (piece: string, square: Square) => void;
  resignGame: () => void;
  isTimerLow: boolean;
}

export default function useChessGame(): UseChessGameReturn {
  // Game state
  const [game, setGame] = useState<any>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [chess, setChess] = useState<Chess>(createChessGame());
  const [gameState, setGameState] = useState<string>("not_started");
  
  // Player settings
  const [playerSide, setPlayerSide] = useState<"white" | "black">("white");
  const [playerRole, setPlayerRole] = useState<"player1" | "player2">("player1");
  
  // Game statistics
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [aiScore, setAiScore] = useState<number>(0);
  const [playerMoves, setPlayerMoves] = useState<number>(0);
  const [aiMoves, setAiMoves] = useState<number>(0);
  
  // UI state
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [freeHitAvailable, setFreeHitAvailable] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Compute current turn
  const currentTurn = chess.turn() === 'w' ? "white" : "black";
  
  // Compute if it's player's turn
  const isPlayerTurn = currentTurn === playerSide;
  
  // Timer setup - 60s for 1st move, 30s for remaining moves
  const initialTime = playerMoves === 0 || aiMoves === 0 ? 60 : 30;
  const { timeRemaining, isTimerLow, resetTimer } = useTimer({
    initialTime,
    isActive: gameState === "in_progress",
    onTimeUp: handleTimeUp
  });

  // Handle time up
  function handleTimeUp() {
    if (gameState !== "in_progress") return;
    
    // Apply missed move penalty
    if (isPlayerTurn) {
      setPlayerScore(prev => Math.max(0, prev - 1));
      setPlayerMoves(prev => prev + 1);
    } else {
      setAiScore(prev => Math.max(0, prev - 1));
      setAiMoves(prev => prev + 1);
    }
    
    // Check if game is over after this move
    checkGameOver();
    
    // Reset timer for next move
    resetTimer(30);
    
    // Make AI move if it's AI's turn now
    if (!isPlayerTurn) {
      makeAIMove();
    }
  }
  
  // Start a new game
  const startNewGame = useCallback(async (options: any) => {
    try {
      // Initialize the chess instance with the given FEN or default
      const newChess = createChessGame(options.fen);
      setChess(newChess);
      
      // Set player options
      setPlayerSide(options.playerSide);
      setPlayerRole(options.playerRole);
      
      // Reset game state
      setPlayerScore(0);
      setAiScore(0);
      setPlayerMoves(0);
      setAiMoves(0);
      setSelectedSquare(null);
      setLegalMoves([]);
      setMoveHistory([]);
      setStatus("Game started");
      setFreeHitAvailable(false);
      
      // Set game state to in progress
      setGameState("in_progress");
      
      // Create a new game on the server
      const response = await apiRequest("POST", "/api/games", {
        playerSide: options.playerSide,
        playerRole: options.playerRole,
        fen: newChess.fen(),
        status: "in_progress"
      });
      
      const gameData = await response.json();
      setGame(gameData);
      setGameId(gameData.id);
      
      // Reset timer
      resetTimer(60); // First move gets 60 seconds
      
      // If AI goes first, make AI move
      if (
        (options.playerSide === "white" && options.playerRole === "player2") ||
        (options.playerSide === "black" && options.playerRole === "player1")
      ) {
        makeAIMove();
      }
    } catch (error) {
      console.error("Error starting new game:", error);
      toast({
        title: "Error",
        description: "Failed to start a new game",
        variant: "destructive"
      });
    }
  }, [resetTimer, toast]);
  
  // Make an AI move
  const makeAIMove = useCallback(async () => {
    if (gameState !== "in_progress" || !gameId) return;
    
    try {
      // Get AI move from Stockfish
      const move = await getAIMove(chess.fen(), 15, 2000);
      
      // Parse the move
      const from = move.substring(0, 2) as Square;
      const to = move.substring(2, 4) as Square;
      const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
      
      // Make the move on the chess board
      const moveObj = chess.move({
        from,
        to,
        promotion
      });
      
      if (!moveObj) {
        throw new Error("Invalid AI move");
      }
      
      // Calculate score for the move
      const points = calculateMoveScore(moveObj);
      
      // Update AI score and moves
      setAiScore(prev => prev + points);
      setAiMoves(prev => prev + 1);
      
      // Add move to history
      const moveData = {
        gameId,
        move: `${from}${to}${promotion || ''}`,
        isPlayer: false,
        capturedPiece: moveObj.captured,
        points,
        moveNumber: aiMoves + 1,
        resultingFen: chess.fen()
      };
      
      // Save move to server
      await apiRequest("POST", `/api/games/${gameId}/moves`, moveData);
      
      // Add to local move history
      setMoveHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          ...moveData
        }
      ]);
      
      // Check if this was a "foul capture" that enables Free Hit
      if (aiMoves === 5 && moveObj.captured) {
        const foulCapture = await isFoulCapture(chess, `${from}${to}`);
        setFreeHitAvailable(foulCapture);
      }
      
      // Check if game is over
      checkGameOver();
      
      // Reset timer for player's move
      resetTimer(playerMoves === 0 ? 60 : 30);
      
      // Update status message
      setStatus(moveObj.captured ? `AI captured your ${moveObj.captured}` : "AI moved");
    } catch (error) {
      console.error("Error making AI move:", error);
      toast({
        title: "Error",
        description: "Failed to make AI move",
        variant: "destructive"
      });
    }
  }, [chess, aiMoves, gameId, gameState, playerMoves, resetTimer, toast]);
  
  // Make a player move
  const makeMove = useCallback((from: Square, to: Square): boolean => {
    if (gameState !== "in_progress" || !isPlayerTurn || !gameId) return false;
    
    try {
      // Check if move is legal
      const move = chess.move({
        from,
        to,
        promotion: 'q' // Auto-promote to queen for simplicity
      });
      
      if (!move) {
        setStatus("Invalid move");
        return false;
      }
      
      // Calculate score for the move
      const points = calculateMoveScore(move);
      
      // Update player score and moves
      setPlayerScore(prev => prev + points);
      setPlayerMoves(prev => prev + 1);
      
      // Add move to history
      const moveData = {
        gameId,
        move: `${from}${to}${move.promotion || ''}`,
        isPlayer: true,
        capturedPiece: move.captured,
        points,
        moveNumber: playerMoves + 1,
        resultingFen: chess.fen()
      };
      
      // Save move to server
      apiRequest("POST", `/api/games/${gameId}/moves`, moveData)
        .catch(error => console.error("Error saving move:", error));
      
      // Add to local move history
      setMoveHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          ...moveData
        }
      ]);
      
      // Reset selected square and legal moves
      setSelectedSquare(null);
      setLegalMoves([]);
      
      // Check if game is over
      const gameOver = checkGameOver();
      
      if (!gameOver) {
        // Reset timer for AI's move
        resetTimer(aiMoves === 0 ? 60 : 30);
        
        // Make AI move after a short delay
        setTimeout(() => {
          makeAIMove();
        }, 500);
      }
      
      // Update status message
      setStatus(move.captured ? `You captured ${move.captured}` : "You moved");
      
      return true;
    } catch (error) {
      console.error("Error making move:", error);
      return false;
    }
  }, [chess, gameState, isPlayerTurn, gameId, playerMoves, aiMoves, resetTimer, makeAIMove]);
  
  // Select a square on the board
  const selectSquare = useCallback((square: Square) => {
    if (gameState !== "in_progress" || !isPlayerTurn) return;
    
    const piece = chess.get(square);
    
    // If a piece belonging to the player is clicked, show legal moves
    if (piece && ((piece.color === 'w' && playerSide === "white") || (piece.color === 'b' && playerSide === "black"))) {
      setSelectedSquare(square);
      setLegalMoves(getLegalMovesForSquare(chess, square));
    }
    // If a legal destination square is clicked, make the move
    else if (selectedSquare && legalMoves.includes(square)) {
      makeMove(selectedSquare, square);
    }
    // If another square is clicked, deselect
    else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [chess, gameState, isPlayerTurn, playerSide, selectedSquare, legalMoves, makeMove]);
  
  // Handle capture button click
  const handleCapture = useCallback((piece: string, square: Square) => {
    // Implement capture functionality
    if (gameState !== "in_progress" || !isPlayerTurn) return;
    
    if (selectedSquare) {
      makeMove(selectedSquare, square);
    }
  }, [gameState, isPlayerTurn, selectedSquare, makeMove]);
  
  // Check if the game is over
  const checkGameOver = useCallback((): boolean => {
    // Check for checkmate
    if (isCheckmate(chess)) {
      const winner = chess.turn() === 'w' ? "ai_win" : "player_win";
      setGameState(winner);
      setStatus(winner === "player_win" ? "You won by checkmate!" : "AI won by checkmate!");
      
      // Update game status on server
      if (gameId) {
        apiRequest("PATCH", `/api/games/${gameId}`, { status: winner })
          .catch(error => console.error("Error updating game status:", error));
      }
      
      return true;
    }
    
    // Check if move limits are reached (6 moves each)
    if (!freeHitAvailable && (playerMoves >= 6 && aiMoves >= 6)) {
      // Determine winner by score
      if (playerScore > aiScore) {
        setGameState("player_win");
        setStatus("You won by points!");
      } else if (aiScore > playerScore) {
        setGameState("ai_win");
        setStatus("AI won by points!");
      } else {
        setGameState("tie");
        setStatus("Game ended in a tie! Puzzle shootout time!");
      }
      
      // Update game status on server
      if (gameId) {
        apiRequest("PATCH", `/api/games/${gameId}`, { 
          status: gameState,
          playerScore,
          aiScore
        }).catch(error => console.error("Error updating game status:", error));
      }
      
      return true;
    }
    
    // Check for free hit rule - if playerMoves is 6 but freeHitAvailable is true
    if (playerMoves >= 6 && !freeHitAvailable && aiMoves < 6) {
      // AI still has moves left
      makeAIMove();
      return false;
    }
    
    return false;
  }, [chess, playerMoves, aiMoves, playerScore, aiScore, freeHitAvailable, gameId, makeAIMove]);
  
  // Resign the game
  const resignGame = useCallback(() => {
    if (gameState !== "in_progress") return;
    
    setGameState("ai_win");
    setStatus("You resigned. AI wins.");
    
    // Update game status on server
    if (gameId) {
      apiRequest("PATCH", `/api/games/${gameId}`, { status: "ai_win" })
        .catch(error => console.error("Error updating game status:", error));
    }
  }, [gameState, gameId]);

  // Effect to update FEN when chess object changes
  const fen = chess.fen();
  
  return {
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
  };
}
