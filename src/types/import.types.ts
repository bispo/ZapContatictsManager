import { z } from 'zod';

export const ImportedContactStatusSchema = z.enum(['valid', 'invalid', 'duplicate', 'unknown']);
export type ImportedContactStatus = z.infer<typeof ImportedContactStatusSchema>;

export const WhatsappVerificationStatusSchema = z.enum([
  'pending',
  'valid',
  'not_found',
  'error',
  'unsupported'
]);
export type WhatsappVerificationStatus = z.infer<typeof WhatsappVerificationStatusSchema>;

export const ImportedContactSchema = z.object({
  rowNumber: z.number().int().positive(),
  originalNumber: z.string(),
  normalizedNumber: z.string(),
  name: z.string(),
  originalName: z.string(),
  status: ImportedContactStatusSchema,
  reason: z.string().optional(),
  hasFallbackName: z.boolean(),
  whatsappStatus: WhatsappVerificationStatusSchema.default('pending'),
  whatsappJid: z.string().optional()
});

export type ImportedContact = z.infer<typeof ImportedContactSchema>;

export const ImportSummarySchema = z.object({
  totalRows: z.number().int().nonnegative(),
  validRows: z.number().int().nonnegative(),
  invalidRows: z.number().int().nonnegative(),
  duplicateRows: z.number().int().nonnegative()
});

export type ImportSummary = z.infer<typeof ImportSummarySchema>;

export const ImportContactsRequestSchema = z.object({
  fileName: z.string().trim().min(1).optional(),
  csv: z.string().min(1)
});

export type ImportContactsRequest = z.infer<typeof ImportContactsRequestSchema>;

export const TransmissionContactInputSchema = z.object({
  rowNumber: z.number().int().positive(),
  originalNumber: z.string(),
  normalizedNumber: z.string().min(1),
  name: z.string().min(1),
  originalName: z.string().default(''),
  hasFallbackName: z.boolean().default(false)
});

export type TransmissionContactInput = z.infer<typeof TransmissionContactInputSchema>;

export const PrepareTransmissionRequestSchema = z.object({
  contacts: z.array(TransmissionContactInputSchema).min(1)
});

export type PrepareTransmissionRequest = z.infer<typeof PrepareTransmissionRequestSchema>;

export const ExportValidContactsRequestSchema = z.object({
  contacts: z.array(ImportedContactSchema).min(1),
  format: z.enum(['json', 'csv'])
});

export type ExportValidContactsRequest = z.infer<typeof ExportValidContactsRequestSchema>;

export const CampaignContactSchema = z.object({
  rowNumber: z.number().int().positive(),
  name: z.string().min(1),
  normalizedNumber: z.string().min(1),
  whatsappJid: z.string().optional()
});

export type CampaignContact = z.infer<typeof CampaignContactSchema>;

export const CampaignTemplateVariableSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1)
});

export type CampaignTemplateVariable = z.infer<typeof CampaignTemplateVariableSchema>;

export const CampaignResolvedMessageSchema = z.object({
  template: z.string().min(1),
  renderedText: z.string().min(1),
  resolvedVariables: z.record(z.string(), z.string())
});

export type CampaignResolvedMessage = z.infer<typeof CampaignResolvedMessageSchema>;

export const CampaignDispatchResultSchema = z.object({
  recipient: CampaignContactSchema,
  message: CampaignResolvedMessageSchema,
  status: z.enum(['sent', 'failed', 'skipped']),
  usedJid: z.string().optional(),
  messageId: z.string().optional(),
  reason: z.string().optional(),
  sentAt: z.string().optional()
});

export type CampaignDispatchResult = z.infer<typeof CampaignDispatchResultSchema>;

export const PreviewCampaignRequestSchema = z.object({
  contactsCsv: z.string().min(1),
  variablesCsv: z.string().min(1),
  template: z.string().trim().min(1)
});

export type PreviewCampaignRequest = z.infer<typeof PreviewCampaignRequestSchema>;

export const SendCampaignRequestSchema = PreviewCampaignRequestSchema.extend({
  rateDelayMs: z.number().int().min(0).max(10000).optional()
});

export type SendCampaignRequest = z.infer<typeof SendCampaignRequestSchema>;
