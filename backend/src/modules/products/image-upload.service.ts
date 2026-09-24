import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { MultipartFile } from '@fastify/multipart';
import { BadRequestError } from '../../common/errors/app-error.js';
import { uploadsDir } from '../../app.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** Saves an uploaded image to disk and returns the URL it's servable at. */
export async function saveProductImage(file: MultipartFile, publicOrigin: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestError('Only JPEG, PNG, WebP, or GIF images are allowed.');
  }

  await mkdir(uploadsDir, { recursive: true });
  const filename = `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`;
  const destination = path.join(uploadsDir, filename);

  try {
    await pipeline(file.file, createWriteStream(destination));
  } catch {
    // @fastify/multipart throws on the stream itself if the file exceeds the configured limit.
    throw new BadRequestError('Image upload failed — it may exceed the 5MB size limit.');
  }
  if (file.file.truncated) {
    throw new BadRequestError('Image exceeds the 5MB size limit.');
  }

  return `${publicOrigin}/uploads/${filename}`;
}
