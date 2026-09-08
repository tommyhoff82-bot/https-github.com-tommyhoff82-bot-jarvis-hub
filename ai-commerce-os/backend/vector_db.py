from functools import lru_cache
from pinecone import Pinecone
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

index_name = os.getenv("PINECONE_INDEX", "commerce-learnings")


# Both clients are built lazily, on first actual use, rather than at
# import time. The original email constructed them at module scope, which
# meant merely *importing* this file (which agents/scout.py and
# workers/learner.py both do unconditionally) crashed immediately without
# PINECONE_API_KEY/OPENAI_API_KEY set — even for code paths that never
# end up calling Pinecone or OpenAI at all.
@lru_cache
def get_pinecone_index():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    return pc.Index(index_name)


@lru_cache
def get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def embed_text(text: str) -> list:
    response = get_openai_client().embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def store_learning(learning_id: str, text: str, metadata: dict):
    index = get_pinecone_index()
    embedding = embed_text(text)
    index.upsert(vectors=[(learning_id, embedding, metadata)])
    print(f"🧠 Stored learning: {learning_id}")


def find_similar_learnings(query: str, niche: str = None, top_k: int = 5) -> list:
    index = get_pinecone_index()
    embedding = embed_text(query)
    filter_dict = {"isActive": True}
    if niche:
        filter_dict["$or"] = [
            {"applicableNiche": niche},
            {"applicableNiche": None}
        ]
    results = index.query(vector=embedding, top_k=top_k, filter=filter_dict,
                           include_metadata=True)
    return results.matches
