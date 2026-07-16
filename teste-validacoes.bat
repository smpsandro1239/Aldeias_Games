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
echo  Teste Validacoes - Erros Esperados
echo  Auth, Stock, Estado, XSS, Permissoes
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
:: 1. Acesso sem token (401)
:: ============================================
echo === 1. Acesso sem token (esperado: 401/403) ===
curl -s -o _resp_noauth.json -w "%%{http_code}" "%BASE_URL%/api/jogos" > _resp_code.txt
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
del _resp_noauth.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 2. Token invalido (401)
:: ============================================
echo === 2. Token invalido (esperado: 401) ===
curl -s -o _resp_badtok.json -w "%%{http_code}" "%BASE_URL%/api/jogos" -H "Authorization: Bearer invalid_token_xyz" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Token invalido -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Token invalido -> !RESP_CODE! (esperado 401)
)
set /a TOTAL+=1
del _resp_badtok.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 3. Login com credenciais erradas (401)
:: ============================================
echo === 3. Login credenciais erradas (esperado: 401) ===
curl -s -o _resp_badlogin.json -w "%%{http_code}" -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@aldeias.pt\",\"password\":\"wrong_password\"}" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Login errado -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Login errado -> !RESP_CODE! (esperado 401)
)
set /a TOTAL+=1
del _resp_badlogin.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 4. Login admin para testes seguintes
:: ============================================
echo === 4. Login admin ===
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
:: 5. Obter evento
:: ============================================
echo === 5. Obter evento ===
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

:: ============================================
:: 6. Criar jogo com stock zero e tentar participar
:: ============================================
echo === 6. Criar jogo com stock 0 ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Teste Stock Zero\",\"tipo\":\"raspadinha\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":2,\"stockInicial\":0,\"configuracao\":{\"premios\":[]}}" > _resp_jogo0.json
call :extract_json _resp_jogo0.json "id" JOGO_0_ID
if "%JOGO_0_ID%"=="" (
    echo ERRO: Criacao de jogo com stock 0 falhou
    type _resp_jogo0.json
    del _resp_jogo0.json >nul 2>&1
    pause
    exit /b 1
)
echo JOGO_0_ID: %JOGO_0_ID%
del _resp_jogo0.json >nul 2>&1
echo.

