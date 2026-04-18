# Plano: Página de Importação para Lista de Transmissão

## Objetivo
Adicionar uma nova página/fluxo para importar um arquivo CSV no formato `Number,Name`, validar e normalizar os contatos, e preparar uma lista de destinatários para uso como lista de transmissão no WhatsApp.

## Contexto Atual do Projeto
- O produto atual é um exportador de contatos de grupos do WhatsApp.
- A interface é uma SPA simples em `public/index.html` + `public/app.js`.
- O backend expõe rotas Fastify para sessão, grupos e exportação.
- Não existe hoje fluxo de upload de arquivo, parser CSV, validação de contatos, nem criação/envio de listas de transmissão.
- O modelo de contato atual em [src/types/contact.types.ts](/home/jerim/Workspace/ZapContatictsManager/src/types/contact.types.ts:1) contém `jid`, `phone` e `groups`, mas não armazena `name`.

## Premissas
- O CSV de entrada terá cabeçalho `Number,Name`.
- `Number` será tratado como telefone em formato internacional ou ao menos normalizável para dígitos.
- A página deve reaproveitar a sessão WhatsApp já autenticada.
- A criação efetiva da lista de transmissão depende de suporte real do WhatsApp Web/Baileys; isso precisa ser validado antes de fechar a implementação.

## Decisão de Produto Recomendada
Tratar a entrega em duas etapas:

1. `V1`: importar CSV, validar, deduplicar, mostrar prévia e montar uma lista pronta para uso no fluxo de transmissão.
2. `V2`: tentar automatizar a criação/uso da lista de transmissão no WhatsApp, caso a biblioteca e a sessão conectada suportem isso de forma confiável.

Essa divisão reduz risco, porque o projeto atual só lê dados do WhatsApp; ele ainda não executa automações de composição de destinatários ou envio.

## Escopo Funcional Proposto

### 1. Nova página/estado de UI
- Adicionar uma nova seção no frontend para `Importar contatos`.
- Exibir instruções curtas sobre o formato esperado do CSV.
- Permitir selecionar arquivo `.csv`.
- Exibir resumo após leitura:
  - total de linhas
  - total válidas
  - total inválidas
  - total deduplicadas
- Exibir tabela prévia com:
  - nome original
  - número original
  - número normalizado
  - status da linha

### 2. Upload e parsing do CSV
- Criar rota dedicada para upload/importação.
- Fazer parsing do arquivo no backend.
- Validar cabeçalho obrigatório `Number,Name`.
- Aceitar variações comuns:
  - espaços extras
  - números com `+`, `(`, `)`, `-`
  - linhas em branco no final

### 3. Normalização e validação
- Remover caracteres não numéricos de `Number`.
- Rejeitar linhas sem número.
- Marcar nomes vazios como pendência ou preencher com fallback previsível.
- Deduplicar por número normalizado.
- Registrar erros de linha com motivo explícito.

### 4. Verificação com WhatsApp
- Adicionar etapa opcional para verificar quais números existem no WhatsApp.
- Classificar cada contato como:
  - válido no WhatsApp
  - inválido/não encontrado
  - erro de verificação

### 5. Preparação da lista de transmissão
- Se houver suporte técnico, transformar os contatos válidos em destinatários para lista de transmissão.
- Se não houver suporte, oferecer fallback explícito:
  - exportar contatos válidos em JSON/CSV pronto para uso manual
  - exibir instruções para criação manual da lista no app do WhatsApp

## Mudanças Técnicas Necessárias

### Frontend
- Evoluir [public/index.html](/home/jerim/Workspace/ZapContatictsManager/public/index.html:1) para incluir uma quarta etapa ou uma página dedicada.
- Evoluir [public/app.js](/home/jerim/Workspace/ZapContatictsManager/public/app.js:1) para:
  - capturar arquivo
  - enviar `multipart/form-data`
  - renderizar prévia e erros
  - iniciar verificação dos contatos
  - habilitar ação final de transmissão somente quando fizer sentido
- Ajustar [public/style.css](/home/jerim/Workspace/ZapContatictsManager/public/style.css:1) para novos estados de tabela, alertas e progresso.

### Backend
- Criar nova rota, por exemplo:
  - `POST /import/contacts`
  - `POST /transmission/prepare`
  - opcionalmente `POST /transmission/create`
- Registrar as rotas em [src/routes/index.ts](/home/jerim/Workspace/ZapContatictsManager/src/routes/index.ts:1).
- Criar serviço dedicado, por exemplo:
  - `src/services/import-contacts.service.ts`
  - `src/services/transmission.service.ts`
