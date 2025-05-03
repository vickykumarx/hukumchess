import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertGameSchema, 
  insertMoveHistorySchema, 
  insertPuzzleSchema
} from "@shared/schema";
import { z } from "zod";
import { getStockfishMove, evaluatePosition, solvePuzzle } from "./stockfish";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API endpoints
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // Create a new game
  app.post("/api/games", async (req: Request, res: Response) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get a game by ID
  app.get("/api/games/:id", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.status(200).json(game);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update a game
  app.patch("/api/games/:id", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const updatedGame = await storage.updateGame(gameId, req.body);
      res.status(200).json(updatedGame);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get move history for a game
  app.get("/api/games/:id/moves", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const moves = await storage.getMoveHistoryByGameId(gameId);
      res.status(200).json(moves);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add a move to the game history
  app.post("/api/games/:id/moves", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const moveData = insertMoveHistorySchema.parse({
        ...req.body,
        gameId
      });
      
      const move = await storage.createMoveHistory(moveData);
      
      // Safely handle potentially null values in the game object
      const currentPlayerMoves = game.playerMoves ?? 0;
      const currentAiMoves = game.aiMoves ?? 0;
      const currentPlayerScore = game.playerScore ?? 0;
      const currentAiScore = game.aiScore ?? 0;
      
      // Update game state
      const updatedGame = await storage.updateGame(gameId, { 
        fen: req.body.resultingFen,
        playerMoves: moveData.isPlayer ? currentPlayerMoves + 1 : currentPlayerMoves,
        aiMoves: !moveData.isPlayer ? currentAiMoves + 1 : currentAiMoves,
        playerScore: moveData.isPlayer ? currentPlayerScore + (moveData.points || 0) : currentPlayerScore,
        aiScore: !moveData.isPlayer ? currentAiScore + (moveData.points || 0) : currentAiScore
      });
      
      res.status(201).json({ move, game: updatedGame });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get AI move for a given position
  app.post("/api/ai/move", async (req: Request, res: Response) => {
    try {
      const { fen, depth = 15, timeLimit = 2000 } = req.body;
      
      if (!fen) {
        return res.status(400).json({ message: "FEN string is required" });
      }
      
      const move = await getStockfishMove(fen, depth, timeLimit);
      res.status(200).json({ move });
    } catch (error) {
      res.status(500).json({ message: "Error getting AI move" });
    }
  });

  // Evaluate a chess position
  app.post("/api/ai/evaluate", async (req: Request, res: Response) => {
    try {
      const { fen, depth = 15 } = req.body;
      
      if (!fen) {
        return res.status(400).json({ message: "FEN string is required" });
      }
      
      const evaluation = await evaluatePosition(fen, depth);
      res.status(200).json({ evaluation });
    } catch (error) {
      res.status(500).json({ message: "Error evaluating position" });
    }
  });

  // Create a puzzle for a game
  app.post("/api/games/:id/puzzles", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const puzzleData = insertPuzzleSchema.parse({
        ...req.body,
        gameId
      });
      
      const puzzle = await storage.createPuzzle(puzzleData);
      res.status(201).json(puzzle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get puzzles for a game
  app.get("/api/games/:id/puzzles", async (req: Request, res: Response) => {
    try {
      const gameId = parseInt(req.params.id);
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      const puzzles = await storage.getPuzzlesByGameId(gameId);
      res.status(200).json(puzzles);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Solve a puzzle with AI
  app.post("/api/puzzles/:id/solve", async (req: Request, res: Response) => {
    try {
      const puzzleId = parseInt(req.params.id);
      const puzzle = await storage.getPuzzlesByGameId(1).then(
        puzzles => puzzles.find(p => p.id === puzzleId)
      );
      
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      const { timeLimit = 15000 } = req.body;
      const solved = await solvePuzzle(puzzle.fen, puzzle.solution, puzzle.mateIn, timeLimit);
      
      const updatedPuzzle = await storage.updatePuzzle(puzzleId, { aiSolved: solved });
      res.status(200).json({ puzzle: updatedPuzzle, solved });
    } catch (error) {
      res.status(500).json({ message: "Error solving puzzle" });
    }
  });
  
  // General puzzle solver endpoint (for direct use in the client-side app)
  app.post("/api/puzzles/solve", async (req: Request, res: Response) => {
    try {
      const { fen, solution, mateIn = 2, timeLimit = 15000 } = req.body;
      
      if (!fen || !solution) {
        return res.status(400).json({ message: "FEN string and solution are required" });
      }
      
      const solved = await solvePuzzle(fen, solution, mateIn, timeLimit);
      res.status(200).json({ solved });
    } catch (error) {
      res.status(500).json({ message: "Error solving puzzle" });
    }
  });

  return httpServer;
}
