@echo off
setlocal enabledelayedexpansion
set BASE_URL=http://localhost:3000
goto :main

:extract_json
set "JSON_FILE=%~1"
set "JSON_KEY=%~2"
set "OUT_VAR=%~3"
if not exist "%JSON_FILE%" exit /b 1
set "FOUND="
set "LINE="
for /f "usebackq delims=" %%a in ("%JSON_FILE%") do (
    if defined LINE (set "LINE=!LINE! %%a") else (set "LINE=%%a")
)
if "!LINE!"=="" exit /b 1
echo !LINE! | findstr /c:"\"%JSON_KEY%\":" >nul || exit /b 1
set "LINE=!LINE:*"%JSON_KEY%":=!"
if "!LINE!"=="" exit /b 1
for /f "delims=,}" %%b in ("!LINE!") do set "FOUND=%%b"
set "FOUND=!FOUND:"=!"
if not "!FOUND!"=="" (
    set "%OUT_VAR%=!FOUND!"
    exit /b 0
)
exit /b 1

:main
echo ============================================
echo  Teste Dashboard Analytics
echo  Super Admin + Aldeia Admin + Jogador
echo ============================================
echo URL Base: %BASE_URL%
echo.

if /i "%1"=="--help" (
    echo Uso: %~nx0 [BASE_URL]
    exit /b 0
)
if not "%1"=="" set "BASE_URL=%1"

set "PASS=0"
set "FAIL=0"
set "TOTAL=0"

:: ============================================
:: 1. Login Super Admin
:: ============================================
echo === 1. Login Super Admin ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@aldeias.pt\",\"password\":\"123456\"}" > _resp_token.json
call :extract_json _resp_token.json "token" TOKEN
if "%TOKEN%"=="" (
    echo ERRO: Login admin falhou
    type _resp_token.json
    del _resp_token.json >nul 2>&1
    pause
    exit /b 1
)
echo OK
del _resp_token.json >nul 2>&1
echo.

:: ============================================
:: 2. Super Admin acede analytics (200)
:: ============================================
echo === 2. Super Admin analytics (esperado: 200) ===
curl -s -o _resp_sa.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard" -H "Authorization: Bearer %TOKEN%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="200" (
    set /a PASS+=1
    echo [PASSOU] Super Admin -> !RESP_CODE!
    findstr /c:"\"totalJogos\"" _resp_sa.json >nul && (echo   Campos analytics: ENCONTRADOS) || (echo   AVISO: campos analytics nao encontrados)
) else (
    set /a FAIL+=1
    echo [FALHOU] Super Admin -> !RESP_CODE! (esperado 200)
    type _resp_sa.json
)
set /a TOTAL+=1
del _resp_sa.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 3. Super Admin com filtro aldeiaId
:: ============================================
echo === 3. Super Admin analytics com filtro aldeiaId ===
curl -s -o _resp_sa_f.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard?aldeiaId=aldeia-vale-azenha" -H "Authorization: Bearer %TOKEN%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="200" (
    set /a PASS+=1
    echo [PASSOU] Super Admin filtro -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Super Admin filtro -> !RESP_CODE!
)
set /a TOTAL+=1
del _resp_sa_f.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 4. Login Aldeia Admin
:: ============================================
echo === 4. Login Aldeia Admin ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin.valeazenha@gmail.com\",\"password\":\"123456\"}" > _resp_token_aa.json
call :extract_json _resp_token_aa.json "token" TOKEN_AA
if "%TOKEN_AA%"=="" (
    echo ERRO: Login aldeia admin falhou
    type _resp_token_aa.json
    del _resp_token_aa.json >nul 2>&1
    echo AVISO: A saltar testes de aldeia admin
    goto :skip_aa
)
echo OK
del _resp_token_aa.json >nul 2>&1
echo.

:: ============================================
:: 5. Aldeia Admin acede analytics (200)
:: ============================================
echo === 5. Aldeia Admin analytics (esperado: 200) ===
curl -s -o _resp_aa.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard" -H "Authorization: Bearer %TOKEN_AA%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="200" (
    set /a PASS+=1
    echo [PASSOU] Aldeia Admin -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Aldeia Admin -> !RESP_CODE! (esperado 200)
    type _resp_aa.json
)
set /a TOTAL+=1
del _resp_aa.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:skip_aa
:: ============================================
:: 6. Login Jogador
:: ============================================
echo === 6. Login Jogador ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"jogador@gmail.com\",\"password\":\"123456\"}" > _resp_token_jog.json
call :extract_json _resp_token_jog.json "token" TOKEN_JOG
if "%TOKEN_JOG%"=="" (
    echo ERRO: Login jogador falhou
    type _resp_token_jog.json
    del _resp_token_jog.json >nul 2>&1
    echo AVISO: A saltar teste de jogador
    goto :skip_jog
)
echo OK
del _resp_token_jog.json >nul 2>&1
echo.

:: ============================================
:: 7. Jogador NAO pode aceder analytics (403)
:: ============================================
echo === 7. Jogador analytics (esperado: 403) ===
curl -s -o _resp_jog.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="403" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Jogador acedeu -> !RESP_CODE! (esperado 403)
)
set /a TOTAL+=1
del _resp_jog.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:skip_jog
:: ============================================
:: 8. Sem token (401)
:: ============================================
echo === 8. Sem token analytics (esperado: 401) ===
curl -s -o _resp_notok.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Sem token -> !RESP_CODE!
) else if "!RESP_CODE!"=="403" (
    set /a PASS+=1
    echo [PASSOU] Sem token -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Sem token -> !RESP_CODE! (esperado 401/403)
)
set /a TOTAL+=1
del _resp_notok.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: Resultado
:: ============================================
del _resp_*.json >nul 2>&1
del _resp_code.txt >nul 2>&1

echo.
echo ============================================
echo  RESULTADO ANALYTICS
echo ============================================
echo  Passaram: !PASS!/%TOTAL%
echo  Falharam: !FAIL!/%TOTAL%
echo ============================================

if !FAIL! gtr 0 (
    echo  ALGUNS TESTES FALHARAM
) else (
    echo  TODOS OS TESTES DE ANALYTICS PASSARAM
)
echo ============================================

pause
exit /b %FAIL%
