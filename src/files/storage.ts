import { v2 as cloudinary } from 'cloudinary';
// @ts-expect-error why
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import * as multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const fileExtName = file.originalname.split('.').pop();
    const publicId = Array(18)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');

    return {
      folder: 'uploads',
      public_id: publicId,
      format: fileExtName,
      resource_type: 'image',
    };
  },
});

export const upload = multer({ storage: fileStorage });
