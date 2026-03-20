import path from 'node:path';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { registerRoutes } from '../routes/index.js';
import { registerQrWsHandler } from '../ws/qr.handler.js';

export const buildServer = async () => {
  const app = fastify({ logger: true });

  await app.register(fastifyWebsocket);

  app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), 'public'),
    prefix: '/'
  });

  registerQrWsHandler(app);
  registerRoutes(app);

  app.get('/', async (_, reply) => {
    return reply.sendFile('index.html');
  });

  return app;
};
