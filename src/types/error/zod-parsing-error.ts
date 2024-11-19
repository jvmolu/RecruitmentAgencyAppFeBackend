import { ZodError } from "zod";

export type ZodParsingError = ZodError & {
    errorType: "ZodParsingError";
};