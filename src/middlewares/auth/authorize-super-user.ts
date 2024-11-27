import {Request, Response, NextFunction} from 'express';
import Role from '../../types/enums/role';

const AuthoriseSuperUser = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    const user = req.body.user;
    if(!user || user.role !== Role.ADMIN) {
        res.status(403).json({
            success: false,
            message: 'Forbidden'
        });
    }
    next();
}

export default AuthoriseSuperUser;
