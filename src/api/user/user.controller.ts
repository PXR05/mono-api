import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { responseSuccess } from "../utils";
import { authService } from "../auth/auth.service";
import { profile } from "./user.schema";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";

export const user = new Elysia({ prefix: "/user", tags: ["User"] })
  .use(authService)
  .guard({
    authenticated: true,
  })
  .get(
    "/",
    async () => {
      const userList = await db.query.users.findMany();
      return responseSuccess({
        success: true,
        message: "Users found",
        data: {
          users: userList,
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
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
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
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user)
        return error(404, {
          success: false,
          message: "User not found",
        });

      const [updated] = await db
        .update(users)
        .set(body)
        .where(eq(users.id, id))
        .returning();

      return responseSuccess({
        success: true,
        message: "User updated",
        data: updated,
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
