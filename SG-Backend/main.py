import os
import datetime
import io
from collections import defaultdict
from typing import List, Optional, Any

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Date, ForeignKey, text, inspect
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ZKTeco and Pandas Imports
try:
    from zk import ZK, const
except ImportError:
    ZK = None

try:
    import pandas as pd
except ImportError:
    pd = None

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
    zkteco_id = Column(Integer, nullable=True, unique=True)  # ZKTeco ID Number
    full_name = Column(String, nullable=False)
    father_name = Column(String, nullable=True, default="-")  # ولد
    province = Column(String, nullable=True, default="-")  # ولایت
    position = Column(String, nullable=False)
    salary = Column(Float, nullable=False)
    phone = Column(String)
    hire_date = Column(Date, default=datetime.date.today)  # تاریخ ثبت نام
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SalaryAdvance(Base):
    __tablename__ = "SalaryAdvances"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, default=datetime.date.today)
    description = Column(String, nullable=True)
    EmployeeId = Column(Integer, ForeignKey("Employees.id"))
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)


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
    balance = Column(Float, default=0)  # Debt or Credit balance
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Order(Base):
    __tablename__ = "Orders"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="PENDING")
    order_type = Column(String, default="SALE")  # SALE or RETURN
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
    discount = Column(Float, default=0.0)
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
    deduction_amount = Column(Float, default=0)  # مبلغ کسر معاش در روز
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

        if "zkteco_id" not in employees_columns:
            try:
                conn.execute(text("ALTER TABLE \"Employees\" ADD COLUMN zkteco_id INTEGER UNIQUE"))
                conn.commit()
            except Exception as e:
                conn.rollback()
                print(f"Migration Notice (zkteco_id): {str(e)}")

        if inspector.has_table("Orders"):
            orders_columns = [col['name'] for col in inspector.get_columns("Orders")]
            if "order_type" not in orders_columns:
                try:
                    conn.execute(text("ALTER TABLE \"Orders\" ADD COLUMN order_type VARCHAR DEFAULT 'SALE'"))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration Notice (Orders order_type): {str(e)}")

        if inspector.has_table("OrderItems"):
            orderitems_columns = [col['name'] for col in inspector.get_columns("OrderItems")]
            if "discount" not in orderitems_columns:
                try:
                    conn.execute(text("ALTER TABLE \"OrderItems\" ADD COLUMN discount FLOAT DEFAULT 0.0"))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration Notice (OrderItems discount): {str(e)}")

        if inspector.has_table("Customers"):
            customers_columns = [col['name'] for col in inspector.get_columns("Customers")]
            if "balance" not in customers_columns:
                try:
                    conn.execute(text("ALTER TABLE \"Customers\" ADD COLUMN balance FLOAT DEFAULT 0.0"))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration Notice (Customers balance): {str(e)}")

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

            if "deduction_amount" not in attendances_columns:
                try:
                    conn.execute(text("ALTER TABLE \"Attendances\" ADD COLUMN deduction_amount FLOAT DEFAULT 0.0"))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Migration Notice (deduction_amount): {str(e)}")


# اجرای مایگریشن‌ها قبل از ایجاد جداول
print("--- Checking Database Connection & Running Migrations ---")
try:
    with engine.connect() as conn:
        print("--- Database connection SUCCESSFUL! ---")
    upgrade_database_schema(engine)
    # ساخت تمام جداول در دیتابیس
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(
        f"\n!!!! DATABASE CONNECTION ERROR !!!!\nخطا در اتصال به دیتابیس PostgreSQL: {str(e)}\nلطفاً مطمئن شوید که سرویس PostgreSQL روشن است و نام کاربری/رمز عبور صحیح است.\n")


def init_default_admin():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Creating default admin user...")
            hashed_pw = get_password_hash("admin123") if 'get_password_hash' in globals() else "admin123"
            new_admin = User(username="admin", password_hash=hashed_pw, role="CEO_SUPERADMIN")
            db.add(new_admin)
            db.commit()
    except Exception as e:
        print("Error creating default admin:", e)
    finally:
        db.close()


try:
    from passlib.context import CryptContext
    import jwt
except ImportError:
    CryptContext = None
    jwt = None

# تنظیمات امنیت (JWT)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-sheen-ghazy-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # One day

if CryptContext:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
else:
    pwd_context = None


