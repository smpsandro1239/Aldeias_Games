@echo off
setlocal enabledelayedexpansion
set BASE_URL=http://localhost:3000
goto :main

:: =============================================
:: Helper: extrair o primeiro valor de uma chave JSON
:: Suporta valores string ("valor") e numericos/boolean (123 / true / false)
:: Uso: call :extract_json "ficheiro" "chave" var_out
:: =============================================
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

:: =============================================
:: MAIN
:: =============================================
:main
echo ============================================
echo  Teste Euromilhoes - Fluxo Completo
echo ============================================
echo URL Base: %BASE_URL%
echo.

if /i "%1"=="--help" (
    echo Uso: %~nx0 [BASE_URL]
    echo Exemplo: %~nx0 https://aldeiasgames.vercel.app
    exit /b 0
)
if not "%1"=="" set "BASE_URL=%1"

:: ----------------------------------------------
:: 1. Login Super Admin
:: ----------------------------------------------
echo === 1. Login Super Admin (admin@aldeias.pt) ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"admin@aldeias.pt\",\"password\":\"123456\"}" > _resp_token.json
call :extract_json _resp_token.json "token" TOKEN
if "%TOKEN%"=="" (
    echo ERRO: Login admin falhou
    type _resp_token.json
    del _resp_token.json >nul 2>&1
    echo.
    echo Dica: O seed foi executado? Use:
    echo   npx prisma db push ^&^& npx tsx prisma/seed-full.ts
    pause
    exit /b 1
)
echo Token: %TOKEN:~0,30%...
del _resp_token.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 1b. Obter ID do evento para criar jogo
:: ----------------------------------------------
echo === 1b. Obter evento ===
curl -s "%BASE_URL%/api/eventos?aldeiaId=aldeia-vale-azenha&limit=1" -H "Authorization: Bearer %TOKEN%" > _resp_evento.json
call :extract_json _resp_evento.json "id" EVENTO_ID
if "%EVENTO_ID%"=="" (
    echo ERRO: Nenhum evento encontrado para aldeia-vale-azenha
    type _resp_evento.json
    del _resp_evento.json >nul 2>&1
    pause
    exit /b 1
)
echo EVENTO_ID: %EVENTO_ID%
del _resp_evento.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 2. Criar Jogo Euromilhoes
:: ----------------------------------------------
echo === 2. Criar Jogo Euromilhoes ===
curl -s -X POST "%BASE_URL%/api/jogos" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"nome\":\"Euromilhoes Teste Bat\",\"tipo\":\"euromilhoes\",\"eventoId\":\"%EVENTO_ID%\",\"preco\":2,\"stockInicial\":10000,\"configuracao\":{\"premioDescricao\":\"1000�\",\"premioValor\":1000}}" > _resp_jogo.json
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

