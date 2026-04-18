import { getSocket } from '../session/baileys.js';
import type {
  CampaignContact,
  CampaignDispatchResult,
  CampaignResolvedMessage,
  CampaignTemplateVariable
} from '../types/import.types.js';
import { csvEscape, normalizeDigits, parseCsvRow, splitCsvLines } from './csv.service.js';

type MessageSocket = {
  sendMessage: (jid: string, content: { text: string }) => Promise<{
    key?: {
      id?: string | null;
      remoteJid?: string | null;
    };
  }>;
  onWhatsApp?: (phone: string) => Promise<Array<{ exists?: boolean; jid?: string; lid?: string }>>;
};

type PreviewCampaignResult = {
  summary: {
    totalContacts: number;
    totalVariables: number;
    detectedTemplateVariables: number;
    sampleCount: number;
  };
  contacts: CampaignContact[];
  variables: CampaignTemplateVariable[];
  templateVariables: string[];
  sampleMessages: CampaignResolvedMessage[];
};

type SendCampaignResult = {
  summary: {
    totalContacts: number;
    sentCount: number;
    failedCount: number;
    skippedCount: number;
    startedAt: string;
    finishedAt: string;
  };
  results: CampaignDispatchResult[];
  reportJson: string;
};

const CONTACTS_HEADER_NUMBER = 'number';
const CONTACTS_HEADER_NAME = 'name';
const CONTACTS_HEADER_JID = 'jid';
const VARIABLES_HEADER_NAME = 'variable';
const VARIABLES_HEADER_VALUES = 'values';
const TEMPLATE_VARIABLE_REGEX = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isLikelyWhatsappJid = (jid: string | undefined): jid is string =>
  Boolean(jid && jid.includes('@') && !jid.startsWith('@'));

const parseCampaignContactsCsv = (csv: string): CampaignContact[] => {
  const lines = splitCsvLines(csv);

  if (lines.length === 0) {
    throw new Error('Arquivo de contatos vazio.');
  }

  const header = parseCsvRow(lines[0]).map((value) => value.trim().toLowerCase());

  if (header[0] !== CONTACTS_HEADER_NUMBER || header[1] !== CONTACTS_HEADER_NAME) {
    throw new Error('Cabecalho invalido no arquivo de contatos. Use Number,Name,JID.');
  }

  const jidIndex = header.indexOf(CONTACTS_HEADER_JID);
  const contacts: CampaignContact[] = [];
  const seenNumbers = new Set<string>();

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1;
    const columns = parseCsvRow(lines[index]);
    const normalizedNumber = normalizeDigits(columns[0] ?? '');
    const name = (columns[1] ?? '').trim();
    const whatsappJid = jidIndex >= 0 ? (columns[jidIndex] ?? '').trim() || undefined : undefined;

    if (!normalizedNumber) {
      throw new Error(`Linha ${rowNumber}: numero ausente no arquivo de contatos.`);
    }

    if (!name) {
      throw new Error(`Linha ${rowNumber}: nome ausente no arquivo de contatos.`);
    }

    if (seenNumbers.has(normalizedNumber)) {
      throw new Error(`Linha ${rowNumber}: numero duplicado no arquivo de contatos.`);
    }

    seenNumbers.add(normalizedNumber);
    contacts.push({
      rowNumber,
      name,
      normalizedNumber,
      whatsappJid
    });
  }

  if (contacts.length === 0) {
    throw new Error('Nenhum contato apto foi encontrado no arquivo.');
  }

  return contacts;
};

const parseVariablesCsv = (csv: string): CampaignTemplateVariable[] => {
  const lines = splitCsvLines(csv);

  if (lines.length === 0) {
    throw new Error('Arquivo de variaveis vazio.');
  }

  const header = parseCsvRow(lines[0]).map((value) => value.trim().toLowerCase());

  if (header[0] !== VARIABLES_HEADER_NAME || header[1] !== VARIABLES_HEADER_VALUES) {
    throw new Error('Cabecalho invalido no arquivo de variaveis. Use Variable,Values.');
  }

  const variables: CampaignTemplateVariable[] = [];
  const seenNames = new Set<string>();

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1;
    const columns = parseCsvRow(lines[index]);
    const name = (columns[0] ?? '').trim();
    const values = (columns.slice(1).join(',') || '')
      .split('|')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (!name) {
      throw new Error(`Linha ${rowNumber}: variavel ausente.`);
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(`Linha ${rowNumber}: nome de variavel invalido (${name}).`);
    }

    if (seenNames.has(name)) {
      throw new Error(`Linha ${rowNumber}: variavel duplicada (${name}).`);
    }

    if (values.length === 0) {
      throw new Error(`Linha ${rowNumber}: a variavel ${name} precisa ter ao menos um valor.`);
    }

    seenNames.add(name);
    variables.push({ name, values });
  }

  return variables;
};

const extractTemplateVariables = (template: string): string[] => {
  const matches = template.matchAll(TEMPLATE_VARIABLE_REGEX);
  const names = new Set<string>();

  for (const match of matches) {
    const name = match[1];

    if (name) {
      names.add(name);
    }
  }

  return Array.from(names);
};

