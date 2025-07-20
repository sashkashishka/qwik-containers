import fastifyStatic from "@fastify/static";
import fastifyPlugin from "fastify-plugin";

// NOTE: this is import of build.server command's output
import { renderWidget } from "../../dist/server/ssr.js";

const qwikPlugin = async (fastify, options) => {
  const { buildDir, outputDir, distDir, assetsDir } = options;

  console.log(outputDir)
  fastify.register(fastifyStatic, {
    root: outputDir,
    prefix: "/w/counter/c/",
    immutable: true,
    maxAge: "1y",
    decorateReply: false,
  });

  fastify.register(fastifyStatic, {
    root: buildDir,
    prefix: "/w/counter/build",
    immutable: true,
    maxAge: "1y",
    decorateReply: false,
  });

  fastify.register(fastifyStatic, {
    root: assetsDir,
    prefix: "/w/counter/assets",
    immutable: true,
    maxAge: "1y",
  });

  fastify.register(fastifyStatic, {
    root: distDir,
    prefix: "/w/counter",
    redirect: false,
    decorateReply: false,
  });

  fastify.removeAllContentTypeParsers();

  fastify.setNotFoundHandler(async (request, response) => {
    try {
      response.type("text/html; charset=utf-8");

      const { readable, writable } = new TextEncoderStream();

      const stream = writable.getWriter();

      renderWidget({
        stream,
        serverData: JSON.parse(request.query.serverData || "{}"),
        qwikLoader: {
          include: "never",
        },
        base: '/w/counter/build'
      });

      response.send(readable);

      await stream.ready;
      await stream.close();
    } catch (error) {
      fastify.log.error(error);
      response.code(500).send({ error: "Internal Server Error" });
    }
  });
};

export default fastifyPlugin(qwikPlugin, { fastify: ">=4.0.0 <6.0.0" });
