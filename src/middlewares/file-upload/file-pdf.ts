import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

const IsPdfFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.file && req.file.mimetype !== 'application/pdf') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: 'Invalid file type',
            error: 'Please upload a PDF file'
        });
    }
    else {
        next();
    }
};

export default IsPdfFile;