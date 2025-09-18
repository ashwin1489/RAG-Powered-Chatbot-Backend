// src/controllers/chatController.js
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../services/redisClient");
const { qdrantClient, embedText } = require("../services/qdrantClient");
const geminiClient = require("../services/geminiClient");

const SESSION_TTL = Number(process.env.SESSION_TTL_SECONDS || 86400);

// --- Build system prompt ---
const makeSystemPrompt = (retrievedPassages) => {
  if (!retrievedPassages.length) {
    return `You are a helpful news assistant.
No relevant passages were found in the database. 
Kindly let the user know there is no matching news at the moment, but answer politely.`;
  }

  return `You are a helpful news assistant. 
Summarize the passages below to answer the user's query. 
- Always base your answer only on these passages. 
- If the information is not directly answering the question, still share the most relevant details. 
- Include the article title and URL in your answer when possible. 

Passages:
${retrievedPassages
    .map((p) => `Title: ${p.title}\nURL: ${p.url}\nText: ${p.text}`)
    .join("\n---\n")}`;
};

// --- Chat endpoint ---
exports.chat = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    const sid = sessionId || uuidv4();

    // 1️⃣ Generate embedding
    const embedding = await embedText(message);

    // 2️⃣ Search Qdrant (returns array directly)
    const topK = 4;
    const hits = await qdrantClient.search(process.env.QDRANT_COLLECTION, {
      vector: embedding,
      limit: topK,
      with_payload: true,
    });

    const retrieved = hits.map((r) => ({
      title: r.payload?.title || "Untitled",
      url: r.payload?.url || "",
      text: r.payload?.text || "",
    }));

    // 3️⃣ Create system prompt
    const systemPrompt = makeSystemPrompt(retrieved);

    // 4️⃣ Call Gemini
    const assistantText = await geminiClient.generate({
      systemPrompt,
      userMessage: message,
    });

    // 5️⃣ Save to Redis
    const historyKey = `session:${sid}:history`;
    await redisClient.rpush(historyKey, JSON.stringify({ role: "user", text: message, ts: Date.now() }));
    await redisClient.rpush(historyKey, JSON.stringify({ role: "assistant", text: assistantText, ts: Date.now() }));
    await redisClient.expire(historyKey, SESSION_TTL);

    res.json({ sessionId: sid, reply: assistantText, retrieved });
  } catch (err) {
    console.error("❌ Chat error:", err);
    next(err);
  }
};

// --- Get history ---
exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const historyKey = `session:${sessionId}:history`;
    const items = await redisClient.lrange(historyKey, 0, -1);
    const parsed = items.map((i) => JSON.parse(i));
    res.json({ sessionId, history: parsed });
  } catch (err) {
    next(err);
  }
};

// --- Clear session ---
exports.clearSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const historyKey = `session:${sessionId}:history`;
    await redisClient.del(historyKey);
    res.json({ sessionId, cleared: true });
  } catch (err) {
    next(err);
  }
};

// --- Streaming chat ---
exports.chatStream = async (req, res) => {
  try {
    const { message } = req.body;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();

    // 1️⃣ Embed and search
    const embedding = await embedText(message);
    const topK = 4;
    const hits = await qdrantClient.search(process.env.QDRANT_COLLECTION, {
      vector: embedding,
      limit: topK,
      with_payload: true,
    });

    const retrieved = hits.map((r) => ({
      title: r.payload?.title || "Untitled",
      url: r.payload?.url || "",
      text: r.payload?.text || "",
    }));

    // 2️⃣ Build system prompt
    const systemPrompt = makeSystemPrompt(retrieved);

    // 3️⃣ Call Gemini
    const assistantText = await geminiClient.generate({
      systemPrompt,
      userMessage: message,
    });

    // 4️⃣ Stream word by word
    const words = assistantText.split(" ");
    for (const word of words) {
      res.write(`data: ${word} \n\n`);
      await new Promise((r) => setTimeout(r, 50));
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("❌ Stream error:", err);
    res.end();
  }
};
