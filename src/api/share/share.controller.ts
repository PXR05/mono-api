import Elysia, { t } from "elysia";
import { authService } from "../auth/auth.service";
import { db } from "../../database/connection";
import { responseSuccess } from "../utils";
import { monoFile } from "../file/file.schema";
import { files, sections } from "../../database/schema";
import { and, eq, inArray } from "drizzle-orm";

export const share = new Elysia({ prefix: "/share", tags: ["File"] })
  .use(authService)
  .guard({
    authenticated: true,
  })
  .post(
    "/single",
    async ({ body, user }) => {
      const existing = await db.query.files.findFirst({
        where: and(eq(files.path, body.path), eq(files.authorId, user!.id)),
      });

      if (existing && existing.public)
        return responseSuccess({
          success: true,
          message: "File already shared",
          data: existing,
        });

      if (existing) {
        const [publicExisting] = await db
          .update(files)
          .set({ public: true })
          .where(eq(files.id, existing.id))
          .returning();
        return responseSuccess({
          success: true,
          message: "File shared",
          data: publicExisting,
        });
      }

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
        message: "File shared",
        data: file,
      });
    },
    {
      body: monoFile,
      detail: {
        summary: "Share a file",
        responses: {
          200: {
            description: "File shared successfully",
          },
        },
      },
    }
  )
  .post(
    "/multiple",
    async ({ body, user }) => {
      const existing = await updateToPublic(body, user!.id);
      if (existing.length === body.length)
        return responseSuccess({
          success: true,
          message: "Files shared",
          data: {
            id: existing[0].sectionId,
            files: existing,
          },
        });

      let section = await db.query.sections.findFirst({
        where: and(
          eq(sections.name, body[0].section),
          eq(sections.authorId, user!.id)
        ),
      });

      if (!section) {
        const [newSection] = await db
          .insert(sections)
          .values({
            name: body[0].section,
            authorId: user!.id,
          })
          .returning();
        section = newSection;
      }

      const newFiles = body.filter(
        (file) =>
          !existing.some((existingFile) => existingFile.path === file.path)
      );

      const createdFiles = await db
        .insert(files)
        .values(
          newFiles.map((file) => ({
            ...file,
            sectionId: section!.id,
            authorId: user!.id,
          }))
        )
        .returning();

      return responseSuccess({
        success: true,
        message: "Files shared",
        data: {
          id: section.id,
          files: [...existing, ...createdFiles],
        },
      });
    },
    {
      body: t.Array(monoFile),
      detail: {
        summary: "Share multiple files",
        responses: {
          200: {
            description: "Files shared successfully",
          },
        },
      },
    }
  );

async function updateToPublic(
  filesList: {
    filename: string;
    path: string;
    section: string;
    text: string;
    metadata?: string;
    raw?: string;
    default?: string;
    type: string;
    public?: boolean;
  }[],
  userId: string
) {
  const paths = filesList.map(f => f.path);

  const existing = await db.query.files.findMany({
    where: and(
      inArray(files.path, paths),
      eq(files.authorId, userId)
    ),
  });

  if (existing.length > 0) {
    const existingIds = existing.map(f => f.id);

    await db.update(files)
      .set({ public: true })
      .where(inArray(files.id, existingIds));

    return await db.query.files.findMany({
      where: inArray(files.id, existingIds),
    });
  }

  return [];
}
