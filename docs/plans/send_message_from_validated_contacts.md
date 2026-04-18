# Plano: Exportar Contatos Válidos e Enviar Mensagem por Arquivo

## Objetivo
Adicionar dois fluxos encadeados, mas independentes:

1. após a validação dos contatos importados, permitir exportar apenas os contatos válidos;
2. criar uma nova seção `Enviar mensagem`, onde o usuário informa uma mensagem template, envia um arquivo com a lista de contatos e um segundo arquivo CSV com variáveis para renderização aleatória por disparo.

## Contexto Atual do Projeto
- O sistema já possui autenticação da sessão do WhatsApp.
- Existe fluxo de importação/validação/verificação de contatos para transmissão manual.
- A aplicação ainda não possui envio ativo de mensagens para contatos importados.
- O backend atual não possui fila, controle de ritmo, relatório de envio nem histórico de campanhas.

## Premissas
- O arquivo de entrada para envio continuará usando o formato `Number,Name` ou um artefato exportado pelo próprio sistema.
- O envio será individual por contato, e não por grupo.
- A sessão autenticada do WhatsApp será reaproveitada.
- O disparo deve ocorrer apenas para contatos validados como aptos.
- A mensagem será escrita como template textual com variáveis no formato `$nome_da_variavel`.
- Haverá um segundo arquivo CSV com as variáveis e seus possíveis valores.
- Para cada envio, o renderizador escolherá aleatoriamente um valor por variável dentre os valores disponíveis no CSV.
- O sistema deve deixar explícito que a operação é sensível a limites, bloqueios e instabilidade do WhatsApp Web/Baileys.

## Decisão de Produto Recomendada
Separar a funcionalidade em duas entregas:

1. `V1`: exportação dos contatos válidos em artefato padronizado para reuso.
2. `V2`: nova sessão `Enviar mensagem` com upload do arquivo exportado, template da mensagem, upload do CSV de variáveis, validação pré-envio, renderização por destinatário, disparo controlado e relatório final.

Essa separação reduz risco porque o envio é uma operação mais crítica que a validação. Também evita acoplar o fluxo de importação ao fluxo de campanha.

## Escopo Funcional Proposto

### 1. Exportação dos contatos válidos
- Após a validação/verificação, disponibilizar ação explícita para exportar somente os contatos válidos.
- Gerar pelo menos dois formatos:
  - `JSON` com metadados do processo
  - `CSV` reaproveitável em `Number,Name`
- Excluir contatos inválidos, duplicados e não encontrados no WhatsApp.
- Incluir, no JSON, campos suficientes para rastreabilidade:
  - data/hora da geração
  - total validado
  - origem do arquivo
  - status de verificação
  - `jid` quando disponível

### 2. Nova sessão de UI: `Enviar mensagem`
- Adicionar uma nova seção independente da importação.
- Exibir instruções curtas:
  - formato esperado do arquivo
  - sintaxe das variáveis do template
  - formato esperado do CSV de variáveis
  - limites e riscos operacionais
  - comportamento do disparo
- Permitir:
  - selecionar arquivo com contatos
  - digitar mensagem template
  - selecionar arquivo CSV de variáveis
  - revisar prévia antes do envio
  - iniciar disparo
  - acompanhar progresso
  - baixar relatório final

### 3. Validação do arquivo de envio
- Aceitar arquivo exportado pelo sistema como formato preferencial.
- Opcionalmente aceitar CSV simples `Number,Name`.
- Revalidar o conteúdo no backend antes de enviar:
  - número presente
  - nome presente ou fallback
  - sem duplicados
  - compatível com o formato interno de envio
- Rejeitar arquivos inválidos com mensagem clara.

### 4. Composição da mensagem por template
- Permitir mensagem de texto livre com placeholders no formato `$nome_da_variavel`.
- Validar:
  - template não vazio
  - tamanho máximo aceitável
  - nomes de variáveis com padrão previsível
  - toda variável usada no template deve existir no CSV de variáveis
- O motor deve:
  - identificar as variáveis usadas no template
  - carregar a lista de valores possíveis de cada variável
  - escolher aleatoriamente um valor por variável para cada destinatário
  - renderizar a mensagem final antes do envio
- Manter o template original e a mensagem renderizada no relatório de campanha.

### 5. Arquivo CSV de variáveis
- Introduzir um segundo arquivo CSV para as variáveis do template.
- Formato recomendado:
  - cabeçalho `Variable,Values`
  - uma linha por variável
  - múltiplos valores na coluna `Values` separados por `|`
- Exemplo de uso:
  - variável `$saudacao` com valores `Oi|Olá|Bom dia`
  - variável `$cta` com valores `me chama aqui|responde esta mensagem|fala comigo`
