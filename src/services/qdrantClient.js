// // src/services/qdrantClient.js
// const { QdrantClient } = require("@qdrant/js-client-rest");
// const { pipeline } = require("@xenova/transformers");

// const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });

// let embedder;

// // 🔹 Initialize the embedding pipeline (lazy load once)
// async function loadEmbedder() {
//   if (!embedder) {
//     embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
//   }
//   return embedder;
// }

// // 🔹 Generate embeddings locally
// async function embedText(text) {
//   const embedder = await loadEmbedder();
//   const output = await embedder(text, { pooling: "mean", normalize: true });
//   return Array.from(output.data); // Convert tensor to plain array
// }

// // 🔹 Search Qdrant
// async function search(query, limit = 5) {
//   const vector = await embedText(query);

//   const result = await qdrant.search(process.env.QDRANT_COLLECTION, {
//     vector,
//     limit,
//   });

//   return result;
// }

// module.exports = { search };


const { QdrantClient } = require("@qdrant/js");
const path = require("path");
const dotenv = require("dotenv");

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Dynamic import for transformers ---
async function getPipeline(task = "feature-extraction", model = "Xenova/all-MiniLM-L6-v2") {
  const { pipeline } = await import("@xenova/transformers");
  return pipeline(task, model);
}

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
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