echo === 6b. Participar com stock 0 (esperado: erro) ===
curl -s -o _resp_stock0.json -w "%%{http_code}" -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_0_ID%\",\"dadosParticipacao\":{},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Teste\",\"telefone\":\"912345678\"}}" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
findstr /c:"\"error\"" _resp_stock0.json >nul && (
    set /a PASS+=1
    echo [PASSOU] Stock 0 bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="400" (
    set /a PASS+=1
    echo [PASSOU] Stock 0 bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="409" (
    set /a PASS+=1
    echo [PASSOU] Stock 0 bloqueado -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Stock 0 devolveu -> !RESP_CODE! (esperado erro)
)
set /a TOTAL+=1
del _resp_stock0.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 7. Criar jogo, fechar, tentar participar
:: ============================================
echo === 7. Criar jogo para fechar ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Teste Fechar\",\"tipo\":\"raspadinha\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":2,\"stockInicial\":10,\"configuracao\":{\"premios\":[]}}" > _resp_jogo_f.json
call :extract_json _resp_jogo_f.json "id" JOGO_F_ID
if "%JOGO_F_ID%"=="" (
    echo ERRO: Criacao de jogo para fechar falhou
    type _resp_jogo_f.json
    del _resp_jogo_f.json >nul 2>&1
    pause
    exit /b 1
)
echo JOGO_F_ID: %JOGO_F_ID%
del _resp_jogo_f.json >nul 2>&1
echo.

echo === 7b. Fechar jogo ===
curl -s -X PUT "%BASE_URL%/api/jogos/%JOGO_F_ID%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"estado\":\"fechado\"}" > _resp_fechar.json
findstr /c:"\"success\"" _resp_fechar.json >nul && (echo Jogo fechado) || (echo AVISO: fechar pode ter falhado)
del _resp_fechar.json >nul 2>&1
echo.

echo === 7c. Participar em jogo fechado (esperado: erro) ===
curl -s -o _resp_fechado.json -w "%%{http_code}" -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_F_ID%\",\"dadosParticipacao\":{},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Teste\",\"telefone\":\"912345678\"}}" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
findstr /c:"\"error\"" _resp_fechado.json >nul && (
    set /a PASS+=1
    echo [PASSOU] Jogo fechado bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="400" (
    set /a PASS+=1
    echo [PASSOU] Jogo fechado bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="409" (
    set /a PASS+=1
    echo [PASSOU] Jogo fechado bloqueado -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Jogo fechado devolveu -> !RESP_CODE! (esperado erro)
)
set /a TOTAL+=1
del _resp_fechado.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 8. Jogador nao pode criar jogos
:: ============================================
echo === 8. Login jogador ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"jogador@gmail.com\",\"password\":\"123456\"}" > _resp_token_jog.json
call :extract_json _resp_token_jog.json "token" TOKEN_JOG
echo OK
del _resp_token_jog.json >nul 2>&1
echo.

echo === 8b. Jogador tenta criar jogo (esperado: 403) ===
curl -s -o _resp_jogcriar.json -w "%%{http_code}" -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN_JOG%" -H "Content-Type: application/json" -d "{\"nome\":\"Hack\",\"tipo\":\"raspadinha\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":1,\"stockInicial\":10}" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="403" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de criar jogo -> !RESP_CODE!
) else if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de criar jogo -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Jogador conseguiu criar jogo -> !RESP_CODE! (esperado 403)
)
set /a TOTAL+=1
del _resp_jogcriar.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 9. Jogador nao pode aceder cofre admin
:: ============================================
echo === 9. Jogador tenta aceder cofre (esperado: 403) ===
curl -s -o _resp_jogcofre.json -w "%%{http_code}" "%BASE_URL%/api/cofre/historico" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="403" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de cofre -> !RESP_CODE!
) else if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de cofre -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Jogador acedeu cofre -> !RESP_CODE! (esperado 403)
)
set /a TOTAL+=1
del _resp_jogcofre.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 10. Jogador nao pode aceder dashboard analytics
:: ============================================
echo === 10. Jogador tenta analytics (esperado: 403) ===
curl -s -o _resp_joganalytics.json -w "%%{http_code}" "%BASE_URL%/api/analytics/dashboard" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="403" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de analytics -> !RESP_CODE!
) else if "!RESP_CODE!"=="401" (
    set /a PASS+=1
    echo [PASSOU] Jogador bloqueado de analytics -> !RESP_CODE!
) else (
    set /a FAIL+=1
    echo [FALHOU] Jogador acedeu analytics -> !RESP_CODE! (esperado 403)
)
set /a TOTAL+=1
del _resp_joganalytics.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 11. Claim duplicado (esperado: erro)
:: ============================================
echo === 11. Criar jogo raspadinha para claim duplicado ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Teste Claim Dup\",\"tipo\":\"raspadinha\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":3,\"stockInicial\":100,\"configuracao\":{\"premios\":[{\"nome\":\"Euro\",\"valorDinheiroAlternative\":5,\"percentagem\":0.50}]}}" > _resp_jogo_dup.json
call :extract_json _resp_jogo_dup.json "id" JOGO_DUP_ID
if "%JOGO_DUP_ID%"=="" (
    echo ERRO: Criacao de jogo claim dup falhou
    type _resp_jogo_dup.json
    del _resp_jogo_dup.json >nul 2>&1
    pause
    exit /b 1
)
echo JOGO_DUP_ID: %JOGO_DUP_ID%
del _resp_jogo_dup.json >nul 2>&1
echo.

echo === 11b. Participar + Revelar ===
curl -s -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN_JOG%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_DUP_ID%\",\"dadosParticipacao\":{},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Teste Dup\",\"telefone\":\"912345678\"}}" > _resp_part_dup.json
findstr /c:"\"error\"" _resp_part_dup.json >nul && (
    echo ERRO na participacao claim dup:
    type _resp_part_dup.json
) || (
    echo OK
)
del _resp_part_dup.json >nul 2>&1

