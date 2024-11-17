import { UserService } from "../services/user-service";
import {Request, Response} from 'express';
import {ZodError} from 'zod';

export class UserController {

    private static userService: UserService = new UserService();

    public static async createUser(req: Request, res: Response) : Promise<any> {
        try {
            const result = await UserController.userService.createUser(req.body);
            if (!result.success) {
                return res.status(result.error.statusCode).json({
                    success: false,
                    message: result.error.businessMessage
                });
            }
            return res.status(201).json({
                success: true,
                data: result.output
            });
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    public static async findAllUsers(req: Request, res: Response) : Promise<any> {
        try {
            
            console.log('find all users');
            const result = await UserController.userService.findAllUsers();
            console.log(result);

            if (!result.success) {
                return res.status(result.error.statusCode).json({
                    success: false,
                    message: result.error.businessMessage
                });
            }
            return res.status(200).json({
                success: true,
                data: result.output
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}