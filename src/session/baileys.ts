import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
  type WASocket
} from 'baileys';
import { Boom } from '@hapi/boom';
import {
  getConnectionState,
  getSessionStarting,
  setConnectionState,
  setCurrentQr,
  setSessionStarting
} from './state.js';
import { logger } from '../utils/logger.js';

type QrListener = (qr: string) => void;
type ConnectedListener = () => void;

const qrListeners = new Set<QrListener>();
const connectedListeners = new Set<ConnectedListener>();

let sock: WASocket | null = null;
let isInitializing = false;

const notifyQr = (qr: string): void => {
  qrListeners.forEach((listener) => listener(qr));
};

const notifyConnected = (): void => {
  connectedListeners.forEach((listener) => listener());
};

export const onQr = (listener: QrListener): (() => void) => {
  qrListeners.add(listener);
  return () => qrListeners.delete(listener);
};

export const onConnected = (listener: ConnectedListener): (() => void) => {
  connectedListeners.add(listener);
  return () => connectedListeners.delete(listener);
};

export const getSocket = (): WASocket | null => sock;

const shouldReconnect = (lastDisconnectError: unknown): boolean => {
  const statusCode = (lastDisconnectError as Boom | undefined)?.output?.statusCode;
  return statusCode !== DisconnectReason.loggedOut;
};

const startInternal = async (): Promise<void> => {
  if (isInitializing) {
    return;
  }

  isInitializing = true;
  setSessionStarting(true);

  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ['WhatsApp Group Exporter', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        setConnectionState('awaiting_qr');
        setCurrentQr(qr);
        notifyQr(qr);
      }

      if (connection === 'open') {
        setConnectionState('connected');
        setCurrentQr(null);
        setSessionStarting(false);
        notifyConnected();
        logger.info('Sessao WhatsApp autenticada.');
      }

      if (connection === 'close') {
        setConnectionState('disconnected');
        setSessionStarting(false);
        setCurrentQr(null);

        if (shouldReconnect(lastDisconnect?.error)) {
          logger.warn('Conexao encerrada. Tentando reconectar...');
          await startInternal();
        } else {
          sock = null;
          logger.warn('Sessao desconectada por logout.');
        }
      }
    });
  } catch (error) {
    setSessionStarting(false);
    setConnectionState('disconnected');
    logger.error('Falha ao iniciar sessao do WhatsApp.', error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const startSession = async (): Promise<{ state: string }> => {
  if (getConnectionState() === 'connected' || getSessionStarting()) {
    return { state: getConnectionState() };
  }

  await startInternal();
  return { state: getConnectionState() };
};