def verify_password(plain_password, hashed_password):
    if pwd_context:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback for plain text stored passwords
            return plain_password == hashed_password
    return plain_password == hashed_password


def get_password_hash(password):
    if pwd_context:
        return pwd_context.hash(password)
    return password


# Initialize admin now that hashing functions are defined
init_default_admin()


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    if jwt:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    return "fake-jwt-token"


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
    zkteco_id: Optional[int] = None


class SalaryAdvanceCreate(BaseModel):
    amount: float
    date: str
    description: Optional[str] = None


class ProductionCreate(BaseModel):
    ProductId: int
    quantity_produced: int
    raw_material_used: float
    department: str = "PIPE"


class DirectSaleItem(BaseModel):
    ProductId: int
    quantity: int
    unit_price: float
    discount: float = 0.0


class DirectSaleCreate(BaseModel):
    CustomerId: Optional[int] = None
    CustomerName: Optional[str] = None
    notes: Optional[str] = None
    received_amount: float = 0.0
    order_type: str = "SALE"
    admin_password: Optional[str] = None
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
def chat_endpoint(request: ChatRequest):
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
                model="gemini-2.5-flash",
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
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                return {
                    "reply": "متاسفانه سهمیه استفاده از هوش مصنوعی پایان یافته است (خطای 429). لطفاً مدتی بعد تلاش کنید یا برای مراجعات فوری مستقیماً تماس بگیرید."}
            raise api_error

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not jwt:
        return User(username="fallback_user", role="ADMIN")  # fallback if jwt not installed

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=400, detail="نام کاربری یا رمز عبور اشتباه است")

    # در محیط واقعی، پسورد باید با verify_password چک شود
    # برای جلوگیری از قفل شدن شما در حال حاضر، اگر پسورد هش نشده باشد، مسقیم چک میکنیم
    is_valid = verify_password(req.password, user.password_hash) if pwd_context else (
                req.password == user.password_hash)

    if not is_valid and user.password_hash != req.password:
        raise HTTPException(status_code=400, detail="نام کاربری یا رمز عبور اشتباه است")

    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"token": access_token, "role": user.role}


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


@app.delete("/api/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    db.delete(db_product)
    db.commit()
    return {"message": "محصول با موفقیت حذف شد"}


@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.id.desc()).all()
    result = []
    for order in orders:
        customer = db.query(Customer).filter(Customer.id == order.CustomerId).first()
        items = db.query(OrderItem).filter(OrderItem.OrderId == order.id).all()

        result.append({
            "id": order.id,
            "status": order.status,
            "order_type": getattr(order, 'order_type', 'SALE'),
            "total_amount": order.total_amount,
            "date": order.date,
            "createdAt": order.createdAt,
            "CustomerId": order.CustomerId,
            "Customer": {"id": customer.id, "full_name": customer.full_name,
                         "whatsapp_number": getattr(customer, 'whatsapp_number', '')} if customer else None,
            "items": [
                {
                    "id": i.id,
                    "ProductId": i.ProductId,
                    "quantity": i.quantity,
                    "unit_price": i.unit_price,
                    "discount": getattr(i, 'discount', 0),
                    "Product": {"id": i.ProductId,
                                "name": db.query(Product).filter(Product.id == i.ProductId).first().name if db.query(
                                    Product).filter(Product.id == i.ProductId).first() else "Unknown"}
                } for i in items
            ]
        })
    return result


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
    device_ip: str = "192.168.50.200"


