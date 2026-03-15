/* ============================================
   MilkyPot - Sistema de Autenticacao (Firebase Auth)
   ============================================
   Usa Firebase Authentication como unica fonte de
   autenticacao. Sem senhas em texto puro.
   ============================================ */

const Auth = {
    SESSION_KEY: MP.SESSION_KEY || 'mp_session',
    _authStateReady: false,
    _currentUser: null,

    // ============================================
    // Login com Email/Senha (Firebase Auth)
    // ============================================
    async login(email, password) {
        try {
            const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = result.user;

            // Busca dados do perfil no DataStore
            const profile = this._findUserProfile(user.email);
            if (!profile) {
                await firebaseAuth.signOut();
                return { success: false, error: 'Usuario nao cadastrado no sistema. Solicite acesso ao administrador.' };
            }

            const session = this._buildSession(user, profile);
            this._saveSession(session);
            return { success: true, session };
        } catch (error) {
            console.error('Auth.login error:', error);
            return { success: false, error: this._translateError(error.code) };
        }
    },

    // ============================================
    // Login com Google (Firebase Auth)
    // ============================================
    async loginWithGoogle() {
        try {
            const result = await firebaseAuth.signInWithPopup(googleProvider);
            const user = result.user;

            // Busca perfil local ou auto-registra owner
            let profile = this._findUserProfile(user.email);

            if (!profile && user.email === MP.OWNER_EMAIL) {
                // Auto-registra owner como super_admin
                profile = this._createUserProfile({
                    email: user.email,
                    name: user.displayName || 'Admin',
                    role: MP.ROLES.SUPER_ADMIN,
                    firebaseUid: user.uid
                });
            }

            if (!profile) {
                await firebaseAuth.signOut();
                return { success: false, error: 'Este e-mail Google nao esta cadastrado no sistema. Solicite acesso ao administrador.' };
            }

            // Atualiza UID do Firebase no perfil
            if (!profile.firebaseUid) {
                this._updateUserProfile(profile.id, { firebaseUid: user.uid });
            }

            const session = this._buildSession(user, profile);
            session.googleAuth = true;
            session.avatar = user.photoURL;
            this._saveSession(session);
            return { success: true, session };
        } catch (error) {
            console.error('Auth.loginWithGoogle error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                return { success: false, error: null }; // usuario cancelou
            }
            return { success: false, error: this._translateError(error.code) };
        }
    },

    // ============================================
    // Registro de novo usuario (Admin cria conta)
    // ============================================
    async createUser(userData) {
        try {
            // Verifica se ja existe no perfil local
            const users = DataStore.get('users') || [];
            if (users.find(u => u.email === userData.email)) {
                return { success: false, error: 'E-mail ja cadastrado' };
            }

            // Cria conta no Firebase Auth
            // NOTA: No Spark plan sem Functions, admin cria com
            // createUserWithEmailAndPassword e depois volta pra propria sessao
            const tempPassword = userData.tempPassword || Utils.generateSecurePassword();

            // Salva sessao atual antes de criar
            const currentSession = this.getSession();

            const result = await firebaseAuth.createUserWithEmailAndPassword(userData.email, tempPassword);
            const newUser = result.user;

            // Atualiza displayName no Firebase
            await newUser.updateProfile({ displayName: userData.name });

            // Restaura sessao do admin (createUser faz login automatico)
            if (currentSession) {
                // Re-autentica o admin
                await firebaseAuth.signInWithEmailAndPassword(currentSession.email, currentSession._adminReauth || '');
            }

            // Cria perfil local
            const profile = this._createUserProfile({
                email: userData.email,
                name: userData.name,
                role: userData.role || MP.ROLES.FRANCHISEE,
                franchiseId: userData.franchiseId || null,
                firebaseUid: newUser.uid
            });

            return {
                success: true,
                user: profile,
                tempPassword: tempPassword,
                message: `Usuario criado. Senha temporaria: ${tempPassword}`
            };
        } catch (error) {
            console.error('Auth.createUser error:', error);
            return { success: false, error: this._translateError(error.code) };
        }
    },

    // ============================================
    // Logout
    // ============================================
    async logout() {
        try {
            await firebaseAuth.signOut();
        } catch (e) {
            console.warn('Firebase signOut error:', e);
        }
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = '/login.html';
    },

    // ============================================
    // Sessao (sincrona para compatibilidade)
    // ============================================
    getSession() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            if (!data) return null;
            const session = JSON.parse(data);
            if (new Date(session.expiresAt) < new Date()) {
                this.logout();
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getSession();
    },

    getRole() {
        const s = this.getSession();
        return s ? s.role : null;
    },

    getFranchiseId() {
        const s = this.getSession();
        return s ? s.franchiseId : null;
    },

    getUserName() {
        const s = this.getSession();
        return s ? s.name : '';
    },

    getUserId() {
        const s = this.getSession();
        return s ? s.userId : null;
    },

    getFirebaseUid() {
        const s = this.getSession();
        return s ? s.firebaseUid : null;
    },

    // Require auth - redirect to login if not authenticated
    requireAuth(requiredRole) {
        const session = this.getSession();
        if (!session) {
            window.location.href = '/login.html';
            return false;
        }
        if (requiredRole && session.role !== requiredRole) {
            if (session.role === MP.ROLES.SUPER_ADMIN) {
                window.location.href = '/admin/';
            } else {
                window.location.href = '/painel/';
            }
            return false;
        }
        return true;
    },

    // ============================================
    // Alterar senha (Firebase Auth)
    // ============================================
    async changePassword(newPassword) {
        try {
            const user = firebaseAuth.currentUser;
            if (!user) return { success: false, error: 'Usuario nao autenticado' };

            if (!Utils.isStrongPassword(newPassword)) {
                return { success: false, error: 'Senha deve ter minimo 8 caracteres, 1 maiuscula e 1 numero' };
            }

            await user.updatePassword(newPassword);
            return { success: true };
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') {
                return { success: false, error: 'Por seguranca, faca logout e login novamente antes de alterar a senha' };
            }
            return { success: false, error: this._translateError(error.code) };
        }
    },

    // Reset de senha por email
    async sendPasswordReset(email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this._translateError(error.code) };
        }
    },

    // ============================================
    // Gerenciamento de usuarios (perfis locais)
    // ============================================
    listUsers() {
        return (DataStore.get('users') || []).map(u => {
            // Nunca retorna dados sensíveis
            const { password, ...safe } = u;
            return safe;
        });
    },

    getUser(userId) {
        const users = DataStore.get('users') || [];
        const user = users.find(u => u.id === userId);
        if (!user) return null;
        const { password, ...safe } = user;
        return safe;
    },

    updateUser(userId, updates) {
        // Nunca permite atualizar senha por aqui
        delete updates.password;
        return DataStore.updateInCollection('users', null, userId, updates);
    },

    deleteUser(userId) {
        const users = DataStore.get('users') || [];
        const user = users.find(u => u.id === userId);
        if (!user || user.role === MP.ROLES.SUPER_ADMIN) return false;
        const filtered = users.filter(u => u.id !== userId);
        DataStore.set('users', filtered);
        // TODO: Quando tiver Firebase Functions, deletar do Firebase Auth tambem
        return true;
    },

    // ============================================
    // Helpers internos
    // ============================================
    _findUserProfile(email) {
        const users = DataStore.get('users') || [];
        return users.find(u => u.email === email) || null;
    },

    _createUserProfile(data) {
        const users = DataStore.get('users') || [];
        const profile = {
            id: Utils.generateId(),
            email: data.email,
            name: data.name,
            role: data.role || MP.ROLES.FRANCHISEE,
            franchiseId: data.franchiseId || null,
            firebaseUid: data.firebaseUid || null,
            createdAt: new Date().toISOString()
        };
        users.push(profile);
        DataStore.set('users', users);
        return profile;
    },

    _updateUserProfile(userId, updates) {
        const users = DataStore.get('users') || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return null;
        users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
        DataStore.set('users', users);
        return users[idx];
    },

    _buildSession(firebaseUser, profile) {
        return {
            userId: profile.id,
            email: profile.email,
            name: profile.name || firebaseUser.displayName || profile.email,
            role: profile.role,
            franchiseId: profile.franchiseId,
            firebaseUid: firebaseUser.uid,
            token: Utils.generateSecureToken(),
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + MP.SESSION_DURATION_MS).toISOString()
        };
    },

    _saveSession(session) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },

    _translateError(code) {
        const map = {
            'auth/user-not-found': 'Usuario nao encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/invalid-email': 'E-mail invalido',
            'auth/email-already-in-use': 'E-mail ja cadastrado no Firebase',
            'auth/weak-password': 'Senha muito fraca (minimo 6 caracteres)',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
            'auth/network-request-failed': 'Erro de conexao. Verifique sua internet.',
            'auth/popup-closed-by-user': 'Login cancelado',
            'auth/requires-recent-login': 'Sessao expirada. Faca login novamente.',
            'auth/invalid-credential': 'E-mail ou senha incorretos'
        };
        return map[code] || `Erro de autenticacao (${code})`;
    },

    // ============================================
    // Migracao: Login legado (fallback temporario)
    // Usado apenas enquanto usuarios nao migraram
    // para Firebase Auth. Remove apos transicao.
    // ============================================
    loginLegacy(email, password) {
        const users = DataStore.get('users') || [];
        const user = users.find(u => u.email === email);
        if (!user) return { success: false, error: 'E-mail ou senha incorretos' };

        // Se usuario tem password legado, tenta migrar
        if (user.password && user.password === password) {
            console.warn('⚠️ Login legado usado para:', email, '- Migrando para Firebase Auth...');

            // Cria sessao temporaria enquanto migra
            const session = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                franchiseId: user.franchiseId,
                token: Utils.generateSecureToken(),
                loginAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + MP.SESSION_DURATION_MS).toISOString(),
                legacy: true // marca como sessao legada
            };
            this._saveSession(session);

            // Tenta criar conta no Firebase Auth em background
            this._migrateToFirebaseAuth(email, password, user);

            return { success: true, session };
        }

        return { success: false, error: 'E-mail ou senha incorretos' };
    },

    async _migrateToFirebaseAuth(email, password, profile) {
        try {
            // Tenta criar usuario no Firebase Auth
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: profile.name });

            // Remove senha do perfil local
            const users = DataStore.get('users') || [];
            const idx = users.findIndex(u => u.id === profile.id);
            if (idx !== -1) {
                delete users[idx].password;
                users[idx].firebaseUid = result.user.uid;
                users[idx].migratedAt = new Date().toISOString();
                DataStore.set('users', users);
            }

            console.log('✅ Usuario migrado para Firebase Auth:', email);
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                // Ja existe no Firebase, so remove senha local
                const users = DataStore.get('users') || [];
                const idx = users.findIndex(u => u.email === email);
                if (idx !== -1) {
                    delete users[idx].password;
                    DataStore.set('users', users);
                }
            } else {
                console.warn('Migracao Firebase Auth falhou:', error.code);
            }
        }
    }
};
