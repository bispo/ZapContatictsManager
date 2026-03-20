import { z } from 'zod';

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative()
});

export type Group = z.infer<typeof GroupSchema>;
