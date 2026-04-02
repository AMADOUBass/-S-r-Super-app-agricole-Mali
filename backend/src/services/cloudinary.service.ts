// Service Cloudinary pour l'upload et la compression des photos
// Utilise un storage Multer custom compatible avec cloudinary@v2
// (multer-storage-cloudinary ne supporte que v1)

import { v2 as cloudinary } from 'cloudinary';
import multer, { StorageEngine } from 'multer';
import { Request } from 'express';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────────────────────
// Storage Engine Multer custom pour Cloudinary v2
// ─────────────────────────────────────────────────────────────
class CloudinaryStorageV2 implements StorageEngine {
  _handleFile(
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, info?: Partial<Express.Multer.File> & { path?: string; filename?: string }) => void
  ) {
    const folder = file.fieldname === 'photo' ? 'soro/annonces' : 'soro/avatars';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:low', fetch_format: 'webp' },
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          cb(error || new Error('Cloudinary upload failed'));
          return;
        }
        cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          // Taille réelle après compression
          size: result.bytes,
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File & { filename?: string },
    cb: (error: Error | null) => void
  ) {
    if (file.filename) {
      cloudinary.uploader.destroy(file.filename).then(() => cb(null)).catch(cb);
    } else {
      cb(null);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Middleware Multer avec le storage custom
// Fallback vers memoryStorage si Cloudinary n'est pas configuré
// ─────────────────────────────────────────────────────────────
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'SORO-MALI-AGRO' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

export const uploadPhoto = multer({
  storage: cloudinaryConfigured ? new CloudinaryStorageV2() : multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  },
}).single('photo');

// ─────────────────────────────────────────────────────────────
// Supprimer une photo par son public_id Cloudinary
// ─────────────────────────────────────────────────────────────
export const supprimerPhoto = async (photoUrl: string): Promise<void> => {
  try {
    // Extraire le public_id depuis l'URL Cloudinary
    // URL format: https://res.cloudinary.com/cloud/image/upload/v123/soro/annonces/abc123.webp
    const match = photoUrl.match(/\/soro\/(annonces|avatars)\/([^.]+)/);
    if (!match) return;
    const publicId = `soro/${match[1]}/${match[2]}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[Cloudinary] Erreur suppression:', err);
  }
};
