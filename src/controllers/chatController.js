// src/controllers/chatController.js
const { v4: uuidv4 } = require("uuid");
const redisClient = require("../services/redisClient");
const { qdrantClient, embedText } = require("../services/qdrantClient");
const geminiClient = require("../services/geminiClient");

const SESSION_TTL = Number(process.env.SESSION_TTL_SECONDS || 86400);

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

    // Generate embedding
    const embedding = await embedText(message);

    // Search top-k docs from Qdrant
    const topK = 4;
    const searchRes = await qdrantClient.points.search({
      collection_name: process.env.QDRANT_COLLECTION,
      vector: embedding,
      limit: topK,
      with_payload: true,
    });

    // ✅ unwrap result array
    const hits = searchRes.result || [];
    const retrieved = hits.map((r) => ({
      title: r.payload?.title || "Untitled",
      url: r.payload?.url || "",
      text: r.payload?.text || "",
    }));

    console.log("Qdrant hits:", hits.length);

    const systemPrompt = makeSystemPrompt(retrieved);

    // Call Gemini
    const assistantText = await geminiClient.generate({
      systemPrompt,
      userMessage: message,
    });

    // Save conversation history in Redis
    const historyKey = `session:${sid}:history`;
    const entryUser = { role: "user", text: message, ts: Date.now() };
    const entryAssistant = { role: "assistant", text: assistantText, ts: Date.now() };

    await redisClient.rpush(historyKey, JSON.stringify(entryUser));
    await redisClient.rpush(historyKey, JSON.stringify(entryAssistant));
    await redisClient.expire(historyKey, SESSION_TTL);

    res.json({
      sessionId: sid,
      reply: assistantText,
      retrieved,
    });
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

    const embedding = await embedText(message);
    const topK = 4;
    const searchRes = await qdrantClient.points.search({
      collection_name: process.env.QDRANT_COLLECTION,
      vector: embedding,
      limit: topK,
      with_payload: true,
    });

    const hits = searchRes.result || [];
    const retrieved = hits.map((r) => ({
      title: r.payload?.title || "Untitled",
      url: r.payload?.url || "",
      text: r.payload?.text || "",
    }));

    console.log("Qdrant hits (stream):", hits.length);

    const systemPrompt = makeSystemPrompt(retrieved);

    const assistantText = await geminiClient.generate({
      systemPrompt,
      userMessage: message,
    });

    // Stream word by word
    const words = assistantText.split(" ");
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${words[i]} \n\n`);
      await new Promise((r) => setTimeout(r, 50));
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("❌ Stream error:", err);
    res.end();
  }
};
