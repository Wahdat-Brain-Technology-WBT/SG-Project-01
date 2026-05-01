import os
from sqlalchemy import text
from main import engine, Base


def reset_database():
    with engine.connect() as conn:
        print("Dropping all tables and resetting schema...")
        # چون PostgreSQL محدودیت روابط جدول‌ها را دارد، کل اسکیمای public را حذف و دوباره می‌سازیم
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()

        print("Recreating all tables with new columns...")
        Base.metadata.create_all(bind=engine)
        print("Database successfully reset!")


if __name__ == "__main__":
    confirm = input("ARE YOU SURE YOU WANT TO DELETE ALL DATA? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
        print("Done.")
    else:
        print("Operation cancelled.")