- Criar tipos específicos para:
  - linha importada
  - erro de validação
  - contato normalizado
  - resultado de verificação no WhatsApp

### Modelagem
- Introduzir um novo tipo separado do export atual, em vez de adaptar `Contact` diretamente.
- Estrutura sugerida:

```ts
type ImportedContact = {
  originalNumber: string;
  normalizedNumber: string;
  name: string;
  status: 'valid' | 'invalid' | 'duplicate' | 'unknown';
  reason?: string;
  whatsappJid?: string;
};
```

Isso evita misturar contatos vindos de grupos com contatos importados de arquivo.

## Riscos e Pontos de Viabilidade

### 1. Criação real de lista de transmissão
O maior risco do plano é este: o projeto atual usa Baileys apenas para autenticação e leitura. Antes de prometer a funcionalidade final, é preciso executar uma spike técnica para validar se a stack atual consegue:
- verificar existência dos números no WhatsApp
- montar destinatários compatíveis
- criar ou operar uma lista de transmissão de forma estável

Se isso não for suportado, a funcionalidade deve ser reposicionada como `importação e preparação de contatos para transmissão`, não como criação automática da lista dentro do WhatsApp.

### 2. Normalização de telefones
Números podem vir sem DDI, com nono dígito faltando ou com formatação inconsistente. Sem uma regra clara de normalização, haverá falsos inválidos.

### 3. Privacidade e uso de sessão
Importar e verificar contatos amplia o uso da sessão autenticada. O backend deve evitar logar números completos desnecessariamente.

## Plano de Implementação

### Fase 1. Descoberta técnica
- Revisar suporte do Baileys para validação de número e fluxo de transmissão.
- Definir se a entrega será:
  - `criar transmissão automaticamente`
  - ou `preparar destinatários para transmissão manual`
- Documentar a decisão em `docs/decisions.md`.

### Fase 2. Contratos e tipos
- Criar tipos de importação e resposta.
- Definir payloads e resposta das novas rotas.
- Definir códigos de erro por linha e por arquivo.

### Fase 3. Backend de importação
- Implementar upload de CSV.
- Implementar parser e validação.
- Implementar normalização e deduplicação.
- Retornar resumo e prévia estruturada.

### Fase 4. Verificação com WhatsApp
- Implementar serviço para checar os números importados.
- Associar `normalizedNumber` ao `jid` quando existir.
- Tratar limitação, timeout e erro parcial sem abortar o lote inteiro.

### Fase 5. Interface
- Adicionar a nova tela/etapa.
- Mostrar template esperado do CSV.
- Mostrar prévia, inválidos e duplicados.
- Mostrar status da verificação.
- Expor a ação final compatível com o resultado da spike.

### Fase 6. Saída final
- Se houver automação suportada: acionar criação/preparação da transmissão.
- Se não houver: gerar artefato de saída consistente (`json` e opcionalmente `csv`) com os contatos aptos.

### Fase 7. Qualidade
- Validar fluxo com arquivo pequeno, médio e com erros.
- Garantir mensagens amigáveis no frontend.
- Atualizar `README.md`, `docs/product.md` e `docs/architecture.md`.

## Endpoints Sugeridos

### `POST /import/contacts`
Recebe arquivo CSV e devolve:

```json
{
  "summary": {
    "totalRows": 120,
    "validRows": 100,
    "invalidRows": 12,
    "duplicateRows": 8
  },
  "contacts": [],
  "errors": []
}
```

### `POST /transmission/prepare`
Recebe contatos válidos normalizados e devolve:
- contatos confirmados no WhatsApp
- contatos não encontrados
- contatos com erro de validação

### `POST /transmission/create`
Só deve existir se a spike confirmar suporte real e estável para a operação.

## Critérios de Aceite
- O usuário consegue subir um CSV `Number,Name`.
- O sistema detecta arquivo inválido e cabeçalho incorreto.
- O sistema normaliza e deduplica números.
- O usuário visualiza uma prévia antes de prosseguir.
- O sistema informa claramente quais contatos podem ou não seguir para transmissão.
- O produto não promete criação automática da lista sem validação técnica prévia.

## Ordem Recomendada de Execução
1. Fazer a spike de viabilidade no Baileys.
2. Implementar importação + validação + prévia.
3. Implementar verificação dos números no WhatsApp.
4. Só então decidir pela automação da lista de transmissão ou pelo fallback operacional.
