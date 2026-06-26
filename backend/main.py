from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db import connect_db, disconnect_db, create_tables
from routes import auth, courses, students, collections, expenses, reports, ai_agent
import os
from dotenv import load_dotenv

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    await connect_db()
    # Seed default admin if not exists
    from db import database, users
    from utils.auth import hash_password
    existing = await database.fetch_one(users.select().where(users.c.email == "admin@elyra.ai"))
    if not existing:
        await database.execute(users.insert().values(
            name="Admin",
            email="admin@elyra.ai",
            hashed_password=hash_password("Elyra@2026"),
            role="admin",
            is_active=True,
        ))
        print("✅ Default admin created: admin@elyra.ai / Elyra@2026")

    # Seed Future Optima courses
    from db import courses as courses_table
    course_count = await database.fetch_one("SELECT COUNT(*) as cnt FROM courses")
    if course_count["cnt"] == 0:
        fo_courses = [
            {"name": "Python Full Stack with AI", "code": "PYFS", "duration_months": 6, "total_fee": 35000},
            {"name": "MERN Stack Development", "code": "MERN", "duration_months": 6, "total_fee": 35000},
            {"name": "Data Science with Artificial Intelligence", "code": "DSAI", "duration_months": 6, "total_fee": 40000},
            {"name": "Cybersecurity (Red Team & SOC Analyst)", "code": "CSEC", "duration_months": 6, "total_fee": 40000},
            {"name": "AI-Powered Data Analytics", "code": "AIDA", "duration_months": 4, "total_fee": 30000},
        ]
        for c in fo_courses:
            await database.execute(courses_table.insert().values(**c, is_active=True))
        print("✅ Future Optima courses seeded")

    yield
    await disconnect_db()


app = FastAPI(
    title="Elyra AI 2 — Finance Agent",
    description="Premium Finance Management System for Future Optima IT Solutions | Built by Elyra AI",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(students.router)
app.include_router(collections.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(ai_agent.router)


@app.get("/")
async def root():
    return {
        "app": "Elyra AI 2 — Finance Agent",
        "client": "Future Optima IT Solutions",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "elyra-ai-2-backend"}
