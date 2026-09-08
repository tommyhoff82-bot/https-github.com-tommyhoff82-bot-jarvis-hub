from langchain_openai import ChatOpenAI
from db import db
from vector_db import store_learning
from datetime import datetime, timedelta
import json
import os
import uuid

llm = ChatOpenAI(model="gpt-4o", temperature=0.3,
                  api_key=os.getenv("OPENAI_API_KEY"))


async def analyze_patterns(workspace_id: str):
    print(f"🔬 Analyzing patterns for {workspace_id}")
    await db.connect()

    workspace = await db.workspace.find_unique(where={"id": workspace_id})
    niche = workspace.niche

    decisions = await db.aidecision.find_many(
        where={
            "workspaceId": workspace_id,
            "outcome": {"in": ["success", "failure"]},
            "createdAt": {"gte": datetime.now() - timedelta(days=30)}
        },
        take=10
    )

    if len(decisions) < 10:
        await db.disconnect()
        return

    prompt = f"""Analyze these AI decisions:
NICHE: {niche}
SUCCESSES: {json.dumps([d.decisionData for d in decisions if d.outcome == "success"][:5])}
FAILURES: {json.dumps([d.decisionData for d in decisions if d.outcome == "failure"][:5])}

Identify 3 patterns. Return JSON array with: lesson, confidence (0-1), applicable_to."""

    response = llm.invoke(prompt)

    try:
        patterns = json.loads(response.content)
        for pattern in patterns:
            learning_id = str(uuid.uuid4())
            await db.learning.create(data={
                "workspaceId": workspace_id,
                "category": "pattern",
                "lesson": pattern["lesson"],
                "confidence": pattern["confidence"],
                "sampleSize": len(decisions),
                "applicableNiche": niche,
                "vectorId": learning_id,
                "isActive": True
            })
            store_learning(
                learning_id=learning_id,
                text=f"{niche}: {pattern['lesson']}",
                metadata={"lesson": pattern["lesson"], "niche": niche, "isActive": True}
            )
            print(f"💡 Learning stored: {pattern['lesson'][:50]}")
    except Exception as e:
        print(f"❌ Error: {e}")

    await db.disconnect()
