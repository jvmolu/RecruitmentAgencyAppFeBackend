import Status from "../enums/status";
import BaseSchema, { BaseSearchParams } from "./base-entity";
import { z } from "zod";
import { DateRange } from "./range-entities";

// Define the schema for the Company model
const CompanySchema = BaseSchema.merge(
  z.object({
    name: z.string().min(1, 'Company name must be at least 1 character'),
    website: z.string().url().optional(),
    address: z.string().min(1, 'Company address must be at least 1 character'),
    isPartner: z.boolean().default(false),
    status: z.nativeEnum(Status).default(Status.ACTIVE), // If the status is not provided, default to Active
  })
);

// Company Search Options Schema which allows Wildcard Search for String Fields
const CompanySearchSchema = BaseSchema.merge(
  z.object({
    name: z.string().nullable(),
    website: z.string().nullable(),
    address: z.string().nullable(),
    isPartner: z.boolean().nullable(),
    status: z.nativeEnum(Status).nullable(),

    // Min-Max Options - Handled in repository
    // Range will be like: {min: 0, max: 10}
    createdAtRange: DateRange.optional(),
    updatedAtRange: DateRange.optional()
  })
);

const CompanySearchParamsSchema = BaseSearchParams.merge(
  z.object({
      // I will recieve strings and hence I need transformations which will convert the string to boolean
      isShowNumberOfJobs: z
        .union([z.boolean(), z.string()])
        .default(false)
        .transform((val) => (typeof val === "string" ? val === "true" : val)),
  })
);

type CompanyType = z.infer<typeof CompanySchema>
type CompanySearchOptions = z.infer<typeof CompanySearchSchema>
type ComapnySearchParams = z.infer<typeof CompanySearchParamsSchema>
type CompanyWithJobCount = CompanyType & { jobCount: number | undefined }

class Company implements CompanyType {

  id: string;
  name: string;
  website: string | undefined;
  address: string;
  isPartner: boolean;
  status: Status;
  createdAt: string;
  updatedAt: string;

  constructor(companyData: CompanyType) {

    // This will throw if validation fails
    const validatedCompany = CompanySchema.parse(companyData);

    this.id = validatedCompany.id;
    this.name = validatedCompany.name;
    this.website = validatedCompany.website;
    this.address = validatedCompany.address;
    this.isPartner = validatedCompany.isPartner;
    this.status = validatedCompany.status;
    this.createdAt = validatedCompany.createdAt;
    this.updatedAt = validatedCompany.updatedAt;
  }
}

export { 
  CompanySchema,
  CompanyType,
  Company,
  CompanySearchSchema,
  CompanySearchOptions,
  ComapnySearchParams,
  CompanySearchParamsSchema, 
  CompanyWithJobCount 
};