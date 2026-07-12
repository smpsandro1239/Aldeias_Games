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
echo  Teste Raspadinha - Fluxo Completo
echo ============================================
echo URL Base: %BASE_URL%
echo.

if /i "%1"=="--help" (
    echo Uso: %~nx0 [BASE_URL]
    exit /b 0
)
if not "%1"=="" set "BASE_URL=%1"

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

echo === 2. Obter evento ===
curl -s "%BASE_URL%/api/eventos?aldeiaId=aldeia-vale-azenha&limit=1" -H "Authorization: Bearer %TOKEN%" > _resp_evento.json
call :extract_json _resp_evento.json "id" EVENTO_ID
if "%EVENTO_ID%"=="" (
    echo ERRO: Nenhum evento encontrado
    type _resp_evento.json
    del _resp_evento.json >nul 2>&1
    pause
    exit /b 1
)
echo EVENTO_ID: %EVENTO_ID%
del _resp_evento.json >nul 2>&1
echo.

echo === 3. Criar Jogo Raspadinha ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Raspadinha Teste Bat\",\"tipo\":\"raspadinha\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":3,\"stockInicial\":1000,\"configuracao\":{\"premios\":[{\"nome\":\"Euro\",\"valorDinheiroAlternative\":5,\"percentagem\":0.15},{\"nome\":\"Dois Euro\",\"valorDinheiroAlternative\":2,\"percentagem\":0.20},{\"nome\":\"Cinco Euro\",\"valorDinheiroAlternative\":5,\"percentagem\":0.10},{\"nome\":\"Dez Euro\",\"valorDinheiroAlternative\":10,\"percentagem\":0.05}]}}" > _resp_jogo.json
call :extract_json _resp_jogo.json "id" JOGO_ID
if "%JOGO_ID%"=="" (
    echo ERRO: Criacao de jogo falhou
    type _resp_jogo.json
    del _resp_jogo.json >nul 2>&1
    pause
    exit /b 1
)
echo JOGO_ID: %JOGO_ID%
del _resp_jogo.json >nul 2>&1
echo.

echo === 4. Login Jogador ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"jogador@gmail.com\",\"password\":\"123456\"}" > _resp_token_jog.json
call :extract_json _resp_token_jog.json "token" TOKEN_JOG
echo OK
del _resp_token_jog.json >nul 2>&1
echo.

echo === 4a. Saldo antes ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet.json
call :extract_json _resp_wallet.json "saldo" SALDO_ANTES
echo Saldo: %SALDO_ANTES%@
del _resp_wallet.json >nul 2>&1
echo.

echo === 4b. Comprar raspadinha (saldo) ===
curl -s -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN_JOG%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"dadosParticipacao\":{},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Jogador\",\"telefone\":\"912345678\"}}" > _resp_part.json
findstr /c:"\"error\"" _resp_part.json >nul && (
    echo ERRO:
    type _resp_part.json
    del _resp_part.json >nul 2>&1
    pause
    exit /b 1
) || (
    echo OK
)
del _resp_part.json >nul 2>&1
echo.

echo === 4c. Saldo depois ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet2.json
call :extract_json _resp_wallet2.json "saldo" SALDO_DEPOIS
for /f %%d in ('powershell -Command "%SALDO_ANTES% - %SALDO_DEPOIS%"') do set DIF=%%d
echo Saldo: !SALDO_DEPOIS!@  (diferenca: !DIF!@)
del _resp_wallet2.json >nul 2>&1
echo.

echo === 5. Revelar raspadinha ===
echo A obter ID da participacao via GET /api/participacoes...
curl -s "%BASE_URL%/api/participacoes?jogoId=%JOGO_ID%" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_list.json
set "PART_ID="
set "FULL="
for /f "usebackq delims=" %%a in ("_resp_list.json") do (
    if defined FULL (set "FULL=!FULL! %%a") else (set "FULL=%%a")
)
echo !FULL! | findstr /c:"\"id\":" >nul || (
    echo ERRO: Nenhuma participacao encontrada
    type _resp_list.json
    del _resp_list.json >nul 2>&1
    pause
    exit /b 1
)
set "FULL=!FULL:*"participacao":{=!"
set "FULL=!FULL:*"id":"=!"
for /f "delims=," %%a in ("!FULL!") do set "PART_ID=%%a"
set "PART_ID=!PART_ID:"=!"
echo Participacao ID: !PART_ID!
del _resp_list.json >nul 2>&1
echo.

curl -s -X POST "%BASE_URL%/api/participacoes/!PART_ID!/revelar" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_revelar.json
findstr /c:"\"success\"" _resp_revelar.json >nul && (echo Revelada: SIM) || (
    echo Revelada: nao
    type _resp_revelar.json
)
del _resp_revelar.json >nul 2>&1
echo.

echo === 6. Reclamar premio ===
curl -s -X POST "%BASE_URL%/api/participacoes/!PART_ID!/claim-premio" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_claim.json
findstr /c:"\"success\"" _resp_claim.json >nul && (
    call :extract_json _resp_claim.json "creditedAmount" VALOR
    call :extract_json _resp_claim.json "prizeName" NOME
    call :extract_json _resp_claim.json "newSaldo" NOVO_SALDO
    echo Premio: !NOME! (!VALOR!@)
    echo Novo saldo: !NOVO_SALDO!@
) || (
    echo Sem premio ou ja reclamado:
    type _resp_claim.json
)
del _resp_claim.json >nul 2>&1
echo.

echo === 7. Saldo final ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet3.json
call :extract_json _resp_wallet3.json "saldo" SALDO_FINAL
echo Saldo final: %SALDO_FINAL%@
del _resp_wallet3.json >nul 2>&1
echo.

del _resp_*.json >nul 2>&1

echo.
echo ============================================
echo  Teste Raspadinha concluido!
echo ============================================
pause
exit /b 0
