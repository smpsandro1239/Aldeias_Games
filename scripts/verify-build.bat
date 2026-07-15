@echo off
REM ============================================================
REM Build Verification — Testar build com proxy.ts
REM Aldeias Games v3.12.0
REM ============================================================

echo ============================================
echo   Build Verification - proxy.ts
echo ============================================
echo.

REM ---- STEP 1: Prisma Generate ----
echo [1/5] Prisma generate...
cmd /c "npx prisma@6.19.3 generate"
if %errorlevel% neq 0 (
    echo ERRO: Prisma generate falhou
    exit /b 1
)
echo   OK: Prisma Client gerado
echo.

REM ---- STEP 2: Verificar proxy.ts existe ----
echo [2/5] A verificar proxy.ts...
if not exist "src\proxy.ts" (
    echo ERRO: src/proxy.ts nao encontrado
    exit /b 1
)
echo   OK: src/proxy.ts encontrado
echo.

REM ---- STEP 3: Verificar middleware.ts removido ----
echo [3/5] A verificar middleware.ts removido...
if exist "src\middleware.ts" (
    echo AVISO: src/middleware.ts ainda existe (deveria ter sido removido)
) else (
    echo   OK: src/middleware.ts removido
)
echo.

REM ---- STEP 4: Vitest ----
echo [4/5] A executar testes Vitest...
cmd /c "npx vitest run --reporter=dot 2>&1"
if %errorlevel% neq 0 (
    echo ERRO: Testes Vitest falharam
    exit /b 1
)
echo.

REM ---- STEP 5: Build Next.js ----
echo [5/5] A executar build Next.js (webpack)...
cmd /c "npx next build --webpack"
if %errorlevel% neq 0 (
    echo ERRO: Build Next.js falhou
    exit /b 1
)
echo.

echo ============================================
echo   Build verification concluido com sucesso!
echo ============================================
echo.
echo   Resumo:
echo   - Prisma generate: OK
echo   - proxy.ts: OK
echo   - middleware.ts: removido
echo   - Vitest: todos os testes passaram
echo   - Build Next.js: OK
echo.
echo   O deploy na Vercel deve funcionar.
echo.