@app.post("/api/attendance/sync")
def sync_zkteco(req: SyncRequest = None, db: Session = Depends(get_db)):
    """
    Connect to ZKTeco K70 device to fetch attendance records
    """
    device_ip = req.device_ip if req and req.device_ip else "192.168.50.200"

    zk_client = ZK(device_ip, port=4370, timeout=10, password=0, force_udp=False, ommit_ping=False)

    try:
        conn = zk_client.connect()
        conn.disable_device()  # قفل دستگاه در حین دانلود اطلاعات

        attendances = conn.get_attendance()  # دریافت لاگ‌ها

        conn.enable_device()
        conn.disconnect()

        print(f"Total attendance records fetched: {len(attendances) if attendances else 0}")

        if not attendances:
            return {"success": True, "message": "هیچ رکورد حاضری در دستگاه یافت نشد.", "records_added": 0}

        records_added = 0
        records_updated = 0

        daily_records = defaultdict(lambda: defaultdict(list))

        for att in attendances:
            try:
                # Strip spaces and null bytes which sometimes come from ZKTeco
                cleaned_user_id = str(att.user_id).strip('\x00').strip()
                emp_id = int(cleaned_user_id)
            except ValueError:
                print(f"Warning: Could not parse ZKTeco user_id '{att.user_id}' as int.")
                continue

            date_str = att.timestamp.strftime("%Y-%m-%d")
            daily_records[emp_id][date_str].append(att.timestamp)

        print(f"Daily records mapped for employee IDs: {list(daily_records.keys())}")

        for emp_id, dates in daily_records.items():
            emp = db.query(Employee).filter((Employee.zkteco_id == emp_id) | (Employee.id == emp_id)).first()
            if not emp:
                print(f"Warning: Employee with ZKTeco ID {emp_id} not found in DB.")
                continue

            # Daily salary = salary / 30
            # Hourly salary = Daily salary / 11 (6 AM to 5 PM is 11 hours)
            daily_salary = emp.salary / 30.0 if emp.salary else 0
            hourly_salary = daily_salary / 11.0

            for date_str, timestamps in dates.items():
                timestamps.sort()

                check_in_dt = timestamps[0]
                check_out_dt = timestamps[-1] if len(timestamps) > 1 else None

                check_in_str = check_in_dt.strftime("%I:%M %p")
                check_out_str = check_out_dt.strftime("%I:%M %p") if check_out_dt else None

                # Check lateness based on 6:00 AM shift start
                status = "PRESENT"
                deduction = 0.0
                late_hours = 0.0

                start_shift_time = check_in_dt.replace(hour=6, minute=0, second=0)
                end_shift_time = check_in_dt.replace(hour=17, minute=0, second=0)

                if check_in_dt > start_shift_time:
                    diff = check_in_dt - start_shift_time
                    minutes_late = diff.total_seconds() / 60
                    if minutes_late > 30:  # 30 min grace period
                        status = "LATE"
                        late_hours += minutes_late / 60.0

                if check_out_dt and check_out_dt < end_shift_time:
                    diff2 = end_shift_time - check_out_dt
                    minutes_early = diff2.total_seconds() / 60
                    late_hours += minutes_early / 60.0
                elif not check_out_dt:
                    # No check out yet! But maybe they just arrived.
                    # We should check if it's the end of day before deducting.
                    # If this is past dates, then penalize
                    if (datetime.datetime.now() - check_in_dt).days > 0:
                        # missed checking out yesterday
                        diff2 = end_shift_time - check_in_dt  # Only checked in
                        minutes_early = max(0, diff2.total_seconds() / 60)
                        late_hours += minutes_early / 60.0

                deduction = late_hours * hourly_salary

                db_att = db.query(Attendance).filter(
                    Attendance.EmployeeId == emp.id,
                    Attendance.date == date_str
                ).first()

                if db_att:
                    updated = False
                    if not db_att.check_in or db_att.check_in != check_in_str:
                        db_att.check_in = check_in_str
                        updated = True
                    if check_out_str and (not db_att.check_out or db_att.check_out != check_out_str):
                        db_att.check_out = check_out_str
                        updated = True

                    if db_att.status in ["ABSENT", "PRESENT"] and status == "LATE":
                        db_att.status = status
                        updated = True

                    if deduction > 0 and db_att.deduction_amount != deduction:
                        db_att.deduction_amount = deduction
                        updated = True

                    if updated:
                        records_updated += 1
                else:
                    new_att = Attendance(
                        EmployeeId=emp.id,
                        date=date_str,
                        check_in=check_in_str,
                        check_out=check_out_str,
                        status=status,
                        deduction_amount=deduction
                    )
                    db.add(new_att)
                    records_added += 1

        db.commit()

        msg = f"همگام‌سازی با موفقیت انجام شد. ({records_added} ورودی جدید، {records_updated} بروزرسانی)"
        if records_added == 0 and records_updated == 0:
            return {"success": True, "message": "عملیات موفق اما اطلاعات جدیدی یافت نشد."}
        return {"success": True, "message": msg, "records_added": records_added}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"ارتباط با دستگاه ناموفق بود: {str(e)}")


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
            "ID دستگاه حاضری": emp.zkteco_id or "ثبت نشده",
            "نام سیستم": emp.full_name,
            "ولد": emp.father_name or "-",
            "ولایت": emp.province or "-",
            "وظیفه": emp.position,
            "معاش ماهانه": emp.salary,
            "تاریخ استخدام": emp.hire_date,
            "تاریخ حاضری": att.date,
            "ساعت ورود": att.check_in or "---",
            "ساعت خروج": att.check_out or "---",
            "وضعیت": att.status,
            "مبلغ کسر (AFN)": att.deduction_amount if att.deduction_amount else 0

        })

    df = pd.DataFrame(data)

    # ADVANCED REPORT REQUIREMENT: Grouping logically by Employee, then sorted by Date
    df = df.sort_values(by=["نام سیستم", "تاریخ حاضری"])

    # Fetch all advances for this month
    advances_data = db.query(SalaryAdvance, Employee).join(Employee, SalaryAdvance.EmployeeId == Employee.id).all()

    summary_data = {}
    for att, emp in attendances:
        if emp.id not in summary_data:
            summary_data[emp.id] = {
                "ID": emp.id,
                "ZKTeco ID": emp.zkteco_id or "-",
                "نام سیستم": emp.full_name,
                "معاش ماهانه": float(emp.salary),
                "تعداد روزهای حاضر": 0,
                "تعداد روزهای غایب": 0,
                "مجموع کسر از بابت تاخیر/غیابت": 0.0,
                "مجموع مساعده گرفته شده": 0.0,
            }

        if att.status in ["PRESENT", "LATE"]:
            summary_data[emp.id]["تعداد روزهای حاضر"] += 1
        elif att.status == "ABSENT":
            summary_data[emp.id]["تعداد روزهای غایب"] += 1

        summary_data[emp.id]["مجموع کسر از بابت تاخیر/غیابت"] += float(att.deduction_amount or 0)

    for adv, emp in advances_data:
        if emp.id in summary_data:
            summary_data[emp.id]["مجموع مساعده گرفته شده"] += float(adv.amount)

    for sid, sdata in summary_data.items():
        sdata["قابض (باقیمانده معاش)"] = sdata["معاش ماهانه"] - sdata["مجموع کسر از بابت تاخیر/غیابت"] - sdata[
            "مجموع مساعده گرفته شده"]

    df_summary = pd.DataFrame(list(summary_data.values()))

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df_summary.to_excel(writer, index=False, sheet_name="خلاصه معاشات", freeze_panes=(1, 0))
        df.to_excel(writer, index=False, sheet_name="راپور حاضری", freeze_panes=(1, 0))

        # Apply strict column widths to make it highly organized
        for sheet_name in ["خلاصه معاشات", "راپور حاضری"]:
            worksheet = writer.sheets[sheet_name]
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
    print(f"--- Reached create_employee with data: {emp.model_dump()} ---")
    try:
        db_emp = Employee(**emp.model_dump(exclude_unset=True))
        db.add(db_emp)
        db.commit()
        db.refresh(db_emp)
        print(f"--- Successfully created employee with ID: {db_emp.id} ---")
        return db_emp
    except Exception as e:
        db.rollback()
        print(f"--- Error creating employee: {str(e)} ---")
        raise HTTPException(status_code=400,
                            detail=f"خطا در ذخیره اطلاعات (شاید ID دستگاه حاضری یا نام تکراری باشد): {str(e)}")


