import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { session, signIn, signUp } from "./auth.schema";
import { getJwtTokens } from "./auth.utils";
import { authService } from "./auth.service";
import { responseSuccess } from "../utils";

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

      await db.user.update({
        where: {
          id: user!.id,
        },
        data: {
          refreshToken: null,
          isOnline: false,
        },
      });
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
      const user = await db.user.findUnique({
        where: {
          id,
        },
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

      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: jwtRefresh,
        },
      });

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

      const exist = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (exist)
        return error(409, {
          success: false,
          message: "User already exists",
        });

      const hashed = await Bun.password.hash(password);
      const user = await db.user.create({
        data: {
          email,
          username,
          password: hashed,
        },
      });

      const { jwtAccess, jwtRefresh } = await getJwtTokens(
        user,
        jwt,
        accessToken,
        refreshToken
      );

      const updatedUser = await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: jwtRefresh,
          isOnline: true,
        },
      });

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

      const user = await db.user.findUnique({
        where: {
          email: body.email,
        },
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

      const updatedUser = await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: jwtRefresh,
          isOnline: true,
        },
      });

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
