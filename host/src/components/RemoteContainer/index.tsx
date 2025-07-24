import {
  isBrowser,
  component$,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import { SSRRaw, SSRStream, SSRStreamBlock } from "@qwik.dev/core/internal";

// NOTE: this is a try to make a client side SSR (to fetch SSR html and embed it to the client)
// there are issues with react widget - it always catches hydration errors for some reason
const writeHtml = (root: HTMLElement, html: string) => {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");
  let scripts = [
    ...htmlDocument.querySelectorAll("script"),
    { innerHTML: "console.log(123)", attributes: [] },
  ];

  scripts = scripts.map((s) => {
    const newScript = document.createElement("script");
    for (const { name, value } of s.attributes) {
      newScript.setAttribute(name, value);
    }
    newScript.innerHTML = s.innerHTML;
    s.parentNode?.removeChild(s);
    return newScript;
  });

  root.innerHTML = htmlDocument.body.innerHTML;

  const qc = htmlDocument.body.querySelector(
    `div[${CSS.escape("q:container")}]`,
  );

  const instanceId = qc?.attributes["q:instance"].value;

  const qwikContainer = document.querySelector(
    `div[${CSS.escape("q:instance")}="${instanceId}"]`,
  );
  if (!qwikContainer) throw new Error("Failed to mount qwik container!");
  scripts.forEach((s) => qwikContainer.appendChild(s));
};

async function getClientStream(targetNode: any, endpoint: any) {
  targetNode.innerHTML = "";

  let buffer = "";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
    }
  } catch (error: any) {
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

  useVisibleTask$(async () => {
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
export const RemoteContainer = component$(({ type, host }: IProps) => {
  if (isBrowser) {
    return <StreamingClientRemoteContainer type={type} host={host} />;
  }

  return <SSRRemoteContainer type={type} host={host} />;
});
