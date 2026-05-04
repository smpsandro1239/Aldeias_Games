-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('deposito', 'levantamento', 'cashback', 'pagamento_jogo', 'premio_dinheiro', 'comissao', 'bonus_meta', 'carregamento_saldo', 'transferencia_vendedor_admin', 'recebimento_vendedor');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'aldeia_admin', 'vendedor', 'user');

-- CreateEnum
CREATE TYPE "TipoOrganizacao" AS ENUM ('aldeia', 'escola', 'associacao_pais', 'clube');

-- CreateEnum
CREATE TYPE "NivelEnsino" AS ENUM ('pre_escolar', 'primeiro_ciclo', 'segundo_ciclo', 'terceiro_ciclo', 'secundario', 'superior');

-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('rascunho', 'ativo', 'pausado', 'finalizado', 'cancelado');

-- CreateEnum
CREATE TYPE "TipoJogo" AS ENUM ('poio_da_vaca', 'rifa', 'tombola', 'raspadinha');

-- CreateEnum
CREATE TYPE "EstadoJogo" AS ENUM ('rascunho', 'aberto', 'pausado', 'fechado', 'finalizado');

-- CreateEnum
CREATE TYPE "TipoPremio" AS ENUM ('dinheiro', 'fisico', 'experiencia');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('mbway', 'dinheiro', 'stripe', 'transferencia', 'saldo');

-- CreateEnum
CREATE TYPE "Recorrencia" AS ENUM ('semanal', 'quinzenal', 'mensal');

-- CreateEnum
CREATE TYPE "EstadoPagamento" AS ENUM ('pendente', 'processando', 'concluido', 'falhou', 'reembolsado');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('sistema', 'pagamento', 'sorteio', 'premio', 'campanha', 'alerta');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'ALDEIA_ADMIN', 'GESTOR', 'COLABORADOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PermissionKey" AS ENUM ('MANAGE_ALDEIA', 'VIEW_ALDEIA', 'CREATE_EVENTO', 'EDIT_EVENTO', 'DELETE_EVENTO', 'VIEW_EVENTO', 'CREATE_JOGO', 'EDIT_JOGO', 'DELETE_JOGO', 'VIEW_JOGO', 'MANAGE_PREMIOS', 'VIEW_PREMIOS', 'MANAGE_VENDEDORES', 'VIEW_VENDEDORES', 'EXECUTE_VENDA', 'VIEW_VENDAS', 'VIEW_ANALYTICS_GLOBAL', 'VIEW_ANALYTICS_LOCAL', 'MANAGE_USERS', 'MANAGE_PLANOS');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('pendente', 'confirmado', 'cancelado', 'expirado', 'aguardar_autorizacao');

