const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

console.log("Gemini API key loaded.");

app.post("/visualize", async (req, res) => {
  const prompt = (req.body.prompt || "").trim();

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required.",
    });
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

    // Safe defaults
    const safeSettings = {
      color: "#D99A9A",
      mood: "neutral",
      atmosphere: "abstract",
      energy: "moderate",
      background: "#111111",
      speed: 1,
      density: 30,
      size: 1,
      movement: "normal",
      shape: "circle",
      glow: 15,
    };

    // Validate text values
    if (typeof settings.color === "string") {
      safeSettings.color = settings.color;
    }

    if (typeof settings.mood === "string") {
      safeSettings.mood = settings.mood;
    }

    if (typeof settings.atmosphere === "string") {
      safeSettings.atmosphere = settings.atmosphere;
    }

    if (typeof settings.background === "string") {
      safeSettings.background = settings.background;
    }

    // Validate enum values
    if (["calm", "moderate", "energetic"].includes(settings.energy)) {
      safeSettings.energy = settings.energy;
    }

    if (
      ["normal", "float", "fast", "wave", "rain"].includes(settings.movement)
    ) {
      safeSettings.movement = settings.movement;
    }

    if (["circle", "square", "triangle"].includes(settings.shape)) {
      safeSettings.shape = settings.shape;
    }

    // Validate numeric values
    if (typeof settings.speed === "number") {
      safeSettings.speed = settings.speed;
    }

    if (typeof settings.density === "number") {
      safeSettings.density = settings.density;
    }

    if (typeof settings.size === "number") {
      safeSettings.size = settings.size;
    }

    if (typeof settings.glow === "number") {
      safeSettings.glow = settings.glow;
    }

    // Energy → speed relationship
    if (safeSettings.energy === "calm") {
      safeSettings.speed = Math.min(safeSettings.speed, 1);
    }

    if (safeSettings.energy === "moderate") {
      safeSettings.speed = Math.min(safeSettings.speed, 2);
    }

    if (safeSettings.energy === "energetic") {
      safeSettings.speed = Math.max(safeSettings.speed, 2);
    }

    // Atmosphere → movement
    const atmosphere = safeSettings.atmosphere.toLowerCase();

    if (atmosphere.includes("rain")) {
      safeSettings.movement = "rain";
    }

    if (atmosphere.includes("forest")) {
      safeSettings.movement = "float";
    }

    if (atmosphere.includes("ocean")) {
      safeSettings.movement = "wave";
    }

    // Clamp values
    safeSettings.speed = Math.min(Math.max(safeSettings.speed, 0.1), 3);

    safeSettings.density = Math.min(
      Math.max(Math.round(safeSettings.density), 10),
      100,
    );

    safeSettings.size = Math.min(Math.max(safeSettings.size, 0.5), 2);

    safeSettings.glow = Math.min(Math.max(safeSettings.glow, 0), 40);

    console.log("Prompt:", cleanedPrompt);
    console.log("AI settings:", safeSettings);

    res.json(safeSettings);
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
