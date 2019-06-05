declare module '@skygeario/globby' {
  const globby: (
    patterns: string,
    options?: {
      dot?: boolean;
      gitignore?: boolean;
      gitignoreName?: string;
    }
  ) => Promise<string[]>;

  export default globby;
}
