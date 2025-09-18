# 🚀 RAG News Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-8A2BE2?style=for-the-badge&logo=vector&logoColor=white)

**🔥 Intelligent News Retrieval System powered by RAG Architecture**

*Semantic search meets conversational AI for next-generation news discovery*

[🚀 Quick Start](#-quickstart) • [📖 API Docs](#-api-endpoints) • [⚡ Features](#-features) • [🏗️ Architecture](#️-architecture)

</div>

---

## ✨ Features

🧠 **Smart Retrieval** - Semantic search using sentence-transformers embeddings  
💬 **Conversational AI** - Google Gemini-powered chat interface  
⚡ **Real-time Streaming** - Server-Sent Events for live responses  
🗄️ **Session Memory** - Redis-backed conversation history  
🌐 **Production Ready** - Optimized for Render deployment  
📊 **Vector Search** - Qdrant Cloud integration for lightning-fast queries  

## 🏗️ Architecture

```mermaid
graph TB
    A[🌐 Frontend React App] --> B[🚀 Express API Server]
    B --> C[🔍 Qdrant Vector DB]
    B --> D[💾 Redis Session Store]
    B --> E[🤖 Google Gemini API]
    
    F[📰 News Ingestion] --> G[🔄 sentence-transformers]
    G --> C
    
    style A fill:#61dafb
    style B fill:#68217a
    style C fill:#8a2be2
    style D fill:#dc382d
    style E fill:#4285f4
```

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **🔤 Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | Fast, lightweight semantic encoding |
| **🗄️ Vector DB** | `Qdrant Cloud` | Managed vector storage & similarity search |
| **🤖 LLM API** | `Google Gemini API` | Advanced language understanding |
| **⚙️ Backend** | `Node.js + Express` | RESTful API server |
| **💾 Caching** | `Redis (ioredis)` | Session history & performance |
| **🚀 Deployment** | `Render` | Scalable cloud hosting |

## 🚀 Quickstart

### 📋 Prerequisites

- Node.js 18+ 
- Redis instance (local or Upstash)
- Qdrant Cloud account
- Google Gemini API key

### ⚡ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd rag-news-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### 🔧 Environment Configuration

Create a `.env` file in the root directory:

```env
# 🚀 Server Configuration
PORT=4000

# 💾 Redis Configuration  
REDIS_URL=redis://localhost:6379
# For production: redis://username:password@host:port

# 🗄️ Qdrant Configuration
QDRANT_URL=https://your-cluster.qdrant.cloud
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=news_embeddings

# 🤖 Google Gemini Configuration
GEMINI_API_URL=https://api.studio.googlecloud.ai/your-endpoint
GEMINI_API_KEY=your_gemini_api_key

# ⏱️ Session Configuration
SESSION_TTL_SECONDS=86400
```

### 🏃‍♂️ Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📰 News Ingestion

Populate your vector database with news articles:

```bash
# Navigate to scripts directory
cd scripts

# Install Python dependencies
pip install -r requirements.txt

# Ingest news articles (adjust limit as needed)
python ingest_news.py --limit 50
```

This script will:
- 📥 Fetch news articles from configured sources
- 🔄 Generate embeddings using sentence-transformers
- 💾 Store vectors in Qdrant Cloud
- ✅ Create the collection if it doesn't exist

## 📖 API Endpoints

### 💬 Chat Endpoints

#### `POST /api/chat`
Start or continue a conversation

```bash
curl -X POST https://your-backend.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the latest developments in AI?",
    "sessionId": "optional-session-id"
  }'
```

**Response:**
```json
{
  "sessionId": "unique-session-id",
  "reply": "Based on recent articles, here are the key AI developments...",
  "retrieved": [
    {
      "title": "Article Title",
      "content": "Article snippet...",
      "score": 0.85
    }
  ]
}
```

#### `POST /api/chat/stream`
Stream responses in real-time using Server-Sent Events

```bash
curl -X POST https://your-backend.com/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about renewable energy", "sessionId": "session-123"}'
```

### 🗂️ Session Management

#### `GET /api/session/:sessionId/history`
Retrieve conversation history

```bash
curl https://your-backend.com/api/session/session-123/history
```

#### `POST /api/session/:sessionId/clear`
Clear session history

```bash
curl -X POST https://your-backend.com/api/session/session-123/clear
```

### 💚 Health Check

#### `GET /api/health`
Check server status

```bash
curl https://your-backend.com/api/health
```

## 🔧 PowerShell Usage Notes

When testing with PowerShell, use proper escaping:

```powershell
# Method 1: Use curl.exe with stop-parsing
curl.exe --% -X POST -H "Content-Type: application/json" -d "{\"message\":\"hello\"}" "https://your-backend.com/api/chat"

# Method 2: Use single quotes for JSON
curl -X POST -H 'Content-Type: application/json' -d '{"message":"hello"}' 'https://your-backend.com/api/chat'
```

## 🚀 Deployment

### Render Deployment

1. **🔗 Connect Repository** - Link your GitHub repo to Render
2. **⚙️ Environment Variables** - Add all `.env` variables to Render dashboard
3. **🏗️ Build Settings:**
   ```
   Build Command: npm install
   Start Command: npm start
   ```

### 📦 Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

## 🔒 Security Notes

- ⚠️ **Never commit `.env` files** - Add to `.gitignore`
- 🔐 Use environment variables for all secrets
- 🌐 Configure CORS for your frontend domain
- 🛡️ Implement rate limiting for production
- 🔑 Rotate API keys regularly

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test with coverage
npm run test:coverage
```

## 📊 Performance Tips

- 🚀 **Redis Optimization**: Use connection pooling
- 💾 **Qdrant Tuning**: Optimize vector dimensions
- ⚡ **Caching Strategy**: Implement smart cache invalidation
- 🔄 **Load Balancing**: Use multiple Render instances for scale

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request



---

<div align="center">

**🌟 Built with ❤️ for intelligent news discovery**

[Report Bug](https://github.com/your-repo/issues) • [Live Deployed](https://rag-powered-chatbot-frontend-lovat.vercel.app/) • [Documentation](https://github.com/ashwin1489/RAG-Powered-Chatbot-Backend/blob/main/COMPLETE_DOCUMENTATION.md)


[Watch Demo Video](https://www.youtube.com/watch?v=vav0KYrd59I)
