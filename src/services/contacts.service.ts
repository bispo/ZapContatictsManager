import { getSocket } from '../session/baileys.js';
import type { Contact } from '../types/contact.types.js';
import { logger } from '../utils/logger.js';

type GroupError = {
  groupJid: string;
  message: string;
};

const normalizePhoneFromJid = (jid: string): string => {
  const userPart = jid.split('@')[0] ?? '';
  return userPart.replace(/\D/g, '');
};

export const exportContactsFromGroups = async (
  groupJids: string[]
): Promise<{ contacts: Contact[]; errors: GroupError[] }> => {
  const sock = getSocket();

  if (!sock) {
    throw new Error('Sessao do WhatsApp nao iniciada.');
  }

  const contactsMap = new Map<string, Contact>();
  const errors: GroupError[] = [];

  for (const groupJid of groupJids) {
    try {
      const metadata = await sock.groupMetadata(groupJid);
      const groupName = metadata.subject || groupJid;

      for (const participant of metadata.participants || []) {
        const jid = participant.id;

        if (!jid) {
          continue;
        }

        const existing = contactsMap.get(jid);

        if (existing) {
          if (!existing.groups.includes(groupName)) {
            existing.groups.push(groupName);
          }
          continue;
        }

        contactsMap.set(jid, {
          jid,
          phone: normalizePhoneFromJid(jid),
          groups: [groupName]
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push({ groupJid, message });
      logger.error(`Falha ao processar grupo ${groupJid}`, error);
    }
  }

  const contacts = Array.from(contactsMap.values()).sort((a, b) => a.phone.localeCompare(b.phone));

  return { contacts, errors };
};
