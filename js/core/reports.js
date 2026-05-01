/* ============================================
   MilkyPot - Sistema de Relatórios
   ============================================
   Geração de relatórios em PDF, CSV e envio
   automático via WhatsApp/email.
   ============================================ */

const Reports = {
    // ============================================
    // Relatório Diário
    // ============================================
    generateDailyReport(franchiseId, date) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const orders = this._getOrdersByDate(franchiseId, targetDate);
        const finances = this._getFinancesByDate(franchiseId, targetDate);

        const totalOrders = orders.length;
        const deliveredOrders = orders.filter(o => o.status === MP.ORDER_STATUS.DELIVERED);
        const cancelledOrders = orders.filter(o => o.status === MP.ORDER_STATUS.CANCELLED);
        const revenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgTicket = deliveredOrders.length > 0 ? revenue / deliveredOrders.length : 0;

        // Produtos mais vendidos
        const productCount = {};
        deliveredOrders.forEach(o => {
            (o.items || []).forEach(item => {
                const key = item.flavor || item.sabor || item.name || 'Desconhecido';
                productCount[key] = (productCount[key] || 0) + (item.quantity || 1);
            });
        });
        const topProducts = Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Métodos de pagamento
        const paymentMethods = {};
        deliveredOrders.forEach(o => {
            const method = o.paymentMethod || o.payment || 'nao_informado';
            paymentMethods[method] = (paymentMethods[method] || 0) + 1;
        });

        // Horários de pico
        const hourlyOrders = {};
        orders.forEach(o => {
            const hour = new Date(o.createdAt || o.date).getHours();
            hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
        });
        const peakHour = Object.entries(hourlyOrders)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            type: 'daily',
            date: targetDate,
            franchiseId,
            summary: {
                totalOrders,
                deliveredOrders: deliveredOrders.length,
                cancelledOrders: cancelledOrders.length,
                cancellationRate: totalOrders > 0 ? ((cancelledOrders.length / totalOrders) * 100).toFixed(1) : '0',
                revenue,
                avgTicket,
                topProducts,
                paymentMethods,
                peakHour: peakHour ? `${peakHour[0]}:00 (${peakHour[1]} pedidos)` : '-'
            },
            finances: {
                income: finances.filter(f => f.type === 'income').reduce((s, f) => s + (f.value || f.amount || 0), 0),
                expenses: finances.filter(f => f.type === 'expense').reduce((s, f) => s + (f.value || f.amount || 0), 0)
            },
            generatedAt: new Date().toISOString()
        };
    },

    // ============================================
    // Relatório Semanal
    // ============================================
    generateWeeklyReport(franchiseId, weekStart) {
        const start = weekStart || this._getWeekStart();
        const days = [];
        let totalRevenue = 0;
        let totalOrders = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const daily = this.generateDailyReport(franchiseId, dateStr);
            days.push(daily);
            totalRevenue += daily.summary.revenue;
            totalOrders += daily.summary.totalOrders;
        }

        // Melhor e pior dia
        const bestDay = days.reduce((best, d) =>
            d.summary.revenue > best.summary.revenue ? d : best, days[0]);
        const worstDay = days.reduce((worst, d) =>
            d.summary.revenue < worst.summary.revenue ? d : worst, days[0]);

        // Consolidar produtos da semana
        const weeklyProducts = {};
        days.forEach(d => {
            d.summary.topProducts.forEach(([name, qty]) => {
                weeklyProducts[name] = (weeklyProducts[name] || 0) + qty;
            });
        });

        return {
            type: 'weekly',
            weekStart: start,
            weekEnd: new Date(new Date(start).getTime() + 6 * 86400000).toISOString().split('T')[0],
            franchiseId,
            summary: {
                totalOrders,
                totalRevenue,
                avgDailyRevenue: totalRevenue / 7,
                avgDailyOrders: totalOrders / 7,
                avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                bestDay: { date: bestDay.date, revenue: bestDay.summary.revenue },
                worstDay: { date: worstDay.date, revenue: worstDay.summary.revenue },
                topProducts: Object.entries(weeklyProducts)
                    .sort((a, b) => b[1] - a[1]).slice(0, 10)
            },
            days,
            generatedAt: new Date().toISOString()
        };
    },

    // ============================================
    // Relatório Mensal
    // ============================================
    generateMonthlyReport(franchiseId, year, month) {
        const now = new Date();
        const y = year || now.getFullYear();
        const m = month || now.getMonth() + 1;
        const daysInMonth = new Date(y, m, 0).getDate();

        let totalRevenue = 0;
        let totalOrders = 0;
        let totalExpenses = 0;
        const dailyData = [];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daily = this.generateDailyReport(franchiseId, dateStr);
            dailyData.push(daily);
            totalRevenue += daily.summary.revenue;
            totalOrders += daily.summary.totalOrders;
            totalExpenses += daily.finances.expenses;
        }

        const profit = totalRevenue - totalExpenses;
        const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

        return {
            type: 'monthly',
            year: y,
            month: m,
            franchiseId,
            summary: {
                totalOrders,
                totalRevenue,
                totalExpenses,
                profit,
                profitMargin: margin + '%',
                avgDailyRevenue: totalRevenue / daysInMonth,
                avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0
            },
            dailyData,
            generatedAt: new Date().toISOString()
        };
    },

    // ============================================
    // Exportar para CSV
    // ============================================
    exportToCSV(report) {
        let csv = '';

        if (report.type === 'daily') {
            csv = this._dailyToCSV(report);
        } else if (report.type === 'weekly') {
            csv = this._weeklyToCSV(report);
        } else if (report.type === 'monthly') {
            csv = this._monthlyToCSV(report);
        }

        this._downloadFile(csv, `relatorio_${report.type}_${report.date || report.weekStart || report.year + '-' + report.month}.csv`, 'text/csv');
    },

    _dailyToCSV(report) {
        const s = report.summary;
        let csv = 'Relatório Diário MilkyPot\n';
        csv += `Data,${report.date}\n\n`;
        csv += 'Métrica,Valor\n';
        csv += `Total de Pedidos,${s.totalOrders}\n`;
        csv += `Pedidos Entregues,${s.deliveredOrders}\n`;
        csv += `Pedidos Cancelados,${s.cancelledOrders}\n`;
        csv += `Taxa de Cancelamento,${s.cancellationRate}%\n`;
        csv += `Faturamento,"R$ ${s.revenue.toFixed(2)}"\n`;
        csv += `Ticket Médio,"R$ ${s.avgTicket.toFixed(2)}"\n`;
        csv += `Horário de Pico,"${s.peakHour}"\n\n`;
        csv += 'Produtos Mais Vendidos\n';
        csv += 'Produto,Quantidade\n';
        s.topProducts.forEach(([name, qty]) => {
            csv += `"${name.replace(/"/g, '""')}",${qty}\n`;
        });
        return csv;
    },

    _weeklyToCSV(report) {
        const s = report.summary;
        let csv = 'Relatório Semanal MilkyPot\n';
        csv += `Período,"${report.weekStart} a ${report.weekEnd}"\n\n`;
        csv += 'Métrica,Valor\n';
        csv += `Total de Pedidos,${s.totalOrders}\n`;
        csv += `Faturamento Total,"R$ ${s.totalRevenue.toFixed(2)}"\n`;
        csv += `"Média Diária (R$)","R$ ${s.avgDailyRevenue.toFixed(2)}"\n`;
        csv += `Ticket Médio,"R$ ${s.avgTicket.toFixed(2)}"\n`;
        csv += `Melhor Dia,"${s.bestDay.date} (R$ ${s.bestDay.revenue.toFixed(2)})"\n`;
        csv += `Pior Dia,"${s.worstDay.date} (R$ ${s.worstDay.revenue.toFixed(2)})"\n\n`;
        csv += 'Dia,Pedidos,Faturamento\n';
        report.days.forEach(d => {
            csv += `${d.date},${d.summary.totalOrders},"R$ ${d.summary.revenue.toFixed(2)}"\n`;
        });
        return csv;
    },

    _monthlyToCSV(report) {
        const s = report.summary;
        let csv = 'Relatório Mensal MilkyPot\n';
        csv += `Mês/Ano,${report.month}/${report.year}\n\n`;
        csv += 'Métrica,Valor\n';
        csv += `Total de Pedidos,${s.totalOrders}\n`;
        csv += `Receita Total,"R$ ${s.totalRevenue.toFixed(2)}"\n`;
        csv += `Despesas Total,"R$ ${s.totalExpenses.toFixed(2)}"\n`;
        csv += `Lucro,"R$ ${s.profit.toFixed(2)}"\n`;
        csv += `Margem de Lucro,${s.profitMargin}\n`;
        csv += `Ticket Médio,"R$ ${s.avgTicket.toFixed(2)}"\n\n`;
        csv += 'Dia,Pedidos,Faturamento,Despesas\n';
        report.dailyData.forEach(d => {
            csv += `${d.date},${d.summary.totalOrders},"R$ ${d.summary.revenue.toFixed(2)}","R$ ${d.finances.expenses.toFixed(2)}"\n`;
        });
        return csv;
    },

    // ============================================
    // Gerar HTML para impressão
    // ============================================
    generatePrintableHTML(report) {
        const s = report.summary;
        let html = `
        <html>
        <head>
            <title>Relatório MilkyPot</title>
            <style>
                body { font-family: 'Nunito', Arial, sans-serif; padding: 40px; color: #333; }
                h1 { color: #42A5F5; border-bottom: 3px solid #42A5F5; padding-bottom: 10px; }
                h2 { color: #444; margin-top: 24px; }
                table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; }
                th { background: #f5f5f5; font-weight: 700; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
                .kpi { background: #f8f8f8; padding: 16px; border-radius: 8px; text-align: center; }
                .kpi-value { font-size: 24px; font-weight: 800; color: #42A5F5; }
                .kpi-label { font-size: 12px; color: #666; margin-top: 4px; }
                .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
                @media print { body { padding: 20px; } }
            </style>
        </head>
        <body>
            <h1>🍦 MilkyPot - Relatório ${this._reportTypeLabel(report.type)}</h1>
            <p><strong>Período:</strong> ${this._reportPeriodLabel(report)}</p>
            <p><strong>Gerado em:</strong> ${new Date(report.generatedAt).toLocaleString('pt-BR')}</p>

            <div class="kpi-grid">
                <div class="kpi">
                    <div class="kpi-value">${s.totalOrders}</div>
                    <div class="kpi-label">Pedidos</div>
                </div>
                <div class="kpi">
                    <div class="kpi-value">R$ ${(s.totalRevenue || s.revenue || 0).toFixed(2)}</div>
                    <div class="kpi-label">Faturamento</div>
                </div>
                <div class="kpi">
                    <div class="kpi-value">R$ ${(s.avgTicket || 0).toFixed(2)}</div>
                    <div class="kpi-label">Ticket Médio</div>
                </div>`;

        if (report.type === 'monthly') {
            html += `
                <div class="kpi">
                    <div class="kpi-value">${s.profitMargin}</div>
                    <div class="kpi-label">Margem de Lucro</div>
                </div>`;
        } else {
            html += `
                <div class="kpi">
                    <div class="kpi-value">${s.deliveredOrders || s.totalOrders}</div>
                    <div class="kpi-label">Entregues</div>
                </div>`;
        }

        html += `</div>`;

        // Top Products
        const prods = s.topProducts || [];
        if (prods.length > 0) {
            html += `<h2>🏆 Produtos Mais Vendidos</h2>
            <table>
                <tr><th>#</th><th>Produto</th><th>Qtd</th></tr>`;
            prods.forEach(([name, qty], i) => {
                html += `<tr><td>${i + 1}</td><td>${Utils.escapeHtml(name)}</td><td>${qty}</td></tr>`;
            });
            html += `</table>`;
        }

        html += `
            <div class="footer">
                MilkyPot © ${new Date().getFullYear()} - Relatório gerado automaticamente
            </div>
        </body>
        </html>`;

        return html;
    },

    // Abre relatório para impressão
    printReport(report) {
        const html = this.generatePrintableHTML(report);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    },

    // ============================================
    // Enviar relatório via WhatsApp
    // ============================================
    sendReportViaWhatsApp(report, phone) {
        if (typeof WhatsApp === 'undefined') return;

        const s = report.summary;
        const data = {
            date: this._reportPeriodLabel(report),
            franchiseName: report.franchiseId || 'MilkyPot',
            totalOrders: s.totalOrders,
            revenue: s.totalRevenue || s.revenue || 0,
            avgTicket: s.avgTicket || 0,
            topProduct: (s.topProducts && s.topProducts[0]) ? s.topProducts[0][0] : '-'
        };

        WhatsApp.open(phone, WhatsApp.templates.dailyReport(data));
    },

    // ============================================
    // Agendamento de relatórios (localStorage)
    // ============================================
    scheduleReport(config) {
        const schedules = JSON.parse(localStorage.getItem('mp_report_schedules') || '[]');
        const schedule = {
            id: Utils.generateId(),
            type: config.type || 'daily', // daily, weekly, monthly
            franchiseId: config.franchiseId,
            recipients: config.recipients || [], // [{phone, name}]
            time: config.time || '22:00',
            enabled: true,
            createdAt: new Date().toISOString()
        };
        schedules.push(schedule);
        localStorage.setItem('mp_report_schedules', JSON.stringify(schedules));
        return schedule;
    },

    getSchedules() {
        return JSON.parse(localStorage.getItem('mp_report_schedules') || '[]');
    },

    deleteSchedule(id) {
        const schedules = this.getSchedules().filter(s => s.id !== id);
        localStorage.setItem('mp_report_schedules', JSON.stringify(schedules));
    },

    toggleSchedule(id) {
        const schedules = this.getSchedules();
        const idx = schedules.findIndex(s => s.id === id);
        if (idx !== -1) {
            schedules[idx].enabled = !schedules[idx].enabled;
            localStorage.setItem('mp_report_schedules', JSON.stringify(schedules));
        }
    },

    // Checa se há relatórios agendados para enviar (chamado periodicamente)
    checkScheduledReports() {
        const schedules = this.getSchedules().filter(s => s.enabled);
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const today = now.toISOString().split('T')[0];
        const lastRun = localStorage.getItem('mp_last_report_run') || '';

        if (lastRun === today) return; // Já rodou hoje

        schedules.forEach(schedule => {
            if (currentTime >= schedule.time) {
                let report;
                if (schedule.type === 'daily') {
                    report = this.generateDailyReport(schedule.franchiseId);
                } else if (schedule.type === 'weekly' && now.getDay() === 1) { // Segunda
                    report = this.generateWeeklyReport(schedule.franchiseId);
                } else if (schedule.type === 'monthly' && now.getDate() === 1) { // Dia 1
                    report = this.generateMonthlyReport(schedule.franchiseId);
                }

                if (report && schedule.recipients.length > 0) {
                    schedule.recipients.forEach(r => {
                        if (r.phone) {
                            this.sendReportViaWhatsApp(report, r.phone);
                        }
                    });
                }
            }
        });

        localStorage.setItem('mp_last_report_run', today);
    },

    // ============================================
    // Helpers
    // ============================================
    _getOrdersByDate(franchiseId, dateStr) {
        const key = franchiseId ? `orders_${franchiseId}` : 'orders';
        const orders = DataStore.get(key) || [];
        return orders.filter(o => {
            const orderDate = (o.createdAt || o.date || '').split('T')[0];
            return orderDate === dateStr;
        });
    },

    _getFinancesByDate(franchiseId, dateStr) {
        const key = franchiseId ? `finances_${franchiseId}` : 'finances';
        const finances = DataStore.get(key) || [];
        return finances.filter(f => {
            const fDate = (f.date || '').split('T')[0];
            return fDate === dateStr;
        });
    },

    _getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(now.setDate(diff)).toISOString().split('T')[0];
    },

    _reportTypeLabel(type) {
        return { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' }[type] || type;
    },

    _reportPeriodLabel(report) {
        if (report.date) return report.date;
        if (report.weekStart) return `${report.weekStart} a ${report.weekEnd}`;
        if (report.month) return `${report.month}/${report.year}`;
        return '-';
    },

    _downloadFile(content, filename, type) {
        const blob = new Blob(['\ufeff' + content], { type: type + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Expose globally for browser (const is script-scoped, not a window property)
if (typeof window !== 'undefined') window.Reports = Reports;
if (typeof globalThis !== 'undefined') globalThis.Reports = Reports;
