import { z } from 'zod';
import { SortOrder } from '../enums/sort-order';

export const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BaseSearchParams = z.object({
  // I will recieve strings in req.query so will need trasnformations
  limit: z.string().default("0").transform((val) => parseInt(val) || 0),
  page: z.string().default("0").transform((val) => parseInt(val) || 1),
  orderBy: z.string().default('createdAt'),
  order: z.string().default(SortOrder.DESC).transform((val) => {
    if (val.toUpperCase() === 'ASC') {
      return SortOrder.ASC;
    } else {
      return SortOrder.DESC;
    }
  }),
});

export default BaseSchema;