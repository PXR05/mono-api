FROM oven/bun:slim AS build

WORKDIR /app

COPY package.json package.json
COPY bun.lockb bun.lockb
COPY ./src ./src
COPY ./drizzle ./drizzle
COPY drizzle.config.ts drizzle.config.ts

RUN bun install

RUN bun db:generate
RUN bun db:migrate
RUN bun db:seed

ENV NODE_ENV=production

RUN bun build \
--compile \
--minify-whitespace \
--minify-syntax \
--target bun \
--outfile server \
./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server
COPY --from=build /app/mono.db mono.db

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 3000