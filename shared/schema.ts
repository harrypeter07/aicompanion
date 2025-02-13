import { pgTable, text, serial, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Allow null user_id initially
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),  // Remove .notNull()
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{
    isVoice?: boolean;
    duration?: number;
    emotion?: string;
    contextTags?: string[];
    audioUrl?: string;
    memory?: boolean;
  }>(),
  context: jsonb("context").$type<{
    userName?: string;
    userPreferences?: Record<string, unknown>;
    emotionalState?: string;
    previousTopics?: string[];
    memories?: Array<{key: string, value: string}>;
  }>(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true 
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true
});

export const insertMessageSchema = createInsertSchema(messages)
  .pick({
    content: true,
    role: true,
    metadata: true,
    context: true,
    userId: true,
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;