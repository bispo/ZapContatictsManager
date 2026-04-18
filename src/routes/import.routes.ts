import type { FastifyInstance } from 'fastify';
import { ImportContactsRequestSchema } from '../types/import.types.js';
import { importContactsFromCsv } from '../services/import-contacts.service.js';
import { getConnectionState } from '../session/state.js';

export const registerImportRoutes = (app: FastifyInstance): void => {
  app.post('/import/contacts', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = ImportContactsRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = importContactsFromCsv(parsed.data.csv);
      return reply.send(result);
    } catch (error) {
      return reply.code(400).send({
        message: error instanceof Error ? error.message : 'Falha ao importar CSV.'
      });
    }
  });
};
