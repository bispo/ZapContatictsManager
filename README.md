# WhatsApp Group Exporter

Aplicacao web para autenticar no WhatsApp Web via QR Code, listar grupos, exportar contatos deduplicados em JSON, validar listas de contato e disparar campanhas por template.

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

## Fluxo de importacao para transmissao
1. Conecte o WhatsApp
2. Na secao `Importacao para transmissao`, selecione um CSV com cabecalho `Number,Name`
3. Clique em `Importar CSV`
4. Revise a previa com linhas validas, invalidas e duplicadas
5. Clique em `Verificar no WhatsApp`
6. Baixe `validated-contacts.json` ou `validated-contacts.csv`

Observacao: a exportacao de contatos para campanha considera apenas os contatos validados no WhatsApp.

## Fluxo de campanha por template
1. Conecte o WhatsApp
2. Na secao `Enviar mensagem`, selecione o arquivo `validated-contacts.csv`
3. Suba um CSV de variaveis com cabecalho `Variable,Values`
4. Escreva o template usando variaveis no formato `$nome_da_variavel`
5. Clique em `Gerar previa`
6. Revise as amostras renderizadas
7. Clique em `Enviar campanha`
8. Baixe `message-campaign-report.json`

## Endpoints principais
- `POST /session/start`: inicia sessao Baileys
- `WS /session/qr`: stream do QR em tempo real
- `GET /session/status`: status da sessao
- `GET /groups`: lista grupos
- `POST /export`: exporta contatos dos grupos selecionados
- `POST /import/contacts`: valida e normaliza um CSV `Number,Name`
- `POST /transmission/prepare`: verifica os contatos importados e gera saida preparada para transmissao manual
- `POST /transmission/export-valid`: exporta apenas os contatos validados no WhatsApp
- `POST /messages/preview`: valida o template e gera amostras de campanha
- `POST /messages/send`: envia uma mensagem por destinatario

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