@app.delete("/api/employees/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Delete associated records FIRST to avoid foreign key constraints
    db.query(Attendance).filter(Attendance.EmployeeId == emp_id).delete()

    db.delete(emp)
    db.commit()
    return {"success": True, "message": "Employee deleted"}


@app.post("/api/employees/{emp_id}/advances")
def create_salary_advance(emp_id: int, advance: SalaryAdvanceCreate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    db_adv = SalaryAdvance(
        EmployeeId=emp_id,
        amount=advance.amount,
        date=advance.date,
        description=advance.description
    )
    db.add(db_adv)
    db.commit()
    db.refresh(db_adv)
    return db_adv


@app.get("/api/employees/{emp_id}/advances")
def get_salary_advances(emp_id: int, db: Session = Depends(get_db)):
    return db.query(SalaryAdvance).filter(SalaryAdvance.EmployeeId == emp_id).order_by(SalaryAdvance.date.desc()).all()


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
    total_discount = 0

    # Calculate totals & stock adjust
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.ProductId).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"محصول یافت نشد: {item.ProductId}")

        if sale.order_type == "SALE" and product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"موجودی ناکافی برای محصول {item.ProductId}")

        line_total = item.unit_price * item.quantity
        line_discount = line_total * (item.discount / 100.0)
        total_amount += (line_total - line_discount)
        total_discount += line_discount

    # 1. Provide a dummy customer if none selected (for the notes/name info)
    cust_id = sale.CustomerId
    if not cust_id and sale.CustomerName:
        # Check if dummy customer exists or create one
        dummy = db.query(Customer).filter(Customer.full_name == sale.CustomerName).first()
        if not dummy:
            dummy = Customer(full_name=sale.CustomerName, whatsapp_number="000")
            db.add(dummy)
            db.flush()
        cust_id = dummy.id

    # 2. Create Order
    new_order = Order(
        status="COMPLETED",
        order_type=sale.order_type,
        total_amount=total_amount,
        CustomerId=cust_id,
        date=datetime.datetime.utcnow()
    )
    db.add(new_order)
    db.flush()  # To get new_order.id

    # 3. Create Items and update stock
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.ProductId).first()

        if sale.order_type == "RETURN":
            product.stock_quantity += item.quantity
        else:
            product.stock_quantity -= item.quantity

        db_item = OrderItem(
            quantity=item.quantity,
            unit_price=item.unit_price,
            OrderId=new_order.id,
            ProductId=item.ProductId
        )
        if hasattr(OrderItem, 'discount'):
            db_item.discount = item.discount
        db.add(db_item)

    # 4. Add ledger (income for sale, expense for return refund)
    if sale.received_amount > 0:
        if sale.order_type == "RETURN":
            db_ledger_expense = Ledger(
                type="EXPENSE",
                amount=sale.received_amount,
                description=f"پرداخت نقدی بابت مستردات بیل #{new_order.id}" + (
                    f" - {sale.notes}" if sale.notes else ""),
                department="GENERAL",
                date=datetime.datetime.utcnow(),
                order_id=new_order.id
            )
            db.add(db_ledger_expense)
        else:
            db_ledger_income = Ledger(
                type="INCOME",
                amount=sale.received_amount,
                description=f"دریافت نقدی بابت بیل #{new_order.id}" + (f" - {sale.notes}" if sale.notes else ""),
                department="GENERAL",
                date=datetime.datetime.utcnow(),
                order_id=new_order.id
            )
            db.add(db_ledger_income)

    # 5. Update Customer Balance (Debt)
    if cust_id:
        customer = db.query(Customer).filter(Customer.id == cust_id).first()
        if customer:
            if sale.order_type == "RETURN":
                refund_balance = total_amount - sale.received_amount
                # It means we owe them total_amount, we paid received_amount, remaining we owe is deducted from their total debt
                customer.balance = getattr(customer, "balance", 0.0) - refund_balance
            else:
                debt = total_amount - sale.received_amount
                # add the debt to total_spent (or balance if it exists)
                customer.total_spent = getattr(customer, "total_spent", 0.0) + debt
                customer.balance = getattr(customer, "balance", 0.0) + debt

    db.commit()
    return {"success": True, "total_amount": total_amount, "order_id": new_order.id}


