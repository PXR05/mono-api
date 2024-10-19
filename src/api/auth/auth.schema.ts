import { t } from "elysia";

export const signIn = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const signUp = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  username: t.String({ minLength: 1 }),
});

export const session = t.Cookie({
  accessToken: t.String(),
  refreshToken: t.String(),
});