const renderMessage = (
  template: string,
  templateVariables: string[],
  variablesMap: Map<string, CampaignTemplateVariable>
): CampaignResolvedMessage => {
  const resolvedVariables: Record<string, string> = {};

  for (const variableName of templateVariables) {
    const variable = variablesMap.get(variableName);

    if (!variable) {
      throw new Error(`Variavel ${variableName} nao encontrada.`);
    }

    const value = variable.values[Math.floor(Math.random() * variable.values.length)] ?? '';
    resolvedVariables[variableName] = value;
  }

  const renderedText = template.replace(TEMPLATE_VARIABLE_REGEX, (_, variableName: string) => {
    return resolvedVariables[variableName] ?? `$${variableName}`;
  });

  return {
    template,
    renderedText,
    resolvedVariables
  };
};

const validateTemplateAgainstVariables = (
  template: string,
  variables: CampaignTemplateVariable[]
): { templateVariables: string[]; variablesMap: Map<string, CampaignTemplateVariable> } => {
  const templateVariables = extractTemplateVariables(template);

  if (template.trim().length === 0) {
    throw new Error('O template da mensagem nao pode ser vazio.');
  }

  if (templateVariables.length === 0) {
    throw new Error('O template precisa usar ao menos uma variavel no formato $nome_da_variavel.');
  }

  const variablesMap = new Map(variables.map((variable) => [variable.name, variable]));
  const missingVariables = templateVariables.filter((name) => !variablesMap.has(name));

  if (missingVariables.length > 0) {
    throw new Error(`Variaveis ausentes no CSV: ${missingVariables.map((name) => `$${name}`).join(', ')}.`);
  }

  return { templateVariables, variablesMap };
};

const buildReportJson = (summary: SendCampaignResult['summary'], results: CampaignDispatchResult[]): string =>
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      summary,
      results
    },
    null,
    2
  );

export const previewMessageCampaign = (
  contactsCsv: string,
  variablesCsv: string,
  template: string
): PreviewCampaignResult => {
  const contacts = parseCampaignContactsCsv(contactsCsv);
  const variables = parseVariablesCsv(variablesCsv);
  const { templateVariables, variablesMap } = validateTemplateAgainstVariables(template, variables);

  const sampleMessages = Array.from({ length: Math.min(3, contacts.length) }, () =>
    renderMessage(template, templateVariables, variablesMap)
  );

  return {
    summary: {
      totalContacts: contacts.length,
      totalVariables: variables.length,
      detectedTemplateVariables: templateVariables.length,
      sampleCount: sampleMessages.length
    },
    contacts,
    variables,
    templateVariables,
    sampleMessages
  };
};

export const sendMessageCampaign = async (
  contactsCsv: string,
  variablesCsv: string,
  template: string,
  rateDelayMs = 1200
): Promise<SendCampaignResult> => {
  const sock = getSocket() as unknown as MessageSocket | null;

  if (!sock) {
    throw new Error('Sessao do WhatsApp nao iniciada.');
  }

  const preview = previewMessageCampaign(contactsCsv, variablesCsv, template);
  const variablesMap = new Map(preview.variables.map((variable) => [variable.name, variable]));
  const startedAt = new Date().toISOString();
  const results: CampaignDispatchResult[] = [];

  for (let index = 0; index < preview.contacts.length; index += 1) {
    const recipient = preview.contacts[index];
    const message = renderMessage(template, preview.templateVariables, variablesMap);
    let jid = recipient.whatsappJid;

    if (!isLikelyWhatsappJid(jid)) {
      if (typeof sock.onWhatsApp === 'function') {
        const matches = await sock.onWhatsApp(recipient.normalizedNumber);
        const match = matches.find((item) => item.exists && (item.jid || item.lid));
        jid = match?.jid ?? match?.lid;
      }
    }

    if (!isLikelyWhatsappJid(jid)) {
      results.push({
        recipient,
        message,
        status: 'failed',
        reason: 'Nao foi possivel resolver um JID valido para o destinatario.'
      });

      if (index < preview.contacts.length - 1 && rateDelayMs > 0) {
        await sleep(rateDelayMs);
      }

      continue;
    }

    try {
      const response = await sock.sendMessage(jid, { text: message.renderedText });
      const messageId = response?.key?.id ?? undefined;
      const usedJid = response?.key?.remoteJid ?? jid;

      if (!messageId) {
        results.push({
          recipient,
          message,
          status: 'failed',
          usedJid,
          reason: 'Baileys nao retornou um identificador de mensagem para confirmar o envio.'
        });
      } else {
        results.push({
          recipient,
          message,
          status: 'sent',
          usedJid,
          messageId,
          sentAt: new Date().toISOString()
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido no envio.';
      results.push({
        recipient,
        message,
        status: 'failed',
        usedJid: jid,
        reason
      });
    }

    if (index < preview.contacts.length - 1 && rateDelayMs > 0) {
      await sleep(rateDelayMs);
    }
  }

  const summary = {
    totalContacts: results.length,
    sentCount: results.filter((result) => result.status === 'sent').length,
    failedCount: results.filter((result) => result.status === 'failed').length,
    skippedCount: results.filter((result) => result.status === 'skipped').length,
    startedAt,
    finishedAt: new Date().toISOString()
  };

  return {
    summary,
    results,
    reportJson: buildReportJson(summary, results)
  };
};

export const exportCampaignContactsCsv = (contacts: CampaignContact[]): string => {
  const lines = ['Number,Name,JID'];

  for (const contact of contacts) {
    lines.push(
      [
        csvEscape(contact.normalizedNumber),
        csvEscape(contact.name),
        csvEscape(contact.whatsappJid ?? '')
      ].join(',')
    );
  }

  return lines.join('\n');
};
