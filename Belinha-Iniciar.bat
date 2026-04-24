@echo off
title Belinha - Servidor Local MilkyPot
color 0D

set "MP_DIR=%~dp0"
set "AP_DIR=%MP_DIR%autopilot"

cls
echo.
echo  ==========================================================
echo        BELINHA - Servidor Local
echo        Porta 5757 - Backend: Claude CLI
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

echo [2/3] Verificando Claude CLI...
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

echo [3/3] Iniciando servidor Node...
echo.
echo  ==========================================================
echo    SERVIDOR RODANDO - NAO FECHE ESTA JANELA
echo.
echo    Painel local: http://localhost:5757/painel/copilot-belinha.html
echo    Health check: http://localhost:5757/health
echo  ==========================================================
echo.
echo  O painel abrira AUTOMATICAMENTE no seu browser em 4 segundos.
echo  Belinha vai conectar sem precisar mexer no Chrome.
echo.

REM Aguarda 4s para o servidor subir e abre o painel local no browser padrao
REM Usa localhost (HTTP) em vez de milkypot.com (HTTPS) = sem Mixed Content
start "" /B cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5757/painel/copilot-belinha.html"

node server.js

echo.
echo  ==========================================================
echo    [AVISO] Servidor parou inesperadamente.
echo    Mensagem de erro acima ^(se houver^).
echo.
echo    Causa comum: porta 5757 ocupada por outro processo.
echo    Solucao: feche outras janelas do Belinha, ou reinicie o PC.
echo  ==========================================================
echo.
pause
