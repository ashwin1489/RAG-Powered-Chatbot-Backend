const { QdrantClient } = require("@qdrant/js-client-rest");
const path = require("path");
const dotenv = require("dotenv");

// Load .env (only used locally, not on Render where env vars are injected)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Dynamic import for transformers ---
async function getPipeline(task = "feature-extraction", model = "Xenova/all-MiniLM-L6-v2") {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline(task, model);
}

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,      // e.g. https://d17baae9-...qdrant.io
  apiKey: process.env.QDRANT_API_KEY, // permanent key you created in Qdrant Cloud
});

// Embed text using xenova transformers
async function embedText(text) {
  try {
    const extractor = await getPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    const result = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(result.data); // convert Tensor to array
  } catch (err) {
    console.error("❌ Error generating embeddings:", err);
    return [];
  }
}

module.exports = {
  qdrant,
  embedText,
};
