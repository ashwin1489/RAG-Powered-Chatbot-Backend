# # scripts/ingest_news.py
# """
# Ingest news articles into Qdrant.

# - Tries BBC RSS first (publicly accessible).
# - Falls back to dummy articles if network fails.
# - Splits into passages.
# - Embeds with sentence-transformers (all-MiniLM-L6-v2).
# - Stores vectors + payloads in Qdrant.
# """

# import argparse
# import requests
# from bs4 import BeautifulSoup
# import time
# import os

# from qdrant_client import QdrantClient
# from qdrant_client.http import models
# from sentence_transformers import SentenceTransformer


# QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
# COLLECTION = os.environ.get("QDRANT_COLLECTION", "news_embeddings")


# def split_text(text, max_chars=800):
#     """Split long text into smaller passages."""
#     return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]


# def fetch_bbc_rss(limit=50):
#     """Fetch BBC RSS feed and extract article URLs."""
#     try:
#         url = "https://feeds.bbci.co.uk/news/rss.xml"
#         r = requests.get(url, timeout=20)
#         r.raise_for_status()
#         soup = BeautifulSoup(r.text, "xml")
#         urls = [item.link.text for item in soup.find_all("item")]
#         print(f"✅ Got {len(urls)} URLs from BBC RSS")
#         return urls[:limit]
#     except Exception as e:
#         print("⚠️ BBC RSS fetch failed, switching to dummy data:", e)
#         return None


# def fetch_dummy_articles(limit=50):
#     """Fallback: generate dummy articles if feed fails."""
#     return [f"https://example.com/article/{i}" for i in range(limit)]


# def fetch_article(url):
#     """Download an article and extract title + body."""
#     try:
#         r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
#         soup = BeautifulSoup(r.text, "html.parser")
#         title = (soup.find("h1") or soup.title or "Untitled").get_text(strip=True)
#         paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
#         body = "\n".join(paragraphs) or "This is placeholder text for testing ingestion."
#         return title, body
#     except Exception:
#         return "Dummy Title", "This is dummy text content for testing ingestion."


# def main(limit=50):
#     qdrant = QdrantClient(url=QDRANT_URL)

#     print("📡 Fetching article list...")
#     urls = fetch_bbc_rss(limit)
#     if not urls:
#         urls = fetch_dummy_articles(limit)

#     passages = []
#     for u in urls:
#         title, body = fetch_article(u)
#         if not title or not body:
#             continue
#         chunks = split_text(body, 1000)
#         for c in chunks:
#             passages.append({"title": title, "url": u, "text": c})
#         if len(passages) >= limit:
#             break

#     print(f"📝 Got {len(passages)} passages, creating embeddings...")

#     model = SentenceTransformer("all-MiniLM-L6-v2")
#     texts = [p["text"] for p in passages]
#     vectors = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

#     vector_size = vectors.shape[1]
#     qdrant.recreate_collection(
#         collection_name=COLLECTION,
#         vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE),
#     )

#     print("⬆️ Uploading to Qdrant...")
#     batch_size = 64
#     for i in range(0, len(passages), batch_size):
#         batch = [
#             models.PointStruct(
#                 id=i + j,
#                 vector=vectors[i + j].tolist(),
#                 payload={
#                     "text": passages[i + j]["text"],
#                     "title": passages[i + j]["title"],
#                     "url": passages[i + j]["url"],
#                 },
#             )
#             for j in range(len(passages[i:i + batch_size]))
#         ]
#         qdrant.upsert(collection_name=COLLECTION, points=batch)
#         print(f"   ✅ Upserted points {i}..{i + len(batch)}")
#         time.sleep(0.1)

#     print("🎉 Ingestion complete. Total points:", len(passages))


# if __name__ == "__main__":
#     parser = argparse.ArgumentParser()
#     parser.add_argument("--limit", type=int, default=50)
#     args = parser.parse_args()
#     main(limit=args.limit)

