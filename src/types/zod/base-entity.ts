import { z } from 'zod';
import { SortOrder } from '../enums/sort-order';

export const BaseSchema = z.object({
  // ID: uuid
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BaseSearchParams = z.object({
  limit: z.number().int().default(-1),
  page: z.number().int().default(1),
  orderBy: z.string().default('created_at'),
  order: z.nativeEnum(SortOrder).default(SortOrder.DESC)
});

export default BaseSchema;