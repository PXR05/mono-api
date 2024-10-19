import { t } from "elysia";

export const profile = t.Object({
  id: t.String(),
  username: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});
