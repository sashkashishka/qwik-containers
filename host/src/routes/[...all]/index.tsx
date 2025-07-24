import {
  $,
  component$,
  useOnDocument,
  useSignal,
  useStore,
} from "@qwik.dev/core";
import {
  useLocation,
} from "@qwik.dev/router";
import { RemoteContainer } from "~/components/RemoteContainer";

function useMousePosition() {
  const position = useStore({ x: 0, y: 0 });
  useOnDocument(
    "mousemove",
    $((event) => {
      const { x, y } = event as MouseEvent;
      position.x = x;
      position.y = y;
    }),
  );
  return position;
}


export default component$(() => {
  const loc = useLocation();
  const pos = useMousePosition();
  // const openLocal = useSignal(true);
  const openClientSideSsr = useSignal(true);
  // const openClient = useSignal(true);

  return (
    <>
      <div>
        MousePosition: ({pos.x}, {pos.y})
      </div>
      <br />
      <div>Current route: {loc.url.toString()}</div>
      <br />
      <br />
      <code>
        This button allows us mount and unmount SSR component on the client.
        <br />
        1. User requests main page
        <br />
        2. The server renders the specific component
        <br />
        3. On the client there is a need to unmount component and then mount
        again
      </code>
      <br />
      <br />
      <br />
      <br />
      {loc.url.toString().match("counter") && (
        <>
          <button
            onClick$={() => {
              openClientSideSsr.value = !openClientSideSsr.value;
            }}
          >
            toggle client side SSR
          </button>
          <br />
          This is an example of client side SSR
          <br />
          {openClientSideSsr.value && (
            <RemoteContainer
              type="counter"
              host="http://localhost:5567"
            />
          )}
        </>
      )}
    </>
  );
});
