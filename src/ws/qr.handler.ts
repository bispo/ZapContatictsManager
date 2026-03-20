import type { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { onConnected, onQr } from '../session/baileys.js';
import { getConnectionState, getCurrentQr } from '../session/state.js';

const sendJson = (socket: { send: (data: string) => void }, payload: unknown): void => {
  socket.send(JSON.stringify(payload));
};

const sendQrPayload = async (
  socket: { send: (data: string) => void },
  qrText: string
): Promise<void> => {
  const dataUrl = await QRCode.toDataURL(qrText, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6
  });

  sendJson(socket, { type: 'qr', dataUrl });
};

export const registerQrWsHandler = (app: FastifyInstance): void => {
  app.get('/session/qr', { websocket: true }, (connection) => {
    const ws = connection;

    if (getConnectionState() === 'connected') {
      sendJson(ws, { type: 'connected' });
      ws.close();
      return;
    }

    const currentQr = getCurrentQr();

    if (currentQr) {
      void sendQrPayload(ws, currentQr);
    } else {
      sendJson(ws, { type: 'waiting' });
    }

    const disposeQr = onQr((qr) => {
      void sendQrPayload(ws, qr);
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
