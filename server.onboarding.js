import dotenv from "dotenv";
import { buildOperatorServer } from './src/app/onboarding.app.js';

dotenv.config();

const startOnboarding = async () => {
  try {
    const PORT = Number(process.env.PORT || process.env.ONBOARDING_PORT) || 5000;
    const app = await buildOperatorServer()
    const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    await app.listen({ port: PORT, host: HOST });
    console.log(`Onboarding server listening on ${HOST}:${PORT}`);
  } catch (err) {
    console.error("app failed to start", err);
    process.exit(1);
  }
};

startOnboarding();
