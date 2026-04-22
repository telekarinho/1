/* ============================================
   MilkyPot - Cloud Functions Client
   ============================================
   Chama a API Vercel serverless ao inves do
   Firebase Cloud Functions. Zero dependencia
   do plano Blaze.
   ============================================ */

const CloudFunctions = {
    _apiUrl: null,
    _functions: null, // kept for backward compat checks

    init() {
        // Detecta URL base da API
        var h = window.location.hostname;

        if (h.includes('vercel.app')) {
            // Vercel: usa mesma origem
            this._apiUrl = '/api/cloud-functions';

        } else if (window.MP_VERCEL_API_URL) {
            // URL customizada definida antes de carregar este script
            this._apiUrl = window.MP_VERCEL_API_URL + '/api/cloud-functions';

        } else if (
            h === 'milkypot.com' ||
            h === 'www.milkypot.com' ||
            h.endsWith('.milkypot.com') ||
            h === 'milkypot-ad945.web.app' ||
            h === 'milkypot-ad945.firebaseapp.com' ||
            h === 'telekarinho.github.io'
        ) {
            // Producao: Hostinger PHP API (nao requer Firebase Blaze)
            this._apiUrl = 'https://api.milkypot.com/api/cloud-functions';

        } else {
            // Dev local: tenta Firebase Functions como fallback
            if (typeof firebase !== 'undefined' && firebase.functions) {
                this._functions = firebase.app().functions('southamerica-east1');
                console.log('☁️ CloudFunctions: Firebase Functions (southamerica-east1)');
                return;
            }
            console.warn('⚠️ CloudFunctions: nenhum backend configurado. ' +
                'Em producao usa api.milkypot.com automaticamente.');
            return;
        }

        this._functions = true; // flag para indicar que esta disponivel
        console.log('☁️ CloudFunctions: Hostinger PHP API (' + this._apiUrl + ')');
    },

    // ============================================
    // Chamada principal - detecta Vercel ou Firebase
    // ============================================
    async call(name, data = {}) {
        // Se usando Vercel API
        if (this._apiUrl) {
            return this._callVercel(name, data);
        }

        // Se usando Firebase Functions (fallback)
        if (this._functions && typeof this._functions === 'object') {
            return this._callFirebase(name, data);
        }

        console.warn('CloudFunctions.call: nao inicializado');
        return { success: false, error: 'Functions nao disponivel' };
    },

    // Chama API Vercel
    async _callVercel(action, data) {
        try {
            // Pega token do Firebase Auth para autenticacao
            const token = await this._getAuthToken();
            if (!token) {
                return { success: false, error: 'Nao autenticado no Firebase' };
            }

            const response = await fetch(this._apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ action, data })
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || 'Erro na API' };
            }

            return result;
        } catch (error) {
            console.error(`CloudFunctions._callVercel(${action}) error:`, error);
            return { success: false, error: error.message || 'Erro ao chamar API' };
        }
    },

    // Chama Firebase Functions (fallback)
    async _callFirebase(name, data) {
        try {
            const fn = this._functions.httpsCallable(name);
            const result = await fn(data);
            return result.data;
        } catch (error) {
            console.error(`CloudFunctions._callFirebase(${name}) error:`, error);
            return { success: false, error: error.message || 'Erro ao chamar function' };
        }
    },

    // Pega ID token do usuario logado no Firebase Auth
    async _getAuthToken() {
        try {
            if (typeof firebaseAuth !== 'undefined' && firebaseAuth && firebaseAuth.currentUser) {
                return await firebaseAuth.currentUser.getIdToken();
            }
            return null;
        } catch (e) {
            console.warn('CloudFunctions._getAuthToken error:', e);
            return null;
        }
    },

    // ============================================
    // Atalhos para cada function
    // ============================================

    // Seta role de um usuario (admin only)
    async setUserRole(uid, role, franchiseId) {
        return this.call('setUserRole', { uid, role, franchiseId });
    },

    // Setup inicial do owner como super_admin
    async setupOwner() {
        return this.call('setupOwner', {});
    },

    // Cria usuario com role (admin only)
    async createUserWithRole(email, name, password, role, franchiseId) {
        return this.call('createUserWithRole', {
            email, name, password, role, franchiseId
        });
    },

    // Deleta usuario (admin only)
    async deleteUserAccount(uid) {
        return this.call('deleteUserAccount', { uid });
    },

    // Obtem role do usuario atual
    async getMyRole() {
        return this.call('getMyRole', {});
    },

    // Fiscal
    async getFiscalHealth() {
        return this.call('getFiscalHealth', {});
    },

    async getFiscalConfig(franchiseId) {
        return this.call('getFiscalConfig', { franchiseId });
    },

    async saveFiscalConfig(config, franchiseId) {
        return this.call('saveFiscalConfig', { franchiseId, config });
    },

    async uploadFiscalCertificate(payload) {
        return this.call('uploadFiscalCertificate', payload);
    },

    async listFiscalNotes(franchiseId, filters) {
        return this.call('listFiscalNotes', { franchiseId, filters: filters || {} });
    },

    async emitFiscalDocument(payload) {
        return this.call('emitFiscalDocument', payload);
    },

    async cancelFiscalNote(noteId, reason, franchiseId) {
        return this.call('cancelFiscalNote', { noteId, reason, franchiseId });
    },

    // ============================================
    // Automations (Reports & Alerts)
    // ============================================

    // Envia relatorio do fechamento + auditoria cega
    async sendClosingReport(franchiseId, reportData) {
        const managers = ['milkypot.com@gmail.com', 'jocimarrodrigo@gmail.com', 'joseanemse@gmail.com'];
        // Regra: operador so recebe se a config estiver ativada
        const config = (typeof AdminConfig !== 'undefined') ? AdminConfig.getConfig(franchiseId) : {};
        const sendToOperator = config.enviarComprovanteOperador === true;
        
        return this.call('sendClosingReport', {
            franchiseId,
            managers,
            sendToOperator,
            operatorEmail: reportData.operatorEmail, // Only if sendToOperator is true it will be used
            data: reportData
        });
    },

    // Notifica gestor sobre estoque critico
    async sendLowStockAlert(franchiseId, items) {
        const managers = ['milkypot.com@gmail.com', 'jocimarrodrigo@gmail.com', 'joseanemse@gmail.com'];
        return this.call('sendLowStockAlert', {
            franchiseId,
            managers,
            items: items
        });
    }
};

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.CloudFunctions = CloudFunctions;
if (typeof globalThis !== 'undefined') globalThis.CloudFunctions = CloudFunctions;
