FROM oven/bun:slim AS build

WORKDIR /app

COPY package.json package.json
COPY bun.lockb bun.lockb
COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts
# COPY start.sh start.sh

RUN bun install
RUN bun push

ENV NODE_ENV=production

RUN bun build \
--compile \
--minify-whitespace \
--minify-syntax \
--target bun \
--outfile server \
./src/index.ts

# FROM oven/bun:slim

# WORKDIR /app

# COPY --from=build /app/server server
# # COPY --from=build /app/mono.db mono.db
# COPY --from=build /app/drizzle ./drizzle
# COPY --from=build /app/drizzle.config.ts drizzle.config.ts
# COPY --from=build /app/package.json package.json

# ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000 4000