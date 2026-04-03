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
        // Em producao (Vercel): usa a mesma origem
        // Em dev (GitHub Pages): usa VERCEL_API_URL se definido
        if (window.location.hostname.includes('vercel.app')) {
            this._apiUrl = '/api/cloud-functions';
        } else if (window.MP_VERCEL_API_URL) {
            this._apiUrl = window.MP_VERCEL_API_URL + '/api/cloud-functions';
        } else {
            // Fallback: tenta Firebase Functions se disponivel
            if (typeof firebase !== 'undefined' && firebase.functions) {
                this._functions = firebase.app().functions('southamerica-east1');
                console.log('☁️ CloudFunctions: Firebase Functions (southamerica-east1)');
                return;
            }
            console.warn('⚠️ CloudFunctions: nenhum backend configurado. Defina window.MP_VERCEL_API_URL');
            return;
        }

        this._functions = true; // flag para indicar que esta disponivel
        console.log('☁️ CloudFunctions: Vercel API (' + this._apiUrl + ')');
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
    }
};
