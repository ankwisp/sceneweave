require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log(
  process.env.GEMINI_API_KEY
    ? "Gemini API key loaded."
    : "Gemini API key missing.",
);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Visualizer server is running!");
});

app.post("/visualize", async (req, res) => {
  const prompt = (req.body.prompt || "").trim();

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const cleanedPrompt = prompt.replace(/\s+/g, " ").slice(0, 500);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `
You are the visual intelligence system for an AI Creative Visualizer.

Interpret the user's creative prompt and convert it into visual settings for a JavaScript particle animation.

User prompt:
"${cleanedPrompt}"

Choose settings that match the mood, environment, colors, energy and movement described by the user.
Return ONLY the requested JSON structure.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            color: {
              type: "string",
              description: "Main particle color as a hex code.",
            },
            mood: {
              type: "string",
              description: "The emotional mood of the scene.",
            },
            atmosphere: {
              type: "string",
              description: "The environmental atmosphere of the scene.",
            },
            energy: {
              type: "string",
              enum: ["calm", "moderate", "energetic"],
              description: "The overall energy level of the scene.",
            },
            background: {
              type: "string",
              description: "Background color as a hex code.",
            },
            speed: {
              type: "number",
              description: "Animation speed from 0.1 to 3.",
            },
            density: {
              type: "integer",
              description: "Number of particles from 10 to 100.",
            },
            size: {
              type: "number",
              description: "Particle size multiplier from 0.5 to 2.",
            },
            movement: {
              type: "string",
              enum: ["normal", "float", "fast", "wave", "rain"],
            },
            shape: {
              type: "string",
              enum: ["circle", "square", "triangle"],
            },
            glow: {
              type: "number",
              description: "Glow intensity from 0 to 40.",
            },
          },
          required: [
            "color",
            "mood",
            "atmosphere",
            "energy",
            "background",
            "speed",
            "density",
            "size",
            "movement",
            "shape",
            "glow",
          ],
        },
      },
    });

    const settings = JSON.parse(response.text);

    if (settings.energy === "calm") {
      settings.speed = Math.min(settings.speed, 1);
    }

    if (settings.energy === "moderate") {
      settings.speed = Math.min(settings.speed, 2);
    }

    if (settings.energy === "energetic") {
      settings.speed = Math.max(settings.speed, 2);
    }

    if (settings.atmosphere.toLowerCase().includes("rain")) {
      settings.movement = "rain";
    }

    if (settings.atmosphere.toLowerCase().includes("forest")) {
      settings.movement = "float";
    }

    if (settings.atmosphere.toLowerCase().includes("ocean")) {
      settings.movement = "wave";
    }

    settings.speed = Math.min(Math.max(settings.speed, 0.1), 3);
    settings.density = Math.min(Math.max(settings.density, 10), 100);
    settings.size = Math.min(Math.max(settings.size, 0.5), 2);
    settings.glow = Math.min(Math.max(settings.glow, 0), 40);

    const validMovements = ["normal", "float", "fast", "wave", "rain"];
    const validShapes = ["circle", "square", "triangle"];

    if (!validMovements.includes(settings.movement)) {
      settings.movement = "normal";
    }

    if (!validShapes.includes(settings.shape)) {
      settings.shape = "circle";
    }

    console.log("Prompt:", cleanedPrompt);
    console.log("AI settings:", settings);

    res.json(settings);
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({
      error: "AI generation failed.",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
