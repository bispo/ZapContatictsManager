import type { Group } from '../types/group.types.js';
import { getSocket } from '../session/baileys.js';

export const listGroups = async (): Promise<Group[]> => {
  const sock = getSocket();

  if (!sock) {
    throw new Error('Sessao do WhatsApp nao iniciada.');
  }

  const chats = await sock.groupFetchAllParticipating();

  return Object.values(chats)
    .map((group) => ({
      id: group.id,
      name: group.subject || 'Sem nome',
      size: group.size || group.participants?.length || 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};
