import { z } from "zod";
import BaseSchema from "./base-entity";

const FileParsedSchema = BaseSchema.merge(
  z.object({
    fileUrl: z.string(),
    parsedContent: z.string(),
  })
);

// Search schema with nullable fields
const FileParsedSearchSchema = BaseSchema.merge(
  z.object({
    fileUrl: z.string().nullable(),
    parsedContent: z.string().nullable(),
  })
);

type FileParsedType = z.infer<typeof FileParsedSchema>
type FileParsedSearchOptions = z.infer<typeof FileParsedSearchSchema>

export { FileParsedSchema, FileParsedType, FileParsedSearchSchema, FileParsedSearchOptions };