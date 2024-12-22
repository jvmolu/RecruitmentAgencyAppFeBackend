import { z } from 'zod';
import ApplicationStages from "../enums/application-stages";
import BaseSchema from './base-entity';

export const ApplicationLifecycleSchema = BaseSchema.merge(
    z.object({
        id: z.string().uuid(),
        applicationId: z.string().uuid(),
        status: z.nativeEnum(ApplicationStages),
        notes: z.string().optional(),
    })
);

export type ApplicationLifecycleType = z.infer<typeof ApplicationLifecycleSchema>;
