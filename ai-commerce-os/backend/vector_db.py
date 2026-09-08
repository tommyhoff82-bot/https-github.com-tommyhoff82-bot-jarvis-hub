from pinecone import Pinecone
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX", "commerce-learnings")
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_index():
    return pc.Index(index_name)


def embed_text(text: str) -> list:
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def store_learning(learning_id: str, text: str, metadata: dict):
    index = get_index()
    embedding = embed_text(text)
    index.upsert(vectors=[(learning_id, embedding, metadata)])
    print(f"🧠 Stored learning: {learning_id}")


def find_similar_learnings(query: str, niche: str = None, top_k: int = 5) -> list:
    index = get_index()
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
