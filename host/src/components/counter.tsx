import {
  component$,
  useServerData,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

const Timer = component$(() => {
  const time = useSignal("time");

  useVisibleTask$(({ cleanup }) => {
    const update = () => (time.value = new Date().toLocaleTimeString());
    const id = setInterval(update, 1000);
    cleanup(() => clearInterval(id));
  });

  return (
    <div>
      <p>Time: {time.value}</p>
    </div>
  );
});

export const Counter = component$(() => {
  const initialState = useServerData<number>("initialState");
  const count = useSignal(initialState || 0);

  return (
    <div>
      <Timer />
      <p>Count: {count.value}</p>
      <p>
        <button
          onClick$={() => {
            const a = "foooooooooooooooo";
            count.value++;
            console.log(a);
          }}
        >
          Increment
        </button>
      </p>
    </div>
  );
});
