import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { responseSuccess } from "../utils";
import { authService } from "../auth/auth.service";
import { profile } from "./user.schema";

export const user = new Elysia({ prefix: "/user", tags: ["User"] })
  .use(authService)
  .guard({
    authenticated: true,
  })
  .get(
    "/",
    async () => {
      const users = await db.user.findMany();
      return responseSuccess({
        success: true,
        message: "Users found",
        data: {
          users,
        },
      });
    },
    {
      detail: {
        summary: "Get all users",
        responses: {
          200: {
            description: "Users retrieved successfully",
          },
        },
      },
    }
  )
  .guard({
    params: t.Object({ id: t.String() }),
  })
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const user = await db.user.findUnique({
        where: {
          id,
        },
      });

      if (!user)
        return error(404, {
          success: false,
          message: "User not found",
        });

      return responseSuccess({
        success: true,
        message: "User found",
        data: {
          user,
        },
      });
    },
    {
      detail: {
        summary: "Get a user by id",
        responses: {
          200: {
            description: "User retrieved successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, error }) => {
      const user = await db.user.findUnique({
        where: {
          id,
        },
      });

      if (!user)
        return error(404, {
          success: false,
          message: "User not found",
        });

      await db.user.update({
        where: {
          id,
        },
        data: {
          ...body,
        },
      });

      return responseSuccess({
        success: true,
        message: "User updated",
      });
    },
    {
      body: t.Partial(profile),
      detail: {
        summary: "Update a user by id",
        responses: {
          200: {
            description: "User updated successfully",
          },
          404: {
            description: "User not found",
          },
        },
      },
    }
  );
