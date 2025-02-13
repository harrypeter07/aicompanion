import { messages, memories, users, assistantProperties, type Message, type InsertMessage, type User, type InsertUser, type Memory, type InsertMemory, type AssistantProperty, type InsertAssistantProperty } from "@shared/schema";
import { db } from "./db";
import { desc, eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(userId: number): Promise<void>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;

  // Memory methods
  getMemories(userId: number): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  searchMemories(userId: number, key: string): Promise<Memory[]>;

  // Assistant Property methods
  getAssistantProperty(key: string): Promise<AssistantProperty | undefined>;
  setAssistantProperty(property: InsertAssistantProperty): Promise<AssistantProperty>;
  deleteAssistantProperty(key: string): Promise<void>;


  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getMessages(userId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.timestamp));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async clearMessages(userId: number): Promise<void> {
    await db.delete(messages).where(eq(messages.userId, userId));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getMemories(userId: number): Promise<Memory[]> {
    return db.select()
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt));
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const [newMemory] = await db
      .insert(memories)
      .values(memory)
      .returning();
    return newMemory;
  }

  async searchMemories(userId: number, key: string): Promise<Memory[]> {
    return db.select()
      .from(memories)
      .where(
        and(
          eq(memories.userId, userId),
          eq(memories.key, key)
        )
      );
  }

  async getAssistantProperty(key: string): Promise<AssistantProperty | undefined> {
    const [property] = await db.select().from(assistantProperties).where(eq(assistantProperties.key, key));
    return property;
  }

  async setAssistantProperty(property: InsertAssistantProperty): Promise<AssistantProperty> {
    const [newProperty] = await db.insert(assistantProperties).values(property).returning();
    return newProperty;
  }

  async deleteAssistantProperty(key: string): Promise<void> {
    await db.delete(assistantProperties).where(eq(assistantProperties.key, key));
  }
}

export const storage = new DatabaseStorage();