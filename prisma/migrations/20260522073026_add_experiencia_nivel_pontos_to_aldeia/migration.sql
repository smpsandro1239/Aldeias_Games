-- AlterTable
ALTER TABLE "aldeias" ADD COLUMN     "experiencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nivel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pontos" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "metodosPagamentoDefault" SET DEFAULT '[\"saldo\",\"dinheiro\"]';

-- AddForeignKey
ALTER TABLE "game_analytics" ADD CONSTRAINT "game_analytics_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "jogos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
