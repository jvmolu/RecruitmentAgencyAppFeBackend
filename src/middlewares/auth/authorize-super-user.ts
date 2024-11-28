import {Request, Response, NextFunction} from 'express';
import Role from '../../types/enums/role';
import HttpStatusCode from '../../types/enums/http-status-codes';

const AuthoriseSuperUser = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {
        const user = req.body.user;
        if(!user || user.role !== Role.ADMIN) {
            res.status(HttpStatusCode.FORBIDDEN).json({
                success: false,
                message: 'Only Super Users are allowed to perform this operation'
            });
        } else {
            next();
        }
    }
    catch (error) {
        console.log(error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export default AuthoriseSuperUser;
