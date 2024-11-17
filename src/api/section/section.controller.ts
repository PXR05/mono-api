import Elysia, { t } from "elysia";
import { db } from "../../database/connection";
import { monoSection } from "./section.schema";
import { authService } from "../auth/auth.service";
import { responseSuccess } from "../utils";
import { sections, files } from "../../database/schema";
import { and, eq, or } from "drizzle-orm";

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
      let sectionList;
      if (user) {
        sectionList = await db.query.sections.findMany({
          where: or(
            eq(sections.authorId, user.id),
            eq(sections.public, true)
          ),
        });
      } else {
        sectionList = await db.query.sections.findMany({
          where: eq(sections.public, true),
        });
      }
      return responseSuccess({
        success: true,
        message: "Sections found",
        data: sectionList,
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
      const section = await db.query.sections.findFirst({
        where: and(
          eq(sections.id, id),
          or(
            eq(sections.authorId, user!.id),
            eq(sections.public, true)
          )
        ),
      });
      if (!section) {
        return error(404, {
          success: false,
          message: "Section not found",
        });
      }
      const fileList = await db.query.files.findMany({
        where: eq(files.sectionId, section.id),
        columns: {
          id: true,
          authorId: true,
          filename: true,
          section: true,
          path: true,
          type: true,
          default: true,
        },
      });
      return responseSuccess({
        success: true,
        message: "Files found",
        data: fileList,
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
      const sectionList = await db.query.sections.findMany({
        where: eq(sections.authorId, user!.id),
      });
      return responseSuccess({
        success: true,
        message: "Sections found",
        data: sectionList,
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
      const exists = await db.query.sections.findFirst({
        where: and(
          eq(sections.name, body.name),
          eq(sections.authorId, user!.id)
        ),
      });
      if (exists) {
        return error(409, {
          success: false,
          message: "Section already exists",
        });
      }
      const [section] = await db.insert(sections)
        .values({
          ...body,
          authorId: user!.id,
        })
        .returning();
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
      const [section] = await db.update(sections)
        .set(body)
        .where(and(
          eq(sections.name, name),
          eq(sections.authorId, user!.id)
        ))
        .returning();

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
      const [section] = await db.delete(sections)
        .where(and(
          eq(sections.name, name),
          eq(sections.authorId, user!.id)
        ))
        .returning();

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
