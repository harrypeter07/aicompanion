import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyA1ZZChadARut17eYel7BxfYCkpGU7hv4A");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

function analyzeEmotion(text: string): string {
  // Simple emotion analysis based on keywords
  const emotions = {
    happy: ["happy", "glad", "joy", "excited", "great"],
    sad: ["sad", "unhappy", "depressed", "down"],
    angry: ["angry", "mad", "frustrated", "annoyed"],
    neutral: ["okay", "fine", "normal"]
  };

  const lowercaseText = text.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      return emotion;
    }
  }
  return "neutral";
}

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

    // Add emotion analysis to user messages
    const emotion = analyzeEmotion(result.data.content);
    const userMessage = await storage.createMessage({
      ...result.data,
      metadata: {
        ...result.data.metadata,
        emotion,
      },
      context: {
        emotionalState: emotion,
        previousTopics: [], // This could be populated by analyzing message content
      },
    });

    try {
      // Get previous messages and format them for the chat
      const previousMessages = await storage.getMessages();
      const history = previousMessages
        .reverse() // Get messages in chronological order
        .map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

      const chat = model.startChat({
        history,
      });

      const response = await chat.sendMessage([{ text: userMessage.content }]);
      const responseText = await response.response.text();

      const assistantMessage = await storage.createMessage({
        content: responseText,
        role: "assistant",
        metadata: {
          isVoice: result.data.metadata?.isVoice || false,
        },
        context: {
          emotionalState: emotion, // Mirror user's emotional state
          previousTopics: [], // Could be populated by analyzing conversation
        },
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