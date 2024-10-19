import Elysia, { t } from "elysia";
import { authService } from "../auth/auth.service";
import { db } from "../../database/connection";
import { responseSuccess } from "../utils";
import { monoFile } from "../file/file.schema";

export const share = new Elysia({ prefix: "/share", tags: ["File"] })
  .use(authService)
  .guard({
    authenticated: true,
  })
  .post(
    "/single",
    async ({ body, user }) => {
      const existing = await db.file.findUnique({
        where: {
          path_authorId: {
            path: body.path,
            authorId: user!.id,
          },
        },
      });
      if (existing && existing.public)
        return responseSuccess({
          success: true,
          message: "File already shared",
          data: existing,
        });
      if (existing) {
        const publicExisting = await db.file.update({
          where: {
            id: existing.id,
          },
          data: {
            public: true,
          },
        });
        return responseSuccess({
          success: true,
          message: "File shared",
          data: publicExisting,
        });
      }
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
      let section = await db.section.findUnique({
        where: {
          name_authorId: {
            name: body[0].section,
            authorId: user!.id,
          },
        },
      });
      if (!section) {
        section = await db.section.create({
          data: {
            name: body[0].section,
            author: {
              connect: { id: user!.id },
            },
          },
        });
      }
      const newFiles = body.filter(
        (file) =>
          !existing.some((existingFile) => existingFile.path === file.path)
      );
      const createdFiles = await db.file.createManyAndReturn({
        data: newFiles.map((file) => ({
          ...file,
          sectionId: section!.id,
          authorId: user!.id,
        })),
      });
      const files = [...existing, ...createdFiles];
      return responseSuccess({
        success: true,
        message: "Files shared",
        data: {
          id: section.id,
          files,
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
  files: {
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
  const existing = await db.file.findMany({
    where: {
      path: {
        in: files.map((file) => file.path),
      },
      authorId: userId,
    },
  });
  await db.file.updateMany({
    where: {
      id: {
        in: existing.map((file) => file.id),
      },
      public: {
        not: true,
      },
    },
    data: {
      public: true,
    },
  });
  const publicExisting = await db.file.findMany({
    where: {
      id: {
        in: existing.map((file) => file.id),
      },
    },
  });
  return publicExisting;
}
