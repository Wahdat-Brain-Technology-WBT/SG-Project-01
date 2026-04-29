import os
from sqlalchemy import text
from main import engine, Base


def reset_database():
    with engine.connect() as conn:
        print("Dropping all tables...")
        # Since PostgreSQL has foreign key constraints, drop_all() can sometimes fail
        # The fastest and cleanest way in Postgres is to drop the schema and recreate it
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()

        print("Recreating all tables...")
        Base.metadata.create_all(bind=engine)
        print("Database successfully reset!")


if __name__ == "__main__":
    confirm = input("ARE YOU SURE YOU WANT TO DELETE ALL DATA? (y/n): ")
    if confirm.lower() == 'y':
        reset_database()
        print("Done.")
    else:
        print("Operation cancelled.")