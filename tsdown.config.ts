import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts', 'basedir.ts'],
  dts: true,
});
