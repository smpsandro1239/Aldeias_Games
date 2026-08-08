import fs from "fs";
import path from "path";

// Rede de segurança: apaga todos os ficheiros prisma/test-*.db deixados
// por suites interrompidas (crash, fail, teardown não invocado).
export default async function globalTeardown() {
  const dir = path.resolve(__dirname, "../../../prisma");
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith("test-") && f.endsWith(".db")) {
      try {
        fs.unlinkSync(path.join(dir, f));
      } catch {
        // ficheiro bloqueado em Windows — ignorar
      }
    }
  }
}