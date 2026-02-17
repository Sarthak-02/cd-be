import dotenv from "dotenv";
import { buildUserfacingServer } from "./src/app/userfacing.app.js";

dotenv.config();

const startUserfacing = async () => {
  try {
    const PORT = Number(process.env.PORT || process.env.USERFACING_PORT) || 5001;
    const app = await buildUserfacingServer()
    const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    await app.listen({ port: PORT, host: HOST });
    console.log(`Userfacing server listening on ${HOST}:${PORT}`);
  } catch (err) {
    console.error("app failed to start", err);
    process.exit(1);
  }
};

startUserfacing();
