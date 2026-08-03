import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Each test file runs in its own vitest worker with its own module registry,
// so a pid-based suffix guarantees a unique DB file per file -> parallel-safe.
const TEST_DB_PATH = path.resolve(
  __dirname,
  `../../../prisma/test-${process.pid}-${Math.random().toString(36).slice(2, 8)}.db`
);

let prismaInstance: any = null;

export function getTestDbUrl(): string {
  return `file:${TEST_DB_PATH}`;
}

export function setupTestDatabase(): void {
  process.env.DATABASE_URL = getTestDbUrl();

  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  execSync("npx prisma db push --skip-generate --accept-data-loss 2>&1", {
    cwd: path.resolve(__dirname, "../../.."),
    env: { ...process.env, DATABASE_URL: getTestDbUrl() },
    stdio: "pipe",
  });
}

export function teardownTestDatabase(): void {
  if (prismaInstance) {
    prismaInstance.$disconnect();
    prismaInstance = null;
  }
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch { }
  }
}

export async function getPrisma() {
  if (prismaInstance) return prismaInstance;

  const { PrismaClient } = await import("@prisma/client");
  prismaInstance = new PrismaClient({
    datasources: { db: { url: getTestDbUrl() } },
  });
  return prismaInstance as any;
}
