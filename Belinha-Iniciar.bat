@echo off
title Belinha - Servidor Local MilkyPot
color 0D

set "MP_DIR=%~dp0"
set "AP_DIR=%MP_DIR%autopilot"

cls
echo.
echo  ==========================================================
echo        BELINHA - Servidor Local
echo        Porta 5757 - Modo padrao: Codex Local
echo  ==========================================================
echo.

cd /d "%AP_DIR%"
if not exist server.js (
    echo [ERRO] autopilot\server.js nao encontrado.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/3] Instalando dependencias ^(primeira vez, ~1min^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERRO] npm install falhou. Verifique sua internet.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencias OK.
)

echo [2/3] Verificando Claude CLI ^(principal^)...
call claude --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Claude CLI nao instalado ou nao logado.
    echo.
    echo Resolver:
    echo   1. npm install -g @anthropic-ai/claude-code
    echo   2. claude login
    echo.
    pause
    exit /b 1
)

echo [2.1/3] Verificando autenticacao do Claude...
@echo Responda apenas OK> "%TEMP%\mp-claude-auth-check.txt"
type "%TEMP%\mp-claude-auth-check.txt" | claude -p --output-format json > "%TEMP%\mp-claude-auth-out.txt" 2>nul
findstr /C:"authentication_error" "%TEMP%\mp-claude-auth-out.txt" >nul 2>&1
if not errorlevel 1 (
    echo [AVISO] Claude encontrado, mas sem login valido. A Belinha vai tentar Codex como backup.
    echo         Pra restaurar o principal: rode ^`claude login^`.
)

echo [3/3] Verificando porta 5757...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing 'http://localhost:5757/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if not errorlevel 1 (
    echo.
    echo  ==========================================================
    echo    JA EXISTE UMA BELINHA RODANDO NA PORTA 5757
    echo.
    echo    Health: http://localhost:5757/health
    echo    Painel: http://localhost:5757/painel/copilot-belinha.html
    echo    Reaproveitando a instancia atual sem reiniciar.
    echo  ==========================================================
    echo.
    start "" "http://localhost:5757/painel/copilot-belinha.html"
    exit /b 0
)

echo [3/3] Iniciando servidor Node...
echo.
echo  ==========================================================
echo    SERVIDOR RODANDO - NAO FECHE ESTA JANELA
echo.
echo    Health: http://localhost:5757/health
echo    Painel: http://localhost:5757/painel/copilot-belinha.html
echo    Se voltar ao menu abaixo, o servidor caiu.
echo  ==========================================================
echo.

REM Abre o painel no browser padrao apos 4s (tempo do servidor subir)
start "" /B cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5757/painel/copilot-belinha.html"

node server.js

echo.
echo  ==========================================================
echo    [AVISO] Servidor parou inesperadamente.
echo    Mensagem de erro acima ^(se houver^).
echo.
echo    Causa comum: porta 5757 ocupada por outro processo.
echo    Se ja existir outra janela da Belinha, use a instancia que ja esta aberta.
echo  ==========================================================
echo.
pause
