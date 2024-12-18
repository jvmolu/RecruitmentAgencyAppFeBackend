import multer from 'multer';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import HttpStatusCode from '../../types/enums/http-status-codes';

dotenv.config({ path: __dirname + '/./../../.env' });

const memoryStorage = multer.memoryStorage();

const imageSizeLimit = Number(process.env.MULTER_IMAGE_SIZE_LIMIT) || 5 * 1024 * 1024; // Default to 5MB
const videoSizeLimit = Number(process.env.MULTER_VIDEO_SIZE_LIMIT) || 50 * 1024 * 1024; // Default to 50MB
const pdfSizeLimit = Number(process.env.MULTER_PDF_SIZE_LIMIT) || 10 * 1024 * 1024; // Default to 10MB

const fileSizeFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  
  const contentLength = req.headers['content-length'];
  if (!contentLength) {
    cb(new Error('Missing content-length header'));
    return;
  }
  
  const fileSize = parseInt(contentLength, 10);
  if (isNaN(fileSize)) {
    cb(new Error('Invalid content-length header'));
    return;
  }

  if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
    console.log('Image size: ' + fileSize);
    if (fileSize > imageSizeLimit) {
      cb(new Error('Image size limit exceeded.'));
    } else {
      cb(null, true);
    }
  } else if (file.mimetype === 'video/mp4') {
    console.log('Video size: ' + fileSize);
    if (fileSize > videoSizeLimit) {
      cb(new Error('Video size limit exceeded.'));
    } else {
      cb(null, true);
    }
  } else if (file.mimetype === 'application/pdf') {
    console.log('PDF size: ' + fileSize);
    if (fileSize > pdfSizeLimit) {
      cb(new Error('PDF size limit exceeded.'));
    } else {
      cb(null, true);
    }
  } else {
    cb(new Error('Invalid file type.'));
  }
};

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
  fileSizeFilter(req, file, cb);
};

const uploadAlert = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
}).single('file');

const MulterRequestParser = (req: Request, res: Response, next: NextFunction): void => {
  uploadAlert(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: err.message, success: false });
      } else {
        // An unknown error occurred when uploading.
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: err.message, success: false });
      }
    } else {
      // Custom Logic - Whenever file is sent - form data is being sent - get actual body in a stringified format
      // Everything went fine - GET STRINGIFIED REQUEST BODY AND PARSE IT AND ADD IT TO THE REQUEST BODY
      const requestBody = JSON.parse(req.body.body);
      // Add Everything in this body to the request body
      for (const key in requestBody) {
          req.body[key] = requestBody[key];
      }
      delete req.body.body;
      next();
    }
  });
};

export default MulterRequestParser;