- Regras:
  - toda variável do template deve existir no CSV
  - cada variável deve ter ao menos um valor
  - valores vazios devem ser rejeitados
  - variáveis extras podem ser aceitas com aviso ou rejeitadas, conforme decisão de implementação

### 6. Prévia da renderização
- Antes do disparo, mostrar:
  - template original
  - variáveis detectadas
  - exemplo de mensagem renderizada
  - quantidade de destinatários aptos
- Opcionalmente mostrar 3 a 5 amostras de renderização para o usuário validar a variação do texto.

### 7. Disparo controlado
- Enviar uma mensagem por contato válido.
- Renderizar uma nova versão da mensagem para cada contato antes do envio.
- Aplicar ritmo controlado entre envios para reduzir risco operacional.
- Capturar resultado por contato:
  - enviado
  - falhou
  - ignorado
- Continuar o lote mesmo se alguns contatos falharem.

### 8. Relatório final
- Exibir resumo após o disparo:
  - total da lista
  - total enviado com sucesso
  - total com falha
  - tempo total
- Disponibilizar relatório detalhado para download.
- Registrar no relatório:
  - template utilizado
  - variáveis resolvidas por envio
  - mensagem final renderizada para cada destinatário

## Exemplo de Template

```txt
$saudacao, $nome_contato!

Passando para falar sobre $oferta. Hoje estamos com $beneficio.

Se fizer sentido para voce, $cta.
```

## Exemplo de Arquivo de Variáveis

Formato CSV:

```csv
Variable,Values
saudacao,"Oi|Olá|Bom dia|Boa tarde"
nome_contato,"Cliente|Amigo|Contato"
oferta,"nossa consultoria|nosso produto|a oportunidade que comentei"
beneficio,"condição especial|desconto exclusivo|atendimento prioritário"
cta,"me responde aqui|me chama nesta conversa|fala comigo por esta mensagem"
```

### Exemplo de Renderização Possível

```txt
Olá, Cliente!

Passando para falar sobre nosso produto. Hoje estamos com desconto exclusivo.

Se fizer sentido para voce, me responde aqui.
```

## Mudanças Técnicas Necessárias

### Frontend
- Evoluir [public/index.html](/home/jerim/Workspace/ZapContatictsManager/public/index.html:1) para incluir uma nova seção `Enviar mensagem`.
- Evoluir [public/app.js](/home/jerim/Workspace/ZapContatictsManager/public/app.js:1) para:
  - receber arquivo da campanha
  - receber template da mensagem
  - receber arquivo CSV de variáveis
  - enviar payload para validação
  - renderizar prévia dos destinatários
  - renderizar prévia do template e das variáveis detectadas
  - capturar mensagem
  - iniciar disparo
  - acompanhar progresso e relatório final
- Ajustar [public/style.css](/home/jerim/Workspace/ZapContatictsManager/public/style.css:1) para:
  - formulário de mensagem
  - área do template
  - área de variáveis e exemplos renderizados
  - área de revisão
  - barra/indicador de progresso
  - estados de sucesso, falha e alerta

### Backend
- Criar rotas dedicadas, por exemplo:
  - `POST /transmission/export-valid`
  - `POST /messages/preview`
  - `POST /messages/send`
  - opcionalmente `GET /messages/report/:id`
- Registrar as rotas em [src/routes/index.ts](/home/jerim/Workspace/ZapContatictsManager/src/routes/index.ts:1).
- Criar serviços dedicados, por exemplo:
  - `src/services/transmission-export.service.ts`
  - `src/services/message-campaign.service.ts`
- Evoluir os tipos de importação/campanha para isolar:
  - contato pronto para envio
  - template da mensagem
  - variável com lista de valores
  - renderização resolvida por destinatário
  - item de resultado de envio
  - resumo da campanha

### Modelagem Sugerida
```ts
type MessageRecipient = {
  name: string;
  normalizedNumber: string;
  whatsappJid?: string;
};

type MessageTemplateVariable = {
  name: string;
  values: string[];
};

type RenderedMessage = {
  template: string;
  renderedText: string;
  resolvedVariables: Record<string, string>;
};

type MessageDispatchResult = {
  recipient: MessageRecipient;
  message: RenderedMessage;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  sentAt?: string;
};
```

## Riscos e Pontos de Viabilidade

### 1. Envio ativo de mensagens
O maior risco agora não é mais a validação, e sim o envio automatizado. Antes de implementar, precisa ficar claro se a stack atual suporta com estabilidade:
- envio de texto para JID individual
- sequência de múltiplos envios
- tratamento de rate limit, timeout e falhas parciais

