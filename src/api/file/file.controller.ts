import Elysia, { error, t } from "elysia";
import { db } from "../../database/connection";
import { monoFile } from "./file.schema";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";
import { files, sections } from "../../database/schema";
import { and, eq, or } from "drizzle-orm";

export const file = new Elysia({ prefix: "/file", tags: ["File"] })
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
      let fileList;
      if (user) {
        fileList = await db.query.files.findMany({
          where: or(eq(files.authorId, user.id), eq(files.public, true)),
        });
      } else {
        fileList = await db.query.files.findMany({
          where: eq(files.public, true),
        });
      }

      return responseSuccess({
        success: true,
        message: "Files found",
        data: fileList,
      });
    },
    {
      detail: {
        summary: "Get all files (public and user's)",
        responses: {
          200: {
            description: "Files retrieved successfully",
          },
        },
      },
    }
  )
  .put(
    "/",
    async ({ body, user, error }) => {
      let section = await db.query.sections.findFirst({
        where: and(
          eq(sections.name, body.section),
          eq(sections.authorId, user!.id)
        ),
      });

      if (!section) {
        const [newSection] = await db
          .insert(sections)
          .values({
            name: body.section,
            authorId: user!.id,
          })
          .returning();
        section = newSection;
      }

      const exists = await db.query.files.findFirst({
        where: and(eq(files.path, body.path), eq(files.authorId, user!.id)),
      });
      if (exists) {
        return error(409, {
          success: false,
          message: "File already exists",
          data: exists,
        });
      }
      const [file] = await db
        .insert(files)
        .values({
          ...body,
          sectionId: section.id,
          authorId: user!.id,
        })
        .returning();
      return responseSuccess({
        success: true,
        message: "File created",
        data: file,
      });
    },
    {
      authenticated: true,
      body: monoFile,
      detail: {
        summary: "Create a new file",
        responses: {
          200: {
            description: "File created successfully",
          },
          409: {
            description: "File already exists",
          },
        },
      },
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get(
    "/:id",
    async ({ params: { id }, user }) => {
      let file;
      if (user) {
        file = await db.query.files.findFirst({
          where: and(
            eq(files.id, id),
            or(eq(files.authorId, user.id), eq(files.public, true))
          ),
        });
      } else {
        file = await db.query.files.findFirst({
          where: and(eq(files.id, id), eq(files.public, true)),
        });
      }

      if (!file) {
        return error(404, {
          success: false,
          message: "File not found",
        });
      }
      return responseSuccess({
        success: true,
        message: "File found",
        data: file,
      });
    },
    {
      detail: {
        summary: "Get a specific file by ID",
        responses: {
          200: {
            description: "File retrieved successfully",
          },
          404: {
            description: "File not found",
          },
        },
      },
    }
  )
  .guard({
    authenticated: true,
  })
  .post(
    "/unshare/:id",
    async ({ params: { id }, user, error }) => {
      const file = await db.query.files.findFirst({
        where: and(eq(files.id, id), eq(files.authorId, user!.id)),
      });
      if (!file) {
        return error(404, {
          success: false,
          message: "File not found",
        });
      }
      if (!file.public) {
        return responseSuccess({
          success: true,
          message: "File already unshared",
          data: file,
        });
      }
      const [unshared] = await db
        .update(files)
        .set({ public: false })
        .where(eq(files.id, id))
        .returning();

      return responseSuccess({
        success: true,
        message: "File unshared",
        data: unshared,
      });
    },
    {
      detail: {
        summary: "Unshare a file",
        responses: {
          200: {
            description: "File unshared successfully",
          },
          404: {
            description: "File not found",
          },
        },
      },
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user }) => {
      const exists = await db.query.files.findFirst({
        where: and(eq(files.id, id), eq(files.authorId, user!.id)),
      });
      if (!exists) {
        return error(404, {
          success: false,
          message: "File not found",
        });
      }
      const [file] = await db
        .update(files)
        .set(body)
        .where(and(eq(files.id, id), eq(files.authorId, user!.id)))
        .returning();

      return responseSuccess({
        success: true,
        message: "File updated",
        data: file,
      });
    },
    {
      body: t.Partial(monoFile),
      detail: {
        summary: "Update a file",
        responses: {
          200: {
            description: "File updated successfully",
          },
          404: {
            description: "File not found",
          },
        },
      },
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, user }) => {
      const [file] = await db
        .delete(files)
        .where(and(eq(files.id, id), eq(files.authorId, user!.id)))
        .returning();

      if (!file) {
        return error(404, {
          success: false,
          message: "File not found",
        });
      }
      return responseSuccess({
        success: true,
        message: "File deleted",
        data: file,
      });
    },
    {
      detail: {
        summary: "Delete a file",
        responses: {
          200: {
            description: "File deleted successfully",
          },
          404: {
            description: "File not found",
          },
        },
      },
    }
  );