:: ----------------------------------------------
:: 3. Criar Grelha
:: ----------------------------------------------
echo === 3. Criar Grelha ===
curl -s -X POST "%BASE_URL%/api/euromilhoes/grelhas" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"premioDescricao\":\"1000�\",\"premioValor\":1000}" > _resp_grelha.json
call :extract_json _resp_grelha.json "id" GRELHA_ID
if "%GRELHA_ID%"=="" (
    echo ERRO: Criacao de grelha falhou
    type _resp_grelha.json
    del _resp_grelha.json >nul 2>&1
    pause
    exit /b 1
)
echo GRELHA_ID: %GRELHA_ID%
del _resp_grelha.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 3a. Verificar sorteioData e bloqueioData
:: ----------------------------------------------
echo === 3a. Verificar datas agendadas ===
curl -s "%BASE_URL%/api/euromilhoes/grelhas?jogoId=%JOGO_ID%" -H "Authorization: Bearer %TOKEN%" > _resp_datas.json
findstr /c:"sorteioData" _resp_datas.json >nul && (echo Grelha tem sorteioData SIM) || (echo AVISO: sorteioData NAO encontrado)
findstr /c:"bloqueioData" _resp_datas.json >nul && (echo Grelha tem bloqueioData SIM) || (echo AVISO: bloqueioData NAO encontrado)
call :extract_json _resp_datas.json "sorteioData" SD
if not "%SD%"=="" echo Sorteio: %SD%
call :extract_json _resp_datas.json "bloqueioData" BD
if not "%BD%"=="" echo Bloqueio: %BD%
del _resp_datas.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 4. Login Jogador
:: ----------------------------------------------
echo === 4. Login Jogador ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"jogador@gmail.com\",\"password\":\"123456\"}" > _resp_token_jog.json
call :extract_json _resp_token_jog.json "token" TOKEN_JOG
if "%TOKEN_JOG%"=="" (
    echo ERRO: Login jogador falhou
    type _resp_token_jog.json
    del _resp_token_jog.json >nul 2>&1
    pause
    exit /b 1
)
echo Token jogador: %TOKEN_JOG:~0,30%...
del _resp_token_jog.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 4a. Saldo antes
:: ----------------------------------------------
echo === 4a. Saldo antes ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet.json
call :extract_json _resp_wallet.json "saldo" SALDO_ANTES
echo Saldo: %SALDO_ANTES%�
del _resp_wallet.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 4b. Participar (5 numeros, saldo)
:: ----------------------------------------------
echo === 4b. Participar (numeros 7,13,21,34,42) ===
curl -s -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN_JOG%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"grelhaId\":\"%GRELHA_ID%\",\"numerosSelecionados\":[7,13,21,34,42],\"dadosParticipacao\":{\"numeros\":[7,13,21,34,42]},\"quantidade\":1,\"metodoPagamento\":\"saldo\",\"dadosCliente\":{\"nome\":\"Jogador Teste\",\"telefone\":\"912345678\"}}" > _resp_part.json
findstr /c:"\"error\"" _resp_part.json >nul && (
    echo ERRO na participacao:
    type _resp_part.json
) || (
    echo Participacao criada
)
del _resp_part.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 4c. Saldo depois
:: ----------------------------------------------
echo === 4c. Saldo depois (esperado: menos 10� = 5 nums x 2�) ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet2.json
call :extract_json _resp_wallet2.json "saldo" SALDO_DEPOIS
if not "%SALDO_DEPOIS%"=="" (
    echo Saldo: %SALDO_DEPOIS%�
    for /f %%d in ('powershell -Command "%SALDO_ANTES% - %SALDO_DEPOIS%"') do set DIF=%%d
    echo Diferenca: !DIF!�
)
del _resp_wallet2.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 5. Login Vendedor
:: ----------------------------------------------
echo === 5. Login Vendedor ===
curl -s -X POST "%BASE_URL%/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"vendedor@gmail.com\",\"password\":\"123456\"}" > _resp_token_ven.json
call :extract_json _resp_token_ven.json "token" TOKEN_VEN
if "%TOKEN_VEN%"=="" (
    echo ERRO: Login vendedor falhou
    type _resp_token_ven.json
    del _resp_token_ven.json >nul 2>&1
    pause
    exit /b 1
)
echo Token vendedor: %TOKEN_VEN:~0,30%...
del _resp_token_ven.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 5a. Vendedor regista anonimo (dinheiro)
:: ----------------------------------------------
echo === 5a. Vendedor regista anonimo (numeros 3,9,15,28,44) ===
curl -s -X POST "%BASE_URL%/api/participacoes" -H "Authorization: Bearer %TOKEN_VEN%" -H "Content-Type: application/json" -d "{\"jogoId\":\"%JOGO_ID%\",\"grelhaId\":\"%GRELHA_ID%\",\"numerosSelecionados\":[3,9,15,28,44],\"dadosParticipacao\":{\"numeros\":[3,9,15,28,44]},\"quantidade\":1,\"metodoPagamento\":\"dinheiro\",\"dadosCliente\":{\"nome\":\"Anonimo da Rua\",\"telefone\":\"912345678\"}}" > _resp_part_ven.json
findstr /c:"\"error\"" _resp_part_ven.json >nul && (
    echo ERRO na participacao do vendedor:
    type _resp_part_ven.json
) || (
    echo Participacao criada
)
del _resp_part_ven.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 6. Fechar Grelha
:: ----------------------------------------------
echo === 6. Fechar Grelha ===
curl -s -X PUT "%BASE_URL%/api/euromilhoes/grelhas/%GRELHA_ID%/fechar" -H "Authorization: Bearer %TOKEN%" > _resp_fechar.json
call :extract_json _resp_fechar.json "estado" ESTADO
echo Estado: %ESTADO%
del _resp_fechar.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 7. Sortear (fallback manual: numero 13)
:: ----------------------------------------------
echo === 7. Sortear (fallback manual: 13) ===
curl -s -X PUT "%BASE_URL%/api/euromilhoes/grelhas/%GRELHA_ID%/sortear" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"numeroManual\":13}" > _resp_sortear.json
call :extract_json _resp_sortear.json "numeroSorteado" NUM_SORT
echo Numero sorteado: %NUM_SORT%
findstr /c:"\"isVendido\":true" _resp_sortear.json >nul && (echo Foi vendido: sim) || (echo Foi vendido: nao)
del _resp_sortear.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 8. Verificar premio
:: ----------------------------------------------
echo === 8. Verificar premio do vencedor ===
curl -s "%BASE_URL%/api/wallet" -H "Authorization: Bearer %TOKEN_JOG%" > _resp_wallet3.json
call :extract_json _resp_wallet3.json "saldo" SALDO_FINAL
echo Saldo final jogador: %SALDO_FINAL%�
findstr /c:"premio_dinheiro" _resp_wallet3.json >nul && (echo Transacao premio_dinheiro encontrada) || (echo AVISO: sem transacao premio_dinheiro)
del _resp_wallet3.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 9. Cashbox Vendedor
:: ----------------------------------------------
echo === 9. Cashbox Vendedor ===
curl -s "%BASE_URL%/api/vendedor/cashbox" -H "Authorization: Bearer %TOKEN_VEN%" > _resp_cashbox.json
type _resp_cashbox.json
echo.
del _resp_cashbox.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 10. Estado final da grelha
:: ----------------------------------------------
echo === 10. Estado final da grelha ===
curl -s "%BASE_URL%/api/euromilhoes/grelhas?jogoId=%JOGO_ID%" -H "Authorization: Bearer %TOKEN%" > _resp_final.json
findstr /c:"\"sorteada\"" _resp_final.json >nul && (echo Grelha sorteada) || (echo AVISO: estado inesperado)
call :extract_json _resp_final.json "numeroSorteado" NS
if not "%NS%"=="" echo Numero sorteado: %NS%
call :extract_json _resp_final.json "vencedorId" VID
if not "%VID%"=="" (echo Vencedor ID: %VID%) else (echo Vencedor: nenhum)
del _resp_final.json >nul 2>&1
echo.

:: ----------------------------------------------
:: 11. Logs de auditoria
:: ----------------------------------------------
echo === 11. Logs de auditoria (ultimos 5) ===
curl -s "%BASE_URL%/api/admin/audit-logs?limit=5" -H "Authorization: Bearer %TOKEN%" > _resp_audit.json
findstr /c:"euromilhoes" _resp_audit.json >nul && (
    echo Logs:
    findstr /c:"euromilhoes" _resp_audit.json
) || (
    echo Nenhum log de euromilhoes:
    type _resp_audit.json
)
del _resp_audit.json >nul 2>&1
echo.

:: ----------------------------------------------
:: Limpeza
:: ----------------------------------------------
del _resp_*.json >nul 2>&1

echo.
echo ============================================
echo  Teste concluido!
echo ============================================
pause
exit /b 0
