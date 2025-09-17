// src/services/geminiClient.js
const axios = require("axios");

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

exports.generate = async ({ systemPrompt, userMessage }) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `
You are a helpful news assistant.
Here are the retrieved news passages:

${systemPrompt}

Now answer the user's query LY.

User: ${userMessage}
                `
              }
            ]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from Gemini"
    );
  } catch (err) {
    console.error("Gemini API error:", err.response?.data || err.message);
    return `Gemini API error: ${err.message}`;
  }
};
