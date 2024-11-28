import { InviteRepository } from "../repositories/invites-repository";
import HttpStatusCode from "../types/enums/http-status-codes";
import { ZodParsingError } from "../types/error/zod-parsing-error";
import { GeneralAppResponse, isGeneralAppFailureResponse } from "../types/response/general-app-response";
import { InviteSchema, InviteSearchOptions, InviteSearchSchema, InviteType } from "../types/zod/invite-entity";
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from "./email-service";
import { User } from "../types/zod/user-entity";
import { UserService } from "./user-service";
import { DataNotFoundError } from "../types/error/data-not-found-error";
import { emailInviteTemplate } from "../templates/email-invite";

export class InviteService {

    private static inviteRepository: InviteRepository = new InviteRepository();
    private static emailService: EmailService = EmailService.getInstance();

    public static async sendAndCreateInvite(inviteData: Omit<InviteType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<InviteType>> {
        
        let invite: InviteType = {
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...inviteData
        }

        // Validate invite data
        const validationResult = InviteSchema.safeParse(invite);
        if (!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid invite data',
                success: false
            };
        }
        invite = validationResult.data;

        // SEND EMAIL INVITE
        let emailResponse: GeneralAppResponse<void> = await InviteService.sendEmailInvite(invite);
        if(isGeneralAppFailureResponse(emailResponse)) {
            return emailResponse;
        }

        // CREATE INVITE IN DB
        let response: GeneralAppResponse<InviteType> = await InviteService.inviteRepository.create(invite);
        return response;
    }

    private static async sendEmailInvite(invite: InviteType) : Promise<GeneralAppResponse<void>> {
        const candidateDetailsResponse: GeneralAppResponse<User> = await InviteService.fetchCandidateDetails(invite.candidateId);
        if(isGeneralAppFailureResponse(candidateDetailsResponse)) {
            return candidateDetailsResponse;
        }
        const candidateDetails: User = candidateDetailsResponse.data;
        const emailSubject: string = 'You have been invited to apply for a job';
        const emailText: string = emailInviteTemplate(invite.jobId, candidateDetails.firstName);
        return await InviteService.emailService.sendEmail(candidateDetails.email, emailSubject, emailText);
    }

    private static async fetchCandidateDetails(candidateId: string) : Promise<GeneralAppResponse<User>> {
        // Fetch candidate details using UserService
        const userResponse : GeneralAppResponse<User[]> = await UserService.findUsersByParams({id: candidateId});
        if(isGeneralAppFailureResponse(userResponse)) {
           return userResponse;
        }
        if(userResponse.data.length === 0) {
            const error: DataNotFoundError = new Error('Candidate not found') as DataNotFoundError;
            error.errorType = 'DataNotFoundError';
            return {
                error: error,
                statusCode: HttpStatusCode.NOT_FOUND,
                businessMessage: 'Candidate not found',
                success: false
            };
        }
        return { data: userResponse.data[0], success: true };
    }

    public static async findByParams(inviteFields: Partial<InviteSearchOptions>): Promise<GeneralAppResponse<InviteType[]>> {
        
        const validationResult = InviteSearchSchema.partial().safeParse(inviteFields);
        if(!validationResult.success) {
            let zodError: ZodParsingError = validationResult.error as ZodParsingError;
            zodError.errorType = 'ZodParsingError';
            return {
                error: zodError,
                statusCode: HttpStatusCode.BAD_REQUEST,
                businessMessage: 'Invalid invite data',
                success: false
            };
        }

        inviteFields = validationResult.data;
        return await InviteService.inviteRepository.findByParams(inviteFields);
    }

}