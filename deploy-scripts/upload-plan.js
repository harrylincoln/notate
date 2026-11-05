import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { lookup } from 'mime-types';

// Make trailing-slash routes actual S3 objects as well as directory indexes.
// This works with REST origins without requiring a CloudFront rewrite.
export async function createUploadPlan(directory, prefix = '') {
  const objects = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    const key = prefix + entry.name;
    if (entry.isDirectory()) {
      objects.push(...await createUploadPlan(source, `${key}/`));
    } else {
      const object = { Key: key, Body: await readFile(source), ContentType: lookup(source) || 'application/octet-stream' };
      objects.push(object);
      if (key !== 'index.html' && key.endsWith('/index.html')) {
        objects.push({ ...object, Key: key.slice(0, -'index.html'.length) });
      }
    }
  }
  return objects;
}
