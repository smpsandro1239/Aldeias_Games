@echo off
REM ============================================================
REM Aldeias Games — Testes Automatizados dos 4 Jogos
REM Production: https://aldeiasgames.vercel.app
REM ============================================================

set BASE_URL=https://aldeiasgames.vercel.app
set RESULTS_DIR=%TEMP%\aldeias-tests
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

echo ============================================
echo   Aldeias Games — Testes Automatizados
echo   Base URL: %BASE_URL%
echo ============================================
echo.

REM ---- STEP 0: Health Check ----
echo [0/8] Health Check...
curl -s %BASE_URL%/api/health > "%RESULTS_DIR%\health.json" 2>&1
type "%RESULTS_DIR%\health.json"
echo.
echo.

REM ---- STEP 1: Login Super Admin ----
echo [1/8] Login Super Admin...
curl -s -X POST %BASE_URL%/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@aldeias.pt\",\"password\":\"123456\"}" > "%RESULTS_DIR%\login-admin.json" 2>&1
type "%RESULTS_DIR%\login-admin.json"
echo.
echo.

REM ---- STEP 2: Login Jogador ----
echo [2/8] Login Jogador...
curl -s -X POST %BASE_URL%/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"jogador@gmail.com\",\"password\":\"123456\"}" > "%RESULTS_DIR%\login-jogador.json" 2>&1
type "%RESULTS_DIR%\login-jogador.json"
echo.
echo.

echo ============================================
echo   Resultados guardados em: %RESULTS_DIR%
echo ============================================
