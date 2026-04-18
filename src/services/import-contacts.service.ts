import type { ImportedContact, ImportSummary } from '../types/import.types.js';
import { normalizeDigits, parseCsvRow, splitCsvLines } from './csv.service.js';

type ImportContactsResult = {
  summary: ImportSummary;
  contacts: ImportedContact[];
  errors: Array<{ rowNumber: number; message: string }>;
};

const HEADER_NUMBER = 'number';
const HEADER_NAME = 'name';

const buildSummary = (contacts: ImportedContact[]): ImportSummary => ({
  totalRows: contacts.length,
  validRows: contacts.filter((contact) => contact.status === 'valid').length,
  invalidRows: contacts.filter((contact) => contact.status === 'invalid').length,
  duplicateRows: contacts.filter((contact) => contact.status === 'duplicate').length
});

export const importContactsFromCsv = (csv: string): ImportContactsResult => {
  const nonEmptyLines = splitCsvLines(csv);

  if (nonEmptyLines.length === 0) {
    throw new Error('Arquivo CSV vazio.');
  }

  const headerColumns = parseCsvRow(nonEmptyLines[0]).map((value) => value.trim().toLowerCase());

  if (headerColumns.length < 2 || headerColumns[0] !== HEADER_NUMBER || headerColumns[1] !== HEADER_NAME) {
    throw new Error('Cabecalho invalido. Use exatamente: Number,Name');
  }

  const contacts: ImportedContact[] = [];
  const seenNumbers = new Set<string>();
  const errors: Array<{ rowNumber: number; message: string }> = [];

  for (let index = 1; index < nonEmptyLines.length; index += 1) {
    const line = nonEmptyLines[index];
    const rowNumber = index + 1;
    const columns = parseCsvRow(line);
    const originalNumber = columns[0] ?? '';
    const originalName = columns.slice(1).join(',').trim();
    const normalizedNumber = normalizeDigits(originalNumber);
    const hasFallbackName = originalName.length === 0;
    const name = hasFallbackName
      ? normalizedNumber
        ? `Contato ${normalizedNumber}`
        : `Contato linha ${rowNumber}`
      : originalName;

    let status: ImportedContact['status'] = 'valid';
    let reason: string | undefined;

    if (!normalizedNumber) {
      status = 'invalid';
      reason = 'Numero ausente.';
    } else if (normalizedNumber.length < 10 || normalizedNumber.length > 15) {
      status = 'invalid';
      reason = 'Numero deve ter entre 10 e 15 digitos apos normalizacao.';
    } else if (seenNumbers.has(normalizedNumber)) {
      status = 'duplicate';
      reason = 'Numero duplicado no arquivo.';
    } else {
      seenNumbers.add(normalizedNumber);
      if (hasFallbackName) {
        reason = 'Nome ausente; fallback aplicado.';
      }
    }

    const contact: ImportedContact = {
      rowNumber,
      originalNumber,
      normalizedNumber,
      name,
      originalName,
      status,
      reason,
      hasFallbackName,
      whatsappStatus: 'pending'
    };

    contacts.push(contact);

    if (status !== 'valid' && reason) {
      errors.push({ rowNumber, message: reason });
    }
  }

  return {
    summary: buildSummary(contacts),
    contacts,
    errors
  };
};
