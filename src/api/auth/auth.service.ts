import jwt from "@elysiajs/jwt";
import Elysia from "elysia";
import { db } from "../../database/connection";

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
    const user = await db.user.findUnique({
      where: {
        id,
      },
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
