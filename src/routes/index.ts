import type { FastifyInstance } from 'fastify';
import { registerSessionRoutes } from './session.routes.js';
import { registerGroupsRoutes } from './groups.routes.js';
import { registerExportRoutes } from './export.routes.js';

export const registerRoutes = (app: FastifyInstance): void => {
  registerSessionRoutes(app);
  registerGroupsRoutes(app);
  registerExportRoutes(app);
};
