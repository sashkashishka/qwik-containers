import {
  $,
  Resource,
  component$,
  useServerData,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main component
export default component$(() => {
  const initialState = useServerData<number>("initialState");

  // State management
  const count = useSignal(0);
  const message = useSignal("Hello Qwik!");
  const showDetails = useSignal(false);

  // Click handlers
  const handleIncrement = $(() => {
    count.value++;
  });

  const handleDecrement = $(() => {
    count.value--;
  });

  const handleToggleDetails = $(() => {
    showDetails.value = !showDetails.value;
  });

  const handleMessageChange = $((event: Event) => {
    const target = event.target as HTMLInputElement;
    message.value = target.value;
  });

  const pokemon = useSignal();

  useVisibleTask$(async () => {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon/pikachu");

    await delay(initialState);

    if (response.ok) {
      pokemon.value = response.json();
    } else {
      pokemon.value = Promise.reject();
    }
  });

  return (
    <Resource
      value={pokemon}
      onPending={() => "loading..."}
      onResolved={(data) => (
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
          <h2>Qwik Component Demo</h2>

          <div style={{ display: "flex", gap: "16px" }}>
            <div>
              <img
                src={`https://img.pokemondb.net/artwork/${data?.name || "ditto"}.jpg`}
                width={100}
                height={100}
              />
            </div>

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

          {/* Toggle Details Section */}
          <div>
            <button
              onClick$={handleToggleDetails}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#339af0",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              {showDetails.value ? "Hide" : "Show"} Details
            </button>

            {showDetails.value && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#e7f5ff",
                  borderRadius: "4px",
                  border: "1px solid #339af0",
                }}
              >
                <p>
                  <strong>Counter Value:</strong> {count.value}
                </p>
                <p>
                  <strong>Message:</strong> {message.value}
                </p>
                <p>
                  <strong>Details Visible:</strong> Yes
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      onRejected={() => "error"}
    />
  );
});
