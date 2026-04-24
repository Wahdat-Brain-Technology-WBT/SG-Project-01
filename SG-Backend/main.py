import os
from google import genai
from google.genai import types
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Date, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional, Any
import datetime
import io
from collections import defaultdict
from dotenv import load_dotenv

# IoT & Reporting Modules
try:
    from zk import ZK, const
except ImportError:
    ZK = None

try:
    import pandas as pd
except ImportError:
    pd = None

# بارگذاری متغیرهای محیطی
load_dotenv()

# تنظیمات دیتابیس PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/sheen_ghazy_erp")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    print("WARNING: GEMINI_API_KEY environment variable not set. AI Chatbot features will not work.")
    client = None


# ==========================================
# Models (جداول دیتابیس)
# ==========================================
class Product(Base):
    __tablename__ = "Products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    product_code = Column(String, nullable=True)  # اضافه شده
    category = Column(String, default="عمومی")
    size = Column(String, nullable=False)
    color = Column(String, default="-")  # اضافه شده
    qty_per_carton = Column(Integer, default=0)
    current_price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Ledger(Base):
    __tablename__ = "Ledgers"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # INCOME, EXPENSE
    department = Column(String, default="GENERAL")
    amount = Column(Float, nullable=False)
    description = Column(Text)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    order_id = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Employee(Base):
    __tablename__ = "Employees"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    father_name = Column(String, nullable=True, default="-")  # ولد
    province = Column(String, nullable=True, default="-")  # ولایت
    position = Column(String, nullable=False)
    salary = Column(Float, nullable=False)
    phone = Column(String)
    hire_date = Column(Date, default=datetime.date.today)  # تاریخ ثبت نام
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Production(Base):
    __tablename__ = "Productions"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String, default="PIPE")
    quantity_produced = Column(Integer, nullable=False)
    raw_material_used = Column(Float)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    ProductId = Column(Integer, ForeignKey("Products.id"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Customer(Base):
    __tablename__ = "Customers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    whatsapp_number = Column(String, unique=True, nullable=False)
    address = Column(Text)
    total_spent = Column(Float, default=0)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Order(Base):
    __tablename__ = "Orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="PENDING")
    total_amount = Column(Float, default=0)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    CustomerId = Column(Integer, ForeignKey("Customers.id"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class OrderItem(Base):
    __tablename__ = "OrderItems"
    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    OrderId = Column(Integer, ForeignKey("Orders.id"))
    ProductId = Column(Integer, ForeignKey("Products.id"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Attendance(Base):
    __tablename__ = "Attendances"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, nullable=False)  # 'PRESENT', 'LATE', 'ABSENT'
    date = Column(String, nullable=False)
    check_in = Column(String, nullable=True)  # Added for ZKTeco entry time
    check_out = Column(String, nullable=True)  # Added for ZKTeco exit time
    EmployeeId = Column(Integer, ForeignKey("Employees.id"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class User(Base):
    __tablename__ = "Users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="EMPLOYEE")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


# ==========================================
# Schema Migrations (به‌روزرسانی خودکار دیتابیس)
# ==========================================
from sqlalchemy import inspect


def upgrade_database_schema(engine):
    """
    Safely adds new columns to the SQLite/PostgreSQL database
    if they don't already exist.
    """
    inspector = inspect(engine)

    # Check what tables exist to avoid errors if the database is completely empty
    if not inspector.has_table("Employees"):
        return

    with engine.connect() as conn:
        # Check if father_name exists in Employees
        employees_columns = [col['name'] for col in inspector.get_columns("Employees")]
        if "father_name" not in employees_columns:
            try:
                conn.execute(text("ALTER TABLE \"Employees\" ADD COLUMN father_name VARCHAR DEFAULT '-'"))
                conn.execute(text("ALTER TABLE \"Employees\" ADD COLUMN province VARCHAR DEFAULT '-'"))
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Migration Notice (Employees): {str(e)}")

        # Check if check_in exists in Attendances
        if inspector.has_table("Attendances"):
            attendances_columns = [col['name'] for col in inspector.get_columns("Attendances")]
            if "check_in" not in attendances_columns:
                try:
                    conn.execute(text("ALTER TABLE \"Attendances\" ADD COLUMN check_in VARCHAR"))
                    conn.execute(text("ALTER TABLE \"Attendances\" ADD COLUMN check_out VARCHAR"))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration Notice (Attendances): {str(e)}")


# اجرای مایگریشن‌ها قبل از ایجاد جداول
upgrade_database_schema(engine)

# ساخت تمام جداول در دیتابیس
Base.metadata.create_all(bind=engine)

# ==========================================
# FastAPI App Setup
# ==========================================
app = FastAPI(title="Sheen Ghazy ERP API")

# تنظیمات CORS (اصلاح شده برای جلوگیری از خطای مرورگر)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# سیستم مدیریت خطاهای هوشمند
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": f"خطای سرور: {str(exc)}"})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": f"خطای اطلاعات ورودی: {exc.errors()}"})


# Dependency برای گرفتن سشن دیتابیس
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# Gemini Tools & Configuration
# ==========================================
def check_live_price(product_name: str) -> str:
    """Queries the PostgreSQL database to get the exact current price and stock."""
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if product:
            return f"قیمت {product.name} (سایز {product.size}): {product.current_price} افغانی است. موجودی: {product.stock_quantity} عدد."
        return f"متاسفانه محصولی با نام {product_name} یافت نشد."
    finally:
        db.close()


def place_new_order(customer_name: str, whatsapp: str, address: str, product_name: str, quantity: int) -> str:
    """Inserts a new PENDING order into the PostgreSQL Orders and Customers tables."""
    db = SessionLocal()
    try:
        # Find product
        product = db.query(Product).filter(Product.name.ilike(f"%{product_name}%")).first()
        if not product:
            return f"خطا: محصول {product_name} یافت نشد."

        # Find or create customer
        customer = db.query(Customer).filter(Customer.whatsapp_number == whatsapp).first()
        if not customer:
            customer = Customer(full_name=customer_name, whatsapp_number=whatsapp, address=address)
            db.add(customer)
            db.commit()
            db.refresh(customer)

        # Create Order
        new_order = Order(CustomerId=customer.id, status='PENDING')
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # Create Order Item
        order_item = OrderItem(
            OrderId=new_order.id,
            ProductId=product.id,
            quantity=quantity,
            unit_price=product.current_price
        )
        db.add(order_item)

        # Update total amount
        new_order.total_amount = product.current_price * quantity
        db.commit()

        return "سفارش شما با موفقیت ثبت شد. تیم فروش به زودی با شما در واتساپ به تماس خواهد شد."
    except Exception as e:
        db.rollback()
        return f"خطا در ثبت سفارش: {str(e)}"
    finally:
        db.close()


tools_list = [check_live_price, place_new_order]

system_instruction = """
You are the official Smart Sales Assistant for SHEEN GHAZY BABA PVC Piping Company. 
Your default language is Dari, but you must reply in the language the user speaks (Dari, Pashto, or English). 
Be polite, professional, and concise. NEVER hallucinate prices. Always use the check_live_price tool.
CRITICAL: When calling check_live_price, ONLY pass the core product name (e.g., "شیران یزد" or "پایپ PVC"). Do not include sizes, colors, or quantities in the search query.
If the user wants to buy something, intelligently ask for their Name, WhatsApp Number, and Delivery Address step-by-step. 
Once collected, trigger the place_new_order function and reply exactly with: "سفارش شما با موفقیت ثبت شد. تیم فروش به زودی با شما در واتساپ به تماس خواهد شد."
"""


# We will instantiate the chat inside the endpoint to maintain statelessness or handle history properly.

# ==========================================
# Pydantic Schemas (برای اعتبارسنجی اطلاعات ورودی)
# ==========================================
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class ExpenseCreate(BaseModel):
    amount: float
    description: str
    department: str = "GENERAL"
    type: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    product_code: Optional[str] = None
    category: str = "عمومی"
    size: str
    color: str = "-"
    qty_per_carton: int = 0
    current_price: float
    stock_quantity: int = 0


class EmployeeCreate(BaseModel):
    full_name: str
    father_name: Optional[str] = "-"
    province: Optional[str] = "-"
    position: str
    salary: float
    phone: Optional[str] = None


class ProductionCreate(BaseModel):
    ProductId: int
    quantity_produced: int
    raw_material_used: float
    department: str = "PIPE"


class DirectSaleItem(BaseModel):
    ProductId: int
    quantity: int
    unit_price: float


class DirectSaleCreate(BaseModel):
    CustomerId: int
    items: List[DirectSaleItem]


class LoginRequest(BaseModel):
    username: str
    password: str


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    qty_per_carton: Optional[int] = None
    current_price: Optional[float] = None
    stock_quantity: Optional[int] = None


class AttendanceCreate(BaseModel):
    EmployeeId: int
    status: str
    date: str


class QuickAttendanceCreate(BaseModel):
    date: str


class PublicOrderItem(BaseModel):
    productId: int
    quantity: int


class PublicOrderCreate(BaseModel):
    fullName: str
    whatsappNumber: str
    address: str
    items: List[PublicOrderItem]


# ==========================================
# API Routes (مسیرهای ارتباطی)
# ==========================================

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools_list,
            temperature=0.7,
        )

        # Convert request.history to Gemini format
        gemini_history = []
        for msg in request.history:
            role = "user" if msg.role == "user" else "model"
            gemini_history.append({"role": role, "parts": [{"text": msg.content}]})

        if not client:
            return JSONResponse(status_code=500, content={
                "reply": "خطا: کلید API جمنای (GEMINI_API_KEY) در سرور تنظیم نشده است. لطفا آن را در فایل .env تنظیم کنید."})

        try:
            chat = client.chats.create(
                model="gemini-1.5-flash",
                config=config,
                history=gemini_history if gemini_history else None
            )
            response = chat.send_message(request.message)
            return {"reply": response.text}
        except Exception as api_error:
            error_str = str(api_error)
            if "404" in error_str or "NOT_FOUND" in error_str:
                print(f"Model 404 Error caught. Returning graceful fallback. Details: {error_str}")
                return {
                    "reply": "متاسفانه سیستم هوش مصنوعی در حال حاضر در دسترس نیست (خطای ارتباط با سرور). لطفاً برای ثبت سفارش مستقیماً با شماره واتساپ شرکت به تماس شوید."}
            raise api_error

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return {"token": "fake-jwt-token", "role": "CEO_SUPERADMIN"}


@app.get("/")
def read_root():
    return {"message": "Sheen Ghazy ERP API is running on FastAPI!"}


@app.get("/api/db-status")
def db_status(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "connected", "database": "PostgreSQL (FastAPI)"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.patch("/api/products/{id}")
def update_product(id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")

    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()


@app.post("/api/orders/{id}/confirm")
def confirm_order(id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")
    if order.status != 'PENDING':
        raise HTTPException(status_code=400, detail="سفارش قبلاً تایید شده است")

    order.status = 'COMPLETED'

    db_ledger = Ledger(
        type="INCOME",
        amount=order.total_amount,
        description=f"فروش سفارش #{order.id}",
        department="GENERAL",
        date=datetime.datetime.utcnow(),
        order_id=order.id
    )
    db.add(db_ledger)
    db.commit()
    return order


@app.post("/api/attendance")
def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db)):
    time_str = datetime.datetime.now().strftime("%I:%M %p")
    db_att = db.query(Attendance).filter(Attendance.EmployeeId == att.EmployeeId, Attendance.date == att.date).first()
    if db_att:
        db_att.status = att.status
        if not db_att.check_in and att.status in ['PRESENT', 'LATE']:
            db_att.check_in = time_str
    else:
        db_att = Attendance(
            EmployeeId=att.EmployeeId,
            status=att.status,
            date=att.date,
            check_in=time_str if att.status in ['PRESENT', 'LATE'] else None
        )
        db.add(db_att)
    db.commit()
    db.refresh(db_att)
    return db_att


@app.post("/api/attendance/quick")
def quick_attendance(req: QuickAttendanceCreate, db: Session = Depends(get_db)):
    time_str = datetime.datetime.now().strftime("%I:%M %p")
    employees = db.query(Employee).all()
    for emp in employees:
        db_att = db.query(Attendance).filter(Attendance.EmployeeId == emp.id, Attendance.date == req.date).first()
        if db_att:
            if db_att.status not in ['PRESENT', 'LATE']:
                db_att.status = 'PRESENT'
                if not db_att.check_in:
                    db_att.check_in = time_str
        else:
            db_att = Attendance(EmployeeId=emp.id, status='PRESENT', date=req.date, check_in=time_str)
            db.add(db_att)
    db.commit()
    return {"success": True}


class SyncRequest(BaseModel):
    device_ip: str = "192.168.1.201"


@app.post("/api/attendance/sync")
def sync_zkteco(req: SyncRequest = None, db: Session = Depends(get_db)):
    """
    MOCKED ZKTECO ENDPOINT (Hardware not yet available).
    Simulates successful connection and injects fake attendance records.
    """
    try:
        # Simulate network latency
        import time
        time.sleep(1.5)

        # Ensure we have at least one employee in the database
        employees = db.query(Employee).limit(3).all()
        if not employees:
            return {
                "success": False,
                "message": "هیچ کارمندی برای ثبت حاضری آزمایشی یافت نشد. لطفاً یک کارمند ثبت کنید."
            }

        today_str = datetime.datetime.now().strftime("%Y-%m-%d")

        # Fake punch data matching your requirements
        mock_punches = [
            {"check_in": "07:45 AM", "check_out": "05:00 PM", "status": "PRESENT"},
            {"check_in": "08:15 AM", "check_out": "05:10 PM", "status": "LATE"},
            {"check_in": "07:50 AM", "check_out": "04:00 PM", "status": "PRESENT"}
        ]

        records_added = 0
        for idx, emp in enumerate(employees):
            # Select mock data for this user
            mock_data = mock_punches[idx % len(mock_punches)]

            db_att = db.query(Attendance).filter(
                Attendance.EmployeeId == emp.id,
                Attendance.date == today_str
            ).first()

            if db_att:
                db_att.check_in = mock_data["check_in"]
                db_att.check_out = mock_data["check_out"]
                db_att.status = mock_data["status"]
            else:
                new_att = Attendance(
                    EmployeeId=emp.id,
                    date=today_str,
                    check_in=mock_data["check_in"],
                    check_out=mock_data["check_out"],
                    status=mock_data["status"]
                )
                db.add(new_att)

            records_added += 1

        db.commit()

        return {
            "success": True,
            "message": "همگامسازی (آزمایشی) با موفقیت انجام شد",
            "records_added": records_added
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"خطای سرور در همگام‌سازی آزمایشی: {str(e)}")


@app.get("/api/attendance/report")
def export_attendance_report(month: str = "current", db: Session = Depends(get_db)):
    if not pd:
        raise HTTPException(status_code=500,
                            detail="Pandas library not installed. Please run: pip install pandas openpyxl")

    # Get attendance via join to grab employee full names
    attendances = db.query(Attendance, Employee).join(Employee, Attendance.EmployeeId == Employee.id).all()

    if not attendances:
        raise HTTPException(status_code=404, detail="هیچ داده‌ای برای راپور یافت نشد.")

    data = []
    for att, emp in attendances:
        # Generate mapping row
        data.append({
            "ID کارمند": emp.id,
            "نام سیستم": emp.full_name,
            "ولد": emp.father_name or "-",
            "ولایت": emp.province or "-",
            "وظیفه": emp.position,
            "تاریخ استخدام": emp.hire_date,
            "تاریخ حاضری": att.date,
            "ساعت ورود": att.check_in or "---",
            "ساعت خروج": att.check_out or "---",
            "وضعیت": att.status
        })

    df = pd.DataFrame(data)

    # ADVANCED REPORT REQUIREMENT: Grouping logically by Employee, then sorted by Date
    df = df.sort_values(by=["نام کامل", "تاریخ"])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="راپور حاضری", freeze_panes=(1, 0))

        # Apply strict column widths to make it highly organized
        worksheet = writer.sheets["راپور حاضری"]
        for col in worksheet.columns:
            max_length = 0
            column = col[0].column_letter
            for cell in col:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            worksheet.column_dimensions[column].width = adjusted_width

    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename="SheenGhazy_AttendanceReport.xlsx"'
    }
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )


@app.post("/api/public/orders")
def create_public_order(order_req: PublicOrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.whatsapp_number == order_req.whatsappNumber).first()
    if not customer:
        customer = Customer(full_name=order_req.fullName, whatsapp_number=order_req.whatsappNumber,
                            address=order_req.address)
        db.add(customer)
        db.commit()
        db.refresh(customer)

    total_amount = 0
    new_order = Order(CustomerId=customer.id, status='PENDING')
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for item in order_req.items:
        product = db.query(Product).filter(Product.id == item.productId).first()
        if not product:
            continue
        order_item = OrderItem(OrderId=new_order.id, ProductId=product.id, quantity=item.quantity,
                               unit_price=product.current_price)
        db.add(order_item)
        total_amount += product.current_price * item.quantity

    new_order.total_amount = total_amount
    db.commit()
    return {"success": True, "orderId": new_order.id}


# --- Products ---
@app.get("/api/products")
@app.get("/api/public/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@app.post("/api/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.model_dump(exclude_unset=True))
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# --- Ledger (مصارف و درآمدها) ---
@app.get("/api/ledger")
def get_ledger(db: Session = Depends(get_db)):
    return db.query(Ledger).order_by(Ledger.date.desc()).limit(200).all()


@app.post("/api/ledger")
def create_ledger(expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_ledger = Ledger(
        type="EXPENSE",
        amount=expense.amount,
        description=expense.description,
        department=expense.department,
        date=datetime.datetime.utcnow()
    )
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    return db_ledger


# --- Employees (کارمندان) ---
@app.get("/api/employees")
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    results = []
    for emp in employees:
        emp_dict = emp.__dict__.copy()
        emp_dict.pop('_sa_instance_state', None)

        attendances = db.query(Attendance).filter(Attendance.EmployeeId == emp.id).all()
        emp_dict['Attendances'] = [
            {
                "id": a.id,
                "status": a.status,
                "date": a.date,
                "check_in": a.check_in,
                "check_out": a.check_out,
                "time": a.check_in  # Fallback for frontend
            } for a in attendances
        ]
        results.append(emp_dict)
    return results


@app.post("/api/employees")
def create_employee(emp: EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = Employee(**emp.model_dump(exclude_unset=True))
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp


# --- Production (تولیدات) ---
@app.get("/api/production")
def get_production(db: Session = Depends(get_db)):
    return db.query(Production).order_by(Production.date.desc()).all()


@app.post("/api/production")
def create_production(prod: ProductionCreate, db: Session = Depends(get_db)):
    db_prod = Production(
        ProductId=prod.ProductId,
        quantity_produced=prod.quantity_produced,
        raw_material_used=prod.raw_material_used,
        department=prod.department
    )
    db.add(db_prod)

    product = db.query(Product).filter(Product.id == prod.ProductId).first()
    if product:
        product.stock_quantity += prod.quantity_produced

    db.commit()
    db.refresh(db_prod)
    return db_prod


# --- Customers ---
@app.get("/api/customers")
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()


@app.post("/api/orders/direct")
def create_direct_sale(sale: DirectSaleCreate, db: Session = Depends(get_db)):
    total_amount = 0
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.ProductId).first()
        if not product or product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"موجودی ناکافی برای محصول {item.ProductId}")

        product.stock_quantity -= item.quantity
        total_amount += item.unit_price * item.quantity

    db_ledger = Ledger(
        type="INCOME",
        amount=total_amount,
        description="فروش مستقیم",
        department="GENERAL",
        date=datetime.datetime.utcnow()
    )
    db.add(db_ledger)

    customer = db.query(Customer).filter(Customer.id == sale.CustomerId).first()
    if customer:
        customer.total_spent += total_amount

    db.commit()
    return {"success": True, "total_amount": total_amount}
