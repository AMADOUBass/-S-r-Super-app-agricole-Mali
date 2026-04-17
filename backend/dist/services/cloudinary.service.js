"use strict";
// Service Cloudinary pour l'upload et la compression des photos
// Utilise un storage Multer custom compatible avec cloudinary@v2
// (multer-storage-cloudinary ne supporte que v1)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supprimerPhoto = exports.uploadAudio = exports.uploadPhoto = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ─────────────────────────────────────────────────────────────
// Storage Engine Multer custom pour Cloudinary v2
// ─────────────────────────────────────────────────────────────
class CloudinaryStorageV2 {
    _handleFile(_req, file, cb) {
        const isAudio = file.mimetype.startsWith('audio/') || file.fieldname === 'audio';
        const folder = isAudio ? 'soro/vocals' : (file.fieldname === 'photo' ? 'soro/annonces' : 'soro/avatars');
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: isAudio ? 'video' : 'image', // 'video' is used for audio in Cloudinary v2
            ...(isAudio ? {} : {
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto:low', fetch_format: 'webp' },
                ],
            }),
        }, (error, result) => {
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
        });
        file.stream.pipe(uploadStream);
    }
    _removeFile(_req, file, cb) {
        if (file.filename) {
            cloudinary_1.v2.uploader.destroy(file.filename).then(() => cb(null)).catch(cb);
        }
        else {
            cb(null);
        }
    }
}
// ─────────────────────────────────────────────────────────────
// Middleware Multer avec le storage custom
// Fallback vers memoryStorage si Cloudinary n'est pas configuré
// ─────────────────────────────────────────────────────────────
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'SORO-MALI-AGRO' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;
exports.uploadPhoto = (0, multer_1.default)({
    storage: cloudinaryConfigured ? new CloudinaryStorageV2() : multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Seules les images sont acceptées'));
        }
    },
}).single('photo');
exports.uploadAudio = (0, multer_1.default)({
    storage: cloudinaryConfigured ? new CloudinaryStorageV2() : multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max pour l'audio
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' || file.mimetype === 'application/octet-stream') {
            cb(null, true);
        }
        else {
            cb(null, true); // On est plus indulgent car les navigateurs mobiles envoient des types variés pour les blobs
        }
    },
}).single('audio');
// ─────────────────────────────────────────────────────────────
// Supprimer une photo par son public_id Cloudinary
// ─────────────────────────────────────────────────────────────
const supprimerPhoto = async (photoUrl) => {
    try {
        // Extraire le public_id depuis l'URL Cloudinary
        // URL format: https://res.cloudinary.com/cloud/image/upload/v123/soro/annonces/abc123.webp
        const match = photoUrl.match(/\/soro\/(annonces|avatars|vocals)\/([^.]+)/);
        if (!match)
            return;
        const publicId = `soro/${match[1]}/${match[2]}`;
        await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: match[1] === 'vocals' ? 'video' : 'image' });
    }
    catch (err) {
        console.error('[Cloudinary] Erreur suppression:', err);
    }
};
exports.supprimerPhoto = supprimerPhoto;
//# sourceMappingURL=cloudinary.service.js.map