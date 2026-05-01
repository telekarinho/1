/* ============================================
   MilkyPot - Seed do documento club_config/global
   ============================================
   Como usar (localmente, com credenciais admin):

   1) Tenha as credenciais do Firebase Admin SDK disponiveis:
      - Via ADC:      gcloud auth application-default login
      - OU via arquivo JSON:
          export GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json
        (no PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\caminho\\sa.json")

   2) (Opcional) Defina o projeto Firebase:
          export GOOGLE_CLOUD_PROJECT=milkypot-xxxx

   3) Rode:
          cd functions
          node seed-club-config.js

   Este script cria (ou faz merge) o doc "club_config/global" com os
   valores default do contrato MILKYCLUBE_CONTRACT.md (secao 3.1).
   Idempotente: pode ser rodado varias vezes sem duplicar nada.
   ============================================ */

const admin = require("firebase-admin");

// Inicializa o Admin SDK (usa credenciais do ambiente).
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

const CLUB_DEFAULT_CONFIG = {
    version: 1,
    tiers: {
        leite: {
            label: "Leite",
            minSpent: 0,
            cashbackRate: 0.03,
            color: "#B3E5FC",
            emoji: "\uD83E\uDD5B"
        },
        nata: {
            label: "Nata",
            minSpent: 500,
            cashbackRate: 0.05,
            color: "#FFD54F",
            emoji: "\u2728"
        },
        chantilly: {
            label: "Chantilly",
            minSpent: 2000,
            cashbackRate: 0.07,
            color: "#F06292",
            emoji: "\uD83D\uDC51"
        }
    },
    expiryDays: 30,
    bonuses: {
        signup: 20,
        firstOrder: 50,
        birthday: 100,
        referrer: 100,
        referred: 50,
        gameDesafio10: 10,
        scratchMin: 1,
        scratchMax: 50
    },
    appLinks: {
        playStore: "",
        appStore: "",
        pwa: "/clube/"
    },
    featureFlags: {
        enabled: true,
        whatsappNotify: true,
        pushEnabled: true
    }
};

async function seed() {
    const ref = db.collection("club_config").doc("global");
    const existing = await ref.get();

    const payload = {
        ...CLUB_DEFAULT_CONFIG,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!existing.exists) {
        payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
        console.log("[seed-club-config] Criando doc club_config/global...");
    } else {
        console.log("[seed-club-config] Doc ja existe, fazendo merge dos defaults...");
    }

    await ref.set(payload, { merge: true });
    console.log("[seed-club-config] OK. Conteudo atual:");
    const after = await ref.get();
    console.log(JSON.stringify(after.data(), null, 2));
}

seed()
    .then(() => {
        console.log("[seed-club-config] Concluido.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("[seed-club-config] Erro:", err);
        process.exit(1);
    });
