# Qwik containers

This is an example of micro frontend application built in qwik.

It consist of host and 2 widgets. First widget is completely written in qwik.
Second widget is written in react and wrapped in qwikify adapter.

To run this application, install deps in each microfrontend and follow their readme.

## Container in container render approaches

I’ve reviewed several example repos on how to build microfrontends with qwik:
- [qwik-microfrontend-starter](https://github.com/gioboa/qwik-microfrontend-starter/)
- [qwik-tiktok-microfrontends](https://github.com/gioboa/qwik-tiktok-microfrontends)
- [qwik-microfrontend-starter](https://github.com/gioboa/qwik-microfrontend-starter)
- [qwik-dream-demo](https://github.com/gioboa/qwik-dream-demo)
- [workers-web-experiments](https://github.com/cloudflare/workers-web-experiments)

These are great for MPAs, but not for SPA. We have such inputs:
- completely dynamic routing—we have a single route that catches all paths ([...all]) in our host app and it decides what content to render
- we use qwik containers that live separately to render content (compared to components which live directly in the project and are known during build time)

Thus, using qwik city, we don’t know any information about the future components of the page (I know that such information comes with the q-data.json response).

So to render these containers on the client, I came up with these two approaches:

1. **client side SSR** 

This approach mimics SSR on the client: we hit the same endpoint for another container as during real SSR, receive an HTML response, and inject it into the DOM using dangerouslySetInnerHTML.  However, this approach is unreliable. For example, in the linked repo, you can:
* Run the project
* Open either the counter or react routes on the host
* Click the "toggle client-side ssr" button

You’ll observe:
* Weird behavior of the timer after remounting the component—it doesn’t work at all
* Hydration errors in the qwikified React app

Example of this [client-side ssr](https://github.com/sashkashishka/qwik-containers/blob/main/host/src/components/RemoteContainer/index.tsx#L35)


2. **Client-Side Rendering Bundle**

In this approach, aside from generating qwik output for the server and client, I also bundle a third output: a client-only bundle that calls the render method for a specific component on the client.
- [Entrypoint](https://github.com/sashkashishka/qwik-containers/blob/main/widget-counter/src/widget/client.tsx)
- [vite config](https://github.com/sashkashishka/qwik-containers/blob/main/widget-counter/vite.config.ts#L22)
- [Injection on the client](https://github.com/sashkashishka/qwik-containers/blob/main/host/src/components/RemoteContainer/index.tsx#L106)

This approach seems much better, but I’m still concerned about bundle duplication. For instance:
* We SSR a qwik container
* During interaction, it loads its client-side dependencies that are linked to the server bundle
* Then we unmount and mount the component again
* It fetches another set of scripts—those from the client-only bundle—to render the component again

