import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

const isMp4File = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.file && req.file.mimetype !== 'video/mp4') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
            success: false,
            message: 'Invalid file type',
            error: 'Please upload an MP4 file'
        });
    }
    else {
        next();
    }
};

export default isMp4File;