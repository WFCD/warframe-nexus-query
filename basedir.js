import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const baseDir = dirname(fileURLToPath(import.meta.url));
