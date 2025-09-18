// src/services/qdrantClient.js
const { QdrantClient } = require("@qdrant/js-client-rest");
const path = require("path");
const dotenv = require("dotenv");

// Load .env locally (Render injects env automatically)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Dynamic import for transformers ---
async function getPipeline(
  task = "feature-extraction",
  model = "Xenova/all-MiniLM-L6-v2"
) {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline(task, model);
}

// ✅ Hardcode fallback to Cloud if env not set
const qdrantClient = new QdrantClient({
  url:
    process.env.QDRANT_URL ||
    "https://d17baae9-9ed7-4efb-9238-ac17eb9ee92e.us-west-1-0.aws.cloud.qdrant.io",
  apiKey:
    process.env.QDRANT_API_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.iMoo-NZkYp0HdZEBYk8fg4TMc5qtlNPuY4sNWpV_gfo",
});

// Embed text using xenova transformers
async function embedText(text) {
  try {
    const extractor = await getPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    const result = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(result.data);
  } catch (err) {
    console.error("❌ Error generating embeddings:", err);
    return [];
  }
}

module.exports = {
  qdrantClient,
  embedText,
};
