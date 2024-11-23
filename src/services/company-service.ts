import DbTable from "../enums/db-table";
import HttpStatusCode from "../enums/http-status-codes";
import { CompanyRepository } from "../repositories/company-repository";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { GeneralAppResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { CompanySchema, CompanyType } from "../types/zod/company-entity";
import { v4 as uuidv4 } from 'uuid';

export class CompanyService {

    private static companyRepository: CompanyRepository = new CompanyRepository(DbTable.COMPANIES);

    public static async createCompany(companyData: Omit<CompanyType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<CompanyType>> {
        
        const company: CompanyType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...companyData
        };

        // Validate company data
        const validationResult = CompanySchema.safeParse(company);

        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid company data',
                success: false
            };
        }

        let response: GeneralAppResponse<CompanyType> = await CompanyService.companyRepository.create(company);

        if (isGeneralAppResponse(response)) {
            return response;
        }

        return response;
    }


    public static async findByParams(companyFields: Partial<CompanyType>): Promise<GeneralAppResponse<CompanyType[]>> {

        const validationResult = CompanySchema.partial().safeParse(companyFields);

        if(!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid company data',
                success: false
            };
        }

        companyFields = validationResult.data;
        return await CompanyService.companyRepository.findByParams(companyFields);
    }
}