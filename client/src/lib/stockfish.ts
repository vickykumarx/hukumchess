import { Chess } from "chess.js";
import { apiRequest } from "./queryClient";

// Function to get AI move from server
export async function getAIMove(fen: string, depth: number = 15, timeLimit: number = 2000): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/ai/move", {
      fen,
      depth,
      timeLimit
    });
    
    const data = await response.json();
    return data.move;
  } catch (error) {
    console.error("Error getting AI move:", error);
    throw new Error("Failed to get AI move");
  }
}

// Evaluate a chess position
export async function evaluatePosition(fen: string, depth: number = 15): Promise<number> {
  try {
    const response = await apiRequest("POST", "/api/ai/evaluate", {
      fen,
      depth
    });
    
    const data = await response.json();
    return data.evaluation;
  } catch (error) {
    console.error("Error evaluating position:", error);
    throw new Error("Failed to evaluate position");
  }
}

// Check if a move is a "foul capture" (for Free Hit rule)
export async function isFoulCapture(chess: Chess, move: string): Promise<boolean> {
  try {
    // Make a copy of the chess object to try the move
    const chessCopy = new Chess(chess.fen());
    
    // Parse the move
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    
    // Get the piece that would be moved
    const piece = chessCopy.get(from);
    if (!piece) return false;
    
    // Make the move
    const moveObj = chessCopy.move({ from, to });
    if (!moveObj) return false;
    
    // Check if it was a capture
    if (!moveObj.captured) return false;
    
    // Evaluate the position before and after the move
    const evaluationBefore = await evaluatePosition(chess.fen());
    const evaluationAfter = await evaluatePosition(chessCopy.fen());
    
    // If the evaluation drastically worsens for the player who made the move,
    // it's considered a foul capture
    const evaluationDiff = piece.color === 'w' 
      ? evaluationBefore - evaluationAfter
      : evaluationAfter - evaluationBefore;
    
    return evaluationDiff > 2; // Consider it foul if evaluation diff is > 2 pawns
  } catch (error) {
    console.error("Error checking for foul capture:", error);
    return false;
  }
}

// Solve a mate-in-X puzzle
export async function solvePuzzle(
  fen: string,
  solution: string,
  mateIn: number,
  timeLimit: number = 15000
): Promise<boolean> {
  try {
    const response = await apiRequest("POST", `/api/puzzles/solve`, {
      fen,
      solution,
      mateIn,
      timeLimit
    });
    
    const data = await response.json();
    return data.solved;
  } catch (error) {
    console.error("Error solving puzzle:", error);
    throw new Error("Failed to solve puzzle");
  }
}
