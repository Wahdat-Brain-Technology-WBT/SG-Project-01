from database import engine, Base

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables from scratch...")
Base.metadata.create_all(bind=engine)

print("Database reset strictly successful!")