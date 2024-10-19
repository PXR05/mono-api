import Elysia, { error, t } from "elysia";
import { db } from "../../database/connection";
import { monoFile } from "./file.schema";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";

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
      let files;
      if (user) {
        files = await db.file.findMany({
          where: {
            OR: [{ authorId: user.id }, { public: true }],
          },
        });
      } else {
        files = await db.file.findMany({
          where: {
            public: true,
          },
        });
      }

      return responseSuccess({
        success: true,
        message: "Files found",
        data: files,
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
      let section = await db.section.findUnique({
        where: {
          name_authorId: {
            name: body.section,
            authorId: user!.id,
          },
        },
      });
      if (!section) {
        section = await db.section.create({
          data: {
            name: body.section,
            author: {
              connect: { id: user!.id },
            },
          },
        });
      }
      const exists = await db.file.findUnique({
        where: {
          path_authorId: {
            path: body.path,
            authorId: user!.id,
          },
        },
      });
      if (exists) {
        return error(409, {
          success: false,
          message: "File already exists",
          data: exists,
        });
      }
      const file = await db.file.create({
        data: {
          ...body,
          sectionId: section.id,
          author: {
            connect: { id: user!.id },
          },
        },
      });
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
        file = await db.file.findFirst({
          where: {
            id,
            OR: [{ authorId: user.id }, { public: true }],
          },
        });
      } else {
        file = await db.file.findFirst({
          where: {
            id,
            public: true,
          },
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
      const file = await db.file.findUnique({
        where: {
          id,
          authorId: user!.id,
        },
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
      const unshared = await db.file.update({
        where: {
          id,
        },
        data: {
          public: false,
        },
      });
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
      const exists = await db.file.findUnique({
        where: {
          id,
          authorId: user!.id,
        },
      });
      if (!exists) {
        return error(404, {
          success: false,
          message: "File not found",
        });
      }
      const file = await db.file.update({
        where: {
          id,
          authorId: user!.id,
        },
        data: body,
      });
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
      const file = await db.file.delete({
        where: {
          id,
          authorId: user!.id,
        },
      });
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
