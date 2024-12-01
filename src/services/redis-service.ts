import client from "../db-connection/redis-connect";
import HttpStatusCode from "../types/enums/http-status-codes";
import { RedisError } from "../types/error/redis-error";
import { GeneralAppResponse } from "../types/response/general-app-response";

class RedisService {

    public static async set(key: string, value: string, options: { expiresInMillis?: number } = {}): Promise<GeneralAppResponse<undefined>> {
        try {
            
            let redisOptions: { EX?: number } = {};
            if (options.expiresInMillis) {
                redisOptions.EX = options.expiresInMillis;
            }

            const result: string | null = await client.set(key, value, redisOptions);

            if (result === 'OK') {
                return {
                    data: undefined,
                    success: true
                };
            } else {
                const error: RedisError = new Error('Failed to set value in Redis') as RedisError
                return {
                    error,
                    businessMessage: 'Failed to set value in Redis',
                    success: false,
                    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
                };
            }
        }
        catch (error: any) {
            return {
                error,
                businessMessage: 'Internal Server Error',
                success: false,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
    }

    public static async get(key: string): Promise<GeneralAppResponse<string | null>> {
        try {
            const result: string | null = await client.get(key);
            return {
                data: result,
                success: true
            };
        }
        catch (error: any) {
            return {
                error,
                businessMessage: 'Internal Server Error',
                success: false,
                statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
            };
        }
    }
}

export default RedisService;