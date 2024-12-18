import { PoolClient } from 'pg';
import { BaseRepository } from '../repositories/base-repository';
import { GeneralAppResponse, isGeneralAppFailureResponse } from '../types/response/general-app-response';

export function Transactional() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let client: PoolClient;
      let shouldRelease = false;

      const lastArg = args[args.length - 1];
      if (
        lastArg &&
        typeof lastArg.query === 'function' &&
        typeof lastArg.release === 'function'
      ) {
        client = lastArg as PoolClient;
        // Remove client from args to avoid passing it twice
        args = args.slice(0, -1);
      } else {
        client = await BaseRepository.pool.connect();
        shouldRelease = true;
        await client.query('BEGIN');
      }

      try {
        const result: GeneralAppResponse<any> = await originalMethod.apply(this, [...args, client]);
        if (shouldRelease) {
          if (isGeneralAppFailureResponse(result)) {
            await client.query('ROLLBACK');
          } else {
            await client.query('COMMIT');
          }
        }
        return result;
      } catch (error) {
        if (shouldRelease) {
          await client.query('ROLLBACK');
        }
        throw error;
      } finally {
        if (shouldRelease) {
          client.release();
        }
      }
    };

    return descriptor;
  };
}