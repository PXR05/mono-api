FROM oven/bun AS build

WORKDIR /app

COPY package.json package.json
COPY bun.lockb bun.lockb
COPY ./src ./src
COPY start.sh start.sh

RUN bun install
RUN bunx prisma generate

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./src/index.ts

FROM oven/bun:slim

WORKDIR /app

COPY --from=build /app/start.sh start.sh
COPY --from=build /app/src/database/schema.prisma src/database/schema.prisma
COPY --from=build /app/server server
COPY --from=build /app/node_modules/.prisma node_modules/.prisma

ENV NODE_ENV=production

CMD ["./start.sh"]

EXPOSE 3000