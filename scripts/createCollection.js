// src/scripts/createCollection.js
const { QdrantClient } = require("@qdrant/js-client-rest");
require("dotenv").config();

async function main() {
  const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });

  await client.collections.create("news_embeddings", {
    vectors: {
      size: 384,       // embedding dimension for MiniLM-L6-v2
      distance: "Cosine"
    },
  });

  console.log("✅ Collection created: news_embeddings");
}

main().catch(console.error);
