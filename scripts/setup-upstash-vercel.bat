@echo off
REM ============================================================
REM Upstash Redis — Configuração na Vercel (Windows)
REM Aldeias Games v3.12.0
REM ============================================================

echo ============================================
echo   Upstash Redis — Setup Vercel
echo ============================================
echo.

REM ---- STEP 1: Verificar Vercel CLI ----
echo [1/4] A verificar Vercel CLI...
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Vercel CLI nao encontrado.
    echo Instalar com: npm i -g vercel
    exit /b 1
)
echo   OK: Vercel CLI encontrado
echo.

REM ---- STEP 2: Credenciais ----
echo [2/4] Credenciais Upstash Redis
echo.
echo   Para obter estas credenciais:
echo   1. Aceder a https://upstash.com
echo   2. Criar banco de dados Redis (Regional: Frankfurt)
echo   3. Copiar REST URL e REST Token
echo.

set /p UPSTASH_URL="  UPSTASH_REDIS_REST_URL: "
set /p UPSTASH_TOKEN="  UPSTASH_REDIS_REST_TOKEN: "

REM ---- STEP 3: Adicionar ao Vercel ----
echo.
echo [3/4] A adicionar variaveis de ambiente no Vercel...
echo %UPSTASH_URL% | vercel env add UPSTASH_REDIS_REST_URL production
echo %UPSTASH_TOKEN% | vercel env add UPSTASH_REDIS_REST_TOKEN production
echo   OK: Variaveis adicionadas
echo.

REM ---- STEP 4: Proximos passos ----
echo [4/4] Configuracao concluida!
echo.
echo   Proximos passos:
echo   1. git push origin main
echo   2. Verificar deploy no Vercel Dashboard
echo   3. Testar: curl -I https://aldeiasgame.vercel.app/api/health
echo.
echo   Headers esperados:
echo     X-RateLimit-Limit: 100
echo     X-RateLimit-Remaining: 99
echo.
