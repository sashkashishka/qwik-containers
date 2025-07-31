import fastifyStatic from "@fastify/static";
import fastifyPlugin from "fastify-plugin";

// NOTE: this is import of build.server command's output
import { WIDGET } from "../../constants.js";
import { renderWidget } from "../../dist/server/ssr.js";

const prefix = `/w/${WIDGET}`;

const qwikPlugin = async (fastify, options) => {
  const { buildDir, outputDir, distDir, assetsDir } = options;

  fastify.register(fastifyStatic, {
    root: outputDir,
    prefix: `${prefix}/c/`,
    immutable: true,
    maxAge: "1y",
    decorateReply: false,
  });

  fastify.register(fastifyStatic, {
    root: buildDir,
    prefix: `${prefix}/build`,
    immutable: true,
    maxAge: "1y",
    decorateReply: false,
  });

  fastify.register(fastifyStatic, {
    root: assetsDir,
    prefix: `${prefix}/assets`,
    immutable: true,
    maxAge: "1y",
  });

  fastify.register(fastifyStatic, {
    root: distDir,
    prefix: `${prefix}`,
    redirect: false,
    decorateReply: false,
  });

  fastify.removeAllContentTypeParsers();

  fastify.setNotFoundHandler(async (request, response) => {
    try {
      response.type("text/html; charset=utf-8");

      const { readable, writable } = new TextEncoderStream();

      const stream = writable.getWriter();

      const p = renderWidget({
        stream,
        serverData: JSON.parse(request.query.serverData || "{}"),
        qwikLoader: {
          include: "never",
        },
        base: `${prefix}/build`,
      });

      response.send(readable);

      await p;
      await stream.ready;
      await stream.close();
    } catch (error) {
      fastify.log.error(error);
      response.code(500).send({ error: "Internal Server Error" });
    }
  });
};

export default fastifyPlugin(qwikPlugin, { fastify: ">=4.0.0 <6.0.0" });
