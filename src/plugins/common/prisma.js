import fp from "fastify-plugin";
import {prisma} from '../../prisma/prisma.js'

async function prismaPlugin(fastify) {
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(prismaPlugin);
