import {PrismaClient} from "./generated/prisma/client.js";
import {PrismaPg} from "@prisma/adapter-pg";
import pkg from 'pg';

const dbUrl = `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@localhost:5432/${process.env.DATABASE_DATABASE}?schema=public`

const { Pool } = pkg;
const pool = new Pool({connectionString: dbUrl});
const adapter = new PrismaPg(pool);

export const db = new PrismaClient({adapter})