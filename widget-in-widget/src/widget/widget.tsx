import {
  $,
  component$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { RemoteContainer } from "~/components/RemoteContainer";

export default component$(() => {
  const count = useSignal(0);

  const handleIncrement = $(() => {
    count.value++;
  });

  const handleDecrement = $(() => {
    count.value--;
  });

  const pokemon = useSignal();

  useVisibleTask$(async () => {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu");

    if (response.ok) {
      pokemon.value = response.json();
    } else {
      pokemon.value = Promise.reject();
    }
  });

  return (
    <div
      style={{
        padding: "2rem",
        border: "2px solid #333",
        borderRadius: "8px",
        maxWidth: "400px",
        margin: "2rem auto",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f0f8ff",
        transition: "background-color 0.3s ease",
      }}
    >
      <h2>Qwik widget in widget</h2>

      <RemoteContainer type="widget1" host="http://localhost:4577" />

      {/* Counter Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Counter: {count.value}</h3>
        <div>
          <button
            onClick$={handleDecrement}
            style={{
              padding: "0.5rem 1rem",
              marginRight: "0.5rem",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            -
          </button>
          <button
            onClick$={handleIncrement}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#51cf66",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
});
