import { buildServer } from './server/index.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const server = buildServer();

server
  .listen({ port, host })
  .then(() => {
    console.log(`Servidor executando em http://${host}:${port}`);
  })
  .catch((error) => {
    server.log.error(error);
    process.exit(1);
  });
