import databases
import sqlalchemy
from sqlalchemy import (
    MetaData, Table, Column, Integer, String, Float,
    DateTime, Boolean, Text, Date, Enum, ForeignKey
)
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").replace("channel_binding=require", "").replace("&&", "").replace("?&", "?").rstrip("&").rstrip("?")

# asyncpg needs postgresql+asyncpg:// for async, plain postgresql:// for sync
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://") if not DATABASE_URL.startswith("postgresql+asyncpg") else DATABASE_URL
SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

database = databases.Database(ASYNC_DATABASE_URL)
metadata = MetaData()

users = Table("users", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(100), nullable=False),
    Column("email", String(150), unique=True, nullable=False),
    Column("hashed_password", String(255), nullable=False),
    Column("role", String(20), default="finance"),
    Column("is_active", Boolean, default=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

courses = Table("courses", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(200), nullable=False),
    Column("code", String(20), unique=True, nullable=False),
    Column("duration_months", Integer, default=6),
    Column("total_fee", Float, nullable=False),
    Column("is_active", Boolean, default=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

batches = Table("batches", metadata,
    Column("id", Integer, primary_key=True),
    Column("batch_name", String(100), nullable=False),
    Column("course_id", Integer, ForeignKey("courses.id")),
    Column("start_date", Date, nullable=False),
    Column("end_date", Date),
    Column("timings", String(100)),
    Column("is_active", Boolean, default=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

students = Table("students", metadata,
    Column("id", Integer, primary_key=True),
    Column("student_id", String(20), unique=True, nullable=False),
    Column("name", String(150), nullable=False),
    Column("email", String(150)),
    Column("phone", String(20), nullable=False),
    Column("address", Text),
    Column("course_id", Integer, ForeignKey("courses.id")),
    Column("batch_id", Integer, ForeignKey("batches.id")),
    Column("total_fee", Float, nullable=False),
    Column("discount", Float, default=0),
    Column("net_fee", Float, nullable=False),
    Column("admission_date", Date, nullable=False),
    Column("status", String(20), default="active"),
    Column("notes", Text),
    Column("created_at", DateTime, default=datetime.utcnow),
)

fee_installments = Table("fee_installments", metadata,
    Column("id", Integer, primary_key=True),
    Column("student_id", Integer, ForeignKey("students.id")),
    Column("installment_no", Integer, nullable=False),
    Column("amount_due", Float, nullable=False),
    Column("due_date", Date, nullable=False),
    Column("amount_paid", Float, default=0),
    Column("paid_date", Date),
    Column("status", String(20), default="pending"),
    Column("created_at", DateTime, default=datetime.utcnow),
)

collections = Table("collections", metadata,
    Column("id", Integer, primary_key=True),
    Column("receipt_no", String(30), unique=True, nullable=False),
    Column("student_id", Integer, ForeignKey("students.id")),
    Column("installment_id", Integer, ForeignKey("fee_installments.id"), nullable=True),
    Column("amount", Float, nullable=False),
    Column("payment_mode", String(20), nullable=False),
    Column("payment_date", Date, nullable=False),
    Column("transaction_ref", String(100)),
    Column("collected_by", Integer, ForeignKey("users.id")),
    Column("notes", Text),
    Column("created_at", DateTime, default=datetime.utcnow),
)

expenses = Table("expenses", metadata,
    Column("id", Integer, primary_key=True),
    Column("category", String(50), nullable=False),
    Column("description", String(300), nullable=False),
    Column("amount", Float, nullable=False),
    Column("expense_date", Date, nullable=False),
    Column("payment_mode", String(20), nullable=False),
    Column("vendor", String(150)),
    Column("reference", String(100)),
    Column("added_by", Integer, ForeignKey("users.id")),
    Column("created_at", DateTime, default=datetime.utcnow),
)

salary_records = Table("salary_records", metadata,
    Column("id", Integer, primary_key=True),
    Column("staff_name", String(150), nullable=False),
    Column("designation", String(100)),
    Column("month", Integer, nullable=False),
    Column("year", Integer, nullable=False),
    Column("gross_salary", Float, nullable=False),
    Column("deductions", Float, default=0),
    Column("net_salary", Float, nullable=False),
    Column("paid_date", Date),
    Column("payment_mode", String(50)),
    Column("added_by", Integer, ForeignKey("users.id")),
    Column("created_at", DateTime, default=datetime.utcnow),
)

engine = sqlalchemy.create_engine(SYNC_DATABASE_URL)

async def create_tables():
    pass
    metadata.create_all(engine)

async def connect_db():
    await database.connect()

async def disconnect_db():
    await database.disconnect()

