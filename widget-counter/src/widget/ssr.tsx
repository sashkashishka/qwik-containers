import {
  type RenderToStreamOptions,
  renderToStream,
} from "@qwik.dev/core/server";

import { Counter } from "./counter";

interface IOptions extends RenderToStreamOptions {
  attributes?: Record<string, any>;
}

export function renderWidget({
  containerTagName = "div",
  stream,
  serverData,
  ...options
}: IOptions) {
  return renderToStream(<Counter />, {
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
