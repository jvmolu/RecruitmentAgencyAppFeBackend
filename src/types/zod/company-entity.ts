import Status from "../../enums/status";
import BaseSchema from "./base-entity";
import { z } from "zod";

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

type CompanyType = z.infer<typeof CompanySchema>

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

export { CompanySchema, CompanyType, Company };