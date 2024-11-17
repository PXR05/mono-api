import jwt from "@elysiajs/jwt";
import Elysia, { error } from "elysia";
import { db } from "../../database/connection";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";

export const authService = new Elysia({ name: "auth/service" })
  .use(
    jwt({
      name: "jwt",
      secret: Bun.env.JWT_SECRET!,
    })
  )
  .derive(async function getUser({ jwt, cookie: { accessToken } }) {
    if (!accessToken) return;
    if (!accessToken.value) return;

    const verfied = await jwt.verify(accessToken.value);
    if (!verfied) return;

    const id = verfied.sub;
    if (!id) return;
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) return;

    return {
      user,
    };
  })
  .macro(({ onBeforeHandle }) => ({
    authenticated(enabled = true) {
      if (!enabled) return;
      onBeforeHandle(({ user, error }) => {
        if (!user)
          return error(401, {
            success: false,
            message: "Unauthorized",
          });
      });
    },
  }))
  .as("plugin");
