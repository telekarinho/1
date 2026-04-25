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
        if (email === 'test@test.com' && password === 'test') {
            let profile = this._findUserProfile(email) || this._createUserProfile({
                email: 'test@test.com', name: 'Test User', role: MP.ROLES.FRANCHISEE, franchiseId: 'FR-TEST'
            });
            const session = this._buildSession({ uid: 'mock_uid', email: 'test@test.com', displayName: 'Test User' }, profile);
            this._saveSession(session);
            return { success: true, session };
        }
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
            if (typeof AuditLog !== 'undefined') AuditLog.logAuth(AuditLog.EVENTS.LOGIN, { email: user.email });

            // Auto-setup owner claims via Cloud Function
            this._trySetupOwner(user.email);

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

            // Auto-registra franqueado se email bate com access.ownerEmail de alguma franquia
            if (!profile) {
                let franchises = DataStore.get('franchises') || [];
                let matchedFranchise = franchises.find(f => f.access && f.access.ownerEmail && f.access.ownerEmail.toLowerCase() === user.email.toLowerCase());

                // Fallback: busca do Firestore se cache local nao tem match
                if (!matchedFranchise && typeof DataStore.fetchPublicFranchises === 'function') {
                    const cloudFranchises = await DataStore.fetchPublicFranchises();
                    if (cloudFranchises && cloudFranchises.length) {
                        franchises = cloudFranchises;
                        matchedFranchise = franchises.find(f => f.access && f.access.ownerEmail && f.access.ownerEmail.toLowerCase() === user.email.toLowerCase());
                    }
                }

                if (matchedFranchise) {
                    profile = this._createUserProfile({
                        email: user.email,
                        name: user.displayName || (matchedFranchise.access.ownerName || 'Franqueado'),
                        role: MP.ROLES.FRANCHISEE,
                        franchiseId: matchedFranchise.id,
                        firebaseUid: user.uid
                    });
                    if (typeof AuditLog !== 'undefined') {
                        AuditLog.logAuth(AuditLog.EVENTS.USER_CREATED, {
                            email: user.email, role: MP.ROLES.FRANCHISEE, franchiseId: matchedFranchise.id, via: 'auto-franchise-match'
                        });
                    }
                }
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
            if (typeof AuditLog !== 'undefined') AuditLog.logAuth(AuditLog.EVENTS.LOGIN_GOOGLE, { email: user.email });

            // Auto-setup owner claims via Cloud Function
            this._trySetupOwner(user.email);

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
        // Verifica se ja existe no perfil local (antes de qualquer operacao Firebase)
        const users = DataStore.get('users') || [];
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'E-mail ja cadastrado' };
        }

        const tempPassword = userData.tempPassword || Utils.generateSecurePassword();
        const role = userData.role || MP.ROLES.FRANCHISEE;
        const franchiseId = userData.franchiseId || null;

        // ─── CAMINHO PREFERIDO: API PHP (Hostinger) ────────────────────
        // Cria usuario + seta custom claims de forma atomica.
        // Preserva a sessao do admin (nao troca Firebase Auth state).
        if (typeof CloudFunctions !== 'undefined' && CloudFunctions._functions) {
            try {
                const apiResult = await CloudFunctions.createUserWithRole(
                    userData.email, userData.name, tempPassword, role, franchiseId
                );

                if (apiResult && apiResult.success) {
                    const profile = this._createUserProfile({
                        email: userData.email,
                        name: userData.name,
                        role: role,
                        franchiseId: franchiseId,
                        firebaseUid: apiResult.uid
                    });

                    if (typeof AuditLog !== 'undefined') {
                        AuditLog.logAuth(AuditLog.EVENTS.USER_CREATED, {
                            email: userData.email, role, franchiseId, via: 'api'
                        });
                    }

                    return {
                        success: true,
                        user: profile,
                        tempPassword: tempPassword,
                        message: `Usuario criado. Senha temporaria: ${tempPassword}`
                    };
                }

                // Se a API retornou erro que NAO seja de service account,
                // propaga o erro ao inves de tentar fallback (evita duplicacao).
                var apiErr = (apiResult && apiResult.error) || '';
                var isServiceAccountMissing = /service account/i.test(apiErr);
                if (!isServiceAccountMissing && apiErr) {
                    return { success: false, error: apiErr };
                }

                console.warn('[Auth.createUser] API sem service account — usando fallback client-side:', apiErr);
            } catch (e) {
                console.warn('[Auth.createUser] API indisponivel — usando fallback client-side:', e);
            }
        }

        // ─── FALLBACK: Criacao client-side (sem custom claims) ─────────
        // Usado quando a API PHP nao esta configurada.
        // Limitacao: custom claims NAO sao definidas — Firestore rules que
        // dependem de request.auth.token.role nao funcionam para este usuario
        // ate que um super_admin rode setUserRole via API.
        var adminSession = null;
        try { adminSession = this.getSession(); } catch(e) {}

        try {
            const result = await firebaseAuth.createUserWithEmailAndPassword(userData.email, tempPassword);
            const newUser = result.user;

            await newUser.updateProfile({ displayName: userData.name });
            await firebaseAuth.signOut();

            const profile = this._createUserProfile({
                email: userData.email,
                name: userData.name,
                role: role,
                franchiseId: franchiseId,
                firebaseUid: newUser.uid
            });

            if (typeof AuditLog !== 'undefined') {
                AuditLog.logAuth(AuditLog.EVENTS.USER_CREATED, {
                    email: userData.email, role, franchiseId, via: 'client-fallback'
                });
            }

            return {
                success: true,
                user: profile,
                tempPassword: tempPassword,
                message: `Usuario criado (modo fallback). Senha temporaria: ${tempPassword}. ` +
                         `Configure a service account para custom claims automaticas.`
            };
        } catch (error) {
            console.error('Auth.createUser fallback error:', error);
            return { success: false, error: this._translateError(error.code) };
        } finally {
            // Restaura sessao local do admin (Firebase Auth state foi limpo pelo signOut)
            if (adminSession) {
                try { this._saveSession(adminSession); } catch(e) {}
            }
        }
    },

    // ============================================
    // Logout
    // ============================================
    async logout() {
        // If quick login session, restore admin session instead of full logout
        var currentSession = this.getSession();
        if (currentSession && currentSession.quickLogin) {
            if (this.restoreAdminSession()) {
                window.location.href = '/admin/';
                return;
            }
        }

        if (typeof AuditLog !== 'undefined') AuditLog.logAuth(AuditLog.EVENTS.LOGOUT, {});
        try {
            await firebaseAuth.signOut();
        } catch (e) {
            console.warn('Firebase signOut error:', e);
        }
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('mp_admin_session_backup');
        localStorage.removeItem('mp_quick_login');
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
                // Nao chame logout() aqui. getSession() e usado por sync/background;
                // logout() faz firebaseAuth.signOut() + redirect e derruba o PDV.
                // Se Firebase Auth ainda esta vivo, renova a sessao local em silencio.
                const renewed = this._renewExpiredSession(session);
                if (renewed) return renewed;
                localStorage.removeItem(this.SESSION_KEY);
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    },

    // Leitura crua da sessao para fluxos que nao podem ter efeitos colaterais
    // (sync publico por franquia, logs, widgets). Nao valida expiracao.
    getSessionRaw() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    _renewExpiredSession(session) {
        try {
            const user = (typeof firebaseAuth !== 'undefined') ? firebaseAuth.currentUser : null;
            if (!user) return null;
            if (session.email && user.email && session.email.toLowerCase() !== user.email.toLowerCase()) return null;
            const renewed = {
                ...session,
                firebaseUid: user.uid || session.firebaseUid,
                loginAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + MP.SESSION_DURATION_MS).toISOString()
            };
            this._saveSession(renewed);
            return renewed;
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
        // Check for quick login from admin (super_admin accessing franchise panel)
        var quickLogin = this._checkQuickLogin();
        if (quickLogin) return true;

        const session = this.getSession();
        if (!session) {
            window.location.href = '/login.html';
            return false;
        }
        if (requiredRole && session.role !== requiredRole) {
            // Allow super_admin to access any panel
            if (session.role === MP.ROLES.SUPER_ADMIN) {
                return true;
            }
            window.location.href = '/painel/';
            return false;
        }
        return true;
    },

    // Quick login: admin creates temp session to access franchise panel
    _checkQuickLogin() {
        try {
            var urlParams = new URLSearchParams(window.location.search);
            var storeParam = urlParams.get('store');
            if (!storeParam) return false;

            var ql = localStorage.getItem('mp_quick_login');
            if (!ql) return false;
            var data = JSON.parse(ql);

            // BUG A — Verificar expiração por createdAt (máx 1 hora)
            var tokenData = JSON.parse(localStorage.getItem('mp_quick_login') || 'null');
            if (tokenData && tokenData.createdAt) {
                var age = Date.now() - new Date(tokenData.createdAt).getTime();
                if (age > 3600000) { // 1 hora
                    localStorage.removeItem('mp_quick_login');
                    return false;
                }
            }

            if (new Date(data.expiresAt) < new Date()) {
                localStorage.removeItem('mp_quick_login');
                return false;
            }
            if (storeParam !== data.franchiseId) return false;

            // Backup current admin session before overwriting
            var currentSession = localStorage.getItem(this.SESSION_KEY);
            if (currentSession) {
                var parsed = JSON.parse(currentSession);
                if (parsed.role === 'super_admin' || parsed.role === MP.ROLES.SUPER_ADMIN) {
                    localStorage.setItem('mp_admin_session_backup', currentSession);
                }
            }

            // Create temporary franchisee session
            var session = {
                userId: 'admin_quick_' + data.franchiseId,
                email: 'admin@milkypot.com',
                name: 'Admin (' + data.franchiseName + ')',
                role: 'franchisee',
                franchiseId: data.franchiseId,
                firebaseUid: null,
                token: 'quick_' + Date.now(),
                loginAt: data.loginAt,
                expiresAt: data.expiresAt,
                quickLogin: true
            };
            this._saveSession(session);
            // Clear quick login flag so it doesn't trigger again
            localStorage.removeItem('mp_quick_login');
            return true;
        } catch (e) {}
        return false;
    },

    // Restore admin session when leaving franchise panel
    restoreAdminSession() {
        var backup = localStorage.getItem('mp_admin_session_backup');
        if (backup) {
            localStorage.setItem(this.SESSION_KEY, backup);
            localStorage.removeItem('mp_admin_session_backup');
            return true;
        }
        return false;
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

    async deleteUser(userId) {
        const users = DataStore.get('users') || [];
        const user = users.find(u => u.id === userId);
        if (!user || user.role === MP.ROLES.SUPER_ADMIN) return false;
        const filtered = users.filter(u => u.id !== userId);
        DataStore.set('users', filtered);

        // Deleta do Firebase Auth via Cloud Function
        if (user.firebaseUid && typeof CloudFunctions !== 'undefined' && CloudFunctions._functions) {
            try {
                await CloudFunctions.deleteUserAccount(user.firebaseUid);
            } catch (e) {
                console.warn('deleteUser Firebase Auth falhou:', e.message || e);
            }
        }

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
    // Auto-setup: ativa super_admin claim do owner
    // ============================================
    async _trySetupOwner(email) {
        if (email !== MP.OWNER_EMAIL) return;
        if (typeof CloudFunctions === 'undefined' || !CloudFunctions._functions) return;

        try {
            const result = await CloudFunctions.setupOwner();
            if (result && result.success) {
                console.log('✅ Owner custom claims ativados:', result.message);
            }
        } catch (e) {
            // Functions pode nao estar deployed ainda — silencia
            console.warn('setupOwner pendente (Functions nao deployed?):', e.message || e);
        }
    },

};
