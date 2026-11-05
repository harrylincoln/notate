import { beforeEach, afterEach, vi } from 'vitest';

const { upload, invalidate, plan, s3Config, cloudfrontConfig } = vi.hoisted(() => ({
  upload: vi.fn(), invalidate: vi.fn(), plan: vi.fn(), s3Config: vi.fn(), cloudfrontConfig: vi.fn(),
}));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class { constructor(config) { s3Config(config); } send = upload; },
  PutObjectCommand: class { constructor(input) { this.input = input; } },
}));
vi.mock('@aws-sdk/client-cloudfront', () => ({
  CloudFrontClient: class { constructor(config) { cloudfrontConfig(config); } send = invalidate; },
  CreateInvalidationCommand: class { constructor(input) { this.input = input; } },
}));
vi.mock('../deploy-scripts/upload-plan.js', () => ({ createUploadPlan: plan }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('AWS_DEFAULT_REGION', 'eu-west-2');
  vi.stubEnv('AWS_CLOUDFRONT_DIST_ID', 'test-distribution');
  upload.mockResolvedValue({});
  invalidate.mockResolvedValue({});
  plan.mockResolvedValue([{ Key: 'index.html' }, { Key: 'sheet-music-to-guitar-tabs/' }]);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it('invalidates the entire cache only after every upload completes', async () => {
  const order = [];
  upload.mockImplementation(async command => { order.push(command.input.Key); });
  invalidate.mockImplementation(async () => { order.push('invalidate'); });
  await import('../deploy-scripts/deploy.js');
  expect(order).toEqual(['index.html', 'sheet-music-to-guitar-tabs/', 'invalidate']);
  expect(invalidate.mock.calls[0][0].input).toMatchObject({
    DistributionId: 'test-distribution',
    InvalidationBatch: { Paths: { Quantity: 1, Items: ['/*'] } },
  });
});

it('fails without invalidating when an upload fails', async () => {
  upload.mockRejectedValue(new Error('Upload failed'));
  await expect(import('../deploy-scripts/deploy.js')).rejects.toThrow('Upload failed');
  expect(invalidate).not.toHaveBeenCalled();
});

it('rejects missing invalidation configuration before uploading', async () => {
  vi.stubEnv('AWS_CLOUDFRONT_DIST_ID', '');
  await expect(import('../deploy-scripts/deploy.js')).rejects.toThrow('AWS_CLOUDFRONT_DIST_ID');
  expect(upload).not.toHaveBeenCalled();
  expect(invalidate).not.toHaveBeenCalled();
});


it('uses the configured bucket region for AWS clients', async () => {
  await import('../deploy-scripts/deploy.js');
  expect(s3Config).toHaveBeenCalledWith({ region: 'eu-west-2' });
  expect(cloudfrontConfig).toHaveBeenCalledWith({ region: 'eu-west-2' });
});
