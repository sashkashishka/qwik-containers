let lastInstanceId = "";

export const fixRemotePathsInDevMode = (
  rawHtml: string,
  base = "",
): { html: string; base: string } => {
  let html = rawHtml;
  if (import.meta.env.DEV) {
    const instanceId = html.match(/q:instance="(\w+)"/m);
    if (instanceId) {
      lastInstanceId = instanceId[1];
    }

    html = html.replace(/q:base="([^\/]+)\/build\/?"/gm, (match, child) => {
      base = child;
      // console.log('FOUND', base);
      return match;
    });
    html = html.replace(/from "\/src/gm, () => {
      // console.log('REPLACE', path);
      return `from "/${base}/src`;
    });
    html = html.replace(/="(\/src\/([^"]+))"/gm, (_, path) => {
      // console.log('REPLACE', path);
      return '="' + base + path + '"';
    });
    html = html.replace(/"\\u0002(\/src\/([^"]+))"/gm, (_, path) => {
      // console.log('REPLACE', path);
      return '"\\u0002' + base + path + '"';
    });
  }
  html = fixErroredHostClash(html, base);
  html = fixImageWarningClash(html, base);
  return { html, base };
};

const fixErroredHostClash = (html: string, base: string) =>
  html
    .replace(/ErroredHost/gm, `ErroredHost${lastInstanceId}`)
    .replace(/errored-host/gm, `errored-host-${lastInstanceId}`);

const fixImageWarningClash = (html: string, base: string) =>
  html.replace(/image-warning/gm, `image-warning-${lastInstanceId}`);

// NOTE: this is a try to make a client side SSR (to fetch SSR html and embed it to the client)
// there are issues with react widget - it always catches hydration errors for some reason
export const writeHtml = (root: HTMLElement, html: string) => {
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(html, "text/html");
  let scripts = [
    ...htmlDocument.querySelectorAll("script"),
    { innerHTML: "console.log(123)", attributes: [] },
    { innerHTML: "var e=document.querySelectorAll('[on\\\\:qvisible]');if(e.length){const o=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.dispatchEvent(new CustomEvent('qvisible')),o.unobserve(e.target))})});e.forEach(e=>o.observe(e))}", attributes: [] },
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

export async function getClientStream(targetNode, endpoint, options = {}) {
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
    let base = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      const fixedHtmlObj = fixRemotePathsInDevMode(chunk, base);
      base = fixedHtmlObj.base;
      buffer += fixedHtmlObj.html;
    }
  } catch (error) {
    console.error("Streaming error:", error);
    buffer = `<div style="color: red;">Error loading content: ${error.message}</div>`;
  } finally {
    writeHtml(targetNode, buffer);
  }
}

export async function fetchAndExecuteModule(moduleUrl: string, options = {}) {
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

export function getSSRStreamFunction(remoteUrl: string, host: string) {
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

    let base = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      const rawHtml = decoder.decode(value);

      const fixedHtmlObj = fixRemotePathsInDevMode(rawHtml, base);
      // console.log(base)
      base = fixedHtmlObj.base;
      stream.write(fixedHtmlObj.html);
    }
  };
}
