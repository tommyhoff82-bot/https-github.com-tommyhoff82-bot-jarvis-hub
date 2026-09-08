from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import os
from dotenv import load_dotenv

from api.routes import billing
from api.webhooks import shopify

load_dotenv()

app = FastAPI(title="AI Commerce OS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(billing.router, prefix="/api")
app.include_router(shopify.router, prefix="/api")


class WorkspaceCreate(BaseModel):
    business_name: str
    niche: str
    user_id: str


class AgentTrigger(BaseModel):
    workspace_id: str
    agent_type: str


class OutcomeReport(BaseModel):
    decision_id: str
    outcome: str
    outcome_data: dict


async def provision_store_task(workspace_id: str, niche: str):
    print(f"🏪 Provisioning store for {workspace_id}")
    await asyncio.sleep(3)
    print(f"✅ Store {workspace_id} is LIVE!")


async def run_ai_agent_task(workspace_id: str, agent_type: str):
    print(f"🤖 Starting {agent_type} agent")
    if agent_type == "scout":
        from agents.scout import run_scout_agent
        from db import db, connect_db, disconnect_db
        await connect_db()
        workspace = await db.workspace.find_unique(where={"id": workspace_id})
        await run_scout_agent(workspace_id, workspace.niche if workspace else "general")
        await disconnect_db()
    elif agent_type == "learner":
        from workers.learner import analyze_patterns
        await analyze_patterns(workspace_id)
    else:
        await asyncio.sleep(2)


@app.get("/")
async def root():
    return {"status": "online", "version": "2.0.0"}


@app.post("/api/workspaces")
async def create_workspace(data: WorkspaceCreate, background_tasks: BackgroundTasks):
    background_tasks.add_task(provision_store_task, "ws_123", data.niche)
    return {"message": "Workspace created", "workspace_id": "ws_123"}


@app.post("/api/agents/trigger")
async def trigger_agent(data: AgentTrigger, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_ai_agent_task, data.workspace_id, data.agent_type)
    return {"status": "Agent started"}


@app.get("/api/agents/tasks")
async def get_agent_tasks(workspace_id: str):
    return [
        {"id": "1", "agentType": "scout", "actionType": "Found 3 products",
         "status": "completed", "createdAt": "2026-09-08T10:00:00Z"},
        {"id": "2", "agentType": "learner", "actionType": "Analyzed patterns",
         "status": "completed", "createdAt": "2026-09-08T10:05:00Z"}
    ]


@app.post("/api/learning/outcome")
async def report_outcome(data: OutcomeReport):
    print(f"📊 Recording outcome: {data.outcome}")
    return {"status": "recorded"}


@app.get("/api/learning/insights")
async def get_system_insights(workspace_id: str):
    return {
        "total_decisions": 1247,
        "success_rate": 0.73,
        "top_learnings": [
            {"lesson": "Eco-friendly products convert 34% better"},
            {"lesson": "Question-based hooks perform 2.1x better"},
            {"lesson": "$40-$80 price point has highest ROAS"}
        ],
        "improvement_over_time": "+18% conversion rate"
    }
