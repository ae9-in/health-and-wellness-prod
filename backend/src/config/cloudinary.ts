import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('Cloudinary Config Debug:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key present:', !!process.env.CLOUDINARY_API_KEY);
console.log('API Secret present:', !!process.env.CLOUDINARY_API_SECRET);

try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} catch (err) {
  console.error('Cloudinary config error:', err);
}

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = 'wellspring', resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<any> => {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.error('CRITICAL: CLOUDINARY_API_KEY is missing in uploadToCloudinary');
    return Promise.reject(new Error('Cloudinary configuration is incomplete: Missing API Key'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload stream error callback:', error);
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    } catch (err) {
      console.error('Cloudinary upload stream sync error:', err);
      reject(err);
    }
  });
};

export default cloudinary;
