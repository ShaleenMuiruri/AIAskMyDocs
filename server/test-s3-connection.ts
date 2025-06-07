import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '../.env.local' });

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Use the existing S3 client configuration pattern from s3.ts
const s3 = new S3Client({
  region: "eu-north-1", // Using the same region as in s3.ts
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function testS3Connection() {
  console.log("Testing S3 connection...");
  
  if (!BUCKET_NAME) {
    console.error("Error: S3_BUCKET_NAME environment variable is not set");
    return;
  }

  try {
    // Attempt to list objects (max 1) in the bucket
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1, // Only fetch one object to minimize response size
    });

    const response = await s3.send(command);
    
    // Check if the response was successful
    if (response.$metadata.httpStatusCode === 200) {
      console.log("✅ S3 connection successful!");
      console.log(`Bucket: ${BUCKET_NAME}`);
      console.log(`Items in bucket: ${response.Contents?.length || 0}`);
      
      if (response.Contents && response.Contents.length > 0) {
        // Only show the key of the first item, not any sensitive content
        console.log(`Sample item key: ${response.Contents[0].Key}`);
      }
    } else {
      console.error(`❌ S3 connection failed with status: ${response.$metadata.httpStatusCode}`);
    }
  } catch (error) {
    console.error("❌ Error connecting to S3:");
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
    } else {
      console.error(String(error));
    }
  }
}

// Run the test
testS3Connection();