@app.put("/api/orders/{order_id}")
def update_order(order_id: int, sale: DirectSaleCreate, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    # 1. Authorize Admin Edit
    if current_user.role != "ADMIN":
        admin = db.query(User).filter(User.role == "ADMIN").first()
        if admin and sale.admin_password:
            is_valid = verify_password(sale.admin_password, admin.password_hash) if pwd_context else (
                        sale.admin_password == admin.password_hash)
            if not is_valid and admin.password_hash != sale.admin_password:
                raise HTTPException(status_code=403, detail="رمز عبور مقام صلاحیت‌دار (ریس شرکت) اشتباه است")
        elif admin:
            raise HTTPException(status_code=403,
                                detail="برای ویرایش بیل مستردات، تاییدیه مقام صلاحیت‌دار (رمز عبور ریس شرکت) الزامی است")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="بیل یافت نشد")

    # 2. Revert previous ledger and customer balance
    old_ledgers = db.query(Ledger).filter(Ledger.order_id == order_id).all()
    old_received = sum(l.amount for l in old_ledgers)
    old_total = order.total_amount

    if order.CustomerId:
        old_customer = db.query(Customer).filter(Customer.id == order.CustomerId).first()
        if old_customer:
            # Reverse previous operations
            if order.order_type == "RETURN":
                old_refund_balance = old_total - old_received
                old_customer.balance = getattr(old_customer, "balance", 0.0) + old_refund_balance
            else:
                old_debt = old_total - old_received
                old_customer.total_spent = getattr(old_customer, "total_spent", 0.0) - old_debt
                old_customer.balance = getattr(old_customer, "balance", 0.0) - old_debt

    for old_l in old_ledgers:
        db.delete(old_l)

    # 3. Revert old stock based on old items
    old_items = db.query(OrderItem).filter(OrderItem.OrderId == order_id).all()
    for old_item in old_items:
        prod = db.query(Product).filter(Product.id == old_item.ProductId).first()
        if prod:
            if order.order_type == "RETURN":
                prod.stock_quantity -= old_item.quantity
            else:
                prod.stock_quantity += old_item.quantity
        db.delete(old_item)

    db.flush()

    total_amount = 0
    total_discount = 0

    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.ProductId).first()
        if not product:
            raise HTTPException(status_code=404, detail="محصول یافت نشد")
        if sale.order_type == "SALE" and product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"موجودی ناکافی برای محصول {item.ProductId}")

        line_total = item.unit_price * item.quantity
        line_discount = line_total * (item.discount / 100.0)
        total_amount += (line_total - line_discount)
        total_discount += line_discount

        if sale.order_type == "RETURN":
            product.stock_quantity += item.quantity
        else:
            product.stock_quantity -= item.quantity

        db_item = OrderItem(
            quantity=item.quantity,
            unit_price=item.unit_price,
            OrderId=order.id,
            ProductId=item.ProductId
        )
        if hasattr(OrderItem, 'discount'):
            db_item.discount = item.discount
        db.add(db_item)

    order.total_amount = total_amount
    order.order_type = sale.order_type

    if sale.CustomerId:
        order.CustomerId = sale.CustomerId
    elif sale.CustomerName:
        dummy = db.query(Customer).filter(Customer.full_name == sale.CustomerName).first()
        if not dummy:
            dummy = Customer(full_name=sale.CustomerName, whatsapp_number="000")
            db.add(dummy)
            db.flush()
        order.CustomerId = dummy.id

    # 4. Insert new Ledger entries
    if sale.received_amount > 0:
        if sale.order_type == "RETURN":
            db_ledger_expense = Ledger(
                type="EXPENSE",
                amount=sale.received_amount,
                description=f"پرداخت نقدی بابت ویرایش مستردات بیل #{order.id}" + (
                    f" - {sale.notes}" if sale.notes else ""),
                department="GENERAL",
                date=datetime.datetime.utcnow(),
                order_id=order.id
            )
            db.add(db_ledger_expense)
        else:
            db_ledger_income = Ledger(
                type="INCOME",
                amount=sale.received_amount,
                description=f"دریافت نقدی بابت ویرایش فاکتور #{order.id}" + (f" - {sale.notes}" if sale.notes else ""),
                department="GENERAL",
                date=datetime.datetime.utcnow(),
                order_id=order.id
            )
            db.add(db_ledger_income)

    # 5. Apply new debts to customer
    if order.CustomerId:
        new_customer = db.query(Customer).filter(Customer.id == order.CustomerId).first()
        if new_customer:
            if sale.order_type == "RETURN":
                new_refund_balance = total_amount - sale.received_amount
                new_customer.balance = getattr(new_customer, "balance", 0.0) - new_refund_balance
            else:
                new_debt = total_amount - sale.received_amount
                new_customer.total_spent = getattr(new_customer, "total_spent", 0.0) + new_debt
                new_customer.balance = getattr(new_customer, "balance", 0.0) + new_debt

    db.commit()
    return {"success": True, "message": "بیل با موفقیت ویرایش و حسابات تنظیم شد", "order_id": order.id}


if __name__ == "__main__":
    import uvicorn

    # تغییر هاست به 0.0.0.0 تا بتوان از دستگاه‌های دیگر (تلفن همراه، کامپیوترهای شبکه) به آن متصل شد.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
