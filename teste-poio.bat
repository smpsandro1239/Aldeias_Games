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
echo  Teste Poio da Vaca - Fluxo Completo
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

echo === 3. Criar Jogo Poio da Vaca ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Poio Teste Bat\",\"tipo\":\"poio_da_vaca\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":2,\"stockInicial\":100,\"configuracao\":{\"letras\":[\"A\",\"B\",\"C\",\"D\",\"E\"],\"numerosPorLetra\":10},\"dimensoesCampo\":\"{\\\"x\\\":10,\\\"y\\\":5}\",\"custoQuadrado\":2}" > _resp_jogo.json
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

echo === 4b. Participar (A5 - coordenada A,5) ===
curl -s -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN_JOG%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"dadosParticipacao\":{\"letra\":\"A\",\"numero\":5,\"coordenadas\":[\"A5\"]},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Jogador\",\"telefone\":\"912345678\"}}" > _resp_part.json
findstr /c:"\"error\"" _resp_part.json >nul && (
    echo ERRO:
    type _resp_part.json
) || (
    echo OK
)
del _resp_part.json >nul 2>&1
echo.

echo === 4c. Saldo depois ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet2.json
call :extract_json _resp_wallet2.json "saldo" SALDO_DEPOIS
set /a DIF = SALDO_ANTES - SALDO_DEPOIS
echo Saldo: !SALDO_DEPOIS!@  (diferenca: !DIF!@)
del _resp_wallet2.json >nul 2>&1
echo.

echo === 5. Commit do sorteio (PATCH) ===
curl -s -X PATCH "%BASE_URL%/api/sorteios" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"action\":\"commit\"}" > _resp_commit.json
findstr /c:"\"success\"" _resp_commit.json >nul && (echo Hash comprometido) || (type _resp_commit.json)
del _resp_commit.json >nul 2>&1
echo.

echo === 6. Sortear (POST) ===
curl -s -X POST "%BASE_URL%/api/sorteios" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"clientSeed\":\"teste123\"}" > _resp_sortear.json
findstr /c:"\"success\"" _resp_sortear.json >nul && (
    call :extract_json _resp_sortear.json "resultado" RESULTADO
    echo Resultado: !RESULTADO!
    call :extract_json _resp_sortear.json "vencedorId" VENCEDOR
    if not "!VENCEDOR!"=="" (echo Vencedor encontrado: SIM) else (echo Vencedor encontrado: nao)
) || (
    echo Resultado do sorteio:
    type _resp_sortear.json
)
del _resp_sortear.json >nul 2>&1
echo.

echo === 7. Verificar estado do jogo ===
curl -s "%BASE_URL%/api/jogos/%JOGO_ID%" -H "Authorization: Bearer %TOKEN%" > _resp_jogo_final.json
findstr /c:"\"isFinalizado\":true" _resp_jogo_final.json >nul && (echo Jogo finalizado: SIM) || (echo Jogo finalizado: nao)
call :extract_json _resp_jogo_final.json "sorteado" SORTEADO
if not "!SORTEADO!"=="" echo Numero sorteado: !SORTEADO!
del _resp_jogo_final.json >nul 2>&1
echo.

del _resp_*.json >nul 2>&1

echo.
echo ============================================
echo  Teste Poio da Vaca concluido!
echo ============================================
pause
exit /b 0