### 2. Risco de bloqueio e compliance
Automação de envio em lote pode gerar bloqueio de conta, limitação temporária ou comportamento antifraude do WhatsApp. A interface precisa deixar isso claro antes do disparo.

### 3. Idempotência e reenvio acidental
Sem controle de execução, o usuário pode reenviar a mesma campanha por engano. O fluxo precisa considerar confirmação explícita antes do início.

### 4. Personalização randômica da mensagem
Se o template e o CSV de variáveis não forem validados juntos, o usuário pode disparar mensagens quebradas, com placeholders sem valor ou com variação insuficiente.

### 5. Reprodutibilidade e auditoria
Como cada envio escolhe valores aleatórios, o sistema precisa registrar qual combinação foi usada em cada destinatário. Sem isso, fica difícil auditar o que realmente foi enviado.

## Plano de Implementação

### Fase 1. Contrato de exportação dos válidos
- Definir formato oficial do arquivo exportado para reuso.
- Garantir que o artefato contenha apenas contatos aptos.
- Atualizar o fluxo atual para deixar a exportação explícita.

### Fase 2. Descoberta técnica do envio
- Validar o uso do Baileys para envio individual de mensagem.
- Definir se o envio usará:
  - `jid` já resolvido
  - ou resolução de número em tempo de envio
- Documentar limites e tradeoffs em `docs/decisions.md`.

### Fase 3. Contratos e tipos da campanha
- Criar tipos para:
  - destinatário
  - template da mensagem
  - variável de template
  - renderização resolvida
  - payload de prévia
  - payload de envio
  - item de resultado
  - relatório final
- Definir regras de validação do template e do CSV de variáveis.

### Fase 4. Backend de prévia
- Implementar leitura do arquivo da campanha.
- Implementar leitura e parse do CSV de variáveis.
- Validar estrutura e contatos aptos.
- Validar correspondência entre variáveis usadas no template e variáveis fornecidas.
- Gerar amostras de renderização para revisão.
- Retornar prévia com total de destinatários e inconsistências.

### Fase 5. Backend de envio
- Implementar o serviço de disparo.
- Renderizar a mensagem final por destinatário imediatamente antes do envio.
- Enviar uma mensagem por contato.
- Tratar erro por destinatário sem abortar todo o lote.
- Registrar resumo de execução.

### Fase 6. Interface de envio
- Criar nova seção `Enviar mensagem`.
- Adicionar área de template da mensagem.
- Adicionar upload do CSV de variáveis.
- Mostrar prévia dos destinatários.
- Mostrar variáveis detectadas e amostras de renderização.
- Exigir confirmação do usuário antes do disparo.
- Mostrar progresso e resultado final.

### Fase 7. Qualidade
- Testar com lista pequena e média.
- Validar erros de sessão expirada.
- Validar arquivo inválido.
- Atualizar `README.md`, `docs/product.md` e `docs/architecture.md`.

## Endpoints Sugeridos

### `POST /transmission/export-valid`
Recebe os contatos já validados e devolve um artefato só com os aptos para envio.

Resposta sugerida:
```json
{
  "exportedAt": "2026-04-17T21:00:00.000Z",
  "totalValidContacts": 80,
  "contacts": []
}
```

### `POST /messages/preview`
Recebe:
- arquivo da lista
- template da mensagem
- arquivo CSV de variáveis

Devolve:
- contatos aceitos
- contatos rejeitados
- variáveis detectadas
- exemplos de renderização
- resumo da campanha

### `POST /messages/send`
Recebe:
- lista validada
- template validado
- variáveis validadas

Devolve:
- resumo do envio
- resultados por destinatário

## Critérios de Aceite
- Após validar contatos, o usuário consegue exportar apenas os válidos.
- O sistema oferece uma seção separada para envio de mensagem.
- O usuário consegue informar um template, subir um arquivo de contatos e subir um CSV de variáveis.
- O sistema mostra uma prévia antes de enviar.
- O sistema detecta as variáveis `$nome_da_variavel` usadas no template.
- O sistema valida se todas as variáveis do template existem no CSV.
- O sistema renderiza uma mensagem diferente por destinatário com escolha aleatória dos valores.
- O disparo ocorre individualmente por contato, com resultado por destinatário.
- O sistema gera relatório final com sucessos e falhas.
- A interface explicita que automação de envio pode sofrer limitações operacionais do WhatsApp.

## Ordem Recomendada de Execução
1. Padronizar a exportação de contatos válidos.
2. Fazer a spike técnica de envio individual com Baileys.
3. Definir o contrato do template e do CSV de variáveis.
4. Implementar prévia e validação do arquivo de campanha.
5. Implementar envio controlado, renderização por destinatário e relatório.
6. Só depois considerar anexos, histórico de campanhas ou regras mais avançadas de personalização.
