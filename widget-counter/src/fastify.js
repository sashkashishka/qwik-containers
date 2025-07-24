/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Fastify server when building for production.
 *
 * Learn more about Node.js server integrations here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import Fastify from "fastify";
import path from "node:path";
import FastifyQwik from "./plugins/fastify-qwik.js";

// Directories where the static assets are located
const distDir = path.join(import.meta.dirname, "../dist/client/");
const buildDir = path.join(distDir, "build");
const assetsDir = path.join(distDir, "assets");

// Allow for dynamic port and host
const PORT = parseInt(process.env.PORT ?? "5567");
const HOST = process.env.HOST ?? "0.0.0.0";

const start = async () => {
  // Create the fastify server
  // https://fastify.dev/docs/latest/Guides/Getting-Started/
  const fastify = Fastify({
    logger: true,
  });

  // Enable compression
  // https://github.com/fastify/fastify-compress
  // IMPORTANT NOTE: THIS MUST BE REGISTERED BEFORE THE fastify-qwik PLUGIN
  // await fastify.register(import('@fastify/compress'))

  // Handle Qwik City using a plugin
  await fastify.register(FastifyQwik, { distDir, buildDir, assetsDir });

  // Start the fastify server
  await fastify.listen({ port: PORT, host: HOST });
};

start();
