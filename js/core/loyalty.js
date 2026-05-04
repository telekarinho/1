/**
 * MilkyPot - Sistema de Fidelidade (Loyalty Points)
 * 1 ponto por R$1 gasto. 100 pontos = recompensa.
 */

// BUG H — Chave unificada para DataStore (evita inconsistência entre funções)
var LOYALTY_KEY = function(fid) { return 'loyalty_' + fid; };

const Loyalty = {
    POINTS_PER_REAL: 1,
    REWARD_THRESHOLD: 100,
    REWARD_DESCRIPTION: 'Sorvete gratis (tamanho Mini)',
    REWARD_VALUE: 10.00,
    // Engagement milestones below the reward threshold (triggers WA notification)
    MILESTONES: [10, 50],

    // Busca cliente por telefone
    getCustomer(phone, franchiseId) {
        const customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        return customers.find(c => c.phone === phone) || null;
    },

    // Registra ou atualiza cliente
    registerCustomer(phone, name, franchiseId) {
        let customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        let customer = customers.find(c => c.phone === phone);

        if (!customer) {
            customer = {
                id: Utils.generateId(),
                phone, name,
                points: 0,
                totalSpent: 0,
                ordersCount: 0,
                rewards: [],
                createdAt: new Date().toISOString()
            };
            customers.push(customer);
        } else {
            if (name) customer.name = name;
        }

        DataStore.set(LOYALTY_KEY(franchiseId), customers);
        return customer;
    },

    // Returns the highest MILESTONES value crossed in [prevPts+1 .. newPts], or null
    _getMilestoneCrossed(prevPts, newPts) {
        const crossed = this.MILESTONES.filter(m => prevPts < m && m <= newPts);
        return crossed.length ? crossed[crossed.length - 1] : null;
    },

    // Adiciona pontos apos pedido entregue
    addPointsFromOrder(order, franchiseId) {
        if (!order.customer?.phone) return null;

        const customer = this.registerCustomer(
            order.customer.phone,
            order.customer.name,
            franchiseId
        );

        const points = Math.floor(order.total * this.POINTS_PER_REAL);
        const prevPoints = customer.points;
        customer.points += points;
        customer.totalSpent += order.total;
        customer.ordersCount++;
        customer.lastOrderAt = new Date().toISOString();

        // Milestone check before reward loop (points are at their peak here)
        const milestoneCrossed = this._getMilestoneCrossed(prevPoints, prevPoints + points);

        // Verifica se atingiu recompensa
        let rewardEarned = false;
        while (customer.points >= this.REWARD_THRESHOLD) {
            customer.points -= this.REWARD_THRESHOLD;
            customer.rewards.push({
                id: Utils.generateId(),
                description: this.REWARD_DESCRIPTION,
                value: this.REWARD_VALUE,
                earnedAt: new Date().toISOString(),
                redeemed: false
            });
            rewardEarned = true;
        }

        // Save — usando a mesma chave unificada
        const customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        const idx = customers.findIndex(c => c.id === customer.id);
        if (idx !== -1) customers[idx] = customer;
        DataStore.set(LOYALTY_KEY(franchiseId), customers);

        return { customer, pointsAdded: points, rewardEarned, milestoneCrossed };
    },

    // Resgata recompensa
    redeemReward(customerId, rewardId, franchiseId) {
        const customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return { success: false, error: 'Cliente nao encontrado' };

        const reward = customer.rewards.find(r => r.id === rewardId);
        if (!reward) return { success: false, error: 'Recompensa nao encontrada' };
        if (reward.redeemed) return { success: false, error: 'Recompensa ja resgatada' };

        reward.redeemed = true;
        reward.redeemedAt = new Date().toISOString();

        const idx = customers.findIndex(c => c.id === customerId);
        if (idx !== -1) customers[idx] = customer;
        DataStore.set(LOYALTY_KEY(franchiseId), customers);

        return { success: true, reward };
    },

    // Lista clientes com mais pontos
    getTopCustomers(franchiseId, limit = 10) {
        const customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        return customers
            .slice()
            .sort((a, b) => b.points - a.points)
            .slice(0, limit);
    },

    // Estatisticas
    getStats(franchiseId) {
        const customers = DataStore.get(LOYALTY_KEY(franchiseId)) || [];
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const activeCustomers = customers.filter(c => c.lastOrderAt && c.lastOrderAt >= thirtyDaysAgo);
        const pendingRewards = customers.reduce((sum, c) => sum + c.rewards.filter(r => !r.redeemed).length, 0);
        const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);
        const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
        const totalOrders = customers.reduce((sum, c) => sum + c.ordersCount, 0);

        return {
            totalCustomers: customers.length,
            activeCustomers: activeCustomers.length,
            pendingRewards,
            totalPoints,
            totalSpent,
            totalOrders
        };
    }
};
