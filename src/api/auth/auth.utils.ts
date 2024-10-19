import { JWTPayloadSpec } from "@elysiajs/jwt";
import { Cookie } from "elysia";

const ACCESS_EXPIRE = 60 * 30; // 30 minutes
const REFRESH_EXPIRE = 60 * 60 * 24 * 7; // 1 week

const getJwtTokens = async (
  user: any,
  jwt: {
    readonly sign: (
      morePayload: Record<string, string | number> & JWTPayloadSpec
    ) => Promise<string>;
  },
  accessToken: Cookie<string | undefined>,
  refreshToken: Cookie<string | undefined>
) => {
  const jwtAccess = await jwt.sign({
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + ACCESS_EXPIRE,
  });
  accessToken.set({
    value: jwtAccess,
    httpOnly: true,
    maxAge: ACCESS_EXPIRE,
    sameSite: "none",
  });

  const jwtRefresh = await jwt.sign({
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + REFRESH_EXPIRE,
  });
  refreshToken.set({
    value: jwtRefresh,
    httpOnly: true,
    maxAge: REFRESH_EXPIRE,
    sameSite: "lax",
    path: "/",
  });

  return {
    jwtAccess,
    jwtRefresh,
  };
};

export { getJwtTokens, ACCESS_EXPIRE, REFRESH_EXPIRE };
