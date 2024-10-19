import { t } from "elysia";

export const monoFile = t.Object({
    filename: t.String(),
    path: t.String(),
    section: t.String(),
    text: t.String(),
    metadata: t.Optional(t.String()),
    raw: t.Optional(t.String()),
    default: t.Optional(t.String()),
    type: t.String(),
    public: t.Optional(t.Boolean()),
  });
  