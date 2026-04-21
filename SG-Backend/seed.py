from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import Product, Base
import os
from dotenv import load_dotenv

# بارگذاری متغیرهای محیطی
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/sheen_ghazy_erp")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()

# لیست محصولات نمونه برای کارخانه شین غزی بابا
sample_products = [
    Product(name="شیران یزد", category="PPRC", size="25mm", color="سفید", qty_per_carton=30, current_price=120.5, stock_quantity=500),
    Product(name="شیران یزد", category="PPRC", size="32mm", color="سفید", qty_per_carton=20, current_price=180.0, stock_quantity=300),
    Product(name="پایپ فشار قوی", category="PVC", size="110mm", color="خاکستری", qty_per_carton=1, current_price=850.0, stock_quantity=150),
    Product(name="زانو خم 90 درجه", category="Fittings", size="32mm", color="سفید", qty_per_carton=100, current_price=25.0, stock_quantity=2000),
    Product(name="پایپ فاضلاب", category="PVC", size="160mm", color="سفید", qty_per_carton=1, current_price=1200.0, stock_quantity=80),
    Product(name="سه راهی مساوی", category="Fittings", size="25mm", color="سبز", qty_per_carton=50, current_price=35.0, stock_quantity=1000),
]

# اضافه کردن محصولات به دیتابیس
added_count = 0
for p in sample_products:
    # بررسی اینکه آیا محصول قبلاً اضافه شده یا نه
    exists = db.query(Product).filter(Product.name == p.name, Product.size == p.size).first()
    if not exists:
        db.add(p)
        added_count += 1

db.commit()
db.close()

if added_count > 0:
    print(f"✅ تعداد {added_count} محصول با موفقیت به دیتابیس PostgreSQL اضافه شد!")
else:
    print("⚠️ این محصولات قبلاً در دیتابیس وجود داشتند.")