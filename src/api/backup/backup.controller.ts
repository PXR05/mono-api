import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";
import { backups } from "../../database/schema";
import { eq } from "drizzle-orm";

export const backup = new Elysia({ prefix: "/backup", tags: ["Backup"] })
  .use(authService)
  .onAfterHandle(({ response, error }) => {
    if (response === null)
      return error(404, {
        success: false,
        message: "Not found",
      });
  })
  .get(
    "/",
    async ({ user }) => {
      const backupList = await db.query.backups.findMany({
        where: eq(backups.authorId, user!.id),
      });
      return responseSuccess({
        success: true,
        message: "Backups found",
        data: backupList,
      });
    },
    {
      authenticated: true,
      detail: {
        summary: "Get all backups for the authenticated user",
        responses: {
          200: {
            description: "Backups retrieved successfully",
          },
        },
      },
    }
  )
  .get(
    "/user/:userId",
    async ({ params: { userId }, error }) => {
      const backupList = await db.query.backups.findMany({
        where: eq(backups.authorId, userId),
      });
      if (backupList.length === 0) {
        return error(404, {
          success: false,
          message: "No backups found for this user",
        });
      }
      return responseSuccess({
        success: true,
        message: "Backups found",
        data: backupList,
      });
    },
    {
      params: t.Object({ userId: t.String() }),
      detail: {
        summary: "Get backups by user ID",
        responses: {
          200: {
            description: "Backups retrieved successfully",
          },
          404: {
            description: "No backups found for this user",
          },
        },
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, parseInt(id)),
      });
      if (!backup) {
        return error(404, {
          success: false,
          message: "Backup not found",
        });
      }
      return responseSuccess({
        success: true,
        message: "Backup found",
        data: backup,
      });
    },
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Get a specific backup by ID",
        responses: {
          200: {
            description: "Backup retrieved successfully",
          },
          404: {
            description: "Backup not found",
          },
        },
      },
    }
  )
  .put(
    "/",
    async ({ body, user }) => {
      const [newBackup] = await db.insert(backups)
        .values({
          ...body,
          authorId: user!.id,
        })
        .returning();
      return responseSuccess({
        success: true,
        message: "Backup created",
        data: newBackup,
      });
    },
    {
      authenticated: true,
      body: t.Object({
        data: t.Any(),
      }),
      detail: {
        summary: "Create a new backup",
        responses: {
          200: {
            description: "Backup created successfully",
          },
        },
      },
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, error }) => {
      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, parseInt(id)),
      });

      if (!backup) {
        return error(404, {
          success: false,
          message: "Backup not found",
        });
      }

      if (backup.authorId !== user!.id) {
        return error(403, {
          success: false,
          message: "You don't have permission to delete this backup",
        });
      }

      await db.delete(backups)
        .where(eq(backups.id, parseInt(id)));

      return responseSuccess({
        success: true,
        message: "Backup deleted",
      });
    },
    {
      authenticated: true,
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "Delete a backup",
        responses: {
          200: {
            description: "Backup deleted successfully",
          },
          404: {
            description: "Backup not found",
          },
          403: {
            description: "Permission denied",
          },
        },
      },
    }
  );
