import { v2 as cloudinary } from "cloudinary";

type BufferedImage = { buffer: Buffer };

function configureCloudinary() {
  const value = process.env.CLOUDINARY_URL;
  if (!value) {
    throw new Error("CLOUDINARY_URL is not set in the operations-service environment.");
  }

  let credentials: URL;
  try {
    credentials = new URL(value);
  } catch {
    throw new Error("CLOUDINARY_URL must use cloudinary://<api_key>:<api_secret>@<cloud_name>.");
  }

  if (credentials.protocol !== "cloudinary:" || !credentials.hostname || !credentials.username || !credentials.password) {
    throw new Error("CLOUDINARY_URL must use cloudinary://<api_key>:<api_secret>@<cloud_name>.");
  }

  cloudinary.config({
    cloud_name: credentials.hostname,
    api_key: decodeURIComponent(credentials.username),
    api_secret: decodeURIComponent(credentials.password),
    secure: true,
  });
}

export async function uploadHotelImage(file: BufferedImage) {
  configureCloudinary();
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "stayease/hotels", resource_type: "image", unique_filename: true },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary returned an incomplete image result."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    ).end(file.buffer);
  });
}
