import {
  type RenderToStreamOptions,
  renderToStream,
} from "@builder.io/qwik/server";

import { PORT } from "../../constants";

import Widget from "./widget";

interface IOptions extends RenderToStreamOptions {
  attributes?: Record<string, any>;
}

export function renderWidget({
  containerTagName = "div",
  stream,
  serverData,
  ...options
}: IOptions) {
  return renderToStream(<Widget />, {
    streaming: {
      inOrder: {
        strategy: "direct",
      },
    },
    base: import.meta.env.DEV ? `http://localhost:${PORT}/build/` : undefined,
    ...options,
    containerTagName,
    ...(!containerTagName ? { containerAttributes: { lang: "en" } } : {}),
    serverData,
    stream,
    preloader: false,
  });
}

export default renderWidget;
