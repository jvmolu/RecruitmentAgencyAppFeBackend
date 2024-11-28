import nodemailer from 'nodemailer';
import { GeneralAppResponse } from '../types/response/general-app-response';
import { EmailSendError } from '../types/error/email-send-error';

export class EmailService {

    private static instance: EmailService;
    private transporter: nodemailer.Transporter;

    private constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    public async sendEmail(to: string, subject: string, text: string): Promise<GeneralAppResponse<void>> {
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                text
            });
            return { data: undefined, success: true };
        } catch (error: any) {
            console.error('Error sending email: ', error);
            const emailError: EmailSendError = new Error('Error sending email') as EmailSendError;
            emailError.errorType = 'EmailSendError';
            return {
                error: emailError,
                businessMessage: 'Error sending email',
                statusCode: 500,
                success: false
            };
        }
    }
}