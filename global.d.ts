export {};

declare global {
  // Package consumers set this to the install directory before cleanup.
  // eslint-disable-next-line vars-on-top
  var __basedir: string | undefined;
}
