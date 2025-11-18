
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateReport(topic, depth = 2, breadth = 2) {
  if (!topic) throw new Error("Topic is required");

  console.log("=== Using GEMINI_API_KEY from .env.local ===");

  // 1️⃣ Check if key is loaded from server.ts
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found — add it to .env.local");
  }

  // 2️⃣ Dynamic import AFTER key is already loaded by server.ts dotenv
  const { research, writeFinalReport } = await import("../src/deep-research.js");

  console.log("Research engine imported. Starting research...");

  // 3️⃣ Run research pipeline
  const researchResult = await research({
    query: topic,
    depth,
    breadth,
  });

  console.log("Research completed. Generating final report...");

  // 4️⃣ Generate final markdown
  const report = await writeFinalReport({
    prompt: topic,
    learnings: researchResult.learnings ?? [],
    visitedUrls: researchResult.visitedUrls ?? [],
  });

  console.log("Report generated successfully.");

  return report;
}
