import { component$ } from "@builder.io/qwik";
import { RemoteContainer } from "~/components/RemoteContainer";

export default component$(() => {
  return (
    <div>
      Widget in widget sequential render
      {/* initialState is used as an artificial render delay */}
      <RemoteContainer
        type="widget-in-widget"
        host="http://localhost:4578"
        initialState={1000}
      />
      <RemoteContainer
        type="widget-in-widget"
        host="http://localhost:4578"
        initialState={2000}
      />
      <RemoteContainer
        type="widget-in-widget"
        host="http://localhost:4578"
        initialState={5000}
      />
    </div>
  );
});
