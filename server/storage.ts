import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  moveHistory, type MoveHistory, type InsertMoveHistory,
  puzzles, type Puzzle, type InsertPuzzle
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined>;
  
  // Move history methods
  createMoveHistory(move: InsertMoveHistory): Promise<MoveHistory>;
  getMoveHistoryByGameId(gameId: number): Promise<MoveHistory[]>;
  
  // Puzzle methods
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  getPuzzlesByGameId(gameId: number): Promise<Puzzle[]>;
  updatePuzzle(id: number, updates: Partial<Puzzle>): Promise<Puzzle | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private moves: Map<number, MoveHistory>;
  private puzzles: Map<number, Puzzle>;
  private currentUserId: number;
  private currentGameId: number;
  private currentMoveId: number;
  private currentPuzzleId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.moves = new Map();
    this.puzzles = new Map();
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentMoveId = 1;
    this.currentPuzzleId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Game methods
  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const now = new Date();
    const game: Game = { 
      ...insertGame, 
      id, 
      playerScore: 0, 
      aiScore: 0, 
      playerMoves: 0, 
      aiMoves: 0, 
      createdAt: now 
    };
    this.games.set(id, game);
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  // Move history methods
  async createMoveHistory(insertMove: InsertMoveHistory): Promise<MoveHistory> {
    const id = this.currentMoveId++;
    const move: MoveHistory = { ...insertMove, id };
    this.moves.set(id, move);
    return move;
  }

  async getMoveHistoryByGameId(gameId: number): Promise<MoveHistory[]> {
    return Array.from(this.moves.values())
      .filter(move => move.gameId === gameId)
      .sort((a, b) => a.moveNumber - b.moveNumber);
  }

  // Puzzle methods
  async createPuzzle(insertPuzzle: InsertPuzzle): Promise<Puzzle> {
    const id = this.currentPuzzleId++;
    const puzzle: Puzzle = { ...insertPuzzle, id, aiSolved: false };
    this.puzzles.set(id, puzzle);
    return puzzle;
  }

  async getPuzzlesByGameId(gameId: number): Promise<Puzzle[]> {
    return Array.from(this.puzzles.values())
      .filter(puzzle => puzzle.gameId === gameId);
  }

  async updatePuzzle(id: number, updates: Partial<Puzzle>): Promise<Puzzle | undefined> {
    const puzzle = this.puzzles.get(id);
    if (!puzzle) return undefined;
    
    const updatedPuzzle = { ...puzzle, ...updates };
    this.puzzles.set(id, updatedPuzzle);
    return updatedPuzzle;
  }
}

export const storage = new MemStorage();
