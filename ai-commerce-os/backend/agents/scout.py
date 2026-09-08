from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import List, TypedDict
import json
import os
from dotenv import load_dotenv
from vector_db import find_similar_learnings

load_dotenv()


class AgentState(TypedDict):
    workspace_id: str
    niche: str
    raw_trends: str
    evaluated_products: List[dict]
    final_shopify_products: List[dict]
    relevant_learnings: List[dict]


llm = ChatOpenAI(model="gpt-4o", temperature=0.2,
                  api_key=os.getenv("OPENAI_API_KEY"))


def retrieve_learnings(state: AgentState):
    print(f"🧠 Retrieving learnings for {state['niche']}")
    query = f"Product selection strategies for {state['niche']} niche"
    learnings = find_similar_learnings(query, state['niche'], top_k=5)
    formatted = [{"lesson": m.metadata.get("lesson"), "confidence": m.score}
                 for m in learnings]
    return {"relevant_learnings": formatted}


def research_trends(state: AgentState):
    learning_context = ""
    if state['relevant_learnings']:
        learning_context = "\nPAST LEARNINGS:\n"
        for l in state['relevant_learnings'][:3]:
            learning_context += f"- {l['lesson']}\n"

    prompt = f"""Generate JSON list of 5 trending products in '{state['niche']}' niche.
{learning_context}
Include: name, cost, price, why_trending. Return JSON array only."""

    response = llm.invoke(prompt)
    return {"raw_trends": response.content}


def evaluate_products(state: AgentState):
    prompt = f"""Analyze these products: {state['raw_trends']}
Evaluate profit margin (3x+ markup) and virality (1-10).
Return top 3 as JSON array."""
    response = llm.invoke(prompt)
    try:
        return {"evaluated_products": json.loads(response.content)}
    except Exception:
        return {"evaluated_products": []}


def format_for_store(state: AgentState):
    final = []
    for product in state['evaluated_products']:
        prompt = f"""Write Shopify listing for: {product.get('name', 'Product')}
Return JSON with: title, description, tags"""
        response = llm.invoke(prompt)
        try:
            listing = json.loads(response.content)
            final.append({**listing, "cost": product.get('cost', 0),
                          "price": product.get('price', 0)})
        except Exception:
            pass
    return {"final_shopify_products": final}


workflow = StateGraph(AgentState)
workflow.add_node("retrieve_learnings", retrieve_learnings)
workflow.add_node("research", research_trends)
workflow.add_node("evaluate", evaluate_products)
workflow.add_node("format", format_for_store)

workflow.set_entry_point("retrieve_learnings")
workflow.add_edge("retrieve_learnings", "research")
workflow.add_edge("research", "evaluate")
workflow.add_edge("evaluate", "format")
workflow.add_edge("format", END)

scout_agent = workflow.compile()


async def run_scout_agent(workspace_id: str, niche: str):
    initial_state = {
        "workspace_id": workspace_id, "niche": niche,
        "raw_trends": "", "evaluated_products": [],
        "final_shopify_products": [], "relevant_learnings": []
    }
    final_state = scout_agent.invoke(initial_state)
    return final_state['final_shopify_products']
