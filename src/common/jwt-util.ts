import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { AuthError } from '../types/error/auth-error';
import { GeneralAppResponse } from '../types/response/general-app-response';

dotenv.config({ path: __dirname + "/./../../.env" });

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_EXPIRY: string | undefined = process.env.JWT_EXPIRY;

export function generateJWTToken(userId: string) : GeneralAppResponse<string> {
    if(!JWT_SECRET || !JWT_EXPIRY) {
        console.error('JWT_SECRET or JWT_EXPIRY is not defined');
        return {
            error: new Error('JWT_SECRET or JWT_EXPIRY is not defined') as AuthError,
            statusCode: 500,
            businessMessage: 'Internal server error',
            success: false
        }
    }
    return {
        data: jwt.sign({userId: userId}, JWT_SECRET, { expiresIn: JWT_EXPIRY, algorithm: 'HS256' }),
        success: true
    };
}

export function verifyJWTToken(token: string) : GeneralAppResponse<JwtPayload> {
    if(!JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return {
            error: new Error('JWT_SECRET is not defined') as AuthError,
            statusCode: 500,
            businessMessage: 'Internal server error',
            success: false
        }
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        return {
            data: decoded as JwtPayload,
            success: true
        };
    }
    catch(err: any) {
        let error: AuthError = new Error('Error while verifying token') as AuthError;
        error.errorType = 'AuthError';
        switch(err.name) {
            case 'TokenExpiredError':
                error.message = 'Token expired';
                break;
            case 'JsonWebTokenError':
                error.message = 'Invalid token';
                break;
        }
        return {
            error: error,
            statusCode: 401,
            businessMessage: error.message,
            success: false
        }
    }
}

export function getUserIdFromToken(token: string) : GeneralAppResponse<string> {
    const response: GeneralAppResponse<JwtPayload> = verifyJWTToken(token);
    if(response.success) {
        return {
            data: response.data.userId,
            success: true
        };
    }
    return {
        error: response.error,
        statusCode: response.statusCode,
        businessMessage: response.businessMessage,
        success: false
    };
}
