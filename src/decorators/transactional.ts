import { PoolClient } from 'pg';
import { BaseRepository } from '../repositories/base-repository';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';

export function Transactional() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const client: PoolClient = await BaseRepository.pool.connect();
            try {
                await client.query('BEGIN');
                const result: GeneralAppResponse<any> = await originalMethod.apply(this, [...args, client]);
                // If the result is a failure response, rollback the transaction
                if (isGeneralAppFailureResponse(result)) {
                    await client.query('ROLLBACK');
                    return result;
                } else {
                    await client.query('COMMIT');
                    return result;
                }
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        };

        return descriptor;
    };
}