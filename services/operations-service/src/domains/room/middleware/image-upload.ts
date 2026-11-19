import multer from "multer";

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!acceptedImageTypes.has(file.mimetype)) {
      callback(new Error("Choose a JPEG, PNG, WebP, or AVIF image."));
      return;
    }
    callback(null, true);
  },
});
