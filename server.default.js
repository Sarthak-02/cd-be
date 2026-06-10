import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(__dirname, 'vidyaarohan-website', 'index.html'), 'utf-8');

const fastify = Fastify({
  logger: true
});

fastify.get('/*', async (request, reply) => {
  reply.type('text/html');
  return indexHtml;
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    const port = process.env.PORT || 8080;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
