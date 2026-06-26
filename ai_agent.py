from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from db import database
from routes.auth import get_current_user
from datetime import date
import os

router = APIRouter(tags=["AI Agent"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


async def get_finance_context() -> str:
    today = date.today()
    m, y = today.month, today.year

    today_col = await database.fetch_one(
        "SELECT COALESCE(SUM(amount), 0) as t FROM collections WHERE payment_date = :d",
        {"d": today}
    )
    month_col = await database.fetch_one(
        "SELECT COALESCE(SUM(amount), 0) as t FROM collections WHERE EXTRACT(MONTH FROM payment_date)=:m AND EXTRACT(YEAR FROM payment_date)=:y",
        {"m": m, "y": y}
    )
    month_exp = await database.fetch_one(
        "SELECT COALESCE(SUM(amount), 0) as t FROM expenses WHERE EXTRACT(MONTH FROM expense_date)=:m AND EXTRACT(YEAR FROM expense_date)=:y",
        {"m": m, "y": y}
    )
    active_students = await database.fetch_one("SELECT COUNT(*) as cnt FROM students WHERE status='active'")
    overdue = await database.fetch_one(
        "SELECT COUNT(*) as cnt, COALESCE(SUM(amount_due - amount_paid),0) as t FROM fee_installments WHERE status IN ('pending','partial') AND due_date < :today",
        {"today": today}
    )
    outstanding = await database.fetch_one(
        "SELECT COALESCE(SUM(net_fee),0) - COALESCE((SELECT SUM(amount) FROM collections),0) as t FROM students WHERE status='active'"
    )
    course_rev = await database.fetch_all("""
        SELECT c.name, COUNT(s.id) as students, COALESCE(SUM(col.amount),0) as collected
        FROM courses c
        LEFT JOIN students s ON s.course_id = c.id
        LEFT JOIN collections col ON col.student_id = s.id
        GROUP BY c.name ORDER BY collected DESC
    """)

    top_pending = await database.fetch_all("""
        SELECT s.name, s.phone, s.net_fee - COALESCE(SUM(col.amount),0) as balance
        FROM students s
        LEFT JOIN collections col ON col.student_id = s.id
        WHERE s.status='active'
        GROUP BY s.id
        HAVING s.net_fee - COALESCE(SUM(col.amount),0) > 0
        ORDER BY balance DESC LIMIT 5
    """)

    course_lines = "\n".join([f"  - {r['name']}: {r['students']} students, ₹{r['collected']:,.0f} collected" for r in course_rev])
    pending_lines = "\n".join([f"  - {r['name']} ({r['phone']}): ₹{r['balance']:,.0f} outstanding" for r in top_pending])

    return f"""
LIVE FINANCE DATA — Future Optima IT Solutions ({today.strftime('%d %B %Y')})

TODAY'S COLLECTION: ₹{today_col['t']:,.2f}
THIS MONTH COLLECTION: ₹{month_col['t']:,.2f}
THIS MONTH EXPENSES: ₹{month_exp['t']:,.2f}
THIS MONTH PROFIT: ₹{(month_col['t'] or 0) - (month_exp['t'] or 0):,.2f}
ACTIVE STUDENTS: {active_students['cnt']}
TOTAL OUTSTANDING: ₹{max(outstanding['t'] or 0, 0):,.2f}
OVERDUE INSTALLMENTS: {overdue['cnt']} installments worth ₹{overdue['t']:,.2f}

COURSE-WISE REVENUE:
{course_lines}

TOP 5 OUTSTANDING STUDENTS:
{pending_lines}
"""


@router.post("/ai/chat")
async def ai_chat(request: ChatRequest, current_user=Depends(get_current_user)):
    context = await get_finance_context()

    system_prompt = f"""You are Elyra, an intelligent AI Finance Agent for Future Optima IT Solutions, built by Elyra AI 2.
You have real-time access to the institute's financial data shown below.

{context}

Your capabilities:
- Answer questions about daily collections, monthly revenue, expenses, outstanding fees
- Identify overdue payments and at-risk students
- Provide P&L analysis, cash flow insights
- Give actionable recommendations to improve fee collection
- Answer in a professional, concise manner
- Use ₹ for Indian Rupee amounts
- Always be helpful, accurate, and data-driven

If asked about data outside your context, say you don't have that specific data but offer what you can.
Always sign off as "— Elyra, Finance Agent | Elyra AI 2"
"""

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=1000,
        temperature=0.3,
    )

    return {
        "response": response.choices[0].message.content,
        "model": "llama-3.1-70b-versatile",
    }


@router.get("/ai/quick-insights")
async def quick_insights(current_user=Depends(get_current_user)):
    context = await get_finance_context()

    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": "You are Elyra, a finance AI agent. Give 3 sharp, actionable insights from the data. Be concise. Format as numbered list."},
            {"role": "user", "content": f"Give me 3 key financial insights for today:\n{context}"}
        ],
        max_tokens=400,
        temperature=0.3,
    )

    return {"insights": response.choices[0].message.content}
