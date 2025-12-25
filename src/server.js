import dotenv from "dotenv";
import { buildOperatorServer } from './app/onboarding.app.js';

dotenv.config();

const startOnboarding = async () => {
  try {
    const PORT = Number(process.env.PORT) || 5001;
    const app = await buildOperatorServer()
    // await app.listen({ port: PORT, host: "localhost" }); //for local dev
    app.listen({ port: PORT, host: "0.0.0.0" }); //for render.com
  } catch (err) {
    console.error("app failed to start", err);
    process.exit(1);
  }
};

startOnboarding()
