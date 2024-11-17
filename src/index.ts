import cors from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import swagger from "@elysiajs/swagger";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { Elysia } from "elysia";
import { auth } from "./api/auth/auth.controller";
import { file } from "./api/file/file.controller";
import { section } from "./api/section/section.controller";
import { user } from "./api/user/user.controller";
import { share } from "./api/share/share.controller";
import { db } from "./database/connection";
import { eq } from "drizzle-orm";
import { keys } from "./database/schema";
import bearer from "@elysiajs/bearer";

const app = new Elysia({ name: "mono" })
  .use(cors())
  .use(
    opentelemetry({
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: "https://api.axiom.co/v1/traces",
            headers: {
              Authorization: `Bearer ${Bun.env.AXIOM_TOKEN}`,
              "X-Axiom-Dataset": Bun.env.AXIOM_DATASET,
            },
          })
        ),
      ],
    })
  )
  .onError(({ error, code }) => {
    switch (code) {
      case "NOT_FOUND":
        return {
          success: false,
          message: "Not found",
          errors: error,
        };
      case "VALIDATION":
        return {
          success: false,
          message: "Validation error",
          errors: error,
        };
      case "PARSE":
        return {
          success: false,
          message: "Parse error",
          errors: error,
        };
      case "INTERNAL_SERVER_ERROR":
        return {
          success: false,
          message: "Internal server error",
          errors: error,
        };
      case "INVALID_COOKIE_SIGNATURE":
        return {
          success: false,
          message: "Invalid cookie signature",
          errors: error,
        };
      case "UNKNOWN":
        return {
          success: false,
          message: "Unknown error",
          errors: error,
        };
      default:
        console.log(error);
        return {
          success: false,
          message: "Unknown error",
          errors: error,
        };
    }
  })
  .use(
    swagger({
      path: "/docs",
      documentation: {
        tags: [
          { name: "Auth" },
          { name: "Section" },
          { name: "File" },
          { name: "User" },
        ],
        info: {
          title: "Mono",
          version: "1.0.0",
          description: "Mono API documentation",
        },
      },
      provider: "scalar",
      scalarConfig: {
        favicon: "https://elysiajs.com/assets/elysia.svg",
      },
      theme: "dark",
      autoDarkMode: true,
    })
  )
  .onTransform(({ path, request: { method, headers } }) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: \x1b[36m${method}\x1b[0m to \x1b[32m${path}\x1b[0m from \x1b[33m${headers.get(
      "origin"
    )}\x1b[0m`;
    console.log(logMessage);
  })
  .use(bearer())
  .guard({
    async beforeHandle({ bearer, error }) {
      if (!bearer) return error(401, "Unauthorized");
      const exist = await db.query.keys.findFirst({
        where: eq(keys.key, bearer),
      });
      if (!exist) return error(401, "Unauthorized");
      return;
    },
  })
  .use(auth)
  .use(user)
  .use(section)
  .use(file)
  .use(share)
  .listen(3000);

console.log(
  `🦊 Elysia is running at \x1b[32m${app.server?.hostname}:${app.server?.port}\x1b[0m`
);
