import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";

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
      const backups = await db.backup.findMany({
        where: {
          authorId: user!.id,
        },
      });
      return responseSuccess({
        success: true,
        message: "Backups found",
        data: backups,
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
      const backups = await db.backup.findMany({
        where: {
          authorId: userId,
        },
      });
      if (backups.length === 0) {
        return error(404, {
          success: false,
          message: "No backups found for this user",
        });
      }
      return responseSuccess({
        success: true,
        message: "Backups found",
        data: backups,
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
      const backup = await db.backup.findUnique({
        where: {
          id: parseInt(id),
        },
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
      const newBackup = await db.backup.create({
        data: {
          ...body,
          authorId: user!.id,
        },
      });
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
      const backup = await db.backup.findUnique({
        where: {
          id: parseInt(id),
        },
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

      await db.backup.delete({
        where: {
          id: parseInt(id),
        },
      });

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
