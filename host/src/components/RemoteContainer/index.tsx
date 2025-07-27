import {
  isBrowser,
  component$,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import { SSRRaw, SSRStream, SSRStreamBlock } from "@qwik.dev/core/internal";

import {
  writeHtml,
  getClientStream,
  fetchAndExecuteModule,
  fixRemotePathsInDevMode,
  getSSRStreamFunction,
} from "./utils";

interface IProps {
  type: string;
  host: string;
}

const StreamingClientRemoteContainer = component$(({ type, host }: IProps) => {
  const ref = useSignal<HTMLElement>();

  useVisibleTask$(async ({ cleanup }) => {
    getClientStream(
      ref.value,
      new URL(
        `/w/${type}?serverData=${JSON.stringify({ initialState: 12 })}`,
        import.meta.env.DEV ? host : window.location.origin,
      ),
    );
  });

  return <div ref={ref} />;
});

// =========================
// =========================
// full blown client chunk
// =========================
// =========================

const ClientRemoteContainer = component$(({ type }: IProps) => {
  const ref = useSignal<HTMLElement>();

  useVisibleTask$(async ({ cleanup }) => {
    const { success, module } = await fetchAndExecuteModule(
      `/w/${type}/c/render.js`,
    );

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
      return <StreamingClientRemoteContainer type={type} host={host} />;
    }

    if (isBrowser) {
      return <ClientRemoteContainer type={type} />;
    }

    return <SSRRemoteContainer type={type} host={host} />;
  },
);
