import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./connection";

migrate(db, { migrationsFolder: "./drizzle" });
