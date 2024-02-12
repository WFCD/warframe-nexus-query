import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default dirname(fileURLToPath(import.meta.url));
