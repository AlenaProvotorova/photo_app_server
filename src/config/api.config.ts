export const API_CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  cloudinaryBaseUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  uploadsPath: 'uploads', // папка в Cloudinary
  watermarksPath: 'watermarks', // папка в Cloudinary
};
