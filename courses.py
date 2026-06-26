from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from db import database, courses, batches
from routes.auth import get_current_user

router = APIRouter(tags=["Courses & Batches"])


# ── COURSES ────────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    name: str
    code: str
    duration_months: int = 6
    total_fee: float
    is_active: bool = True


@router.get("/courses")
async def list_courses(current_user=Depends(get_current_user)):
    return [dict(r) for r in await database.fetch_all(courses.select().order_by(courses.c.id))]


@router.post("/courses")
async def create_course(data: CourseCreate, current_user=Depends(get_current_user)):
    existing = await database.fetch_one(courses.select().where(courses.c.code == data.code))
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    cid = await database.execute(courses.insert().values(**data.dict()))
    return {"message": "Course created", "id": cid}


@router.put("/courses/{course_id}")
async def update_course(course_id: int, data: CourseCreate, current_user=Depends(get_current_user)):
    await database.execute(courses.update().where(courses.c.id == course_id).values(**data.dict()))
    return {"message": "Updated"}


@router.delete("/courses/{course_id}")
async def delete_course(course_id: int, current_user=Depends(get_current_user)):
    await database.execute(courses.update().where(courses.c.id == course_id).values(is_active=False))
    return {"message": "Deactivated"}


# ── BATCHES ────────────────────────────────────────────────────────────────────

class BatchCreate(BaseModel):
    batch_name: str
    course_id: int
    start_date: date
    end_date: Optional[date] = None
    timings: Optional[str] = None
    is_active: bool = True


@router.get("/batches")
async def list_batches(current_user=Depends(get_current_user)):
    query = """
        SELECT b.*, c.name as course_name, c.code as course_code
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        ORDER BY b.id DESC
    """
    return [dict(r) for r in await database.fetch_all(query)]


@router.post("/batches")
async def create_batch(data: BatchCreate, current_user=Depends(get_current_user)):
    bid = await database.execute(batches.insert().values(**data.dict()))
    return {"message": "Batch created", "id": bid}


@router.put("/batches/{batch_id}")
async def update_batch(batch_id: int, data: BatchCreate, current_user=Depends(get_current_user)):
    await database.execute(batches.update().where(batches.c.id == batch_id).values(**data.dict()))
    return {"message": "Updated"}
