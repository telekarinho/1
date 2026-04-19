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
            const parsed = this._parseItem(item);
            const sabor = parsed.sabor;
            const tamanho = parsed.tamanho || 'Medio';
            const formato = parsed.formato || '';

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
        if (!order || order.inventoryDeducted) return [];

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
        order.inventoryDeducted = true;
        order.inventoryDeductedAt = new Date().toISOString();

        // Audit log
        if (typeof AuditLog !== 'undefined') {
            AuditLog.log(AuditLog.EVENTS.INVENTORY_UPDATED, {
                orderId: order.id,
                deducted: ingredients
            }, franchiseId);
        }

        return ingredients;
    },

    _parseItem(item) {
        const rawName = String((item && (item.sabor || item.name)) || '').trim();
        const rawSize = String((item && (item.tamanho || item.size)) || '').trim();
        const normalizedName = rawName.toLowerCase();
        const normalizedSize = rawSize.toLowerCase();

        let sabor = rawName;
        if (normalizedName.startsWith('shake ')) sabor = rawName.substring(6).trim();
        else if (normalizedName.startsWith('sundae ')) sabor = rawName.substring(7).trim();
        else if (normalizedName.startsWith('bowl ')) sabor = rawName.substring(5).trim();
        else if (normalizedName.startsWith('acai shake ')) sabor = rawName.substring(11).trim();
        else if (normalizedName.startsWith('acai bowl ')) sabor = rawName.substring(10).trim();

        let formato = item && item.formato ? item.formato : '';
        if (!formato) {
            if (normalizedName.indexOf('shake') !== -1) formato = 'Shake';
            else if (normalizedName.indexOf('sundae') !== -1) formato = 'Sundae';
        }

        let tamanho = item && item.tamanho ? item.tamanho : '';
        if (!tamanho && normalizedSize) {
            if (normalizedSize.indexOf('medio') !== -1 || normalizedSize.indexOf('500ml') !== -1) tamanho = 'Medio';
            else if (normalizedSize.indexOf('mini') !== -1) tamanho = 'Mini';
            else if (normalizedSize.indexOf('pequeno') !== -1 || normalizedSize.indexOf('300ml') !== -1) tamanho = 'Pequeno';
            else if (normalizedSize.indexOf('grande') !== -1 || normalizedSize.indexOf('700ml') !== -1) tamanho = 'Grande';
            else if (normalizedSize.indexOf('gigante') !== -1) tamanho = 'Gigante';
        }

        return {
            sabor: sabor,
            tamanho: tamanho || 'Medio',
            formato: formato
        };
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
