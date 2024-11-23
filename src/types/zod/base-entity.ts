import { z } from 'zod';

export const BaseSchema = z.object({
  // ID: uuid
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export default BaseSchema;