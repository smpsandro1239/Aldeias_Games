/**
 * Gera docs/openapi.yaml a partir dos route handlers existentes em src/app/api.
 * Não requer zod-to-openapi por rota — enumera os ficheiros e inventaria métodos
 * exportados (GET/POST/PUT/PATCH/DELETE) de cada rota.
 *
 * Uso: npx tsx scripts/gen-openapi.ts
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const API_DIR = join(process.cwd(), "src", "app", "api");
const OUT_DIR = join(process.cwd(), "docs");
const METHOD_NAMES = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

interface RouteEntry {
  apiPath: string;
  filePath: string;
}

function collectRoutes(dir: string, base = ""): RouteEntry[] {
  const routes: RouteEntry[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      routes.push(...collectRoutes(full, `${base}/${entry}`));
    } else if (entry === "route.ts" || entry === "route.tsx") {
      routes.push({ apiPath: `/api${base}`, filePath: full });
    }
  }
  return routes;
}

function inferMethods(filePath: string): string[] {
  const src = readFileSync(filePath, "utf8");
  return METHOD_NAMES.filter((m) => new RegExp(`export (async )?function ${m}\\b`).test(src));
}

function pathToOpenApi(routePath: string): string {
  return routePath.replace(/\[\.\.\.([^\]]+)\]/g, "{$1+}").replace(/\[([^\]]+)\]/g, "{$1}");
}

function yamlSafe(value: string): string {
  return JSON.stringify(value);
}

function main() {
  const seen = new Set<string>();
  const paths: Record<string, string> = {};

  for (const route of collectRoutes(API_DIR)) {
    const openPath = openApiPath(route.apiPath);
    if (seen.has(openPath)) continue;
    seen.add(openPath);

    const methods = inferMethods(route.filePath);
    const ops: string[] = [];
    for (const m of methods) {
      const tag = route.apiPath.split("/").filter(Boolean)[1] || "geral";
      ops.push(
        `    ${m.toLowerCase()}:\n` +
          `      summary: ${yamlSafe(m === "GET" ? "Obter recurso(s)" : "Escrever/alterar recurso")}\n` +
          `      tags:\n        - ${yamlSafe(tag)}\n` +
          `      responses:\n        "200":\n          description: Sucesso\n        "400":\n          description: Pedido inválido\n        "401":\n          description: Não autorizado\n        "403":\n          description: Proibido\n        "500":\n          description: Erro interno\n`
      );
    }
    if (ops.length > 0) {
      paths[openPath] = `  ${yamlSafe(openPath)}:\n${ops.join("")}`;
    }
  }

  const yaml = `openapi: 3.0.3
info:
  title: Aldeias Games API
  description: API da plataforma de angariação de fundos em comunidades locais portuguesas (especificação gerada por scripts/gen-openapi.ts)
  version: "3.14.0"
servers:
  - url: https://aldeiasgames.vercel.app
    description: Produção
  - url: http://localhost:3000
    description: Desenvolvimento local
paths:
${Object.values(paths).join("\n")}
`;

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "openapi.yaml"), yaml);
  console.log(`[gen-openapi] ${Object.keys(paths).length} paths -> docs/openapi.yaml`);
}

function openApiPath(apiPath: string): string {
  return openApiToBracket(apiPath);
}

function openApiToBracket(p: string): string {
  return p.replace(/\[\.\.\.([^\]]+)\]/g, "{$1+}").replace(/\[([^\]]+)\]/g, "{$1}");
}

main();