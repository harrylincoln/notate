import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createUploadPlan } from '../deploy-scripts/upload-plan.js';

it('uploads the guide at its exact canonical route and index alias with identical HTML', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'notate-upload-test-'));
  try {
    await mkdir(path.join(directory, 'sheet-music-to-guitar-tabs'));
    await writeFile(path.join(directory, 'index.html'), 'homepage');
    await writeFile(path.join(directory, 'sheet-music-to-guitar-tabs/index.html'), 'guide');
    const objects = await createUploadPlan(directory);
    const guide = objects.find(object => object.Key === 'sheet-music-to-guitar-tabs/');
    const index = objects.find(object => object.Key === 'sheet-music-to-guitar-tabs/index.html');
    expect(guide.Body.toString()).toBe('guide');
    expect(guide.ContentType).toBe('text/html');
    expect(guide.Body).toEqual(index.Body);
    expect(objects.some(object => object.Key === '')).toBe(false);
  } finally {
    await rm(directory, { recursive: true });
  }
});
