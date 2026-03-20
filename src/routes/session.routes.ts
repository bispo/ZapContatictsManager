import type { FastifyInstance } from 'fastify';
import { startSession, logoutSession } from '../session/baileys.js';
import { getConnectionState } from '../session/state.js';

export const registerSessionRoutes = (app: FastifyInstance): void => {
  app.post('/session/start', async (_, reply) => {
    const result = await startSession();
    return reply.send(result);
  });

  app.post('/session/logout', async (_, reply) => {
    await logoutSession();
    return reply.send({ state: 'disconnected' });
  });

  app.get('/session/status', async (_, reply) => {
    return reply.send({ state: getConnectionState() });
  });

  app.delete('/session', async (_, reply) => {
    await logoutSession();
    return reply.send({ state: 'disconnected' });
  });
};
