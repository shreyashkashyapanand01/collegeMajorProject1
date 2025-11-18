// ESM-safe __dirname support
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import cors from "cors";

// IMPORTANT: In ESM, you MUST import with .js extension
import { generateReport } from "../src/generate-wrapper.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/generate-report", async (req, res) => {
  try {
    const { topic, depth = 1, breadth = 1 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const report = await generateReport(topic, depth, breadth);
    res.json({ report });
  } catch (err: any) {
    console.error("generate-report error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// Serve frontend
const frontendPath = path.resolve(__dirname, "../frontend");
app.use(express.static(frontendPath));

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`API running on http://localhost:${port}`)
);
