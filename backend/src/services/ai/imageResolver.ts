import fs from 'fs';
import path from 'path';

export interface ResolvedImageBuffer {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Resolves binary image buffer and mime-type from:
 * 1. Base64 Data URL (data:image/...)
 * 2. Local uploaded filesystem files (/uploads/*, demo-evidence/*)
 * 3. Remote HTTP/HTTPS URLs (Cloudinary, external cloud storage)
 */
export async function resolveImageBuffer(
  imageUrl?: string,
  imageFilename?: string
): Promise<ResolvedImageBuffer | null> {
  const url = imageUrl || '';

  // 1. Data URL
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], 'base64'),
      };
    }
  }

  // 2. Local filesystem search
  const candidates = [
    url ? path.basename(url.split('?')[0]) : '',
    imageFilename ? path.basename(imageFilename.split('?')[0]) : '',
  ].filter(Boolean);

  const searchDirs = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'uploads/demo'),
    path.resolve(__dirname, '../../../uploads'),
    path.resolve(__dirname, '../../uploads'),
    path.resolve(__dirname, '../../../../frontend/public/demo-evidence'),
    path.resolve(process.cwd(), '../frontend/public/demo-evidence'),
    path.resolve(process.cwd(), 'frontend/public/demo-evidence'),
  ];

  for (const name of candidates) {
    for (const dir of searchDirs) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) {
        try {
          const buffer = fs.readFileSync(p);
          const ext = path.extname(p).toLowerCase();
          const mimeType =
            ext === '.png'
              ? 'image/png'
              : ext === '.webp'
              ? 'image/webp'
              : ext === '.svg'
              ? 'image/svg+xml'
              : 'image/jpeg';
          return { buffer, mimeType };
        } catch {
          // continue
        }
      }
    }
  }

  // 3. Remote HTTP/HTTPS fetch
  if (/^https?:\/\//i.test(url)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const headerType = res.headers.get('content-type') || 'image/jpeg';
        const mimeType = headerType.split(';')[0].trim();
        return { buffer: Buffer.from(ab), mimeType };
      }
    } catch (err) {
      console.warn(`[imageResolver] Remote image fetch failed for ${url}:`, err);
    }
  }

  return null;
}
