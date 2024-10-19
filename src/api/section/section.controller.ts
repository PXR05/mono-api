import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { monoSection } from "./section.schema";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";

export const section = new Elysia({ prefix: "/section", tags: ["Section"] })
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
      let sections;
      if (user) {
        sections = await db.section.findMany({
          where: {
            OR: [{ authorId: user.id }, { public: true }],
          },
        });
      } else {
        sections = await db.section.findMany({
          where: {
            public: true,
          },
        });
      }
      return responseSuccess({
        success: true,
        message: "Sections found",
        data: sections,
      });
    },
    {
      detail: {
        summary: "Get all sections",
        responses: {
          200: {
            description: "Sections retrieved successfully",
          },
        },
      },
    }
  )
  .get(
    "/:id/files",
    async ({ params: { id }, user, error }) => {
      const section = await db.section.findUnique({
        where: {
          id,
          OR: [{ authorId: user!.id }, { public: true }],
        },
      });
      if (!section) {
        return error(404, {
          success: false,
          message: "Section not found",
        });
      }
      const files = await db.file.findMany({
        select: {
          id: true,
          authorId: true,
          filename: true,
          section: true,
          path: true,
          type: true,
          default: true,
        },
        where: {
          sectionId: section.id,
        },
      });
      return responseSuccess({
        success: true,
        message: "Files found",
        data: files,
      });
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get all files in a section",
        responses: {
          200: {
            description: "Files retrieved successfully",
          },
          404: {
            description: "Section not found",
          },
        },
      },
    }
  )
  .guard({
    authenticated: true,
  })
  .get(
    "/self",
    async ({ user }) => {
      const sections = await db.section.findMany({
        where: {
          authorId: user!.id,
        },
      });
      return responseSuccess({
        success: true,
        message: "Sections found",
        data: sections,
      });
    },
    {
      detail: {
        summary: "Get user's own sections",
        responses: {
          200: {
            description: "User's sections retrieved successfully",
          },
        },
      },
    }
  )
  .put(
    "/",
    async ({ body, user, error }) => {
      const exists = await db.section.findUnique({
        where: {
          name_authorId: {
            name: body.name,
            authorId: user!.id,
          },
        },
      });
      if (exists) {
        return error(409, {
          success: false,
          message: "Section already exists",
        });
      }
      const section = await db.section.create({
        data: {
          ...body,
          authorId: user!.id,
        },
      });
      return responseSuccess({
        success: true,
        message: "Section created",
        data: section,
      });
    },
    {
      body: monoSection,
      detail: {
        summary: "Create a new section",
        responses: {
          200: {
            description: "Section created successfully",
          },
          409: {
            description: "Section already exists",
          },
        },
      },
    }
  )
  .guard({
    params: t.Object({
      name: t.String(),
    }),
  })
  .patch(
    "/:name",
    async ({ body, params: { name }, user, error }) => {
      const section = await db.section.update({
        where: {
          name_authorId: {
            name,
            authorId: user!.id,
          },
        },
        data: body,
      });

      if (!section)
        return error(404, {
          success: false,
          message: "Section not found",
        });

      return responseSuccess({
        success: true,
        message: "Section updated",
        data: section,
      });
    },
    {
      body: t.Partial(monoSection),
      detail: {
        summary: "Update a section",
        responses: {
          200: {
            description: "Section updated successfully",
          },
          404: {
            description: "Section not found",
          },
        },
      },
    }
  )
  .delete(
    "/:name",
    async ({ params: { name }, user, error }) => {
      const section = await db.section.delete({
        where: {
          name_authorId: {
            name,
            authorId: user!.id,
          },
        },
      });

      if (!section)
        return error(404, {
          success: false,
          message: "Section not found",
        });

      return responseSuccess({
        success: true,
        message: "Section deleted",
        data: section,
      });
    },
    {
      detail: {
        summary: "Delete a section",
        responses: {
          200: {
            description: "Section deleted successfully",
          },
          404: {
            description: "Section not found",
          },
        },
      },
    }
  );
