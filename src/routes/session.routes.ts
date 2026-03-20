import type { FastifyInstance } from 'fastify';
import { startSession } from '../session/baileys.js';
import { getConnectionState } from '../session/state.js';

export const registerSessionRoutes = (app: FastifyInstance): void => {
  app.post('/session/start', async (_, reply) => {
    const result = await startSession();
    return reply.send(result);
  });

  app.get('/session/status', async (_, reply) => {
    return reply.send({ state: getConnectionState() });
  });
};
