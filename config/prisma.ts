import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? "file:./data/hxh.db";
const databaseFile = connectionString.startsWith("file:")
  ? connectionString.slice("file:".length).split("?")[0]
  : undefined;

if (databaseFile && databaseFile !== ":memory:") {
  const directory = dirname(databaseFile);
  if (directory !== ".") {
    mkdirSync(isAbsolute(directory) ? directory : `${process.cwd()}/${directory}`, {
      recursive: true,
    });
  }
}

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
