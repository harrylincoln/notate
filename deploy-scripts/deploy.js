import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { createUploadPlan } from './upload-plan.js';

// Validate configuration before any uploads; never publish without being able to invalidate.
for (const name of ['AWS_DEFAULT_REGION', 'AWS_CLOUDFRONT_DIST_ID']) {
  if (!process.env[name]?.trim()) throw new Error(`Missing required deployment configuration: ${name}`);
}
const region = process.env.AWS_DEFAULT_REGION;
const s3 = new S3Client({ region });
const cloudfront = new CloudFrontClient({ region });
const objects = await createUploadPlan('./build');
for (const object of objects) {
  await s3.send(new PutObjectCommand({ Bucket: 'notate-app', ...object }));
}
// Invalidate only after every object has been uploaded successfully.
await cloudfront.send(new CreateInvalidationCommand({
  DistributionId: process.env.AWS_CLOUDFRONT_DIST_ID,
  InvalidationBatch: {
    CallerReference: Date.now().toString(),
    Paths: { Quantity: 1, Items: ['/*'] },
  },
}));
console.log(`Uploaded ${objects.length} objects and requested cache invalidation.`);
