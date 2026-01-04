
import {Connector} from '@google-cloud/cloud-sql-connector';
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool = null;

// Create connection once during app start
export const initDB = async () => {
  if (pool) return pool; // already initialized

  const connector = new Connector();

  console.log(process.env)
  
  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    ipType: "PUBLIC"
  });

  
  pool = mysql.createPool({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: 10
  });

  console.log("✅ Database pool initialized");
  return pool;
};
