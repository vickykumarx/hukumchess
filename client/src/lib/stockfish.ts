import { Chess, Move, Square } from "chess.js";
import { apiRequest } from "./queryClient";

// Import stockfish through dynamic import to ensure compatibility
let stockfishPromise: Promise<any> | null = null;

// Type definition for importing Stockfish
type StockfishModuleType = {
  default?: () => any;
} | (() => any);

// Function to get the Stockfish engine instance
function getStockfishEngine(): Promise<any> {
  if (!stockfishPromise) {
    stockfishPromise = import('stockfish-web').then((StockfishModule: StockfishModuleType) => {
      // Explicitly calling the function to create an instance
      if (typeof StockfishModule === 'function') {
        return StockfishModule();
      } else if (StockfishModule.default && typeof StockfishModule.default === 'function') {
        return StockfishModule.default();
      } else {
        console.error("Stockfish module has unexpected structure");
        return null;
      }
    }).catch(err => {
      console.error("Error loading Stockfish:", err);
      return null;
    });
  }
  return stockfishPromise;
}

// Piece values for Hukum Chess
export const PIECE_VALUES = {
  p: 1,  // pawn
  n: 3,  // knight
  b: 3,  // bishop
  r: 5,  // rook
  q: 9,  // queen
  k: 0   // king (not counted for material)
};

// Initialize Stockfish engine
let stockfishInstance: any = null;
let isStockfishReady = false;

async function initStockfish(): Promise<void> {
  if (!stockfishInstance) {
    try {
      console.log("Initializing Stockfish...");
      stockfishInstance = await getStockfishEngine();
      
      if (!stockfishInstance) {
        console.error("Failed to initialize Stockfish engine");
        return;
      }
      
      // Setup listener for stockfish messages
      const originalListen = stockfishInstance.listen;
      stockfishInstance.listen = (message: string) => {
        // Call original listener if it exists
        if (originalListen) {
          originalListen(message);
        }
        
        // Check for readyok
        if (message === 'readyok') {
          isStockfishReady = true;
          console.log("Stockfish is ready");
        }
        
        // Add our custom message handler
        if (stockfishInstance.messageListeners) {
          for (const listener of stockfishInstance.messageListeners) {
            listener(message);
          }
        }
      };
      
      // Add message listeners array to stockfish instance
      stockfishInstance.messageListeners = [];
      stockfishInstance.addMessageListener = (callback: (message: string) => void) => {
        if (!stockfishInstance.messageListeners) {
          stockfishInstance.messageListeners = [];
        }
        stockfishInstance.messageListeners.push(callback);
      };
      
      // Configure Stockfish
      stockfishInstance.postMessage('uci');
      stockfishInstance.postMessage('isready');
    } catch (error) {
      console.error("Error initializing Stockfish:", error);
      // Fallback to server-side AI if client-side fails
      stockfishInstance = null;
    }
  }
  
  // If still initializing, wait for ready state
  if (stockfishInstance && !isStockfishReady) {
    return new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (isStockfishReady) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
    });
  }
}

// Function to get AI move with Stockfish
export async function getAIMove(fen: string, depth: number = 10, timeLimit: number = 2000): Promise<string> {
  try {
    // Try to use client-side Stockfish first
    await initStockfish();
    
    if (stockfishInstance && isStockfishReady) {
      console.log("Using client-side Stockfish");
      return new Promise((resolve) => {
        let bestMove = '';
        
        stockfishInstance.addMessageListener((message: string) => {
          if (message.startsWith('bestmove')) {
            const parts = message.split(' ');
            if (parts.length >= 2) {
              bestMove = parts[1];
              
              // Convert from UCI format to our format if necessary
              if (bestMove.length === 4 || bestMove.length === 5) {
                resolve(bestMove);
              }
            }
          }
        });
        
        // Set position and start search
        stockfishInstance.postMessage('position fen ' + fen);
        
        // For Hukum Chess: focus on short-term material gain
        stockfishInstance.postMessage('setoption name Skill Level value 20');
        stockfishInstance.postMessage('setoption name Contempt value 0');
        stockfishInstance.postMessage('setoption name Analysis Contempt value Off');
        
        // Start search with depth limit for Hukum Chess (6 moves perspective)
        stockfishInstance.postMessage(`go depth ${depth} movetime ${timeLimit}`);
        
        // Timeout safety
        setTimeout(() => {
          if (!bestMove) {
            // Fallback to server if taking too long
            apiRequest("POST", "/api/ai/move", { fen, depth, timeLimit })
              .then(response => response.json())
              .then(data => resolve(data.move))
              .catch(err => {
                console.error("Server fallback error:", err);
                // Last resort - return a random legal move
                const chess = new Chess(fen);
                const moves = chess.moves({ verbose: true });
                if (moves.length > 0) {
                  const randomMove = moves[Math.floor(Math.random() * moves.length)];
                  resolve(randomMove.from + randomMove.to + (randomMove.promotion || ''));
                } else {
                  resolve('');
                }
              });
          }
        }, timeLimit + 500);
      });
    } else {
      // Fallback to server-side AI
      console.log("Falling back to server-side AI");
      const response = await apiRequest("POST", "/api/ai/move", {
        fen,
        depth,
        timeLimit
      });
      
      const data = await response.json();
      return data.move;
    }
  } catch (error) {
    console.error("Error getting AI move:", error);
    
    // Last resort fallback - make a random move
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length > 0) {
        // Prioritize captures for Hukum Chess
        const captureMoves = moves.filter(move => move.captured);
        if (captureMoves.length > 0) {
          // Sort by value of captured piece
          captureMoves.sort((a, b) => {
            const aValue = a.captured ? PIECE_VALUES[a.captured] : 0;
            const bValue = b.captured ? PIECE_VALUES[b.captured] : 0;
            return bValue - aValue;
          });
          const bestCapture = captureMoves[0];
          return bestCapture.from + bestCapture.to + (bestCapture.promotion || '');
        }
        
        // If no captures, make a random move
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        return randomMove.from + randomMove.to + (randomMove.promotion || '');
      }
    } catch (e) {
      console.error("Error making fallback move:", e);
    }
    
    throw new Error("Failed to get AI move");
  }
}

