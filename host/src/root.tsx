import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <script
          type="importmap"
          dangerouslySetInnerHTML={`{"imports": {
            "@builder.io/qwik": "https://cdn.jsdelivr.net/npm/@builder.io/qwik@1.14.1/+esm",
            "react": "https://cdn.jsdelivr.net/npm/react@18.2.0/+esm",
            "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm"
          }}`}
        />

        <RouterHead />
      </head>
      <body lang="en">
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
