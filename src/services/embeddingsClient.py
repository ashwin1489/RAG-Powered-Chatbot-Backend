from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import uvicorn

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")

class EmbedRequest(BaseModel):
    text: str

@app.post("/embed")
def embed_text(req: EmbedRequest):
    vector = model.encode([req.text])[0].tolist()
    return {"embedding": vector}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
