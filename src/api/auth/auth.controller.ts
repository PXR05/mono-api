import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { session, signIn, signUp } from "./auth.schema";
import { getJwtTokens } from "./auth.utils";
import { authService } from "./auth.service";
import { responseSuccess } from "../utils";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";

export const auth = new Elysia({ prefix: "/auth", tags: ["Auth"] })
  .use(authService)
  .get(
    "/me",
    ({ user, cookie: { accessToken, refreshToken } }) => ({
      user,
      accessToken,
      refreshToken,
    }),
    {
      authenticated: true,
      detail: {
        summary: "Get current user",
        responses: {
          200: {
            description: "Current user information retrieved successfully",
          },
        },
      },
    }
  )
  .post(
    "/sign-out",
    async ({ cookie: { accessToken, refreshToken }, user, error }) => {
      if (!user) {
        error(401, {
          success: false,
          message: "Not authenticated",
        });
      }

      accessToken.remove();
      refreshToken.remove();

      await db.update(users)
        .set({
          refreshToken: null,
          isOnline: false,
        })
        .where(eq(users.id, user!.id));
    },
    {
      cookie: t.Optional(session),
      detail: {
        summary: "Sign out a user",
        responses: {
          200: {
            description: "User signed out successfully",
          },
          401: {
            description: "Not authenticated",
          },
        },
      },
    }
  )
  .post(
    "/refresh",
    async ({ jwt, cookie: { accessToken, refreshToken }, error }) => {
      if (!accessToken || !refreshToken)
        return error(400, {
          success: false,
          message: "Missing tokens",
        });

      if (refreshToken.value === undefined)
        return error(400, {
          success: false,
          message: "Missing tokens",
        });

      const verfied = await jwt.verify(refreshToken.value);
      if (!verfied)
        return error(401, {
          success: false,
          message: "Invalid refresh token",
        });

      const id = verfied.sub;
      if (!id) {
        return error(401, {
          success: false,
          message: "Invalid token payload",
        });
      }
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user)
        return error(401, {
          success: false,
          message: "Invalid refresh token",
        });

      const { jwtAccess, jwtRefresh } = await getJwtTokens(
        user,
        jwt,
        accessToken,
        refreshToken
      );

      await db.update(users)
        .set({
          refreshToken: jwtRefresh,
        })
        .where(eq(users.id, user.id));

      return responseSuccess({
        success: true,
        message: "Refreshed",
        data: {
          accessToken: jwtAccess,
        },
      });
    },
    {
      cookie: t.Optional(session),
      detail: {
        summary: "Refresh user tokens",
        responses: {
          200: {
            description: "Tokens refreshed successfully",
          },
          400: {
            description: "Missing tokens",
          },
          401: {
            description: "Invalid refresh token",
          },
        },
      },
    }
  )
  .post(
    "/sign-up",
    async ({ body, jwt, cookie: { accessToken, refreshToken }, error }) => {
      const { email, username, password } = body;

      const exist = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (exist)
        return error(409, {
          success: false,
          message: "User already exists",
        });

      const hashed = await Bun.password.hash(password);
      const [user] = await db.insert(users)
        .values({
          email,
          username,
          password: hashed,
        })
        .returning();

      const { jwtAccess, jwtRefresh } = await getJwtTokens(
        user,
        jwt,
        accessToken,
        refreshToken
      );

      const [updatedUser] = await db.update(users)
        .set({
          refreshToken: jwtRefresh,
          isOnline: true,
        })
        .where(eq(users.id, user.id))
        .returning();

      return responseSuccess({
        success: true,
        message: "User signed up",
        data: {
          user: updatedUser,
          accessToken: jwtAccess,
        },
      });
    },
    {
      body: signUp,
      detail: {
        summary: "Sign up a new user",
        responses: {
          200: {
            description: "User signed up successfully",
          },
          409: {
            description: "User already exists",
          },
        },
      },
    }
  )
  .post(
    "/sign-in",
    async ({ body, jwt, cookie: { accessToken, refreshToken }, error }) => {
      if (!body.email || !body.password)
        return error(400, {
          success: false,
          message: "Missing email or password",
        });

      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (!user)
        return error(401, {
          success: false,
          message: "Invalid email or password",
        });
        
      const valid = await Bun.password.verify(body.password, user.password);

      if (!valid) {
        return error(401, {
          success: false,
          message: "Invalid email or password",
        });
      }

      const { jwtAccess, jwtRefresh } = await getJwtTokens(
        user,
        jwt,
        accessToken,
        refreshToken
      );

      const [updatedUser] = await db.update(users)
        .set({
          refreshToken: jwtRefresh,
          isOnline: true,
        })
        .where(eq(users.id, user.id))
        .returning();

      return responseSuccess({
        success: true,
        message: "User signed in",
        data: {
          user: updatedUser,
          accessToken: jwtAccess,
        },
      });
    },
    {
      body: signIn,
      detail: {
        summary: "Sign in a user",
        responses: {
          200: {
            description: "User signed in successfully",
          },
          400: {
            description: "Missing email or password",
          },
          401: {
            description: "Invalid email or password",
          },
        },
      },
    }
  );
