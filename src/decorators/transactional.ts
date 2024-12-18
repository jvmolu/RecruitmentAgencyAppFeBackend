import { Pool } from 'pg';
import { PoolClient } from 'pg';
import { BaseRepository } from '../repositories/base-repository';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';

export function Transactional() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Check if a client is already provided
            let client: PoolClient | undefined;
            const lastArg = args[args.length - 1];
            if (
                lastArg &&
                typeof lastArg.query === 'function' && // CHECKING IF THE LAST ARGUMENT IS A POOL CLIENT (It contains a query function and a release function)
                typeof lastArg.release === 'function'
            ) {
                client = lastArg as PoolClient;
                // Remove client from args to avoid passing it twice
                args = args.slice(0, -1);
            } else {
                client = await BaseRepository.pool.connect();
                // Begin transaction only if this is the outermost call
                await client.query('BEGIN');
            }
            try {
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