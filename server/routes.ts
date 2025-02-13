import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number | undefined;
  }
}

const scryptAsync = promisify(scrypt);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyA1ZZChadARut17eYel7BxfYCkpGU7hv4A");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function analyzeEmotion(text: string): string {
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

function extractAssistantProperty(text: string): { isProperty: boolean; key?: string; value?: string } {
  const negationRegex = /you are not|your name is not|you're not|you weren't|you weren't made by|you weren't created by/i;
  const match = text.match(negationRegex);
  
  if (match) {
    const key = text.slice(match.index + match[0].length).trim().toLowerCase();
    return {
      isProperty: true,
      key,
      value: 'false'
    };
  }
  return { isProperty: false };
}

function extractMemory(text: string): { isMemory: boolean; key?: string; value?: string } {
  const rememberRegex = /remember\s+(?:that\s+)?(?:my\s+)?(.*?)\s+(?:is|are)\s+(.*?)(?:\.|$)/i;
  const match = text.match(rememberRegex);

  if (match) {
    return {
      isMemory: true,
      key: match[1].toLowerCase().trim(),
      value: match[2].trim()
    };
  }

  return { isMemory: false };
}

async function processMemories(userId: number, text: string) {
  const memory = extractMemory(text);
  if (memory.isMemory && memory.key && memory.value) {
    await storage.createMemory({
      userId,
      key: memory.key,
      value: memory.value,
    });
    return true;
  }
  return false;
}

export function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;

    try {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ id: user.id, username: user.username });
  });

  // Message routes
  app.get("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const messages = await storage.getMessages(req.session.userId);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = insertMessageSchema.safeParse({
      ...req.body,
      userId: req.session.userId
    });

    if (!result.success) {
      res.status(400).json({ error: "Invalid message format" });
      return;
    }

    // Process memory and assistant properties
    const wasMemoryStored = await processMemories(req.session.userId, result.data.content);
    const property = extractAssistantProperty(result.data.content);
    if (property.isProperty && property.key && property.value) {
      await storage.setAssistantProperty({
        key: property.key,
        value: property.value
      });
    }

    // Add emotion analysis to user messages
    const emotion = analyzeEmotion(result.data.content);

    // Get user's memories for context
    const userMemories = await storage.getMemories(req.session.userId);

    const userMessage = await storage.createMessage({
      ...result.data,
      metadata: {
        ...result.data.metadata,
        emotion,
        memory: wasMemoryStored,
      },
      context: {
        emotionalState: emotion,
        previousTopics: [],
        memories: userMemories.map(m => ({ key: m.key, value: m.value })),
      },
    });

    try {
      // Get previous messages and format them for the chat
      const previousMessages = await storage.getMessages(req.session.userId);
      const history = previousMessages
        .reverse()
        .map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

      // Add memory context to the prompt
      let promptPrefix = "";
      if (userMemories.length > 0) {
        promptPrefix = "Context about the user:\n" + 
          userMemories.map(m => `${m.key}: ${m.value}`).join("\n") + "\n\n";
      }

      const chat = model.startChat({
        history,
      });

      const response = await chat.sendMessage([
        { text: promptPrefix + userMessage.content }
      ]);
      const responseText = await response.response.text();

      const assistantMessage = await storage.createMessage({
        content: responseText,
        role: "assistant",
        userId: req.session.userId,
        metadata: {
          isVoice: result.data.metadata?.isVoice || false,
        },
        context: {
          emotionalState: emotion,
          previousTopics: [],
          memories: userMemories.map(m => ({ key: m.key, value: m.value })),
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

  app.delete("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await storage.clearMessages(req.session.userId);
    res.json({ success: true });
  });

  return createServer(app);
}