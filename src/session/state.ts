import type { SessionState } from '../types/session.types.js';

let connectionState: SessionState = 'disconnected';
let isSessionStarting = false;
let currentQr: string | null = null;

export const setConnectionState = (state: SessionState): void => {
  connectionState = state;
};

export const getConnectionState = (): SessionState => connectionState;

export const setSessionStarting = (value: boolean): void => {
  isSessionStarting = value;
};

export const getSessionStarting = (): boolean => isSessionStarting;

export const setCurrentQr = (qr: string | null): void => {
  currentQr = qr;
};

export const getCurrentQr = (): string | null => currentQr;
