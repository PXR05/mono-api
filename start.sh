#!/bin/sh

bunx prisma db push --schema ./src/database/schema.prisma
./server