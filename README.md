# WhatsApp Group Exporter

Aplicacao web para autenticar no WhatsApp Web via QR Code, listar grupos e exportar contatos deduplicados em JSON.

## Stack
- Node.js + TypeScript
- Fastify
- Baileys
- WebSocket (`@fastify/websocket`)
- Zod
- Frontend estatico (`public/`)

## Pre-requisitos
- Node.js 20+ (recomendado: Node 24)
- Yarn 4+
- Conta WhatsApp ativa para autenticar via QR

## Estrutura do projeto
```text
src/
  server/
  routes/
  ws/
  session/
  services/
  types/
  utils/
  index.ts

public/
  index.html
  app.js
  style.css

docs/
  architecture.md
  product.md
  decisions.md
  backlog.md
```

## Como levantar o ambiente de desenvolvimento
1. Instale as dependencias:
```bash
yarn install
```

2. Rode em modo desenvolvimento:
```bash
yarn dev
```

3. Abra no navegador:
```text
http://localhost:3000
```

## Scripts
- `yarn dev`: sobe servidor com reload (`tsx watch`)
- `yarn build`: compila TypeScript para `dist/`
- `yarn start`: executa build compilada
- `yarn lint`: valida codigo com ESLint
- `yarn format`: formata com Prettier

## Fluxo de uso da aplicacao
1. Clique em `Conectar WhatsApp`
2. Escaneie o QR Code com o celular
3. Aguarde status `conectado`
4. Selecione os grupos
5. Clique em `Exportar Contatos`
6. Baixe o arquivo `contacts-export.json`

## Endpoints principais
- `POST /session/start`: inicia sessao Baileys
- `WS /session/qr`: stream do QR em tempo real
- `GET /session/status`: status da sessao
- `GET /groups`: lista grupos
- `POST /export`: exporta contatos dos grupos selecionados

## Persistencia de sessao
- Credenciais do WhatsApp ficam em `auth_info_baileys/`
- Essa pasta permite reconectar sem novo QR (quando sessao ainda valida)

## Ferramentas Codex/MCP
Este ambiente pode usar MCP no Codex para automacao de navegador.

### Playwright MCP
Configuracao usada:
- nome: `playwright`
- comando: `npx -y @playwright/mcp`

Comandos uteis:
```bash
codex mcp list
codex mcp get playwright
```

Se precisar adicionar manualmente:
```bash
codex mcp add playwright -- npx -y @playwright/mcp
```

## Solucao de problemas
### Erro de dependencia do Baileys no Yarn PnP (`long`)
O projeto ja inclui ajuste para isso em:
- `package.json` (dependencia `long`)
- `.yarnrc.yml` (`packageExtensions` para `baileys`)

Se ocorrer novamente:
```bash
yarn install
```

## Documentacao complementar
- [Arquitetura](docs/architecture.md)
- [Produto](docs/product.md)
- [Decisoes Tecnicas](docs/decisions.md)
- [Backlog](docs/backlog.md)
