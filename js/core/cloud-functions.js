/* ============================================
   MilkyPot - Cloud Functions Client
   ============================================
   Wrapper para chamar Firebase Cloud Functions
   do frontend. Requer firebase-functions SDK.
   ============================================ */

const CloudFunctions = {
    _functions: null,

    init() {
        if (typeof firebase !== 'undefined' && firebase.functions) {
            this._functions = firebase.app().functions('southamerica-east1');
            console.log('☁️ CloudFunctions: conectado (southamerica-east1)');
        } else {
            console.warn('⚠️ CloudFunctions: SDK nao disponivel');
        }
    },

    // Chama uma function com retry
    async call(name, data = {}) {
        if (!this._functions) {
            console.warn('CloudFunctions.call: nao inicializado');
            return { success: false, error: 'Functions nao disponivel' };
        }

        try {
            const fn = this._functions.httpsCallable(name);
            const result = await fn(data);
            return result.data;
        } catch (error) {
            console.error(`CloudFunctions.call(${name}) error:`, error);
            return {
                success: false,
                error: error.message || 'Erro ao chamar function'
            };
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
    }
};
