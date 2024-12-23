import {Request, Response, NextFunction} from 'express';
import Role from '../../types/enums/role';
import HttpStatusCode from '../../types/enums/http-status-codes';

const AuthorizeSelf = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try {

        const user = req.body.user;
        let userIdToAccess = req.body.userId;

        // Check route
        if(req.originalUrl.includes('applications') === true) {
            // Fetch Application by ID and take candidate ID
            userIdToAccess = user.id; // FOR NOW THIS WILL BYPASS THIS CHECK IN APPLICATIONS
        }
        else if(req.originalUrl.includes('user-profile') === true) {
            userIdToAccess = req.body.profileSearchFields && req.body.profileSearchFields.userId;
        }

        if(user.role === Role.ADMIN) {
            next();
        }
        else if(user.id === userIdToAccess) {
            next();
        }
        else {
            res.status(HttpStatusCode.FORBIDDEN).json({
                success: false,
                message: 'Only Super Users / Self User are allowed to perform this operation'
            });
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

export default AuthorizeSelf;
