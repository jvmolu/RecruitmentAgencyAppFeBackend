import { z } from 'zod';

export const BaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export default BaseSchema;