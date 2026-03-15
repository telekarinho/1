/* ============================================
   MilkyPot - Franchise Router
   ============================================
   Detecta a franquia a partir da URL (subdominio
   ou path) e fornece metodos utilitarios para
   roteamento de franquias.

   Deteccao:
     1. Subdominio:  catuai.milkypot.com  → 'catuai'
     2. Path:        milkypot.com/f/catuai → 'catuai'
     3. Localhost:    localhost:8080/f/catuai → 'catuai'
   ============================================ */

const FranchiseRouter = {

    // Dominios principais (sem subdominio de franquia)
    _mainHosts: ['milkypot.com', 'www.milkypot.com', 'localhost', '127.0.0.1'],

    // ============================================
    // Slug da franquia corrente (cached)
    // ============================================
    _cachedSlug: undefined,

    /**
     * Retorna o slug da franquia detectado na URL atual.
     * Prioridade: subdominio > path /f/slug
     * @returns {string|null}
     */
    getFranchiseSlug() {
        if (this._cachedSlug !== undefined) return this._cachedSlug;

        let slug = null;

        // 1. Tentar subdominio (ex: catuai.milkypot.com)
        const host = window.location.hostname;
        const parts = host.split('.');

        // Subdominio valido: pelo menos 3 partes e nao ser 'www'
        if (parts.length >= 3 && parts[0] !== 'www') {
            slug = parts[0].toLowerCase();
        }

        // 2. Fallback: path /f/{slug}/ ou /f/{slug}
        if (!slug) {
            const match = window.location.pathname.match(/^\/f\/([^\/]+)/);
            if (match) {
                slug = match[1].toLowerCase();
            }
        }

        this._cachedSlug = slug;
        return slug;
    },

    /**
     * Retorna os dados da franquia do DataStore.
     * Busca na colecao 'franchises' pelo slug.
     * @param {string} [slug] - Slug opcional; usa o corrente se omitido.
     * @returns {object|null}
     */
    getFranchiseData(slug) {
        const targetSlug = slug || this.getFranchiseSlug();
        if (!targetSlug) return null;

        if (typeof DataStore === 'undefined') {
            console.warn('FranchiseRouter: DataStore nao disponivel');
            return null;
        }

        // Tentar buscar direto pelo slug como key
        const directData = DataStore.get('franchise_' + targetSlug);
        if (directData) return directData;

        // Fallback: buscar na colecao de franchises
        const franchises = DataStore.getCollection(MP.COLLECTIONS.FRANCHISES);
        if (Array.isArray(franchises)) {
            return franchises.find(f => f.slug === targetSlug) || null;
        }

        return null;
    },

    /**
     * Retorna todas as franquias ativas do DataStore.
     * @returns {Array}
     */
    getAllActiveFranchises() {
        if (typeof DataStore === 'undefined') return [];

        const franchises = DataStore.getCollection(MP.COLLECTIONS.FRANCHISES);
        if (!Array.isArray(franchises)) return [];

        return franchises.filter(f =>
            f.status === MP.FRANCHISE_STATUS.ACTIVE || f.status === 'ativo'
        );
    },

    /**
     * Busca franquias ativas diretamente do Firestore.
     * Retorna uma Promise com array de franquias.
     * @returns {Promise<Array>}
     */
    async fetchActiveFranchisesFromFirestore() {
        try {
            if (typeof firebase === 'undefined' || !firebase.firestore) {
                console.warn('FranchiseRouter: Firestore nao disponivel');
                return [];
            }

            const db = firebase.firestore();
            const snapshot = await db.collection(MP.COLLECTIONS.FRANCHISES)
                .where('status', '==', 'ativo')
                .get();

            const franchises = [];
            snapshot.forEach(doc => {
                franchises.push({ id: doc.id, ...doc.data() });
            });

            return franchises;
        } catch (e) {
            console.error('FranchiseRouter.fetchActiveFranchisesFromFirestore error:', e);
            return [];
        }
    },

    /**
     * Verifica se a pagina atual e uma pagina publica de franquia
     * (ou seja, estamos em /f/... ou em um subdominio de franquia).
     * @returns {boolean}
     */
    isPublicFranchisePage() {
        return this.getFranchiseSlug() !== null;
    },

    /**
     * Retorna a URL base para uma franquia.
     * Em producao, prefere subdominio. Em dev (localhost), usa path.
     * @param {string} slug - O slug da franquia.
     * @returns {string}
     */
    getBaseUrl(slug) {
        if (!slug) return '/';

        const host = window.location.hostname;
        const protocol = window.location.protocol;

        // Localhost / dev: sempre usar path
        if (host === 'localhost' || host === '127.0.0.1') {
            const port = window.location.port ? ':' + window.location.port : '';
            return `${protocol}//${host}${port}/f/${slug}/`;
        }

        // Producao: usar subdominio
        // Remove subdominio existente se houver
        const parts = host.split('.');
        let baseDomain;
        if (parts.length >= 3 && parts[0] !== 'www') {
            baseDomain = parts.slice(1).join('.');
        } else if (parts[0] === 'www') {
            baseDomain = parts.slice(1).join('.');
        } else {
            baseDomain = host;
        }

        return `${protocol}//${slug}.${baseDomain}/`;
    },

    /**
     * Retorna a URL do cardapio para uma franquia.
     * @param {string} slug
     * @returns {string}
     */
    getMenuUrl(slug) {
        const host = window.location.hostname;
        const protocol = window.location.protocol;

        if (host === 'localhost' || host === '127.0.0.1') {
            const port = window.location.port ? ':' + window.location.port : '';
            return `${protocol}//${host}${port}/f/${slug}/`;
        }

        return this.getBaseUrl(slug);
    },

    /**
     * Reseta o cache do slug (util para SPA navigation).
     */
    clearCache() {
        this._cachedSlug = undefined;
    }
};
