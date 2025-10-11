import { Storage } from '@google-cloud/storage';
import { GCS_BUCKET, GCS_KEYFILE } from '../config';
import path from 'path';

let storage: Storage | null = null;
if (GCS_BUCKET) {
  storage = new Storage(GCS_KEYFILE ? { keyFilename: path.resolve(process.cwd(), GCS_KEYFILE) } : undefined);
}

export async function uploadFile(localPath: string, destName: string) {
  if (!storage || !GCS_BUCKET) return null;
  const bucket = storage.bucket(GCS_BUCKET);
  await bucket.upload(localPath, { destination: destName });
  // generate signed url
  const file = bucket.file(destName);
  const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 });
  return url;
}
