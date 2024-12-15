import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

const MandateFileUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: 'File not found',
            error: 'Please upload a file'
        });
    }
    else {
        next();
    }
};

export default MandateFileUpload;