// Evaluate a chess position using Stockfish
export async function evaluatePosition(fen: string, depth: number = 10): Promise<number> {
  try {
    await initStockfish();
    
    if (stockfishInstance && isStockfishReady) {
      return new Promise((resolve) => {
        let evaluation = 0;
        
        stockfishInstance.addMessageListener((message: string) => {
          // Parse evaluation score
          if (message.indexOf('score cp ') > -1) {
            const scoreMatch = message.match(/score cp (-?\d+)/);
            if (scoreMatch && scoreMatch[1]) {
              evaluation = parseInt(scoreMatch[1]) / 100; // Convert centipawns to pawns
            }
          } else if (message.indexOf('score mate ') > -1) {
            const mateMatch = message.match(/score mate (-?\d+)/);
            if (mateMatch && mateMatch[1]) {
              // If mate is found, assign a very high/low score
              const mateIn = parseInt(mateMatch[1]);
              evaluation = mateIn > 0 ? 100 : -100;
            }
          }
          
          // When "bestmove" is returned, the evaluation is complete
          if (message.startsWith('bestmove')) {
            resolve(evaluation);
          }
        });
        
        // Set position and start analysis
        stockfishInstance.postMessage('position fen ' + fen);
        stockfishInstance.postMessage(`go depth ${depth}`);
        
        // Safety timeout
        setTimeout(() => {
          if (evaluation !== undefined) {
            resolve(evaluation);
          } else {
            // Fallback to server
            apiRequest("POST", "/api/ai/evaluate", { fen, depth })
              .then(response => response.json())
              .then(data => resolve(data.evaluation))
              .catch(err => {
                console.error("Server evaluation fallback error:", err);
                resolve(0); // Default neutral evaluation
              });
          }
        }, 3000);
      });
    } else {
      // Fallback to server-side evaluation
      const response = await apiRequest("POST", "/api/ai/evaluate", {
        fen,
        depth
      });
      
      const data = await response.json();
      return data.evaluation;
    }
  } catch (error) {
    console.error("Error evaluating position:", error);
    
    // Fallback to basic material counting
    try {
      const chess = new Chess(fen);
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
      
      return evaluation;
    } catch (e) {
      console.error("Error in fallback evaluation:", e);
      return 0;
    }
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
    const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
    
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
    const evaluationBefore = await evaluatePosition(chess.fen());
    const evaluationAfter = await evaluatePosition(chessCopy.fen());
    
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

// Calculate the score value for a move in Hukum Chess
export function calculateMoveScore(move: Move): number {
  let score = 0;
  
  // Add points for captures
  if (move.captured) {
    score += PIECE_VALUES[move.captured];
  }
  
  // Add bonus for promotion (promotion piece value - pawn value)
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] - PIECE_VALUES['p'];
  }
  
  return score;
}

// Solve a mate-in-X puzzle using Stockfish
export async function solvePuzzle(
  fen: string,
  solution: string,
  mateIn: number,
  timeLimit: number = 15000
): Promise<boolean> {
  try {
    // Try to use client-side Stockfish for puzzle solving
    await initStockfish();
    
    if (stockfishInstance && isStockfishReady) {
      return new Promise((resolve) => {
        let bestMove = '';
        let mateFound = false;
        
        stockfishInstance.addMessageListener((message: string) => {
          // Check if mate is found and how many moves it takes
          if (message.indexOf('score mate ') > -1) {
            const mateMatch = message.match(/score mate (\d+)/);
            if (mateMatch && mateMatch[1]) {
              const foundMateIn = parseInt(mateMatch[1]);
              // For Hukum Chess, check if mate can be found within the required moves
              mateFound = foundMateIn <= mateIn;
            }
          }
          
          if (message.startsWith('bestmove')) {
            const parts = message.split(' ');
            if (parts.length >= 2) {
              bestMove = parts[1];
              
              // Convert from UCI format and compare with solution
              const solutionMoves = solution.split(' ');
              const solved = solutionMoves.includes(bestMove) || mateFound;
              resolve(solved);
            }
          }
        });
        
        // Set position and start search with deep analysis for puzzles
        stockfishInstance.postMessage('position fen ' + fen);
        stockfishInstance.postMessage('setoption name MultiPV value 3'); // Look at top 3 moves
        stockfishInstance.postMessage(`go depth ${mateIn * 2} movetime ${timeLimit}`);
        
        // Timeout safety for Hukum Chess (15 seconds max)
        setTimeout(() => {
          if (!bestMove) {
            // If no move found within time limit, consider puzzle failed
            resolve(false);
          }
        }, timeLimit + 500);
      });
    } else {
      // Fallback to server-side puzzle solving
      const response = await apiRequest("POST", `/api/puzzles/solve`, {
        fen,
        solution,
        mateIn,
        timeLimit
      });
      
      const data = await response.json();
      return data.solved;
    }
  } catch (error) {
    console.error("Error solving puzzle:", error);
    throw new Error("Failed to solve puzzle");
  }
}
