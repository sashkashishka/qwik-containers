import { component$ } from "@builder.io/qwik";
import { RemoteContainer } from "~/components/RemoteContainer";

export default component$(() => {
  return (
    <div>
      static page
      {/* initialState is used as an artificial render delay */}
      <RemoteContainer
        type="widget1"
        host="http://localhost:4577"
        initialState={1000}
      />
      <RemoteContainer
        type="widget1"
        host="http://localhost:4577"
        initialState={2000}
      />
      <RemoteContainer
        type="widget1"
        host="http://localhost:4577"
        initialState={3000}
      />
    </div>
  );
});
