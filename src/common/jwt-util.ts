import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: __dirname + "/./../../.env" });

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
const JWT_EXPIRY: string | undefined = process.env.JWT_EXPIRY;

export function generateJWTToken(userId: string) {
    if(!JWT_SECRET || !JWT_EXPIRY) {
        console.error('JWT_SECRET or JWT_EXPIRY is not defined');
        throw new Error('JWT_SECRET or JWT_EXPIRY is not defined');
    }
    return jwt.sign({userId: userId}, JWT_SECRET, { expiresIn: JWT_EXPIRY, algorithm: 'HS256' });
}

export function verifyJWTToken(token: string) {
    if(!JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        throw new Error('JWT_SECRET is not defined');
    }
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}
