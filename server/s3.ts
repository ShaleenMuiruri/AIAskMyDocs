import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// Initialize S3 client
const s3 = new S3Client({
  region: "eu-north-1", // Hardcoded to eu-north-1 since the env var contains extra text
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID=REMOVED || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY=REMOVED || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Upload file to S3
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const key = `documents/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });
    
    await s3.send(command);
    
    return `s3://${BUCKET_NAME}/${key}`;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error(`Failed to upload file to S3: ${error as Error}.message`);
  }
}

// Generate a signed URL for downloading a file
export async function getSignedDownloadUrl(s3Url: string): Promise<string> {
  try {
    const { bucket, key } = parseS3Url(s3Url);
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    return await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error as Error}.message`);
  }
}

// Delete file from S3
export async function deleteFileFromS3(s3Url: string): Promise<boolean> {
  try {
    const { bucket, key } = parseS3Url(s3Url);
    
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    await s3.send(command);
    
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error(`Failed to delete file from S3: ${error as Error}.message`);
  }
}

// Get file from S3
export async function getFileFromS3(s3Url: string): Promise<Buffer> {
  try {
    const { bucket, key } = parseS3Url(s3Url);
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    const response = await s3.send(command);
    
    if (!response.Body) {
      throw new Error("Empty response body");
    }
    
    // Convert the readable stream to a buffer
    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    console.error("Error getting file from S3:", error);
    throw new Error(`Failed to get file from S3: ${error as Error}.message`);
  }
}

// Helper to parse S3 URL
function parseS3Url(s3Url: string): { bucket: string; key: string } {
  // Parse s3://bucket-name/key format
  if (s3Url.startsWith('s3://')) {
    const withoutProtocol = s3Url.substring(5);
    const firstSlashIndex = withoutProtocol.indexOf('/');
    
    if (firstSlashIndex === -1) {
      throw new Error(`Invalid S3 URL format: ${s3Url}`);
    }
    
    const bucket = withoutProtocol.substring(0, firstSlashIndex);
    const key = withoutProtocol.substring(firstSlashIndex + 1);
    
    return { bucket, key };
  }
  
  throw new Error(`Unsupported S3 URL format: ${s3Url}`);
}
