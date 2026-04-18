import type { FastifyInstance } from 'fastify';
import { ExportValidContactsRequestSchema, PrepareTransmissionRequestSchema } from '../types/import.types.js';
import { buildValidContactsExport, prepareTransmissionContacts } from '../services/transmission.service.js';
import { getConnectionState } from '../session/state.js';

export const registerTransmissionRoutes = (app: FastifyInstance): void => {
  app.post('/transmission/prepare', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = PrepareTransmissionRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await prepareTransmissionContacts(parsed.data.contacts);
      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        message: error instanceof Error ? error.message : 'Falha ao preparar transmissao.'
      });
    }
  });

  app.post('/transmission/export-valid', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = ExportValidContactsRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = buildValidContactsExport(parsed.data.contacts, parsed.data.format);
      reply.header('Content-Type', result.contentType);
      reply.header('Content-Disposition', `attachment; filename="${result.fileName}"`);
      return reply.send(result.body);
    } catch (error) {
      return reply.code(400).send({
        message: error instanceof Error ? error.message : 'Falha ao exportar contatos validos.'
      });
    }
  });
};
