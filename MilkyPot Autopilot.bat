@echo off
chcp 65001 >nul
title MilkyPot Autopilot - Belinha AI + CEO Mentor Local
color 0D

REM ============================================================
REM  MilkyPot Autopilot
REM  Servidor local na porta 5757 pra Belinha AI + CEO Mentor
REM  Usa o plano Claude Pro/Max autenticado no `claude` CLI.
REM  Zero custo de API key.
REM ============================================================

set "MP_DIR=%~dp0"
set "AP_DIR=%MP_DIR%autopilot"
set "PORT=5757"

:MENU
cls
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║                                                   ║
echo  ║        🐑  MilkyPot Autopilot v1.0.0             ║
echo  ║        Belinha AI ^| CEO Mentor ^| Local           ║
echo  ║                                                   ║
echo  ╚═══════════════════════════════════════════════════╝
echo.
echo   ═══════════════ SERVIDOR ═══════════════
echo   [1] Iniciar servidor local (deixar rodando)
echo   [2] Parar servidor
echo   [3] Status do servidor
echo   [4] Ver logs em tempo real
echo.
echo   ═══════════════ BELINHA / CEO ═══════════════
echo   [5] Testar conexão com ^`claude^` CLI
echo   [6] Abrir painel Belinha AI no browser
echo   [7] Abrir painel CEO Mentor no browser
echo.
echo   ═══════════════ AUTOPILOT ═══════════════
echo   [8] Briefing do dia AGORA (Belinha)
echo   [9] Análise executiva AGORA (CEO Mentor)
echo   [10] Gerar 3 copies pro Instagram
echo   [11] Scanner de estado (auditoria sistema)
echo.
echo   ═══════════════ SETUP ═══════════════
echo   [12] Instalar dependências (primeira vez)
echo   [13] Fazer login no `claude` CLI
echo   [14] Atualizar código (git pull)
echo   [15] Abrir pasta do projeto
echo.
echo   [0] Sair
echo.
set /p opcao="  Escolha: "

if "%opcao%"=="1" goto START
if "%opcao%"=="2" goto STOP
if "%opcao%"=="3" goto STATUS
if "%opcao%"=="4" goto LOGS
if "%opcao%"=="5" goto TESTCLI
if "%opcao%"=="6" goto OPENBELINHA
if "%opcao%"=="7" goto OPENCEO
if "%opcao%"=="8" goto BRIEFING
if "%opcao%"=="9" goto CEOBRIEF
if "%opcao%"=="10" goto IGCOPIES
if "%opcao%"=="11" goto SCANNER
if "%opcao%"=="12" goto INSTALL
if "%opcao%"=="13" goto LOGIN
if "%opcao%"=="14" goto UPDATE
if "%opcao%"=="15" goto OPENFOLDER
if "%opcao%"=="0" exit
goto MENU

REM ============================================================
REM SERVIDOR
REM ============================================================

:START
cls
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║  🟢 INICIANDO SERVIDOR LOCAL                      ║
echo  ╚═══════════════════════════════════════════════════╝
echo.
echo   Porta: %PORT%
echo   Backend: claude CLI (plano Claude Pro/Max)
echo   Health: http://localhost:%PORT%/health
echo.
cd /d "%AP_DIR%"

REM Verifica se porta ja tem processo zumbi (evita EADDRINUSE)
echo   🔍 Verificando porta %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
  echo   ⚠️  Porta ocupada pelo PID %%a — matando processo zumbi...
  taskkill /F /PID %%a >nul 2>&1
  timeout /t 1 /nobreak >nul
)

if not exist node_modules (
  echo   📦 Instalando dependências (primeira vez, ~1min)...
  call npm install
  if errorlevel 1 (
    echo.
    echo  [ERRO] npm install falhou. Verifique sua conexão e tente opção [12].
    pause
    goto MENU
  )
)
echo   ✅ Dependências OK. Testando Claude CLI...
call claude --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERRO] Claude CLI não encontrado. Use opção [13] pra fazer login primeiro.
  pause
  goto MENU
)
echo   ✅ Claude CLI OK. Iniciando servidor...
echo.
echo   ⭐ SERVIDOR RODANDO. Deixa essa janela aberta!
echo      Pra parar: Ctrl+C ou feche a janela.
echo.
node server.js
echo.
echo  [AVISO] Servidor parou. Se caiu inesperado, rode [3] Status pra diagnosticar.
pause
goto MENU

:STOP
cls
echo.
echo  Parando servidor na porta %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
  echo   PID encontrado: %%a
  taskkill /F /PID %%a 2>nul
)
echo.
echo   ✅ Servidor parado.
echo.
pause
goto MENU

