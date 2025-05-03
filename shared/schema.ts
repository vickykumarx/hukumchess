import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  playerSide: text("player_side").notNull(), // "white" or "black"
  playerRole: text("player_role").notNull(), // "player1" or "player2"
  playerScore: integer("player_score").default(0),
  aiScore: integer("ai_score").default(0),
  playerMoves: integer("player_moves").default(0),
  aiMoves: integer("ai_moves").default(0),
  fen: text("fen").notNull(),
  status: text("status").notNull(), // "in_progress", "player_win", "ai_win", "tie"
  createdAt: timestamp("created_at").defaultNow(),
});

export const moveHistory = pgTable("move_history", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  move: text("move").notNull(),
  isPlayer: boolean("is_player").notNull(),
  capturedPiece: text("captured_piece"),
  points: integer("points").default(0),
  moveNumber: integer("move_number").notNull(),
});

export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  fen: text("fen").notNull(),
  solution: text("solution").notNull(),
  mateIn: integer("mate_in").notNull(),
  aiSolved: boolean("ai_solved"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  playerSide: true,
  playerRole: true,
  fen: true,
  status: true,
});

export const insertMoveHistorySchema = createInsertSchema(moveHistory).pick({
  gameId: true,
  move: true,
  isPlayer: true,
  capturedPiece: true,
  points: true,
  moveNumber: true,
});

export const insertPuzzleSchema = createInsertSchema(puzzles).pick({
  gameId: true,
  fen: true,
  solution: true,
  mateIn: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertMoveHistory = z.infer<typeof insertMoveHistorySchema>;
export type InsertPuzzle = z.infer<typeof insertPuzzleSchema>;

export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type MoveHistory = typeof moveHistory.$inferSelect;
export type Puzzle = typeof puzzles.$inferSelect;
