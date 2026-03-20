import type { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { onConnected, onQr } from '../session/baileys.js';
import { getConnectionState, getCurrentQr } from '../session/state.js';

type WsClient = {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  on: (event: 'close', listener: () => void) => void;
};

const isSocketOpen = (socket: WsClient): boolean => socket.readyState === 1;

const sendJson = (socket: WsClient, payload: unknown): void => {
  if (!isSocketOpen(socket)) {
    return;
  }

  socket.send(JSON.stringify(payload));
};

const sendQrPayload = async (socket: WsClient, qrText: string): Promise<void> => {
  const dataUrl = await QRCode.toDataURL(qrText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6
  });

  sendJson(socket, { type: 'qr', dataUrl });
};

export const registerQrWsHandler = (app: FastifyInstance): void => {
  app.get('/session/qr', { websocket: true }, (ws) => {
    if (getConnectionState() === 'connected') {
      sendJson(ws, { type: 'connected' });
      ws.close();
      return;
    }

    const currentQr = getCurrentQr();

    if (currentQr) {
      void sendQrPayload(ws, currentQr).catch((error: unknown) => {
        app.log.warn({ error }, 'Falha ao enviar QR atual via WebSocket');
      });
    } else {
      sendJson(ws, { type: 'waiting' });
    }

    const disposeQr = onQr((qr) => {
      void sendQrPayload(ws, qr).catch((error: unknown) => {
        app.log.warn({ error }, 'Falha ao enviar QR atualizado via WebSocket');
      });
    });

    const disposeConnected = onConnected(() => {
      sendJson(ws, { type: 'connected' });
      ws.close();
    });

    ws.on('close', () => {
      disposeQr();
      disposeConnected();
    });
  });
};
