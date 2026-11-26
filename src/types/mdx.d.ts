declare module '*.mdx' {
  import type { ComponentType, PropsWithChildren } from 'react';
  const MDXComponent: ComponentType<PropsWithChildren>;
  export default MDXComponent;
}
