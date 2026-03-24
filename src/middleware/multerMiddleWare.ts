import multer, { MulterError } from "multer"
import { BadRequestException } from "./exceptions.js"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const uploadPhoto = multer({
  storage: multer.memoryStorage(),

  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        )
      )
    }
    cb(null, true)
  },

  limits: { fileSize: MAX_SIZE_BYTES },
})