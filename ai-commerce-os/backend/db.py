from prisma import Prisma

db = Prisma()


async def connect_db():
    if not db.is_connected():
        await db.connect()
        print("✅ Connected to database")


async def disconnect_db():
    if db.is_connected():
        await db.disconnect()
