import DbTable from "../types/enums/db-table";
import HttpStatusCode from "../types/enums/http-status-codes";
import { CompanyRepository } from "../repositories/company-repository";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { GeneralAppResponse, isGeneralAppResponse } from "../types/response/general-app-response";
import { ComapnySearchParams, CompanySchema, CompanySearchOptions, CompanySearchParamsSchema, CompanySearchSchema, CompanyType, CompanyWithJobCount } from "../types/zod/company-entity";
import { v4 as uuidv4 } from 'uuid';

export class CompanyService {

    private static companyRepository: CompanyRepository = new CompanyRepository();

    public static async createCompany(companyData: Omit<CompanyType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<CompanyType>> {
        
        let company: CompanyType = {
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
        company = validationResult.data;

        let response: GeneralAppResponse<CompanyType> = await CompanyService.companyRepository.create(company);
        return response;
    }

    public static async findByParams(
        companyFields: Partial<CompanySearchOptions>,
        companySearchParams: Partial<ComapnySearchParams>
    ): Promise<GeneralAppResponse<CompanyWithJobCount[]>> {

        const validationResult = CompanySearchSchema.partial().safeParse(companyFields);
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

        const companySearchParamsValidationResult = CompanySearchParamsSchema.safeParse(companySearchParams);
        if(!companySearchParamsValidationResult.success) {
            let zodError: ZodParsingError = companySearchParamsValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid company search parameters',
                success: false
            };
        }

        return await CompanyService.companyRepository.findByParams(validationResult.data, companySearchParamsValidationResult.data as ComapnySearchParams);
    }

    public static async updateCompanies(
        companySearchFields: Partial<CompanySearchOptions>,
        companyUpdateFields: Partial<CompanyType>
    ): Promise<GeneralAppResponse<CompanyType[]>> {
        const searchValidationResult = CompanySearchSchema.partial().safeParse(companySearchFields);
        if (!searchValidationResult.success) {
            const zodError = searchValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid search parameters',
                success: false
            };
        }

        const updateValidationResult = CompanySchema.partial().safeParse(companyUpdateFields);
        if (!updateValidationResult.success) {
            const zodError = updateValidationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid update data',
                success: false
            };
        }

        // Update updatedAt as well
        updateValidationResult.data.updatedAt = new Date().toISOString();

        return await this.companyRepository.updateByParams(searchValidationResult.data, updateValidationResult.data);
    }
}