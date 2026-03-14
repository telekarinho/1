/* ============================================
   MilkyPot - Sistema de Autenticação
   ============================================ */

const Auth = {
    SESSION_KEY: 'mp_session',

    // Login
    login(email, password) {
        const users = DataStore.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) return { success: false, error: 'E-mail ou senha incorretos' };

        const session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            franchiseId: user.franchiseId,
            token: Utils.generateId() + Utils.generateId(),
            loginAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return { success: true, session };
    },

    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = '/login.html';
    },

    // Get current session
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

    // Is authenticated
    isAuthenticated() {
        return !!this.getSession();
    },

    // Get current user role
    getRole() {
        const s = this.getSession();
        return s ? s.role : null;
    },

    // Get franchise ID for current user
    getFranchiseId() {
        const s = this.getSession();
        return s ? s.franchiseId : null;
    },

    // Get user name
    getUserName() {
        const s = this.getSession();
        return s ? s.name : '';
    },

    // Require auth - redirect to login if not authenticated
    requireAuth(requiredRole) {
        const session = this.getSession();
        if (!session) {
            window.location.href = '/login.html';
            return false;
        }
        if (requiredRole && session.role !== requiredRole) {
            if (session.role === 'super_admin') {
                window.location.href = '/admin/';
            } else {
                window.location.href = '/painel/';
            }
            return false;
        }
        return true;
    },

    // Change password
    changePassword(userId, newPassword) {
        const users = DataStore.get('users') || [];
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return false;
        users[idx].password = newPassword;
        DataStore.set('users', users);
        return true;
    },

    // Create user (admin only)
    createUser(userData) {
        const users = DataStore.get('users') || [];
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'E-mail já cadastrado' };
        }
        const user = {
            id: Utils.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        DataStore.set('users', users);
        return { success: true, user };
    },

    // List users (admin only)
    listUsers() {
        return DataStore.get('users') || [];
    },

    // Delete user
    deleteUser(userId) {
        const users = DataStore.get('users') || [];
        const filtered = users.filter(u => u.id !== userId && u.role !== 'super_admin');
        DataStore.set('users', filtered);
    }
};
