#!/bin/bash

echo "========================================"
echo "  Aldeias Games - Setup"
echo "========================================"
echo ""

echo "[1/4] A instalar dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao instalar dependencias"
    exit 1
fi

echo ""
echo "[2/4] A gerar cliente Prisma..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao gerar Prisma"
    exit 1
fi

echo ""
echo "[3/4] A criar tabelas na base de dados..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao criar tabelas"
    exit 1
fi

echo ""
echo "[4/4] A criar dados de teste (seed)..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao executar seed"
    exit 1
fi

echo ""
echo "========================================"
echo "  Setup concluído com sucesso!"
echo "========================================"
echo ""
echo "Credenciais de teste:"
echo "  - Super Admin: admin@aldeias.pt / 123456"
echo "  - Admin Aldeia: aldeia@gmail.com / 123456"
echo "  - Vendedor: vendedor@gmail.com / 123456"
echo "  - Jogador: smpsandro1239@gmail.com / 123456"
echo ""
echo "Para iniciar: npm run dev"
