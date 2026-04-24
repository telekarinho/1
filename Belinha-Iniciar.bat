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
echo    Health: http://localhost:5757/health
echo    Se voltar ao menu abaixo, o servidor caiu.
echo  ==========================================================
echo.
echo  IMPORTANTE - Chrome bloqueia HTTP^<^>HTTPS por seguranca.
echo  Para conectar ao servidor, faca UMA VEZ:
echo.
echo    1. Abra milkypot.com no Chrome
echo    2. Clique no cadeado ao lado da URL
echo    3. Configuracoes do site ^> Conteudo inseguro: PERMITIR
echo    4. Recarregue a pagina ^(F5^)
echo.
echo  Ou copie esta URL no Chrome e pressione Enter:
echo  chrome://settings/content/siteDetails?site=https://milkypot.com
echo.

REM Tenta abrir Chrome nas configuracoes do site para facilitar
start "" "chrome.exe" "chrome://settings/content/siteDetails?site=https://milkypot.com" 2>nul

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
