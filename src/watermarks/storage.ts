import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as multer from 'multer';

// const generateId = () => {
//   return Array(18)
//     .fill(null)
//     .map(() => Math.round(Math.random() * 16).toString(16))
//     .join('');
// };

// const normalizeFileName = (req, file, cb) => {
//   const fileExtName = file.originalname.split('.').pop();
//   cb(null, `${generateId()}.${fileExtName}`);
// };

// export const fileStorage = diskStorage({
//   destination: './watermarks',
//   filename: normalizeFileName,
// });

export const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const fileExtName = file.originalname.split('.').pop();
    const publicId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return {
      folder: 'watermarks',
      public_id: publicId,
      format: fileExtName,
      resource_type: 'image',
    };
  },
  // filename: normalizeFileName,
});

export const upload = multer({ storage: fileStorage });
