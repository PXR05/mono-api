import { t } from "elysia";

export const monoSection = t.Object({
  name: t.String(),
  public: t.Optional(t.Boolean()),
});
