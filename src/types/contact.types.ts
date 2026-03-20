import { z } from 'zod';

export const ContactSchema = z.object({
  jid: z.string(),
  phone: z.string(),
  groups: z.array(z.string())
});

export type Contact = z.infer<typeof ContactSchema>;

export const ExportRequestSchema = z.object({
  groupJids: z.array(z.string()).min(1)
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;
