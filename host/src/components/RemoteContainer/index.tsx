import {
  isBrowser,
  component$,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import { SSRComment, SSRRaw, SSRStream } from "@qwik.dev/core/internal";

// NOTE: this is a try to make a client side SSR (to fetch SSR html and embed it to the client)
// there are issues with react widget - it always catches hydration errors for some reason
const writeHtml = (root: HTMLElement, html: string) => {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");
  let scripts = [...htmlDocument.querySelectorAll("script")];

  scripts = scripts.map((s, i) => {
    const newScript = document.createElement("script");
    for (const { name, value } of s.attributes) {
      newScript.setAttribute(name, value);
    }
    newScript.innerHTML = s.innerHTML;
    s.parentNode?.removeChild(s);
    return newScript;
  });

  root.innerHTML = htmlDocument.documentElement.innerHTML;
  const qwikContainer = document.querySelector(
    `div[${CSS.escape("q:container")}]`,
  );
  if (!qwikContainer) throw new Error("Failed to mount qwik container!");
  // @ts-ignore
  scripts.forEach((s) => qwikContainer.appendChild(s));
};

async function getClientStream(targetNode, endpoint, options = {}) {
  const {
    method = "GET",
    headers = {},
    body = null,
    clearContent = true,
  } = options;

  if (clearContent) {
    targetNode.innerHTML = "";
  }

  let buffer = "";

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        Accept: "text/html",
        ...headers,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
    }
  } catch (error) {
    console.error("Streaming error:", error);
    buffer = `<div style="color: red;">Error loading content: ${error.message}</div>`;
  } finally {
    writeHtml(targetNode, buffer);
  }
}

interface IProps {
  type: string;
  host: string;
}

const StreamingClientRemoteContainer = component$(({ type }: IProps) => {
  const ref = useSignal<HTMLElement>();

  useVisibleTask$(async ({ cleanup }) => {
    getClientStream(
      ref.value,
      `/w/${type}?serverData=${JSON.stringify({ initialState: 12 })}`,
    );
  });

  return <div ref={ref} />;
});

// =========================
// =========================
// SSR
// =========================
// =========================
function getSSRStreamFunction(remoteUrl: string, host: string) {
  return async function* () {
    const url = new URL(remoteUrl, host);

    const reader = (
      await fetch(url, {
        headers: {
          accept: "text/html",
        },
      })
    ).body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      const rawHtml = decoder.decode(value);

      yield <SSRRaw data={rawHtml} />;
    }
  };
}

const SSRRemoteContainer = component$(({ type, host }: IProps) => {
  return (
    <SSRStream>
      {getSSRStreamFunction(
        `/w/${type}?serverData=${JSON.stringify({ initialState: 12 })}`,
        host,
      )}
    </SSRStream>
  );
});

// =========================
// =========================
// RemoteContainer
// =========================
// =========================
export const RemoteContainer = component$(
  ({ type, host }: IProps) => {
    if (isBrowser) {
      return <StreamingClientRemoteContainer type={type} />;
    }

    return <SSRRemoteContainer type={type} host={host} />;
  },
);
