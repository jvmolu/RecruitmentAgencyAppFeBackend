import { z } from "zod";

// Define Zod Entities for Range (min, max) which can be used for different data types

const NumberRange = z.object({
    min: z.number(),
    max: z.number()
});

const DateRange = z.object({
    min: z.string().datetime(),
    max: z.string().datetime()
});

const StringRange = z.object({
    min: z.string(),
    max: z.string()
});

type NumberRangeType = z.infer<typeof NumberRange>;
type DateRangeType = z.infer<typeof DateRange>;
type StringRangeType = z.infer<typeof StringRange>;

function isNumberRange(value: any): value is NumberRangeType {
    return NumberRange.partial().safeParse(value).success;
}

function isDateRange(value: any): value is DateRangeType {
    return DateRange.partial().safeParse(value).success;
}

function isStringRange(value: any): value is StringRangeType {
    return StringRange.partial().safeParse(value).success;
}

export { 
    NumberRange, 
    DateRange, 
    StringRange,
    isNumberRange,
    isDateRange,
    isStringRange
};