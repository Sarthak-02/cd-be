import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from './generated/index.js'
import dotenv from "dotenv";

dotenv.config();

// console.log(process.env)
const adapter = new PrismaMariaDb({
  host: "35.200.151.11",    // Public IP as string
  port: 3306,
  user: "sarthak",          // Must be string
  password: "Test#123",     // Must be string
  database: "school_db",
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

export { prisma };
