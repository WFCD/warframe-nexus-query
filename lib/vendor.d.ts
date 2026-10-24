declare module 'node-md-config' {
  const md: {
    lineEnd: string;
    codeMulti: string;
    blockEnd: string;
  };
  export default md;
}

declare module 'numeral' {
  interface Numeral {
    format(fmt: string): string;
  }

  function numeral(value?: number | null | undefined): Numeral;
  export default numeral;
}