curl -s "%BASE_URL%/api/participacoes?jogoId=%JOGO_DUP_ID%" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_list_dup.json
set "PART_DUP_ID="
set "FULL="
for /f "usebackq delims=" %%a in ("_resp_list_dup.json") do (
    if defined FULL (set "FULL=!FULL! %%a") else (set "FULL=%%a")
)
set "FULL=!FULL:*"participacao":{=!"
set "FULL=!FULL:*"id":"=!"
for /f "delims=," %%a in ("!FULL!") do set "PART_DUP_ID=%%a"
set "PART_DUP_ID=!PART_DUP_ID:"=!"
echo Part Dup ID: !PART_DUP_ID!
del _resp_list_dup.json >nul 2>&1

curl -s -X POST "%BASE_URL%/api/participacoes/!PART_DUP_ID!/revelar" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_rev_dup.json
findstr /c:"\"success\"" _resp_rev_dup.json >nul && (echo Revelada: SIM) || (echo Revelada: nao/erro)
del _resp_rev_dup.json >nul 2>&1
echo.

echo === 11c. Claim premio ===
curl -s -X POST "%BASE_URL%/api/participacoes/!PART_DUP_ID!/claim-premio" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_claim1.json
findstr /c:"\"success\"" _resp_claim1.json >nul && (echo Claim 1: OK) || (echo Claim 1: sem premio)
del _resp_claim1.json >nul 2>&1
echo.

echo === 11d. Claim duplicado (esperado: erro) ===
curl -s -o _resp_claimdup.json -w "%%{http_code}" -X POST "%BASE_URL%/api/participacoes/!PART_DUP_ID!/claim-premio" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_code.txt
set /p RESP_CODE=<_resp_code.txt
if "!RESP_CODE!"=="400" (
    set /a PASS+=1
    echo [PASSOU] Claim duplicado bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="409" (
    set /a PASS+=1
    echo [PASSOU] Claim duplicado bloqueado -> !RESP_CODE!
) else if "!RESP_CODE!"=="404" (
    set /a PASS+=1
    echo [PASSOU] Claim duplicado bloqueado -> !RESP_CODE!
) else (
    findstr /c:"\"error\"" _resp_claimdup.json >nul && (
        set /a PASS+=1
        echo [PASSOU] Claim duplicado bloqueado com erro
    ) || (
        set /a FAIL+=1
        echo [FALHOU] Claim duplicado devolveu -> !RESP_CODE! (esperado erro)
    )
)
set /a TOTAL+=1
del _resp_claimdup.json >nul 2>&1
del _resp_code.txt >nul 2>&1
echo.

:: ============================================
:: 12. Tentar fechar jogo com participacoes
:: ============================================
echo === 12. Fechar jogo com stock restante (esperado: OK) ===
curl -s -X PUT "%BASE_URL%/api/jogos/%JOGO_DUP_ID%" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"estado\":\"fechado\"}" > _resp_fechardup.json
findstr /c:"\"success\"" _resp_fechardup.json >nul && (
    set /a PASS+=1
    echo [PASSOU] Jogo com participacoes fechado
) || (
    set /a FAIL+=1
    echo [FALHOU] Nao conseguiu fechar jogo com participacoes
)
set /a TOTAL+=1
del _resp_fechardup.json >nul 2>&1
echo.

:: ============================================
:: Resultado
:: ============================================
del _resp_*.json >nul 2>&1
del _resp_code.txt >nul 2>&1

echo.
echo ============================================
echo  RESULTADO VALIDACOES
echo ============================================
echo  Passaram: !PASS!/%TOTAL%
echo  Falharam: !FAIL!/%TOTAL%
echo ============================================

if !FAIL! gtr 0 (
    echo  ALGUNS TESTES FALHARAM
) else (
    echo  TODOS OS TESTES DE VALIDACAO PASSARAM
)
echo ============================================

pause
exit /b %FAIL%
