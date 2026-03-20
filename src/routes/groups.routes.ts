import type { FastifyInstance } from 'fastify';
import { listGroups } from '../services/groups.service.js';
import { getConnectionState } from '../session/state.js';

export const registerGroupsRoutes = (app: FastifyInstance): void => {
  app.get('/groups', async (_, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const groups = await listGroups();
    return reply.send({ groups });
  });
};
