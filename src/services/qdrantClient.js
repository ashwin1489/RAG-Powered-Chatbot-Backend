const { QdrantClient } = require("@qdrant/js-client-rest");
const path = require("path");
const dotenv = require("dotenv");

// Load .env (local only; Render uses env vars directly)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Dynamic import for transformers ---
async function getPipeline(
  task = "feature-extraction",
  model = "Xenova/all-MiniLM-L6-v2"
) {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline(task, model);
}

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,        // e.g. https://xxxx.qdrant.io
  apiKey: process.env.QDRANT_API_KEY, // from Qdrant Cloud API Keys
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
  qdrant,
  embedText,
};
