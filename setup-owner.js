/* ============================================
   MilkyPot - Setup Owner Script
   ============================================
   Roda localmente para setar custom claims do
   owner como super_admin via Firebase Admin SDK.

   Uso: node setup-owner.js
   ============================================ */

const admin = require("./functions/node_modules/firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

const OWNER_EMAIL = "jocimarrodrigo@gmail.com";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function setupOwner() {
    try {
        // Busca usuario pelo email
        const user = await admin.auth().getUserByEmail(OWNER_EMAIL);
        console.log(`✅ Usuario encontrado: ${user.email} (uid: ${user.uid})`);

        // Verifica claims atuais
        if (user.customClaims && user.customClaims.role === "super_admin") {
            console.log("ℹ️  Owner ja tem custom claims de super_admin.");
            console.log("   Claims atuais:", JSON.stringify(user.customClaims));
            process.exit(0);
        }

        // Seta custom claims
        await admin.auth().setCustomUserClaims(user.uid, {
            role: "super_admin",
        });

        console.log("✅ Custom claims definidos: { role: 'super_admin' }");
        console.log("🔑 O owner agora tem acesso total ao sistema.");
        console.log("");
        console.log("⚠️  IMPORTANTE: Faca logout e login novamente no sistema");
        console.log("   para que os novos claims sejam aplicados ao token.");

        // Verifica se deu certo
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log("   Claims atualizados:", JSON.stringify(updatedUser.customClaims));

    } catch (error) {
        if (error.code === "auth/user-not-found") {
            console.error(`❌ Usuario ${OWNER_EMAIL} nao encontrado no Firebase Auth.`);
            console.error("   Voce precisa fazer login pelo menos uma vez no sistema.");
        } else {
            console.error("❌ Erro:", error.message);
        }
        process.exit(1);
    }

    process.exit(0);
}

setupOwner();
