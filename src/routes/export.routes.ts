import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { exportContactsFromGroups } from '../services/contacts.service.js';
import { getConnectionState } from '../session/state.js';

const bodySchema = z.object({
  groupJids: z.array(z.string()).min(1)
});

export const registerExportRoutes = (app: FastifyInstance): void => {
  app.post('/export', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = bodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    const { contacts, errors } = await exportContactsFromGroups(parsed.data.groupJids);

    const payload = {
      exportedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      totalGroupsRequested: parsed.data.groupJids.length,
      errors,
      contacts
    };

    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="contacts-export.json"');

    return reply.send(JSON.stringify(payload, null, 2));
  });
};
