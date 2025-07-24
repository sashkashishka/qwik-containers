import { component$, Slot } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

import styles from "./layout.module.css";

export default component$(() => {
  return (
    <div>
      <div class={styles.header}>
        Awakening logo
        <div class={styles.links}>
          <Link class={styles.link} href="/">
            home
          </Link>
          <Link class={styles.link} href="/logo">
            logo
          </Link>
          <Link class={styles.link} href="/counter">
            counter
          </Link>
          <Link class={styles.link} href="/react">
            react
          </Link>
        </div>
      </div>
      <br />
      <br />
      <Slot />
    </div>
  );
});
