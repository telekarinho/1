#!/usr/bin/env bash
# ============================================================
# MilkyPot — Setup GCP Budget Alert (item 1 das pendencias)
# ============================================================
# Cria budget de R$ 300/mes em milkypot-ad945 com 3 thresholds:
#   50% (R$ 150) -> email
#   90% (R$ 270) -> email
#   100% (R$ 300) -> email + forecast 100%
#
# NAO habilita "disable billing automatically" — produção continua
# rodando mesmo se passar do limite (so alerta).
#
# Pre-requisitos:
#   gcloud auth login
#   gcloud config set project milkypot-ad945
#   gcloud services enable billingbudgets.googleapis.com
#
# Uso:
#   chmod +x scripts/setup-gcp-budget.sh
#   ./scripts/setup-gcp-budget.sh
#
# Ou em PowerShell (Windows):
#   bash scripts/setup-gcp-budget.sh
# ============================================================

set -e

PROJECT_ID="milkypot-ad945"
BUDGET_NAME="MilkyPot Operacional"
AMOUNT_BRL="300"
OWNER_EMAIL="jocimarrodrigo@gmail.com"

echo "==> Verificando autenticacao gcloud..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "ERRO: gcloud nao autenticado. Rode 'gcloud auth login' primeiro."
    exit 1
fi

echo "==> Resolvendo billing account do projeto $PROJECT_ID..."
BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" \
    --format="value(billingAccountName)" 2>/dev/null | sed 's|billingAccounts/||')

if [ -z "$BILLING_ACCOUNT" ]; then
    echo "ERRO: nao foi possivel resolver billing account."
    echo "  Verifique permissao billing.projects.list em $PROJECT_ID"
    echo "  ou execute manualmente:"
    echo "    gcloud billing accounts list"
    exit 1
fi
echo "    Billing account: $BILLING_ACCOUNT"

echo "==> Habilitando API billingbudgets.googleapis.com..."
gcloud services enable billingbudgets.googleapis.com --project="$PROJECT_ID"

echo "==> Criando budget '$BUDGET_NAME' (R\$ $AMOUNT_BRL/mes)..."
gcloud billing budgets create \
    --billing-account="$BILLING_ACCOUNT" \
    --display-name="$BUDGET_NAME" \
    --budget-amount="${AMOUNT_BRL}BRL" \
    --threshold-rule=percent=0.5 \
    --threshold-rule=percent=0.9 \
    --threshold-rule=percent=1.0 \
    --threshold-rule=percent=1.0,basis=forecasted-spend \
    --filter-projects="projects/$PROJECT_ID" \
    2>&1 | tee /tmp/budget-create.log || true

if grep -q "ALREADY_EXISTS" /tmp/budget-create.log 2>/dev/null; then
    echo "Budget ja existia — OK."
elif grep -q "ERROR" /tmp/budget-create.log 2>/dev/null; then
    echo "Se viu ERROR acima: rode 'gcloud billing budgets list --billing-account=$BILLING_ACCOUNT'"
    echo "  pra ver o estado atual."
fi

echo ""
echo "==> Configure email do owner como destinatario:"
echo "    https://console.cloud.google.com/billing/$BILLING_ACCOUNT/budgets"
echo "    1. Clique no budget '$BUDGET_NAME'"
echo "    2. Em 'Notifications', adicione: $OWNER_EMAIL"
echo "    3. Save"
echo ""
echo "Alertas tambem chegam por email nos billing admins automaticamente."
echo ""
echo "==> Done."
