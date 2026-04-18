import { getSocket } from '../session/baileys.js';
import type { ExportValidContactsRequest, ImportedContact, TransmissionContactInput } from '../types/import.types.js';
import { csvEscape } from './csv.service.js';
import { logger } from '../utils/logger.js';

type PrepareTransmissionResult = {
  summary: {
    totalContacts: number;
    verifiedContacts: number;
    whatsappValidContacts: number;
    whatsappInvalidContacts: number;
    whatsappErrorContacts: number;
    unsupportedContacts: number;
  };
  contacts: ImportedContact[];
  validContacts: ImportedContact[];
  validContactsCsv: string;
  validContactsJson: string;
  unsupported: boolean;
  message: string;
};

type OnWhatsAppResult = {
  exists?: boolean;
  jid?: string;
  lid?: string;
};

type VerifiableSocket = {
  onWhatsApp?: (phone: string) => Promise<OnWhatsAppResult[]>;
};

const buildValidContactsCsv = (contacts: ImportedContact[]): string => {
  const lines = ['Number,Name,JID'];

  for (const contact of contacts) {
    lines.push(
      [csvEscape(contact.normalizedNumber), csvEscape(contact.name), csvEscape(contact.whatsappJid ?? '')].join(',')
    );
  }

  return lines.join('\n');
};

const buildValidContactsPayload = (contacts: ImportedContact[]) => ({
  exportedAt: new Date().toISOString(),
  totalValidContacts: contacts.length,
  contacts: contacts.map((contact) => ({
    rowNumber: contact.rowNumber,
    name: contact.name,
    normalizedNumber: contact.normalizedNumber,
    whatsappJid: contact.whatsappJid
  }))
});

export const buildValidContactsExport = (
  contacts: ExportValidContactsRequest['contacts'],
  format: ExportValidContactsRequest['format']
): { contentType: string; fileName: string; body: string } => {
  const validContacts = contacts.filter((contact) => contact.whatsappStatus === 'valid');

  if (validContacts.length === 0) {
    throw new Error('Nao ha contatos validados no WhatsApp para exportar.');
  }

  if (format === 'csv') {
    return {
      contentType: 'text/csv; charset=utf-8',
      fileName: 'validated-contacts.csv',
      body: buildValidContactsCsv(validContacts)
    };
  }

  return {
    contentType: 'application/json; charset=utf-8',
    fileName: 'validated-contacts.json',
    body: JSON.stringify(buildValidContactsPayload(validContacts), null, 2)
  };
};

export const prepareTransmissionContacts = async (
  contacts: TransmissionContactInput[]
): Promise<PrepareTransmissionResult> => {
  const sock = getSocket();

  if (!sock) {
    throw new Error('Sessao do WhatsApp nao iniciada.');
  }

  const verifier = (sock as unknown as VerifiableSocket).onWhatsApp;
  const unsupported = typeof verifier !== 'function';
  const preparedContacts: ImportedContact[] = [];

  if (unsupported) {
    for (const contact of contacts) {
      preparedContacts.push({
        ...contact,
        status: 'valid',
        reason: 'Verificacao automatica indisponivel nesta sessao/Baileys.',
        whatsappStatus: 'unsupported'
      });
    }
  } else {
    for (const contact of contacts) {
      try {
        const result = await verifier(contact.normalizedNumber);
        const match = result[0];

        if (match?.exists) {
          preparedContacts.push({
            ...contact,
            status: 'valid',
            whatsappStatus: 'valid',
            whatsappJid: match.jid ?? match.lid
          });
        } else {
          preparedContacts.push({
            ...contact,
            status: 'valid',
            reason: 'Numero nao encontrado no WhatsApp.',
            whatsappStatus: 'not_found'
          });
        }
      } catch (error) {
        logger.warn(`Falha ao verificar contato da linha ${contact.rowNumber}.`, error);
        preparedContacts.push({
          ...contact,
          status: 'valid',
          reason: 'Erro ao verificar numero no WhatsApp.',
          whatsappStatus: 'error'
        });
      }
    }
  }

  const validContacts = preparedContacts.filter((contact) => contact.whatsappStatus === 'valid');

  const summary = {
    totalContacts: preparedContacts.length,
    verifiedContacts: preparedContacts.filter((contact) => contact.whatsappStatus !== 'pending').length,
    whatsappValidContacts: validContacts.length,
    whatsappInvalidContacts: preparedContacts.filter((contact) => contact.whatsappStatus === 'not_found').length,
    whatsappErrorContacts: preparedContacts.filter((contact) => contact.whatsappStatus === 'error').length,
    unsupportedContacts: preparedContacts.filter((contact) => contact.whatsappStatus === 'unsupported').length
  };

  return {
    summary,
    contacts: preparedContacts,
    validContacts,
    validContactsCsv: buildValidContactsCsv(validContacts),
    validContactsJson: JSON.stringify(buildValidContactsPayload(validContacts), null, 2),
    unsupported,
    message: unsupported
      ? 'Verificacao automatica indisponivel nesta sessao. Nao ha exportacao de contatos validos para envio.'
      : `Contatos verificados. ${validContacts.length} contatos validos podem seguir para o fluxo de envio.`
  };
};
