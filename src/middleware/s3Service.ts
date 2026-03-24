import { Upload } from "@aws-sdk/lib-storage"
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { s3 } from "./s3Client.js"

const BUCKET = process.env.S3_BUCKET_NAME!

export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const key = `uploads/${Date.now()}-${file.originalname}`

  await new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  }).done()

  return key
}

export const generatePresignedUrl = async (
  key: string,
  expiresIn = 60 * 15
): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}

export const deleteFromS3 = async (key: string): Promise<void> => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
