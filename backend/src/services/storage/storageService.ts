import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageUploadResult {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  provider: 'local' | 'cloudinary' | 'supabase';
}

export class StorageService {
  /**
   * Save an uploaded file either to persistent cloud storage (Cloudinary / Supabase)
   * or to local disk storage if cloud credentials are not supplied.
   */
  public static async saveUploadedFile(file: Express.Multer.File): Promise<StorageUploadResult> {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext) ? ext : '.jpg';
    const uniqueFilename = `evidence-${Date.now()}-${uuidv4().slice(0, 8)}${cleanExt}`;

    // 1. Cloudinary Object Storage
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'roadguard_preset';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && (uploadPreset || (apiKey && apiSecret))) {
      try {
        const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
        if (fileBuffer) {
          const base64Data = `data:${file.mimetype};base64,${fileBuffer.toString('base64')}`;
          const formData = new URLSearchParams();
          formData.append('file', base64Data);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'roadguard_evidence');

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const json: any = await uploadRes.json();
            if (json.secure_url) {
              return {
                url: json.secure_url,
                filename: uniqueFilename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                provider: 'cloudinary',
              };
            }
          }
        }
      } catch (err) {
        console.warn('[StorageService] Cloudinary upload encountered error, falling back to local:', err);
      }
    }

    // 2. Supabase Storage Bucket
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'roadguard-evidence';

    if (supabaseUrl && supabaseKey) {
      try {
        const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
        if (fileBuffer) {
          const uploadRes = await fetch(
            `${supabaseUrl}/storage/v1/object/${bucket}/${uniqueFilename}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                'Content-Type': file.mimetype,
              },
              body: new Uint8Array(fileBuffer) as unknown as BodyInit,
            }
          );

          if (uploadRes.ok) {
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${uniqueFilename}`;
            return {
              url: publicUrl,
              filename: uniqueFilename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              provider: 'supabase',
            };
          }
        }
      } catch (err) {
        console.warn('[StorageService] Supabase upload encountered error, falling back to local:', err);
      }
    }

    // 3. Local Disk Storage (Default fallback)
    const localUploadDir = path.resolve(__dirname, '../../../uploads');
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }

    let finalFilename = uniqueFilename;
    if (file.path && fs.existsSync(file.path)) {
      finalFilename = path.basename(file.path);
    } else if (file.buffer) {
      const destination = path.join(localUploadDir, uniqueFilename);
      fs.writeFileSync(destination, file.buffer);
    }

    return {
      url: `/uploads/${finalFilename}`,
      filename: finalFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      provider: 'local',
    };
  }
}
