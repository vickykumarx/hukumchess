// Simple chess AI implementation for Hukum Chess
// This is a direct implementation that doesn't use Stockfish

import { Chess, PieceSymbol, Color, Square } from 'chess.js';

// Piece values for evaluation
const PIECE_VALUES: { [key: string]: number } = {
  p: 1,  // pawn
  n: 3,  // knight
  b: 3,  // bishop
  r: 5,  // rook
  q: 9,  // queen
  k: 0   // king (not counted for material)
};

// Square values for piece positioning (center control is good)
const SQUARE_VALUES: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0],
  [0, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0],
  [0, 0.2, 0.4, 0.5, 0.5, 0.4, 0.2, 0],
  [0, 0.2, 0.4, 0.5, 0.5, 0.4, 0.2, 0],
  [0, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0],
  [0, 0.1, 0.2, 0.2, 0.2, 0.2, 0.1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

// Additional bonus for captures
const CAPTURE_BONUS = 0.5;

// Generate a move for the AI
export async function getStockfishMove(fen: string, depth: number = 3, timeLimit: number = 1000): Promise<string> {
  const chess = new Chess(fen);
  const color = chess.turn();
  
  // For Hukum Chess, we prioritize captures and material advantage
  // Since this is a 6-move game
  const bestMove = findBestMove(chess, depth, color);
  
  // Return the move in UCI format (e.g., "e2e4")
  return bestMove;
}

// Evaluate a position
export async function evaluatePosition(fen: string, depth: number = 2): Promise<number> {
  const chess = new Chess(fen);
  return evaluateBoard(chess);
}

// Attempt to solve a puzzle
export async function solvePuzzle(fen: string, solution: string, mateIn: number, timeLimit: number = 15000): Promise<boolean> {
  try {
    const chess = new Chess(fen);
    
    // Try to find the best move
    const bestMove = findBestMove(chess, Math.min(mateIn * 2, 3), chess.turn());
    
    // Check if the move matches any solution move
    const solutionMoves = solution.split(' ');
    return solutionMoves.includes(bestMove);
  } catch (error) {
    console.error('Error solving puzzle:', error);
    return false;
  }
}

// Find the best move using minimax algorithm
function findBestMove(chess: Chess, depth: number, playerColor: Color): string {
  let bestMove = '';
  let bestScore = playerColor === 'w' ? -Infinity : Infinity;
  const moves = chess.moves({ verbose: true });
  
  // Sort moves to prioritize captures for better pruning
  moves.sort((a, b) => {
    const aCapture = a.captured ? 1 : 0;
    const bCapture = b.captured ? 1 : 0;
    return bCapture - aCapture;
  });
  
  for (const move of moves) {
    // Make move
    chess.move(move);
    
    // Evaluate position
    const score = minimax(chess, depth - 1, -Infinity, Infinity, playerColor === 'w' ? false : true);
    
    // Undo move
    chess.undo();
    
    // Update best move
    if ((playerColor === 'w' && score > bestScore) || (playerColor === 'b' && score < bestScore)) {
      bestScore = score;
      bestMove = move.from + move.to + (move.promotion || '');
    }
  }
  
  // If no best move found (unlikely), return the first legal move
  if (!bestMove && moves.length > 0) {
    const firstMove = moves[0];
    bestMove = firstMove.from + firstMove.to + (firstMove.promotion || '');
  }
  
  return bestMove;
}

// Minimax algorithm with alpha-beta pruning
function minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  // Base case: if depth is 0 or game is over, evaluate the position
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }
  
  const moves = chess.moves({ verbose: true });
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      chess.move(move);
      const score = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minScore;
  }
}

// Evaluate the board position
function evaluateBoard(chess: Chess): number {
  // If game is over, return large score
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -1000 : 1000;
  }
  
  if (chess.isDraw()) {
    return 0;
  }
  
  // Evaluate material for both sides
  let score = 0;
  
  // Get all pieces on the board
  const squares = chess.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = squares[i][j];
      if (piece) {
        // Material value
        const value = PIECE_VALUES[piece.type] * (piece.color === 'w' ? 1 : -1);
        
        // Position value - encourage controlling the center and development
        const positionValue = SQUARE_VALUES[piece.color === 'w' ? i : 7 - i][j] * (piece.color === 'w' ? 0.2 : -0.2);
        
        score += value + positionValue;
      }
    }
  }
  
  // Add a small random factor to avoid repetitive play
  score += (Math.random() * 0.2 - 0.1);
  
  // For Hukum Chess, prioritize material advantage and captures in the 6-move limit
  // by giving a bonus for capturing high-value pieces
  const history = chess.history({ verbose: true });
  if (history.length > 0) {
    const lastMove = history[history.length - 1];
    if (lastMove.captured) {
      const captureValue = PIECE_VALUES[lastMove.captured] * (lastMove.color === 'w' ? 1 : -1);
      score += captureValue * CAPTURE_BONUS * (lastMove.color === 'w' ? 1 : -1);
    }
  }
  
  return score;
}