# scripts/ingest_news.py
"""
Ingest news articles into Qdrant.

- Fetches BBC + Indian (TOI, Hindu, NDTV) RSS feeds.
- Falls back to dummy articles if network fails.
- Splits into passages.
- Embeds with sentence-transformers (all-MiniLM-L6-v2).
- Stores vectors + payloads in Qdrant.
"""

import argparse
import requests
from bs4 import BeautifulSoup
import time
import os

from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer


QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")
COLLECTION = os.environ.get("QDRANT_COLLECTION", "news_embeddings")


def split_text(text, max_chars=800):
    """Split long text into smaller passages."""
    return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]


def fetch_bbc_rss(limit=50):
    """Fetch BBC RSS feed and extract article URLs."""
    try:
        url = "https://feeds.bbci.co.uk/news/rss.xml"
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "xml")
        urls = [item.link.text for item in soup.find_all("item")]
        print(f"✅ Got {len(urls)} URLs from BBC RSS")
        return urls[:limit]
    except Exception as e:
        print("⚠️ BBC RSS fetch failed:", e)
        return []


def fetch_india_rss(limit=50):
    """Fetch Indian news from TOI, Hindu, NDTV RSS feeds."""
    feeds = [
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://feeds.feedburner.com/ndtvnews-top-stories"
    ]
    urls = []
    for feed_url in feeds:
        try:
            r = requests.get(feed_url, timeout=20)
            r.raise_for_status()
            soup = BeautifulSoup(r.text, "xml")
            urls.extend([item.link.text for item in soup.find_all("item")])
        except Exception as e:
            print(f"⚠️ Failed to fetch {feed_url}: {e}")
            continue
    print(f"✅ Got {len(urls)} URLs from Indian RSS feeds")
    return urls[:limit]


def fetch_dummy_articles(limit=50):
    """Fallback: generate dummy articles if feeds fail."""
    return [f"https://example.com/article/{i}" for i in range(limit)]


def fetch_article(url):
    """Download an article and extract title + body."""
    try:
        r = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "html.parser")
        title = (soup.find("h1") or soup.title or "Untitled").get_text(strip=True)
        paragraphs = [p.get_text(strip=True) for p in soup.find_all("p")]
        body = "\n".join(paragraphs) or "This is placeholder text for testing ingestion."
        return title, body
    except Exception:
        return "Dummy Title", "This is dummy text content for testing ingestion."


def main(limit=50):
    qdrant = QdrantClient(url=QDRANT_URL)

    print("📡 Fetching article list...")

    # Collect URLs from BBC + India
    urls = []
    urls.extend(fetch_bbc_rss(limit))
    urls.extend(fetch_india_rss(limit))

    if not urls:
        urls = fetch_dummy_articles(limit)

    passages = []
    for u in urls:
        title, body = fetch_article(u)
        if not title or not body:
            continue
        chunks = split_text(body, 1000)
        for c in chunks:
            passages.append({"title": title, "url": u, "text": c})
        if len(passages) >= limit:
            break

    print(f"📝 Got {len(passages)} passages, creating embeddings...")

    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [p["text"] for p in passages]
    vectors = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

    vector_size = vectors.shape[1]
    qdrant.recreate_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE),
    )

    print("⬆️ Uploading to Qdrant...")
    batch_size = 64
    for i in range(0, len(passages), batch_size):
        batch = [
            models.PointStruct(
                id=i + j,
                vector=vectors[i + j].tolist(),
                payload={
                    "text": passages[i + j]["text"],
                    "title": passages[i + j]["title"],
                    "url": passages[i + j]["url"],
                },
            )
            for j in range(len(passages[i:i + batch_size]))
        ]
        qdrant.upsert(collection_name=COLLECTION, points=batch)
        print(f"   ✅ Upserted points {i}..{i + len(batch)}")
        time.sleep(0.1)

    print("🎉 Ingestion complete. Total points:", len(passages))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=50)
    args = parser.parse_args()
    main(limit=args.limit)
