from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv

from db import db, connect_db, disconnect_db
from auth import get_current_user, require_workspace_owner
from api.routes import auth as auth_routes
from api.routes import billing
from api.webhooks import shopify

load_dotenv()

app = FastAPI(title="AI Commerce OS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(shopify.router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    await connect_db()


@app.on_event("shutdown")
async def on_shutdown():
    await disconnect_db()


class WorkspaceCreate(BaseModel):
    business_name: str
    niche: str


class AgentTrigger(BaseModel):
    workspace_id: str
    agent_type: str  # "scout" | "learner"


class OutcomeReport(BaseModel):
    decision_id: str
    outcome: str  # "success" | "failure"
    outcome_data: dict


async def provision_store_task(workspace_id: str, niche: str):
    """Placeholder for real store provisioning (Shopify store/app install,
    initial theme, etc). No email in the original build-guide sequence
    ever specified this step in code — it only covers the manual Shopify
    Partners signup in Phase 1. Wire integrations/shopify.py here once
    you've decided how a workspace connects its store (OAuth vs a pasted
    admin API token).
    """
    print(f"🏪 Provisioning store for workspace {workspace_id} ({niche})")
    await asyncio.sleep(1)
    print(f"✅ Workspace {workspace_id} ready")


async def run_ai_agent_task(workspace_id: str, agent_type: str):
    task = await db.agenttask.create(data={
        "workspaceId": workspace_id,
        "agentType": agent_type,
        "actionType": "running",
        "status": "pending",
    })
    print(f"🤖 Starting {agent_type} agent (task {task.id})")
    try:
        if agent_type == "scout":
            from agents.scout import run_scout_agent
            workspace = await db.workspace.find_unique(where={"id": workspace_id})
            products = await run_scout_agent(workspace_id, workspace.niche if workspace else "general")
            await db.agenttask.update(
                where={"id": task.id},
                data={"status": "completed", "actionType": f"Found {len(products)} products",
                      "resultData": {"products": products}},
            )
        elif agent_type == "learner":
            from workers.learner import analyze_patterns
            await analyze_patterns(workspace_id)
            await db.agenttask.update(
                where={"id": task.id},
                data={"status": "completed", "actionType": "Analyzed patterns"},
            )
        else:
            raise ValueError(f"Unknown agent_type: {agent_type}")
    except Exception as e:
        await db.agenttask.update(
            where={"id": task.id},
            data={"status": "failed", "errorMessage": str(e)},
        )
        print(f"❌ Agent task {task.id} failed: {e}")


@app.get("/")
async def root():
    return {"status": "online", "version": "2.0.0"}


@app.post("/api/workspaces")
async def create_workspace(data: WorkspaceCreate, background_tasks: BackgroundTasks,
                            current_user=Depends(get_current_user)):
    workspace = await db.workspace.create(data={
        "userId": current_user.id,
        "businessName": data.business_name,
        "niche": data.niche,
    })
    background_tasks.add_task(provision_store_task, workspace.id, data.niche)
    return {"message": "Workspace created", "workspace_id": workspace.id}


@app.post("/api/agents/trigger")
async def trigger_agent(data: AgentTrigger, background_tasks: BackgroundTasks,
                         current_user=Depends(get_current_user)):
    await require_workspace_owner(data.workspace_id, current_user)
    if data.agent_type not in ("scout", "learner"):
        raise HTTPException(status_code=400, detail="agent_type must be 'scout' or 'learner'")
    background_tasks.add_task(run_ai_agent_task, data.workspace_id, data.agent_type)
    return {"status": "Agent started"}


@app.get("/api/agents/tasks")
async def get_agent_tasks(workspace_id: str, current_user=Depends(get_current_user)):
    await require_workspace_owner(workspace_id, current_user)
    tasks = await db.agenttask.find_many(
        where={"workspaceId": workspace_id},
        order={"createdAt": "desc"},
        take=20,
    )
    return [
        {"id": t.id, "agentType": t.agentType, "actionType": t.actionType,
         "status": t.status, "createdAt": t.createdAt.isoformat()}
        for t in tasks
    ]


@app.post("/api/learning/outcome")
async def report_outcome(data: OutcomeReport, current_user=Depends(get_current_user)):
    decision = await db.aidecision.find_unique(where={"id": data.decision_id})
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    await require_workspace_owner(decision.workspaceId, current_user)

    await db.aidecision.update(
        where={"id": data.decision_id},
        data={
            "outcome": data.outcome,
            "outcomeData": data.outcome_data,
            "outcomeRecordedAt": datetime.now(),
        },
    )
    print(f"📊 Recording outcome: {data.outcome}")
    return {"status": "recorded"}


@app.get("/api/learning/insights")
async def get_system_insights(workspace_id: str, current_user=Depends(get_current_user)):
    await require_workspace_owner(workspace_id, current_user)

    decisions = await db.aidecision.find_many(
        where={"workspaceId": workspace_id, "outcome": {"in": ["success", "failure"]}},
        order={"createdAt": "asc"},
    )
    learnings = await db.learning.find_many(
        where={"workspaceId": workspace_id, "isActive": True},
        order={"confidence": "desc"},
        take=3,
    )

    total = len(decisions)
    success_rate = (sum(1 for d in decisions if d.outcome == "success") / total) if total else 0.0

    improvement = "Not enough data yet — trigger the Scout and Learner agents to start building history."
    if total >= 10:
        midpoint = total // 2
        first_half, second_half = decisions[:midpoint], decisions[midpoint:]
        rate = lambda group: (sum(1 for d in group if d.outcome == "success") / len(group)) if group else 0.0
        delta = (rate(second_half) - rate(first_half)) * 100
        improvement = f"{delta:+.0f}% conversion rate change since tracking began"

    return {
        "total_decisions": total,
        "success_rate": round(success_rate, 2),
        "top_learnings": [{"lesson": l.lesson} for l in learnings],
        "improvement_over_time": improvement,
    }
