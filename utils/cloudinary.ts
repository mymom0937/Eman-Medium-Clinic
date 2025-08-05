import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload a single image to Cloudinary
 */
export async function uploadImageToCloudinary(
  file: File | Buffer,
  folder: string = 'eman-clinic/drugs'
): Promise<CloudinaryUploadResult> {
  try {
    // Convert File to Buffer if needed
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Resize for consistency
            { quality: 'auto' }, // Optimize quality
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );

      uploadStream.end(buffer);
    });

    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleImagesToCloudinary(
  files: (File | Buffer)[],
  folder: string = 'eman-clinic/drugs'
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map(file => uploadImageToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Get Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations: any[] = []
): string {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
} 