-- CreateEnum
CREATE TYPE "EstadoEntrega" AS ENUM ('solicitado', 'confirmado', 'cancelado', 'concluido');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "notificacoesEmail" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "falhasLogin" INTEGER NOT NULL DEFAULT 0,
    "ultimaFalhaLogin" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aldeiaId" TEXT,
    "aldeiasPermitidas" TEXT,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comissaoPercentual" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "comissaoAtiva" BOOLEAN NOT NULL DEFAULT true,
    "comissaoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "criterio" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 10,
    "raro" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "conquistadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "pontosParaProximoNivel" INTEGER NOT NULL DEFAULT 100,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "descricao" TEXT,
    "referencia" TEXT,
    "metodoPagamento" TEXT,
    "estado" TEXT,
    "dadosAdicionais" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "metaVendas" DOUBLE PRECISION,
    "bonusMeta" DOUBLE PRECISION,
    "aldeiaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_auths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_auths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_acesso" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "precoMensal" DOUBLE PRECISION NOT NULL,
    "maxEventos" INTEGER NOT NULL DEFAULT 10,
    "maxJogos" INTEGER NOT NULL DEFAULT 50,
    "maxParticipacoes" INTEGER NOT NULL DEFAULT 1000,
    "maxVendedores" INTEGER NOT NULL DEFAULT 5,
    "recursos" TEXT,
    "stripePriceId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aldeias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tipoOrganizacao" "TipoOrganizacao" NOT NULL DEFAULT 'aldeia',
    "descricao" TEXT,
    "logoUrl" TEXT,
    "logoBase64" TEXT,
    "permitirStripe" BOOLEAN NOT NULL DEFAULT false,
    "permitirMBWay" BOOLEAN NOT NULL DEFAULT false,
    "metodosPagamentoDefault" TEXT DEFAULT '["saldo","dinheiro"]',
    "iban" TEXT,
    "nomeTitularConta" TEXT,
    "avisoPagamentosEnviado" BOOLEAN NOT NULL DEFAULT false,
    "nomeEscola" TEXT,
    "codigoEscola" TEXT,
    "nivelEnsino" "NivelEnsino",
    "responsavel" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "morada" TEXT,
    "codigoPostal" TEXT,
    "localidade" TEXT,
    "autorizacaoCM" BOOLEAN NOT NULL DEFAULT false,
    "numeroAlvara" TEXT,
    "documentosVerificados" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "dataVerificacao" TIMESTAMP(3),
    "planoId" TEXT,
    "dataInicioPlano" TIMESTAMP(3),
    "dataFimPlano" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aldeias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "imagemBase64" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "objectivoAngariacao" DOUBLE PRECISION,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'rascunho',
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "totalAngariado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalParticipacoes" INTEGER NOT NULL DEFAULT 0,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateNome" TEXT,
    "frequenciaRecorrencia" "Recorrencia",
    "diaSemanaRecorrencia" INTEGER,
    "proximaData" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aldeiaId" TEXT NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoJogo" NOT NULL,
    "descricao" TEXT,
    "configuracao" TEXT NOT NULL,
    "dimensoesCampo" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "stockInicial" INTEGER NOT NULL,
    "stockAtual" INTEGER NOT NULL,
    "limitePorUsuario" INTEGER NOT NULL DEFAULT 10,
    "custoQuadrado" DOUBLE PRECISION,
    "valorPremioVaca" DOUBLE PRECISION,
    "custoPremioDinheiro" DOUBLE PRECISION,
    "valorCompraVaca" DOUBLE PRECISION,
    "valorMercadoVaca" DOUBLE PRECISION,
    "rentabilidadePercentual" DOUBLE PRECISION,
    "lucroMinimoPercent" DOUBLE PRECISION,
    "custoMedioPrevisto" DOUBLE PRECISION,
    "receitaEsperada" DOUBLE PRECISION,
    "lucroLiquidoPrevisto" DOUBLE PRECISION,
    "percentagemTotalPremios" DOUBLE PRECISION,
    "hashVerificacao" TEXT,
    "estado" "EstadoJogo" NOT NULL DEFAULT 'aberto',
    "dataAbertura" TIMESTAMP(3),
    "dataFecho" TIMESTAMP(3),
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "frequenciaRecorrencia" "Recorrencia",
    "proximaDataCriacao" TIMESTAMP(3),
    "jogoPaiId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "totalParticipacoes" INTEGER NOT NULL DEFAULT 0,
    "totalAngariado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sorteado" BOOLEAN NOT NULL DEFAULT false,
    "dataSorteio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventoId" TEXT NOT NULL,
    "aldeiaId" TEXT,
    "premioId" TEXT,
    "modoSorteio" TEXT NOT NULL DEFAULT 'app',
    "detalhesSorteioExterno" TEXT,

    CONSTRAINT "jogos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apostas" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "numeros" TEXT NOT NULL,
    "jogadorNome" TEXT NOT NULL,
    "jogadorTelefone" TEXT,
    "jogadorEmail" TEXT,
    "vendedorId" TEXT,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apostas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "imagemUrl" TEXT,
    "valorDinheiroAlternative" DOUBLE PRECISION,
    "percentagem" DOUBLE PRECISION,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aldeiaId" TEXT NOT NULL,
    "jogoId" TEXT,

    CONSTRAINT "premios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacoes" (
    "id" TEXT NOT NULL,
    "dadosParticipacao" TEXT NOT NULL,
    "valorPago" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" "MetodoPagamento" NOT NULL,
    "estadoPagamento" "EstadoPagamento" NOT NULL DEFAULT 'pendente',
    "referenciaPagamento" TEXT,
    "dataPagamento" TIMESTAMP(3),
    "seedRaspe" TEXT,
    "hashRaspe" TEXT,
    "resultadoRaspe" TEXT,
    "revelado" BOOLEAN NOT NULL DEFAULT false,
    "dataRevelacao" TIMESTAMP(3),
    "hashParticipacao" TEXT,
    "dadosVerificacao" TEXT,
    "vendedorId" TEXT,
    "nomeCliente" TEXT,
    "telefoneCliente" TEXT,
    "emailCliente" TEXT,
    "ganhador" BOOLEAN NOT NULL DEFAULT false,
    "premioEntregue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jogoId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "participacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeros_vendidos" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "participacaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "numeros_vendidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alteracoes_participacao" (
    "id" TEXT NOT NULL,
    "tipoAlteracao" TEXT NOT NULL,
    "dadosAnteriores" TEXT,
    "motivo" TEXT,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participacaoId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "alteracoes_participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sorteios" (
    "id" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "observacoes" TEXT,
    "preCommitHash" TEXT,
    "commitSalt" TEXT,
    "revealedAt" TIMESTAMP(3),
    "fase" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jogoId" TEXT NOT NULL,

    CONSTRAINT "sorteios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vencedores_sorteio" (
    "id" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL,
    "dadosVencedor" TEXT NOT NULL,
    "premioEntregue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sorteioId" TEXT NOT NULL,

    CONSTRAINT "vencedores_sorteio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "dados" TEXT,
    "dadosAdicionais" JSONB,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimentos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concedeu" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "consentimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direito_esquecimento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "solicitadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendente',
    "notas" TEXT,

    CONSTRAINT "direito_esquecimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "comissao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metodoPagamento" "MetodoPagamento" NOT NULL,
    "dadosCliente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendedorId" TEXT NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamificacao_eventos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 10,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamificacao_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" "PermissionKey" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserGlobalRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserGlobalRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "UserAldeiaRole" (
    "userId" TEXT NOT NULL,
    "aldeiaId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserAldeiaRole_pkey" PRIMARY KEY ("userId","aldeiaId","roleId")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "aldeiaId" TEXT,
    "allow" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "aldeiaId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoCarregamento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendedorId" TEXT,
    "aldeiaId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "passwordOneTime" TEXT,
    "qrCodeData" TEXT,
    "expiresAt" TIMESTAMP(3),
    "estado" "EstadoPedido" NOT NULL DEFAULT 'pendente',
    "tentativaUsada" BOOLEAN NOT NULL DEFAULT false,
    "tentativasErro" INTEGER NOT NULL DEFAULT 0,
    "ultimoErroTimestamp" TIMESTAMP(3),
    "ipOrigem" TEXT,
    "dispositivo" TEXT,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "confirmadoPorId" TEXT,
    "confirmadoAt" TIMESTAMP(3),
    "observacoes" TEXT,
    "requerAutorizacao" BOOLEAN NOT NULL DEFAULT false,
    "autorizado" BOOLEAN NOT NULL DEFAULT false,
    "autorizadoPorId" TEXT,
    "autorizadoAt" TIMESTAMP(3),
    "motivoRejeicao" TEXT,
    "metodoValidacao" TEXT,
    "metodoPagamento" TEXT,
    "notificadoJogador" BOOLEAN NOT NULL DEFAULT false,
    "notificadoVendedor" BOOLEAN NOT NULL DEFAULT false,
    "notificadoAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoCarregamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoNotificacao" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "assunto" TEXT,
    "mensagem" TEXT NOT NULL,
    "enviada" BOOLEAN NOT NULL DEFAULT false,
    "enviadaAt" TIMESTAMP(3),
    "erro" TEXT,
    "criadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaSaldo" (
    "id" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "aldeiaId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoEntrega" NOT NULL DEFAULT 'solicitado',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConfirmacao" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "observacoes" TEXT,
    "comprovativoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntregaSaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_analytics" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gameId" TEXT,
    "gameType" TEXT,
    "quantity" INTEGER,
    "method" TEXT,
    "amount" DOUBLE PRECISION,
    "reason" TEXT,
    "percent" INTEGER,
    "won" BOOLEAN,
    "prizeValue" DOUBLE PRECISION,
    "source" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_userBadges" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_userBadges_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AldeiaAdmins" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AldeiaAdmins_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AldeiaVendedores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AldeiaVendedores_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_aldeiaId_idx" ON "users"("aldeiaId");

-- CreateIndex
CREATE INDEX "user_badges_userId_idx" ON "user_badges"("userId");

-- CreateIndex
CREATE INDEX "user_badges_badgeId_idx" ON "user_badges"("badgeId");

-- CreateIndex
CREATE INDEX "user_levels_userId_idx" ON "user_levels"("userId");

-- CreateIndex
CREATE INDEX "transacoes_userId_idx" ON "transacoes"("userId");

-- CreateIndex
CREATE INDEX "transacoes_tipo_idx" ON "transacoes"("tipo");

-- CreateIndex
CREATE INDEX "transacoes_createdAt_idx" ON "transacoes"("createdAt");

-- CreateIndex
CREATE INDEX "comissoes_vendedorId_idx" ON "comissoes"("vendedorId");

-- CreateIndex
CREATE INDEX "comissoes_aldeiaId_idx" ON "comissoes"("aldeiaId");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_auths_userId_key" ON "two_factor_auths"("userId");

-- CreateIndex
CREATE INDEX "two_factor_auths_userId_idx" ON "two_factor_auths"("userId");

-- CreateIndex
CREATE INDEX "logs_acesso_userId_idx" ON "logs_acesso"("userId");

-- CreateIndex
CREATE INDEX "logs_acesso_createdAt_idx" ON "logs_acesso"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");

-- CreateIndex
CREATE UNIQUE INDEX "aldeias_slug_key" ON "aldeias"("slug");

-- CreateIndex
CREATE INDEX "aldeias_slug_idx" ON "aldeias"("slug");

-- CreateIndex
CREATE INDEX "aldeias_tipoOrganizacao_idx" ON "aldeias"("tipoOrganizacao");

-- CreateIndex
CREATE INDEX "aldeias_verificado_idx" ON "aldeias"("verificado");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE INDEX "eventos_aldeiaId_idx" ON "eventos"("aldeiaId");

-- CreateIndex
CREATE INDEX "eventos_estado_idx" ON "eventos"("estado");

-- CreateIndex
CREATE INDEX "eventos_publico_idx" ON "eventos"("publico");

-- CreateIndex
CREATE INDEX "eventos_dataInicio_idx" ON "eventos"("dataInicio");

-- CreateIndex
CREATE INDEX "jogos_eventoId_idx" ON "jogos"("eventoId");

-- CreateIndex
CREATE INDEX "jogos_tipo_idx" ON "jogos"("tipo");

-- CreateIndex
CREATE INDEX "jogos_estado_idx" ON "jogos"("estado");

-- CreateIndex
CREATE INDEX "jogos_premioId_idx" ON "jogos"("premioId");

-- CreateIndex
CREATE INDEX "apostas_jogoId_idx" ON "apostas"("jogoId");

-- CreateIndex
CREATE INDEX "premios_aldeiaId_idx" ON "premios"("aldeiaId");

-- CreateIndex
CREATE INDEX "participacoes_jogoId_idx" ON "participacoes"("jogoId");

-- CreateIndex
CREATE INDEX "participacoes_userId_idx" ON "participacoes"("userId");

-- CreateIndex
CREATE INDEX "participacoes_estadoPagamento_idx" ON "participacoes"("estadoPagamento");

-- CreateIndex
CREATE INDEX "participacoes_createdAt_idx" ON "participacoes"("createdAt");

-- CreateIndex
CREATE INDEX "numeros_vendidos_jogoId_idx" ON "numeros_vendidos"("jogoId");

-- CreateIndex
CREATE UNIQUE INDEX "numeros_vendidos_jogoId_numero_key" ON "numeros_vendidos"("jogoId", "numero");

-- CreateIndex
CREATE INDEX "alteracoes_participacao_participacaoId_idx" ON "alteracoes_participacao"("participacaoId");

-- CreateIndex
CREATE INDEX "alteracoes_participacao_userId_idx" ON "alteracoes_participacao"("userId");

-- CreateIndex
CREATE INDEX "sorteios_jogoId_idx" ON "sorteios"("jogoId");

-- CreateIndex
CREATE INDEX "sorteios_createdAt_idx" ON "sorteios"("createdAt");

-- CreateIndex
CREATE INDEX "vencedores_sorteio_sorteioId_idx" ON "vencedores_sorteio"("sorteioId");

-- CreateIndex
CREATE INDEX "notificacoes_userId_idx" ON "notificacoes"("userId");

-- CreateIndex
CREATE INDEX "notificacoes_lida_idx" ON "notificacoes"("lida");

-- CreateIndex
CREATE INDEX "notificacoes_createdAt_idx" ON "notificacoes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "consentimentos_userId_idx" ON "consentimentos"("userId");

-- CreateIndex
CREATE INDEX "direito_esquecimento_userId_idx" ON "direito_esquecimento"("userId");

-- CreateIndex
CREATE INDEX "direito_esquecimento_estado_idx" ON "direito_esquecimento"("estado");

-- CreateIndex
CREATE INDEX "vendas_vendedorId_idx" ON "vendas"("vendedorId");

-- CreateIndex
CREATE INDEX "vendas_createdAt_idx" ON "vendas"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserPermission_aldeiaId_idx" ON "UserPermission"("aldeiaId");

-- CreateIndex
CREATE INDEX "PedidoCarregamento_userId_idx" ON "PedidoCarregamento"("userId");

-- CreateIndex
CREATE INDEX "PedidoCarregamento_vendedorId_idx" ON "PedidoCarregamento"("vendedorId");

-- CreateIndex
CREATE INDEX "PedidoCarregamento_estado_idx" ON "PedidoCarregamento"("estado");

-- CreateIndex
CREATE INDEX "PedidoCarregamento_passwordOneTime_idx" ON "PedidoCarregamento"("passwordOneTime");

-- CreateIndex
CREATE INDEX "PedidoCarregamento_expiresAt_idx" ON "PedidoCarregamento"("expiresAt");

-- CreateIndex
CREATE INDEX "PedidoNotificacao_destinatario_idx" ON "PedidoNotificacao"("destinatario");

-- CreateIndex
CREATE INDEX "PedidoNotificacao_enviada_idx" ON "PedidoNotificacao"("enviada");

-- CreateIndex
CREATE INDEX "EntregaSaldo_vendedorId_idx" ON "EntregaSaldo"("vendedorId");

-- CreateIndex
CREATE INDEX "EntregaSaldo_adminId_idx" ON "EntregaSaldo"("adminId");

-- CreateIndex
CREATE INDEX "EntregaSaldo_aldeiaId_idx" ON "EntregaSaldo"("aldeiaId");

-- CreateIndex
CREATE INDEX "EntregaSaldo_estado_idx" ON "EntregaSaldo"("estado");

-- CreateIndex
CREATE INDEX "EntregaSaldo_createdAt_idx" ON "EntregaSaldo"("createdAt");

-- CreateIndex
CREATE INDEX "game_analytics_userId_idx" ON "game_analytics"("userId");

-- CreateIndex
CREATE INDEX "game_analytics_gameId_idx" ON "game_analytics"("gameId");

-- CreateIndex
CREATE INDEX "game_analytics_gameType_idx" ON "game_analytics"("gameType");

-- CreateIndex
CREATE INDEX "game_analytics_createdAt_idx" ON "game_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "_userBadges_B_index" ON "_userBadges"("B");

-- CreateIndex
CREATE INDEX "_AldeiaAdmins_B_index" ON "_AldeiaAdmins"("B");

-- CreateIndex
CREATE INDEX "_AldeiaVendedores_B_index" ON "_AldeiaVendedores"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_acesso" ADD CONSTRAINT "logs_acesso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aldeias" ADD CONSTRAINT "aldeias_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogos" ADD CONSTRAINT "jogos_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apostas" ADD CONSTRAINT "apostas_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros_vendidos" ADD CONSTRAINT "numeros_vendidos_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros_vendidos" ADD CONSTRAINT "numeros_vendidos_participacaoId_fkey" FOREIGN KEY ("participacaoId") REFERENCES "participacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_participacao" ADD CONSTRAINT "alteracoes_participacao_participacaoId_fkey" FOREIGN KEY ("participacaoId") REFERENCES "participacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alteracoes_participacao" ADD CONSTRAINT "alteracoes_participacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorteios" ADD CONSTRAINT "sorteios_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "jogos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vencedores_sorteio" ADD CONSTRAINT "vencedores_sorteio_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "sorteios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimentos" ADD CONSTRAINT "consentimentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direito_esquecimento" ADD CONSTRAINT "direito_esquecimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGlobalRole" ADD CONSTRAINT "UserGlobalRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGlobalRole" ADD CONSTRAINT "UserGlobalRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAldeiaRole" ADD CONSTRAINT "UserAldeiaRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAldeiaRole" ADD CONSTRAINT "UserAldeiaRole_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAldeiaRole" ADD CONSTRAINT "UserAldeiaRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_aldeiaId_fkey" FOREIGN KEY ("aldeiaId") REFERENCES "aldeias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCarregamento" ADD CONSTRAINT "PedidoCarregamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCarregamento" ADD CONSTRAINT "PedidoCarregamento_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCarregamento" ADD CONSTRAINT "PedidoCarregamento_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoCarregamento" ADD CONSTRAINT "PedidoCarregamento_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaSaldo" ADD CONSTRAINT "EntregaSaldo_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaSaldo" ADD CONSTRAINT "EntregaSaldo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_analytics" ADD CONSTRAINT "game_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userBadges" ADD CONSTRAINT "_userBadges_A_fkey" FOREIGN KEY ("A") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_userBadges" ADD CONSTRAINT "_userBadges_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AldeiaAdmins" ADD CONSTRAINT "_AldeiaAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES "aldeias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AldeiaAdmins" ADD CONSTRAINT "_AldeiaAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AldeiaVendedores" ADD CONSTRAINT "_AldeiaVendedores_A_fkey" FOREIGN KEY ("A") REFERENCES "aldeias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AldeiaVendedores" ADD CONSTRAINT "_AldeiaVendedores_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
