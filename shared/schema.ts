import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<{
    isVoice?: boolean;
    duration?: number;
    emotion?: string;
    contextTags?: string[];
    audioUrl?: string;
  }>(),
  context: jsonb("context").$type<{
    userName?: string;
    userPreferences?: Record<string, unknown>;
    emotionalState?: string;
    previousTopics?: string[];
  }>(),
});

export const insertMessageSchema = createInsertSchema(messages)
  .pick({
    content: true,
    role: true,
    metadata: true,
    context: true,
  });

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;