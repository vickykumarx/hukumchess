import { Chess, Square, PieceSymbol, Color } from "chess.js";

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  captured?: PieceSymbol;
  color: Color;
  piece: PieceSymbol;
}

// Piece values for scoring
export const PIECE_VALUES = {
  p: 1, // pawn
  n: 3, // knight
  b: 3, // bishop
  r: 5, // rook
  q: 9, // queen
  k: 0  // king has no capture value
};

// Create a new chess game with optional FEN
export function createChessGame(fen?: string): Chess {
  try {
    if (fen) {
      return new Chess(fen);
    } else {
      return new Chess();
    }
  } catch (error) {
    console.error("Invalid FEN string:", error);
    return new Chess();
  }
}

// Calculate score for a move
export function calculateMoveScore(move: Move): number {
  // Base score is 0
  let score = 0;
  
  // Add points for captured pieces
  if (move.captured) {
    score += PIECE_VALUES[move.captured];
  }
  
  // Add bonus for promotion (new piece value - pawn value)
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] - PIECE_VALUES.p;
  }
  
  return score;
}

// Check if a move results in checkmate
export function isCheckmate(chess: Chess): boolean {
  return chess.isCheckmate();
}

// Check if a move results in draw
export function isDraw(chess: Chess): boolean {
  return chess.isDraw();
}

// Get all legal moves for a given square
export function getLegalMovesForSquare(chess: Chess, square: Square): Square[] {
  try {
    const moves = chess.moves({ square, verbose: true });
    return moves.map(move => move.to as Square);
  } catch (error) {
    console.error("Error getting legal moves:", error);
    return [];
  }
}

// Convert move to algebraic notation (e.g., "e2e4")
export function moveToAlgebraic(from: Square, to: Square, promotion?: PieceSymbol): string {
  return `${from}${to}${promotion || ''}`;
}

// Create a FEN position string from board position
export function createFenFromPosition(position: Record<Square, string>): string {
  const chess = new Chess();
  chess.clear();
  
  Object.entries(position).forEach(([square, piece]) => {
    chess.put({ type: piece.charAt(1).toLowerCase() as PieceSymbol, color: piece.charAt(0) === 'w' ? 'w' : 'b' }, square as Square);
  });
  
  return chess.fen();
}

// Get piece at a specific square
export function getPieceAtSquare(chess: Chess, square: Square): { type: PieceSymbol; color: Color } | null {
  return chess.get(square);
}

// Check if a player can castle (not allowed in this variant)
export function canCastle(chess: Chess, color: Color): boolean {
  // Castling is not allowed in Hukum Chess
  return false;
}

// Check if en passant is valid (only allowed from moves 2-6)
export function isEnPassantValid(moveNumber: number): boolean {
  return moveNumber >= 2 && moveNumber <= 6;
}
