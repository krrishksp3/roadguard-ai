import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storage/storageService';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext) ? ext : '.jpg';
    const uniqueName = `evidence-${Date.now()}-${uuidv4().slice(0, 8)}${cleanExt}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WebP, and SVG road photos are supported.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Accept image under 'image', 'photo', or 'file'
const uploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, message: 'Photo size exceeds 10MB limit. Please choose a smaller photo.' });
        return;
      }
      res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      return;
    } else if (err) {
      res.status(400).json({ success: false, message: err.message || 'File upload failed' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const uploadedFile =
      files?.image?.[0] || files?.photo?.[0] || files?.file?.[0] || (req.file as Express.Multer.File | undefined);

    if (!uploadedFile) {
      res.status(400).json({ success: false, message: 'No road photo file provided.' });
      return;
    }

    StorageService.saveUploadedFile(uploadedFile)
      .then((result) => {
        res.status(201).json({
          success: true,
          message: 'Road photo uploaded successfully',
          data: {
            url: result.url,
            filename: result.filename,
            originalName: result.originalName,
            mimeType: result.mimeType,
            size: result.size,
            storageProvider: result.provider,
          },
        });
      })
      .catch((err) => {
        next(err);
      });
  });
});

export default router;
