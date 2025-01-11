// import { FileParsedRepository } from "../repositories/file-parsed-repository";

// export class FileParsedService {

//   private static repository = new FileParsedRepository();

//   public static async createMatchReport(data: Omit<MatchReportType, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralAppResponse<MatchReportType>> {
//     let matchReport: MatchReportType = {
//       id: uuidv4(),
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       ...data,
//     };

//     const validationResult = MatchReportSchema.safeParse(matchReport);
//     if (!validationResult.success) {
//       const error = validationResult.error as ZodParsingError;
//       error.errorType = 'ZodParsingError';
//       return {
//         error,
//         statusCode: HttpStatusCode.BAD_REQUEST,
//         businessMessage: 'Invalid match report data',
//         success: false,
//       };
//     }

//     return await this.repository.create(validationResult.data);
//   }

//   public static async findByParams(params: Partial<MatchReportSearchOptions>): Promise<GeneralAppResponse<MatchReportType[]>> {
//     const validationResult = MatchReportSearchSchema.safeParse(params);
//     if (!validationResult.success) {
//       const error = validationResult.error as ZodParsingError;
//       error.errorType = 'ZodParsingError';
//       return {
//         error,
//         statusCode: HttpStatusCode.BAD_REQUEST,
//         businessMessage: 'Invalid search parameters',
//         success: false,
//       };
//     }

//     return await this.repository.findByParams(validationResult.data);
//   }
// }