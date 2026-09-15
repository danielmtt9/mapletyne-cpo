#!/usr/bin/env python3
"""CLI utility to reset/update OpenCPO admin password."""
import asyncio
import sys
import bcrypt

async def update_password(email: str, new_password: str):
    from state.postgres import db
    await db.connect()
    async with db.write() as conn:
        pw_hash = bcrypt.hashpw(new_password.strip().encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        res = await conn.execute(
            """
            UPDATE ocpp.users
            SET password_hash = $1
            WHERE email = $2
            """,
            pw_hash,
            email.strip().lower()
        )
        print(f"Updated password for {email}: {res}")
    await db.close()

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "daniel.a@mapletynetechnologies.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "ZPn2bUrFWu2@tyYU"
    asyncio.run(update_password(email, password))
