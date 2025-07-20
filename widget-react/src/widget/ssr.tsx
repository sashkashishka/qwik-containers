import {
  type RenderToStreamOptions,
  renderToStream,
} from "@builder.io/qwik/server";

import { ReactWidget } from "./react";

interface IOptions extends RenderToStreamOptions {
  attributes?: Record<string, any>;
}

export function renderWidget({
  containerTagName = "div",
  stream,
  serverData,
  ...options
}: IOptions) {
  return renderToStream(<ReactWidget />, {
    streaming: {
      inOrder: {
        strategy: "direct",
      },
    },
    ...options,
    containerTagName,
    ...(!containerTagName ? { containerAttributes: { lang: "en" } } : {}),
    serverData,
    stream,
    preloader: false,
  });
}

export default renderWidget;
