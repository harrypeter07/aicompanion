import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export function registerRoutes(app: Express) {
  app.get("/api/messages", async (_req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "Invalid message format" });
      return;
    }

    const userMessage = await storage.createMessage(result.data);

    try {
      const chat = model.startChat({
        history: (await storage.getMessages()).map(msg => ({
          role: msg.role,
          parts: [msg.content],
        })),
      });

      const response = await chat.sendMessage(userMessage.content);
      const responseText = await response.response.text();

      const assistantMessage = await storage.createMessage({
        content: responseText,
        role: "assistant",
        metadata: {},
      });

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  app.delete("/api/messages", async (_req, res) => {
    await storage.clearMessages();
    res.json({ success: true });
  });

  return createServer(app);
}