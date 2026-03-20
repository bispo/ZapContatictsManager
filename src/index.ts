import { buildServer } from './server/index.js';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const start = async (): Promise<void> => {
  const server = await buildServer();

  await server.listen({ port, host });

  console.log(`Servidor executando em http://${host}:${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
