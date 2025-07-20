import {
  isBrowser,
  component$,
  SSRStream,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

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
// full blown client chunk
// =========================
// =========================

async function fetchAndExecuteModule(moduleUrl: string, options = {}) {
  try {
    const module = await import(/* @vite-ignore */ moduleUrl);

    // Return the entire module exports
    return {
      success: true,
      module: module,
      default: module.default,
      exports: Object.keys(module),
    };
  } catch (error) {
    console.error("Failed to import module:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

const ClientRemoteContainer = component$(({ type }: IProps) => {
  const ref = useSignal<HTMLElement>();

  useVisibleTask$(async ({ cleanup }) => {
    const { success, module } = await fetchAndExecuteModule(
      `/w/${type}/c/render.js`,
    );
    console.warn(module);

    if (success) {
      const dispose = await module.render({
        initialState: 10,
        parentNode: ref.value,
      });
      cleanup(() => dispose.cleanup());
    }
  });

  return <div ref={ref} />;
});

// =========================
// =========================
// SSR
// =========================
// =========================
function getSSRStreamFunction(remoteUrl: string, host: string) {
  return async function* (stream: StreamWriter) {
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
      stream.write(rawHtml);
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
  ({ type, host, htmlStreaming }: IProps & { htmlStreaming?: boolean }) => {
    if (isBrowser && htmlStreaming) {
      return <StreamingClientRemoteContainer type={type} />;
    }

    if (isBrowser) {
      return <ClientRemoteContainer type={type} />;
    }

    return <SSRRemoteContainer type={type} host={host} />;
  },
);

// /**
//  * Attempt to get an asset hosted by a fragment service.
//  *
//  * Such asset requests start with `/_fragment/{service-name}/`, which enables us
//  * to choose the appropriate service binding and delegate the request there.
//  */
// export async function tryGetFragmentAsset(
// 	env: Record<string, unknown>,
// 	request: Request
// ) {
// 	const url = new URL(request.url);
// 	const match = /^\/_fragment\/([^/]+)(\/.*)$/.exec(url.pathname);
// 	if (match === null) {
// 		return null;
// 	}
// 	const serviceName = match[1];
// 	const service = env[serviceName];
// 	if (!isFetcher(service)) {
// 		throw new Error("Unknown fragment service: " + serviceName);
// 	}
// 	return await service.fetch(
// 		new Request(new URL(match[2], request.url), request)
// 	);
// }
//
// export async function fetchFragment(
// 	env: Record<string, unknown>,
// 	fragmentName: string,
// 	request: Request
// ) {
// 	const service = env[fragmentName];
// 	if (!isFetcher(service)) {
// 		throw new Error(
// 			`Fragment ${fragmentName} does not have an equivalent service binding.`
// 		);
// 	}
// 	const url = new URL(request.url);
// 	url.searchParams.set("base", `/_fragment/${fragmentName}/`);
// 	const response = await service.fetch(new Request(url, request));
// 	if (response.body === null) {
// 		throw new Error(`Response from "${fragmentName}" request is null.`);
// 	}
// 	return response.body;
// }
//
// function isFetcher(obj: unknown): obj is Fetcher {
// 	return Boolean((obj as Fetcher).fetch);
// }
//
