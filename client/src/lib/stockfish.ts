import { Chess, Move, Square, PieceSymbol, Color } from "chess.js";
import { apiRequest } from "./queryClient";
import { PIECE_VALUES } from "./chess";

/**
 * Simple implementation of AI for Hukum Chess
 * Uses a simpler approach to avoid complex Stockfish integration issues
 */

// Get an AI move for the given position
export async function getAIMove(fen: string, depth: number = 10, timeLimit: number = 2000): Promise<string> {
  try {
    // Try server-side AI first
    try {
      const response = await apiRequest("POST", "/api/ai/move", {
        fen,
        depth,
        timeLimit
      });
      
      const data = await response.json();
      if (data && data.move) {
        return data.move;
      }
    } catch (err) {
      console.log("Server-side AI not available, using fallback");
    }
    
    // If server fails, use local fallback
    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });
    
    if (moves.length === 0) {
      throw new Error("No legal moves available");
    }
    
    // For Hukum Chess: prioritize captures by value
    const captureMoves = moves.filter(move => move.captured);
    if (captureMoves.length > 0) {
      // Sort by value of captured piece (highest first)
      captureMoves.sort((a, b) => {
        const aValue = a.captured ? PIECE_VALUES[a.captured] : 0;
        const bValue = b.captured ? PIECE_VALUES[b.captured] : 0;
        return bValue - aValue;
      });
      
      // Pick the highest value capture
      const bestCapture = captureMoves[0];
      return bestCapture.from + bestCapture.to + (bestCapture.promotion || '');
    }
    
    // If no captures, make a tactical move (basic strategy)
    // In a real implementation, we'd use minimax here, but for simplicity:
    
    // 1. Check for moves that put opponent in check
    const checkMoves = moves.filter(move => {
      const tempChess = new Chess(fen);
      tempChess.move({ from: move.from as Square, to: move.to as Square, promotion: move.promotion });
      return tempChess.isCheck();
    });
    
    if (checkMoves.length > 0) {
      const checkMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
      return checkMove.from + checkMove.to + (checkMove.promotion || '');
    }
    
    // 2. Default: make a random move, slightly favoring development
    const centralMoves = moves.filter(move => {
      const targetRank = parseInt(move.to.charAt(1));
      const targetFile = move.to.charAt(0);
      return (targetRank === 4 || targetRank === 5) && 
             (targetFile === 'd' || targetFile === 'e');
    });
    
    if (centralMoves.length > 0 && Math.random() > 0.3) { // 70% chance of central move
      const centralMove = centralMoves[Math.floor(Math.random() * centralMoves.length)];
      return centralMove.from + centralMove.to + (centralMove.promotion || '');
    }
    
    // Random move as last resort
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove.from + randomMove.to + (randomMove.promotion || '');
  } catch (error) {
    console.error("Error getting AI move:", error);
    throw new Error("Failed to get AI move");
  }
}

// Evaluate a chess position (simplified)
export function evaluatePosition(fen: string, depth: number = 10): number {
  try {
    const chess = new Chess(fen);
    
    // Material evaluation
    let evaluation = 0;
    const board = chess.board();
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = PIECE_VALUES[piece.type] * (piece.color === 'w' ? 1 : -1);
          evaluation += value;
        }
      }
    }
    
    // Position evaluation (simplified)
    // 1. Central control bonus
    const centralSquares = ['d4', 'd5', 'e4', 'e5'];
    for (const square of centralSquares) {
      const piece = chess.get(square as Square);
      if (piece) {
        evaluation += 0.2 * (piece.color === 'w' ? 1 : -1);
      }
    }
    
    // 2. Development bonus 
    const developmentSquares = {
      w: ['f3', 'c3', 'f4', 'c4'],
      b: ['f6', 'c6', 'f5', 'c5']
    };
    
    for (const color of ['w', 'b'] as Color[]) {
      for (const square of developmentSquares[color]) {
        const piece = chess.get(square as Square);
        if (piece && piece.type !== 'p' && piece.color === color) {
          evaluation += 0.1 * (color === 'w' ? 1 : -1);
        }
      }
    }
    
    // 3. Check bonus
    if (chess.isCheck()) {
      evaluation += 0.5 * (chess.turn() === 'b' ? 1 : -1);  // If white gave check, bonus for white
    }
    
    // 4. Mobility (rough approximation using a clone)
    // Chess.js doesn't have a setTurn method, so we use a workaround
    let whiteMoves = 0;
    let blackMoves = 0;
    
    if (chess.turn() === 'w') {
      whiteMoves = chess.moves().length;
      // Create a modified FEN with black to move
      const parts = chess.fen().split(' ');
      parts[1] = 'b'; // Set turn to black
      const blackTurnFen = parts.join(' ');
      try {
        const tempChess = new Chess(blackTurnFen);
        blackMoves = tempChess.moves().length;
      } catch (e) {
        // If FEN manipulation fails, just use an approximation
        blackMoves = whiteMoves;
      }
    } else {
      blackMoves = chess.moves().length;
      // Create a modified FEN with white to move
      const parts = chess.fen().split(' ');
      parts[1] = 'w'; // Set turn to white
      const whiteTurnFen = parts.join(' ');
      try {
        const tempChess = new Chess(whiteTurnFen);
        whiteMoves = tempChess.moves().length;
      } catch (e) {
        // If FEN manipulation fails, just use an approximation
        whiteMoves = blackMoves;
      }
    }
    
    evaluation += 0.05 * (whiteMoves - blackMoves);
    
    return evaluation;
  } catch (error) {
    console.error("Error evaluating position:", error);
    return 0;
  }
}

