/**
 * MilkyPot - Recipe-based Inventory System
 * Maps products to their ingredients and handles automatic deduction on delivery
 */
const Recipes = {
    // Receitas padrao por sabor
    recipes: {
        'Ninho': [
            { ingredient: 'Leite Ninho', quantity: 0.05, unit: 'kg' }
        ],
        'Morango': [
            { ingredient: 'Morango', quantity: 0.08, unit: 'kg' }
        ],
        'Ninho com Morango': [
            { ingredient: 'Leite Ninho', quantity: 0.04, unit: 'kg' },
            { ingredient: 'Morango', quantity: 0.05, unit: 'kg' }
        ],
        'Nutella': [
            { ingredient: 'Nutella', quantity: 0.03, unit: 'kg' }
        ],
        'Oreo': [
            { ingredient: 'Oreo', quantity: 0.02, unit: 'pct' }
        ],
        'Acai + Granola': [
            { ingredient: 'Acai', quantity: 0.15, unit: 'litro' },
            { ingredient: 'Granola', quantity: 0.03, unit: 'kg' }
        ],
        'Banana + Whey': [
            { ingredient: 'Banana', quantity: 0.1, unit: 'kg' },
            { ingredient: 'Whey Protein', quantity: 0.03, unit: 'kg' }
        ]
    },

    // Multiplicador por tamanho
    sizeMultiplier: {
        'Mini': 0.7,
        'Pequeno': 0.8,
        'Medio': 1.0,
        'Grande': 1.3,
        'Gigante': 1.6,
        '300ml': 0.8,
        '500ml': 1.0,
        '700ml': 1.4
    },

    // Embalagem por formato
    packaging: {
        'Shake': { ingredient: 'Copos 500ml', quantity: 1, unit: 'un' },
        'Sundae': { ingredient: 'Copos 300ml', quantity: 1, unit: 'un' }
    },

    // Calcula ingredientes necessarios para um pedido
    getIngredientsForOrder(order) {
        const allIngredients = [];

        if (!order || !order.items) return allIngredients;

        order.items.forEach(item => {
            const sabor = item.sabor || item.name || '';
            const tamanho = item.tamanho || 'Medio';
            const formato = item.formato || '';

            // Check custom recipes first, then default
            const recipe = this.recipes[sabor];
            if (recipe) {
                const multiplier = this.sizeMultiplier[tamanho] || 1.0;

                recipe.forEach(r => {
                    allIngredients.push({
                        ingredient: r.ingredient,
                        quantity: r.quantity * multiplier,
                        unit: r.unit
                    });
                });
            }

            // Add packaging if applicable
            const pack = this.packaging[formato];
            if (pack) {
                allIngredients.push({
                    ingredient: pack.ingredient,
                    quantity: pack.quantity,
                    unit: pack.unit
                });
            }
        });

        // Consolidate same ingredients
        const consolidated = [];
        allIngredients.forEach(ing => {
            const existing = consolidated.find(c => c.ingredient === ing.ingredient && c.unit === ing.unit);
            if (existing) {
                existing.quantity += ing.quantity;
            } else {
                consolidated.push({ ...ing });
            }
        });

        return consolidated;
    },

    // Deduz ingredientes do estoque
    deductFromInventory(franchiseId, order) {
        const ingredients = this.getIngredientsForOrder(order);
        const inventory = DataStore.getCollection('inventory', franchiseId);

        ingredients.forEach(needed => {
            const item = inventory.find(i => i.name === needed.ingredient);
            if (item) {
                item.quantity = Math.max(0, item.quantity - needed.quantity);
                // Check if below minStock and log warning
                if (item.quantity < item.minStock) {
                    console.warn(`⚠️ Estoque baixo: ${item.name} = ${item.quantity} ${item.unit}`);
                }
            }
        });

        DataStore.set('inventory_' + franchiseId, inventory);

        // Audit log
        if (typeof AuditLog !== 'undefined') {
            AuditLog.log(AuditLog.EVENTS.INVENTORY_UPDATED, {
                orderId: order.id,
                deducted: ingredients
            }, franchiseId);
        }

        return ingredients;
    },

    // Custom recipes from DataStore
    getCustomRecipes(franchiseId) {
        const custom = DataStore.get('custom_recipes_' + franchiseId);
        return custom || {};
    },

    // Save a custom recipe for a franchise
    saveCustomRecipe(franchiseId, sabor, ingredients) {
        const custom = this.getCustomRecipes(franchiseId);
        custom[sabor] = ingredients;
        DataStore.set('custom_recipes_' + franchiseId, custom);

        // Also update the in-memory recipes
        this.recipes[sabor] = ingredients;

        if (typeof AuditLog !== 'undefined') {
            AuditLog.log(AuditLog.EVENTS.INVENTORY_UPDATED, {
                action: 'custom_recipe_saved',
                sabor: sabor,
                ingredients: ingredients
            }, franchiseId);
        }
    }
};
