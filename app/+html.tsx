import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const customStyles = `
body {
  background-color: #fff;
}
#root {
  padding-top: env(safe-area-inset-top, 0px) !important;
  padding-bottom: env(safe-area-inset-bottom, 0px) !important;
  padding-left: env(safe-area-inset-left, 0px) !important;
  padding-right: env(safe-area-inset-right, 0px) !important;
  box-sizing: border-box !important;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