// Check if a move is a "foul capture" (for Free Hit rule in Hukum Chess)
export function isFoulCapture(chess: Chess, move: string): boolean {
  try {
    // Make a copy of the chess object to try the move
    const chessCopy = new Chess(chess.fen());
    
    // Parse the move
    const from = move.substring(0, 2) as Square;
    const to = move.substring(2, 4) as Square;
    const promotion = move.length > 4 ? move.substring(4, 5) as PieceSymbol : undefined;
    
    // Get the piece that would be moved
    const piece = chessCopy.get(from);
    if (!piece) return false;
    
    // Make the move
    const moveObj = chessCopy.move({ from, to, promotion });
    if (!moveObj) return false;
    
    // Check if it was a capture
    if (!moveObj.captured) return false;
    
    // For Hukum Chess: A foul capture is defined as:
    // 1. Capturing a higher value piece with a lower value piece (e.g., pawn takes queen)
    // 2. Capturing a piece that leaves the capturer immediately capturable
    // 3. Capturing a piece when the evaluation significantly worsens
    
    // Condition 1: Check piece value exchange
    const movingPieceValue = PIECE_VALUES[piece.type];
    const capturedPieceValue = PIECE_VALUES[moveObj.captured];
    
    if (movingPieceValue < capturedPieceValue) {
      // Good capture (lower value piece takes higher value piece)
      return false;
    }
    
    // Condition 2: Check if the capturing piece is now in danger
    const isCapturerInDanger = chessCopy.isAttacked(to, chessCopy.turn());
    if (isCapturerInDanger && movingPieceValue >= capturedPieceValue) {
      // Foul capture: captured equal/lower value and now in danger
      return true;
    }
    
    // Condition 3: Evaluate position change
    const evaluationBefore = evaluatePosition(chess.fen());
    const evaluationAfter = evaluatePosition(chessCopy.fen());
    
    // If the evaluation drastically worsens for the player who made the move,
    // it's considered a foul capture
    const evaluationDiff = piece.color === 'w' 
      ? evaluationBefore - evaluationAfter
      : evaluationAfter - evaluationBefore;
    
    // Consider it foul if evaluation diff is > 1.5 pawns
    return evaluationDiff > 1.5;
  } catch (error) {
    console.error("Error checking for foul capture:", error);
    return false;
  }
}

// Solve a mate-in-X puzzle (simplified)
export async function solvePuzzle(
  fen: string,
  solution: string,
  mateIn: number,
  timeLimit: number = 15000
): Promise<boolean> {
  try {
    // Try to use the server-side solver first
    try {
      const response = await apiRequest("POST", "/api/puzzles/solve", {
        fen,
        solution,
        mateIn,
        timeLimit
      });
      
      const data = await response.json();
      return data.solved;
    } catch (err) {
      console.log("Server-side puzzle solver not available, using fallback");
    }
    
    // For this version, we'll do a simple solution check:
    // - Just check if the AI finds the exact same move as the solution
    // - In a real implementation, this would verify the entire mate sequence
    
    const chess = new Chess(fen);
    const bestMove = await getAIMove(fen, 10 + mateIn, timeLimit);
    
    // Convert solution and bestMove to standard format if needed
    const cleanSolution = solution.length <= 5 ? solution : solution.split(' ')[0];
    const cleanBestMove = bestMove.length <= 5 ? bestMove : bestMove.split(' ')[0];
    
    // Basic solution check - the moves match
    return cleanSolution === cleanBestMove;
  } catch (error) {
    console.error("Error solving puzzle:", error);
    return false;
  }
}