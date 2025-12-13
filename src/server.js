import app from './app.js'
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 5001;

const start = async () => {
  try {
    // await app.listen({ port: PORT, host: "localhost" }); //for local dev
    await app.listen({ port: PORT, host: "0.0.0.0" }); //for render.com
  } catch (err) {
    console.error("app failed to start", err);
    process.exit(1);
  }
};

start();
