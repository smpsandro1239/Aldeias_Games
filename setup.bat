@echo off
echo ========================================
echo   Aldeias Games - Setup
echo ========================================
echo.

echo [1/4] A instalar dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] A gerar cliente Prisma...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao gerar Prisma
    pause
    exit /b 1
)

echo.
echo [3/4] A criar tabelas na base de dados...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao criar tabelas
    pause
    exit /b 1
)

echo.
echo [4/4] A criar dados de teste (seed)...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao executar seed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup concluído com sucesso!
echo ========================================
echo.
echo Credenciais de teste:
echo   - Super Admin: admin@aldeias.pt / 123456
echo   - Admin Aldeia: aldeia@gmail.com / 123456
echo   - Vendedor: vendedor@gmail.com / 123456
echo   - Jogador: smpsandro1239@gmail.com / 123456
echo.
echo Para iniciar: npm run dev
echo.
pause
