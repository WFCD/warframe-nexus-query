import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Directory containing package.json. Source lives at the repo root; the build emits this file under dist/. */
export default here.endsWith('/dist') ? dirname(here) : here;