:STATUS
cls
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║  📊 STATUS DO SERVIDOR                            ║
echo  ╚═══════════════════════════════════════════════════╝
echo.
curl -s http://localhost:%PORT%/health
echo.
echo.
netstat -aon | findstr :%PORT% | findstr LISTENING
echo.
echo.
pause
goto MENU

:LOGS
cls
echo.
echo  Servidor roda em foreground na opção 1. Se quiser logs separados,
echo  rode:  node server.js ^> milkypot.log 2^>^&1
echo.
if exist "%AP_DIR%\milkypot.log" type "%AP_DIR%\milkypot.log"
pause
goto MENU

REM ============================================================
REM CLI E PAINÉIS
REM ============================================================

:TESTCLI
cls
echo.
echo  Testando conexão com `claude` CLI...
echo.
claude --version
echo.
echo  Enviando mensagem de teste...
echo.
claude -p "Em 1 linha: você é a Belinha AI da MilkyPot?" --output-format json
echo.
echo.
pause
goto MENU

:OPENBELINHA
start https://milkypot.com/painel/copilot-belinha.html
goto MENU

:OPENCEO
start https://milkypot.com/admin/ceo-mentor.html
goto MENU

REM ============================================================
REM AÇÕES AUTOPILOT (via curl direto no servidor local)
REM ============================================================

:BRIEFING
cls
echo.
echo  🌅 Briefing do dia AGORA (Belinha AI)...
echo.
curl -s -X POST http://localhost:%PORT%/copilot ^
 -H "Content-Type: application/json" ^
 -d "{\"persona\":\"belinha\",\"messages\":[{\"role\":\"user\",\"content\":\"Faça meu briefing executivo de hoje. TL;DR em 1 linha, 3 alertas prioritarios, 1 oportunidade do dia, 1 numero que importa. Seja direta.\"}]}"
echo.
echo.
pause
goto MENU

:CEOBRIEF
cls
echo.
echo  🧠 Análise executiva (CEO Mentor)...
echo.
curl -s -X POST http://localhost:%PORT%/copilot ^
 -H "Content-Type: application/json" ^
 -d "{\"persona\":\"ceo_mentor\",\"messages\":[{\"role\":\"user\",\"content\":\"Como CEO com 30 anos em franquias BR, faca a analise estrategica de ontem e hoje da MilkyPot. Onde ha risco? Onde ha upside? O que eu deveria fazer nos proximos 7 dias? Numeros quantificados.\"}]}"
echo.
echo.
pause
goto MENU

:IGCOPIES
cls
echo.
echo  📱 Gerando 3 copies pro Instagram...
echo.
curl -s -X POST http://localhost:%PORT%/copilot ^
 -H "Content-Type: application/json" ^
 -d "{\"persona\":\"belinha\",\"messages\":[{\"role\":\"user\",\"content\":\"Crie 3 copies prontos pra postar no Instagram AGORA. Cada um com hook na primeira linha, 2 linhas corpo, CTA claro. Estilo Belinha (ovelha, carinhosa, Londrina). Formato markdown.\"}]}"
echo.
echo.
pause
goto MENU

:SCANNER
cls
echo.
echo  🔍 Scanner de estado do sistema...
echo.
echo   TODO: integrar com LiloScanner.scan() do painel
echo   Por enquanto, abra o painel copilot-belinha.html
echo   e clique em Briefing do dia.
echo.
pause
goto MENU

REM ============================================================
REM SETUP
REM ============================================================

:INSTALL
cls
echo.
echo  ╔═══════════════════════════════════════════════════╗
echo  ║  📦 INSTALAÇÃO — primeira vez                     ║
echo  ╚═══════════════════════════════════════════════════╝
echo.
echo  1/3 Verificando Node.js...
node --version
if errorlevel 1 (
  echo.
  echo   ❌ Node.js não encontrado.
  echo   Baixe em: https://nodejs.org
  pause
  goto MENU
)
echo.
echo  2/3 Verificando `claude` CLI...
claude --version 2>nul
if errorlevel 1 (
  echo.
  echo   ❌ Claude CLI não encontrado.
  echo   Instale com: npm install -g @anthropic-ai/claude-code
  echo   Depois: claude login  (segue opção 13 deste menu)
  pause
  goto MENU
)
echo.
echo  3/3 Instalando deps do autopilot...
cd /d "%AP_DIR%"
call npm install
echo.
echo   ✅ Tudo pronto! Agora use opção 13 pra login (se nunca fez)
echo   e depois opção 1 pra iniciar o servidor.
echo.
pause
goto MENU

:LOGIN
cls
echo.
echo  Abrindo login do Claude CLI...
claude login
echo.
pause
goto MENU

:UPDATE
cls
echo.
echo  Atualizando código (git pull)...
cd /d "%MP_DIR%"
git pull
echo.
pause
goto MENU

:OPENFOLDER
start "" "%MP_DIR%"
goto MENU
