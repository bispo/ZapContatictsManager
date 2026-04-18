import type { FastifyInstance } from 'fastify';
import { PreviewCampaignRequestSchema, SendCampaignRequestSchema } from '../types/import.types.js';
import { previewMessageCampaign, sendMessageCampaign } from '../services/message-campaign.service.js';
import { getConnectionState } from '../session/state.js';

export const registerMessageRoutes = (app: FastifyInstance): void => {
  app.post('/messages/preview', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = PreviewCampaignRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = previewMessageCampaign(
        parsed.data.contactsCsv,
        parsed.data.variablesCsv,
        parsed.data.template
      );

      return reply.send(result);
    } catch (error) {
      return reply.code(400).send({
        message: error instanceof Error ? error.message : 'Falha ao gerar previa da campanha.'
      });
    }
  });

  app.post('/messages/send', async (request, reply) => {
    if (getConnectionState() !== 'connected') {
      return reply.code(409).send({ message: 'Sessao nao autenticada.' });
    }

    const parsed = SendCampaignRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Payload invalido.',
        issues: parsed.error.flatten()
      });
    }

    try {
      const result = await sendMessageCampaign(
        parsed.data.contactsCsv,
        parsed.data.variablesCsv,
        parsed.data.template,
        parsed.data.rateDelayMs
      );

      return reply.send(result);
    } catch (error) {
      return reply.code(500).send({
        message: error instanceof Error ? error.message : 'Falha ao enviar campanha.'
      });
    }
  });
};
