// src/services/qdrantClient.js
const { QdrantClient } = require("@qdrant/js-client-rest");
const { pipeline } = require("@xenova/transformers");

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || "http://localhost:6333" });

let embedder;

// 🔹 Initialize the embedding pipeline (lazy load once)
async function loadEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

// 🔹 Generate embeddings locally
async function embedText(text) {
  const embedder = await loadEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data); // Convert tensor to plain array
}

// 🔹 Search Qdrant
async function search(query, limit = 5) {
  const vector = await embedText(query);

  const result = await qdrant.search(process.env.QDRANT_COLLECTION, {
    vector,
    limit,
  });

  return result;
}

module.exports = { search };
