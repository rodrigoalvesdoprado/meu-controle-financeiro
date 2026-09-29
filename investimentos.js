/* ============================================================
   INVESTIMENTOS.JS
   Controle de investimentos: ativos, aportes, resgates,
   cotações, gráficos e evolução patrimonial.

   Este arquivo é uma versão consolidada das Partes 1 e 2,
   já com as mudanças da Etapa 2.1 (rateConfig, LCI, etc.).
   ============================================================ */

(function () {
    'use strict';

    // ========== CONSTANTES ==========

    const STORAGE_KEYS = {
        ASSETS: 'assets',
        INVESTMENT_TXS: 'investmentTxs',
        QUOTES_CACHE: 'quotesCache',
        QUOTES_HISTORY: 'quotesHistory',
        SORT_FIELD: 'investmentSortField',
        SORT_DIR: 'investmentSortDir',
        OWNER_FILTER: 'investmentOwnerFilter'
    };

    const ASSET_TYPES = {
        acao:      { label: 'Ação',     currency: 'BRL', api: 'brapi' },
        fii:       { label: 'FII',      currency: 'BRL', api: 'brapi' },
        tesouro:   { label: 'Tesouro',  currency: 'BRL', api: 'brapi' },
        cdb:       { label: 'CDB',      currency: 'BRL', api: 'manual' },
        lci:       { label: 'LCI',      currency: 'BRL', api: 'manual' },
        cofrinho:  { label: 'Cofrinho', currency: 'BRL', api: 'manual' },
        acao_eua:  { label: 'Ação EUA', currency: 'USD', api: 'manual' }
    };

    // ========== ESTADO EM MEMÓRIA ==========

    let sortField = localStorage.getItem(STORAGE_KEYS.SORT_FIELD) || 'asset';
    let sortDir   = localStorage.getItem(STORAGE_KEYS.SORT_DIR)   || 'asc';
    let ownerFilter = localStorage.getItem(STORAGE_KEYS.OWNER_FILTER) || '__all__';

    let editingAssetId = null;
    let selectedAssetId = null;

    // ========== UTILITÁRIOS ==========

    function escapeHtmlText(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]);
    }

    function notify(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'success');
        } else {
            alert(message);
        }
    }

    function fmtBRL(v) {
        const n = Number(v) || 0;
        return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function fmtUSD(v) {
        const n = Number(v) || 0;
        return 'US$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function fmtQty(v) {
        const n = Number(v) || 0;
        let s = n.toFixed(8).replace(/\.?0+$/, '');
        if (s === '') s = '0';
        return s.replace('.', ',');
    }

    function fmtPct(v) {
        const n = Number(v) || 0;
        const sign = n > 0 ? '+' : '';
        return sign + n.toFixed(2).replace('.', ',') + '%';
    }

    function generateId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    function createDateFromString(ds) {
        if (!ds) return null;
        const p = String(ds).split('-');
        if (p.length !== 3) return null;
        const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
        return isNaN(d.getTime()) ? null : d;
    }

    function formatDateToString(d) {
        if (!d || isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function formatDateToDisplay(d) {
        if (!d || isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    // ========== PERSISTÊNCIA ==========

    function getAssets() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.ASSETS);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
    }

    function saveAssets(assets) {
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    }

    function getInvestmentTxs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENT_TXS);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
    }

    function saveInvestmentTxs(txs) {
        localStorage.setItem(STORAGE_KEYS.INVESTMENT_TXS, JSON.stringify(txs));
    }

    function getQuotesCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.QUOTES_CACHE);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) { return {}; }
    }

    function saveQuotesCache(cache) {
        localStorage.setItem(STORAGE_KEYS.QUOTES_CACHE, JSON.stringify(cache));
    }

    function getQuotesHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.QUOTES_HISTORY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) { return {}; }
    }

    function saveQuotesHistory(history) {
        localStorage.setItem(STORAGE_KEYS.QUOTES_HISTORY, JSON.stringify(history));
    }

    function getOwners() {
        if (window.Configuracoes && typeof window.Configuracoes.getOwners === 'function') {
            return window.Configuracoes.getOwners();
        }
        return [];
    }

    // ========== CÁLCULOS POR ATIVO ==========

    function computeAssetAggregates(assetId) {
        const txs = getInvestmentTxs().filter(t => t.assetId === assetId);
        let qty = 0;
        let totalAportado = 0;
        let totalResgatado = 0;

        txs.forEach(tx => {
            const q = Number(tx.quantity) || 0;
            const total = Number(tx.total) || (Number(tx.unitPrice) || 0) * q;
            if (tx.type === 'aporte') {
                qty += q;
                totalAportado += total;
            } else if (tx.type === 'resgate') {
                qty -= q;
                totalResgatado += total;
            }
        });

        const invested = totalAportado - totalResgatado;
        const avgPrice = qty > 0 ? (invested / qty) : 0;

        return {
            quantity: qty,
            invested: invested,
            avgPrice: avgPrice,
            totalAportado: totalAportado,
            totalResgatado: totalResgatado,
            count: txs.length
        };
    }

    function getCurrentPrice(asset) {
        const cache = getQuotesCache();
        const entry = cache[asset.code];
        if (entry && typeof entry.price === 'number' && entry.price > 0) {
            return entry.price;
        }
        return null;
    }

    function computeAssetValuation(asset) {
        const agg = computeAssetAggregates(asset.id);

        // Se for renda fixa, delega para o cálculo especializado
        const isFixedIncome = (
            asset.type === 'cdb' ||
            asset.type === 'lci' ||
            asset.type === 'cofrinho' ||
            asset.type === 'tesouro'
        );

        if (isFixedIncome && asset.rateConfig && asset.rateConfig.kind) {
            const fixValuation = computeFixedIncomeValuation(asset);
            if (fixValuation) {
                const returnAbs = fixValuation.valorBrutoTotal - fixValuation.invested;
                const returnPct = fixValuation.invested > 0
                    ? (returnAbs / fixValuation.invested) * 100
                    : 0;
                return {
                    ...agg,
                    // Campos específicos de renda fixa
                    isFixedIncome: true,
                    valorBrutoTotal: fixValuation.valorBrutoTotal,
                    valorLiquidoTotal: fixValuation.valorLiquidoTotal,
                    irTotal: fixValuation.irTotal,
                    txsDetalhadas: fixValuation.txsDetalhadas,
                    // Campos genéricos (usados pela tabela e detalhes)
                    currentPrice: null,
                    currentValue: fixValuation.valorBrutoTotal,
                    currentValueLiquido: fixValuation.valorLiquidoTotal,
                    returnAbs: returnAbs,
                    returnPct: returnPct
                };
            }
        }

        // Caminho normal (renda variável ou renda fixa sem rateConfig)
        const currentPrice = getCurrentPrice(asset);

        let currentValue;
        if (currentPrice !== null && agg.quantity > 0) {
            currentValue = currentPrice * agg.quantity;
        } else {
            currentValue = agg.invested;
        }

        const returnAbs = currentValue - agg.invested;
        const returnPct = agg.invested > 0 ? (returnAbs / agg.invested) * 100 : 0;

        return {
            ...agg,
            isFixedIncome: false,
            currentPrice: currentPrice,
            currentValue: currentValue,
            currentValueLiquido: currentValue, // em renda variável, bruto = líquido
            returnAbs: returnAbs,
            returnPct: returnPct
        };
    }

    function getEnrichedAssets() {
        const all = getAssets();
        const filtered = (ownerFilter === '__all__')
            ? all
            : all.filter(a => a.ownerId === ownerFilter);

        return filtered.map(asset => ({
            asset,
            valuation: computeAssetValuation(asset)
        }));
    }

    // ========== COMPARADORES ==========

    function getOwnerName(ownerId) {
        const owners = getOwners();
        const o = owners.find(x => x.id === ownerId);
        return o ? o.name : '';
    }

    function getOwnerColor(ownerId) {
        const owners = getOwners();
        const o = owners.find(x => x.id === ownerId);
        return o ? (o.color || '#3498db') : '#95a5a6';
    }

    function getTypeLabel(type) {
        return (ASSET_TYPES[type] && ASSET_TYPES[type].label) || type;
    }

    function compareInvestmentAssets(a, b) {
        const A = a.asset, B = b.asset;
        const VA = a.valuation, VB = b.valuation;

        let result = 0;
        switch (sortField) {
            case 'code':
                result = (A.code || '').localeCompare(B.code || '', 'pt-BR', { sensitivity: 'base' });
                break;
            case 'owner': {
                const na = getOwnerName(A.ownerId);
                const nb = getOwnerName(B.ownerId);
                result = na.localeCompare(nb, 'pt-BR', { sensitivity: 'base' });
                break;
            }
            case 'institution':
                result = (A.institution || '').localeCompare(B.institution || '', 'pt-BR', { sensitivity: 'base' });
                break;
            case 'type':
                result = getTypeLabel(A.type).localeCompare(getTypeLabel(B.type), 'pt-BR', { sensitivity: 'base' });
                break;
            case 'quantity':
                result = (VA.quantity || 0) - (VB.quantity || 0);
                break;
            case 'avgPrice':
                result = (VA.avgPrice || 0) - (VB.avgPrice || 0);
                break;
            case 'invested':
                result = (VA.invested || 0) - (VB.invested || 0);
                break;
            case 'currentPrice':
                result = (VA.currentPrice || 0) - (VB.currentPrice || 0);
                break;
            case 'currentValue':
                result = (VA.currentValue || 0) - (VB.currentValue || 0);
                break;
            case 'return':
                result = (VA.returnPct || 0) - (VB.returnPct || 0);
                break;
            case 'asset':
            default:
                result = (A.name || '').localeCompare(B.name || '', 'pt-BR', { sensitivity: 'base' });
                break;
        }

        if (sortDir === 'desc') result = -result;
        if (result === 0) {
            result = (A.name || '').localeCompare(B.name || '', 'pt-BR', { sensitivity: 'base' });
        }
        return result;
    }

    // ========== UI — FILTRO DE TITULAR ==========

    function refreshOwnerFilter() {
        const sel = document.getElementById('investments-owner-filter');
        if (!sel) return;
        const owners = getOwners();
        const current = ownerFilter;

        sel.innerHTML = '<option value="__all__">Todos</option>';
        owners.forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.id;
            opt.textContent = o.name;
            sel.appendChild(opt);
        });

        const stillExists = (current === '__all__') || owners.some(o => o.id === current);
        sel.value = stillExists ? current : '__all__';
        ownerFilter = sel.value;
        localStorage.setItem(STORAGE_KEYS.OWNER_FILTER, ownerFilter);
    }

    // ========== UI — CARDS DE SUBTOTAL ==========

    function renderOwnerSubtotals() {
        const container = document.getElementById('owner-subtotals-container');
        if (!container) return;
        container.innerHTML = '';

        const owners = getOwners();
        const allAssets = getAssets();

        const ownersToShow = (ownerFilter === '__all__')
            ? owners
            : owners.filter(o => o.id === ownerFilter);

        if (ownersToShow.length === 0) return;

        ownersToShow.forEach(owner => {
            const assetsOfOwner = allAssets.filter(a => a.ownerId === owner.id);
            let totalInvested = 0;
            let totalCurrent = 0;
            assetsOfOwner.forEach(asset => {
                const v = computeAssetValuation(asset);
                totalInvested += v.invested;
                totalCurrent += v.currentValue;
            });
            const diff = totalCurrent - totalInvested;
            const diffPct = totalInvested > 0 ? (diff / totalInvested) * 100 : 0;

            const card = document.createElement('div');
            card.className = 'owner-subtotal-card';
            card.style.borderLeftColor = owner.color || '#3498db';

            const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : '');
            const diffSign = diff > 0 ? '+' : '';

            card.innerHTML = `
                <div class="owner-subtotal-header">
                    <span class="owner-dot" style="background-color: ${escapeHtmlText(owner.color || '#3498db')}"></span>
                    <span class="owner-name">${escapeHtmlText(owner.name)}</span>
                </div>
                <div class="owner-subtotal-row">
                    <span class="label">Ativos</span>
                    <span class="value">${assetsOfOwner.length}</span>
                </div>
                <div class="owner-subtotal-row">
                    <span class="label">Valor Investido</span>
                    <span class="value">${fmtBRL(totalInvested)}</span>
                </div>
                <div class="owner-subtotal-row big">
                    <span class="label">Valor Atualizado</span>
                    <span class="value">${fmtBRL(totalCurrent)}</span>
                </div>
                <div class="owner-subtotal-row">
                    <span class="label">Rentabilidade</span>
                    <span class="value ${diffClass}">${diffSign}${fmtBRL(diff)} (${fmtPct(diffPct)})</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ========== UI — TABELA ==========

    function renderInvestmentsTable() {
        const tbody = document.getElementById('investments-table-body');
        const tfoot = document.getElementById('investments-table-foot');
        const emptyEl = document.getElementById('investments-empty');
        const countEl = document.getElementById('investments-count');
        if (!tbody || !tfoot) return;

        const enriched = getEnrichedAssets().sort(compareInvestmentAssets);

        if (countEl) {
            countEl.textContent = enriched.length === 1
                ? '1 ativo'
                : `${enriched.length} ativos`;
        }

        if (enriched.length === 0) {
            tbody.innerHTML = '';
            tfoot.innerHTML = '';
            if (emptyEl) emptyEl.style.display = '';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        tbody.innerHTML = '';
        enriched.forEach(({ asset, valuation }) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-asset-id', asset.id);

            const ownerName = getOwnerName(asset.ownerId) || '—';
            const ownerColor = getOwnerColor(asset.ownerId);
            const typeLabel = getTypeLabel(asset.type);

            let priceCell;
            if (valuation.currentPrice !== null) {
                priceCell = (asset.currency === 'USD')
                    ? fmtUSD(valuation.currentPrice)
                    : fmtBRL(valuation.currentPrice);
            } else {
                priceCell = `<span class="quote-missing">—</span>`;
            }

            const currentValueCell = fmtBRL(valuation.currentValue);

            let returnCell;
            if (valuation.invested <= 0) {
                returnCell = `<span class="return-neutral">—</span>`;
            } else {
                const cls = valuation.returnAbs > 0 ? 'return-positive'
                          : (valuation.returnAbs < 0 ? 'return-negative' : 'return-neutral');
                returnCell = `<span class="${cls}">${fmtPct(valuation.returnPct)}</span>`;
            }

            const ifText = asset.institution ? escapeHtmlText(asset.institution) : '<span class="quote-missing">—</span>';

            tr.innerHTML = `
                <td class="col-asset" data-label="Ativo">
                    <div class="asset-name-cell">
                        <strong>${escapeHtmlText(asset.name)}</strong>
                        ${asset.notes ? `<small>${escapeHtmlText(asset.notes)}</small>` : ''}
                    </div>
                </td>
                <td class="col-code" data-label="Cód.">${escapeHtmlText(asset.code)}</td>
                <td class="col-owner" data-label="Titular">
                    <span class="owner-badge" style="background-color:${escapeHtmlText(ownerColor)}">
                        <span class="dot"></span>${escapeHtmlText(ownerName)}
                    </span>
                </td>
                <td class="col-if" data-label="IF">${ifText}</td>
                <td class="col-type" data-label="Tipo"><span class="type-badge">${escapeHtmlText(typeLabel)}</span></td>
                <td class="col-qty" data-label="Qtd.">${fmtQty(valuation.quantity)}</td>
                <td class="col-avg" data-label="Pr. Méd">${fmtBRL(valuation.avgPrice)}</td>
                <td class="col-invested" data-label="Vlr. Inv">${fmtBRL(valuation.invested)}</td>
                <td class="col-price" data-label="Pr. Atual">${priceCell}</td>
                <td class="col-current" data-label="Vlr. Atual">${currentValueCell}</td>
                <td class="col-return" data-label="Rent">${returnCell}</td>
                <td class="col-actions" data-label="">
                    <button class="btn-icon secondary" title="Adicionar aporte" data-action="aporte" data-asset-id="${escapeHtmlText(asset.id)}">
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        let sumInvested = 0;
        let sumCurrent = 0;
        enriched.forEach(({ valuation }) => {
            sumInvested += valuation.invested;
            sumCurrent += valuation.currentValue;
        });
        const sumDiff = sumCurrent - sumInvested;
        const sumPct = sumInvested > 0 ? (sumDiff / sumInvested) * 100 : 0;
        const sumClass = sumDiff > 0 ? 'return-positive'
                       : (sumDiff < 0 ? 'return-negative' : 'return-neutral');
        const sumSign = sumDiff > 0 ? '+' : '';

        tfoot.innerHTML = `
            <tr>
                <td colspan="6" class="total-label">TOTAIS (${enriched.length} ${enriched.length === 1 ? 'ativo' : 'ativos'})</td>
                <td class="col-invested" data-label="Vlr. Inv">${fmtBRL(sumInvested)}</td>
                <td class="col-price" data-label=""></td>
                <td class="col-current" data-label="Vlr. Atual">${fmtBRL(sumCurrent)}</td>
                <td class="col-return" data-label="Rent"><span class="${sumClass}">${sumSign}${fmtPct(sumPct)}</span></td>
                <td class="col-actions" data-label=""></td>
            </tr>
        `;

        updateSortIcons();
    }

    function updateSortIcons() {
        document.querySelectorAll('.investments-table thead th.sortable').forEach(th => {
            th.classList.remove('active', 'asc', 'desc');
            if (th.getAttribute('data-sort') === sortField) {
                th.classList.add('active');
                th.classList.add(sortDir);
            }
        });
    }

    // ========== UI — PAINEL DE DETALHES ==========

    function openAssetDetail(assetId) {
        const asset = getAssets().find(a => a.id === assetId);
        if (!asset) return;

        selectedAssetId = assetId;

        const panel = document.getElementById('asset-detail');
        const title = document.getElementById('asset-detail-title');
        const summary = document.getElementById('asset-detail-summary');
        const history = document.getElementById('asset-detail-history');
        if (!panel || !title || !summary || !history) return;

        const ownerName = getOwnerName(asset.ownerId) || '—';
        title.innerHTML = `
            ${escapeHtmlText(asset.name)} <small style="color:var(--text-secondary);font-weight:normal;">
                (${escapeHtmlText(asset.code)} • ${escapeHtmlText(ownerName)})
            </small>
        `;

        const v = computeAssetValuation(asset);
        const diffClass = v.returnAbs > 0 ? 'positive' : (v.returnAbs < 0 ? 'negative' : '');

        summary.innerHTML = `
            <div class="summary-item">
                <span class="label">Qtd. Atual</span>
                <span class="value">${fmtQty(v.quantity)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Preço Médio</span>
                <span class="value">${fmtBRL(v.avgPrice)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Valor Investido</span>
                <span class="value">${fmtBRL(v.invested)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Valor Atualizado</span>
                <span class="value">${fmtBRL(v.currentValue)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Rentabilidade</span>
                <span class="value ${diffClass}">${fmtBRL(v.returnAbs)}<br><small>${fmtPct(v.returnPct)}</small></span>
            </div>
        `;

        const txs = getInvestmentTxs()
            .filter(t => t.assetId === assetId)
            .sort((a, b) => b.timestamp - a.timestamp);

        if (txs.length === 0) {
            history.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:20px;">
                Nenhuma movimentação registrada ainda.
            </p>`;
        } else {
            const ul = document.createElement('ul');
            txs.forEach(tx => {
                const li = document.createElement('li');
                const isAporte = tx.type === 'aporte';
                const cls = isAporte ? 'aporte' : 'resgate';
                const sign = isAporte ? '+' : '−';
                li.innerHTML = `
                    <div class="tx-info">
                        <strong>${isAporte ? 'Aporte' : 'Resgate'} — ${escapeHtmlText(tx.date)}</strong>
                        <small>
                            ${fmtQty(tx.quantity)} × ${fmtBRL(tx.unitPrice)}
                            ${tx.notes ? ' • ' + escapeHtmlText(tx.notes) : ''}
                        </small>
                    </div>
                    <div class="tx-value ${cls}">${sign} ${fmtBRL(tx.total)}
                        <button class="btn-icon danger" style="margin-left:8px" title="Excluir movimentação" data-delete-tx-id="${escapeHtmlText(tx.id)}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                ul.appendChild(li);
            });
            history.innerHTML = '';
            history.appendChild(ul);

            history.querySelectorAll('button[data-delete-tx-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const txId = e.currentTarget.getAttribute('data-delete-tx-id');
                    deleteInvestmentTx(txId);
                });
            });
        }

        panel.classList.add('show');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeAssetDetail() {
        const panel = document.getElementById('asset-detail');
        if (panel) panel.classList.remove('show');
        selectedAssetId = null;
    }

    // ========== MODAL DE ATIVO ==========

    function openAssetModal(assetId) {
        editingAssetId = assetId || null;
        const modal = document.getElementById('assetModal');
        const titleEl = document.getElementById('assetModalTitle');
        if (!modal) return;

        const ownerSel = document.getElementById('asset-owner');
        if (ownerSel) {
            ownerSel.innerHTML = '';
            getOwners().forEach(o => {
                const opt = document.createElement('option');
                opt.value = o.id;
                opt.textContent = o.name;
                ownerSel.appendChild(opt);
            });
        }

        if (editingAssetId) {
            const asset = getAssets().find(a => a.id === editingAssetId);
            if (!asset) return;
            if (titleEl) titleEl.textContent = 'Editar Ativo';
            setAssetFormValues(asset);
        } else {
            if (titleEl) titleEl.textContent = 'Novo Ativo';
            clearAssetForm();
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeAssetModal() {
        const modal = document.getElementById('assetModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = '';
        editingAssetId = null;
    }

    function clearAssetForm() {
        const ids = ['asset-code', 'asset-name', 'asset-institution', 'asset-notes',
                     'asset-rate-percent', 'asset-rate-fixed', 'asset-rate-ipca'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const ownerSel = document.getElementById('asset-owner');
        if (ownerSel && ownerSel.options.length > 0) ownerSel.selectedIndex = 0;
        const typeSel = document.getElementById('asset-type');
        if (typeSel) typeSel.value = 'acao';
        const currSel = document.getElementById('asset-currency');
        if (currSel) currSel.value = 'BRL';
        const kindSel = document.getElementById('asset-rate-kind');
        if (kindSel) kindSel.value = 'cdi';

        updateManualRateVisibility();
    }

    function setAssetFormValues(asset) {
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        set('asset-code', asset.code);
        set('asset-name', asset.name);
        set('asset-institution', asset.institution);
        set('asset-notes', asset.notes);

        const ownerSel = document.getElementById('asset-owner');
        if (ownerSel) ownerSel.value = asset.ownerId || '';

        const typeSel = document.getElementById('asset-type');
        if (typeSel) typeSel.value = asset.type || 'acao';

        const currSel = document.getElementById('asset-currency');
        if (currSel) currSel.value = asset.currency || 'BRL';

        const rc = asset.rateConfig || {};
        const kindSel = document.getElementById('asset-rate-kind');
        if (kindSel) kindSel.value = rc.kind || 'cdi';

        set('asset-rate-percent', rc.percent);
        set('asset-rate-fixed', rc.fixedRate);
        set('asset-rate-ipca', rc.ipcaSpread);

        updateManualRateVisibility();
        updateRateKindFields();
    }

    function updateManualRateVisibility() {
        const typeSel = document.getElementById('asset-type');
        const group = document.getElementById('asset-rate-group');
        if (!typeSel || !group) return;

        const type = typeSel.value;
        const isFixedIncome = (type === 'cdb' || type === 'lci' || type === 'cofrinho' || type === 'tesouro');

        group.style.display = isFixedIncome ? '' : 'none';

        if (isFixedIncome) {
            const kindSel = document.getElementById('asset-rate-kind');
            if (kindSel && type === 'tesouro' && kindSel.value === 'cdi') {
                kindSel.value = 'selic';
            }
            updateRateKindFields();
        }
    }

    function updateRateKindFields() {
        const kindSel = document.getElementById('asset-rate-kind');
        const percentGroup = document.getElementById('asset-rate-percent-group');
        const fixedGroup = document.getElementById('asset-rate-fixed-group');
        const ipcaGroup = document.getElementById('asset-rate-ipca-group');

        if (!kindSel) return;
        const kind = kindSel.value;

        if (percentGroup) percentGroup.style.display = (kind === 'cdi' || kind === 'selic') ? '' : 'none';
        if (fixedGroup)   fixedGroup.style.display   = (kind === 'prefixado') ? '' : 'none';
        if (ipcaGroup)    ipcaGroup.style.display    = (kind === 'ipca') ? '' : 'none';
    }

    function saveAssetFromForm() {
        const codeEl = document.getElementById('asset-code');
        const nameEl = document.getElementById('asset-name');
        const ownerEl = document.getElementById('asset-owner');
        const typeEl = document.getElementById('asset-type');
        const institutionEl = document.getElementById('asset-institution');
        const currencyEl = document.getElementById('asset-currency');
        const notesEl = document.getElementById('asset-notes');
        const rateKindEl = document.getElementById('asset-rate-kind');
        const ratePercentEl = document.getElementById('asset-rate-percent');
        const rateFixedEl = document.getElementById('asset-rate-fixed');
        const rateIpcaEl = document.getElementById('asset-rate-ipca');

        if (!codeEl || !nameEl || !ownerEl || !typeEl) return;

        const code = codeEl.value.trim().toUpperCase();
        const name = nameEl.value.trim();
        const ownerId = ownerEl.value;
        const type = typeEl.value;
        const institution = institutionEl ? institutionEl.value.trim() : '';
        const currency = currencyEl ? currencyEl.value : (ASSET_TYPES[type] ? ASSET_TYPES[type].currency : 'BRL');
        const notes = notesEl ? notesEl.value.trim() : '';

        if (!code || !name || !ownerId) {
            notify('Preencha os campos obrigatórios.', 'error');
            return;
        }

        let rateConfig = null;
        const isFixedIncome = (type === 'cdb' || type === 'lci' || type === 'cofrinho' || type === 'tesouro');
        if (isFixedIncome && rateKindEl) {
            const kind = rateKindEl.value;
            rateConfig = { kind, percent: null, fixedRate: null, ipcaSpread: null };

            if (kind === 'cdi' || kind === 'selic') {
                const v = parseFloat(ratePercentEl && ratePercentEl.value);
                if (!isNaN(v) && v > 0) rateConfig.percent = v;
            } else if (kind === 'prefixado') {
                const v = parseFloat(rateFixedEl && rateFixedEl.value);
                if (!isNaN(v) && v > 0) rateConfig.fixedRate = v;
            } else if (kind === 'ipca') {
                const v = parseFloat(rateIpcaEl && rateIpcaEl.value);
                if (!isNaN(v) && v >= 0) rateConfig.ipcaSpread = v;
            }
        }

        const assets = getAssets();

        const duplicate = assets.find(a =>
            a.code === code && a.ownerId === ownerId &&
            (!editingAssetId || a.id !== editingAssetId)
        );
        if (duplicate) {
            notify('Já existe um ativo com este código para este titular.', 'error');
            return;
        }

        if (editingAssetId) {
            const idx = assets.findIndex(a => a.id === editingAssetId);
            if (idx >= 0) {
                assets[idx] = {
                    ...assets[idx],
                    code, name, ownerId, type,
                    institution, currency, notes,
                    rateConfig
                };
            }
        } else {
            assets.push({
                id: generateId(),
                code, name, ownerId, type,
                institution, currency, notes,
                rateConfig,
                createdAt: Date.now()
            });
        }

        saveAssets(assets);
        closeAssetModal();
        renderAll();
        notify(editingAssetId ? 'Ativo atualizado.' : 'Ativo cadastrado.', 'success');
    }

    function deleteAsset(assetId) {
        const asset = getAssets().find(a => a.id === assetId);
        if (!asset) return;
        const txs = getInvestmentTxs().filter(t => t.assetId === assetId);
        const msg = txs.length > 0
            ? `Excluir "${asset.name}" e todas as ${txs.length} movimentações vinculadas?`
            : `Excluir o ativo "${asset.name}"?`;
        if (!confirm(msg)) return;

        const assets = getAssets().filter(a => a.id !== assetId);
        saveAssets(assets);

        const remainingTxs = getInvestmentTxs().filter(t => t.assetId !== assetId);
        saveInvestmentTxs(remainingTxs);

        if (selectedAssetId === assetId) closeAssetDetail();
        renderAll();
        notify('Ativo excluído.', 'success');
    }

    // ========== MODAL DE MOVIMENTAÇÃO ==========

    let txModalAssetId = null;
    let txModalType = 'aporte';

    function openTxModal(assetId, type) {
        const asset = getAssets().find(a => a.id === assetId);
        if (!asset) return;

        txModalAssetId = assetId;
        txModalType = type === 'resgate' ? 'resgate' : 'aporte';

        const modal = document.getElementById('txModal');
        const titleEl = document.getElementById('txModalTitle');
        const subtitleEl = document.getElementById('txModalSubtitle');
        if (!modal) return;

        if (titleEl) {
            titleEl.textContent = (txModalType === 'aporte' ? 'Novo Aporte' : 'Novo Resgate');
        }
        if (subtitleEl) {
            subtitleEl.innerHTML = `<strong>${escapeHtmlText(asset.name)}</strong> (${escapeHtmlText(asset.code)})`;
        }

        const typeSel = document.getElementById('tx-type');
        if (typeSel) typeSel.value = txModalType;

        const dateEl = document.getElementById('tx-date');
        if (dateEl) dateEl.value = formatDateToString(new Date());

        const qtyEl = document.getElementById('tx-quantity');
        const priceEl = document.getElementById('tx-unit-price');
        const totalEl = document.getElementById('tx-total');
        const notesEl = document.getElementById('tx-notes');
        if (qtyEl) qtyEl.value = '';
        if (priceEl) priceEl.value = '';
        if (totalEl) totalEl.value = '';
        if (notesEl) notesEl.value = '';

        const price = getCurrentPrice(asset);
        if (price !== null && priceEl) priceEl.value = price.toFixed(4);

        recalcTxTotal();

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeTxModal() {
        const modal = document.getElementById('txModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = '';
        txModalAssetId = null;
    }

    function recalcTxTotal() {
        const qtyEl = document.getElementById('tx-quantity');
        const priceEl = document.getElementById('tx-unit-price');
        const totalEl = document.getElementById('tx-total');
        if (!qtyEl || !priceEl || !totalEl) return;
        const q = parseFloat(qtyEl.value) || 0;
        const p = parseFloat(priceEl.value) || 0;
        totalEl.value = (q * p).toFixed(2);
    }

    function saveTxFromForm() {
        const asset = getAssets().find(a => a.id === txModalAssetId);
        if (!asset) {
            notify('Ativo não encontrado.', 'error');
            return;
        }

        const dateEl = document.getElementById('tx-date');
        const typeEl = document.getElementById('tx-type');
        const qtyEl = document.getElementById('tx-quantity');
        const priceEl = document.getElementById('tx-unit-price');
        const notesEl = document.getElementById('tx-notes');

        if (!dateEl || !typeEl || !qtyEl || !priceEl) return;

        const dateStr = dateEl.value;
        const date = createDateFromString(dateStr);
        const type = typeEl.value;
        const qty = parseFloat(qtyEl.value);
        const price = parseFloat(priceEl.value);
        const notes = notesEl ? notesEl.value.trim() : '';

        if (!date) {
            notify('Data inválida.', 'error');
            return;
        }
        if (!(qty > 0)) {
            notify('Quantidade deve ser maior que zero.', 'error');
            return;
        }
        if (!(price >= 0)) {
            notify('Preço unitário inválido.', 'error');
            return;
        }

        if (type === 'resgate') {
            const agg = computeAssetAggregates(asset.id);
            if (qty > agg.quantity + 1e-9) {
                notify(`Você só possui ${fmtQty(agg.quantity)} unidades deste ativo.`, 'error');
                return;
            }
        }

        const total = qty * price;

        const txs = getInvestmentTxs();
        txs.push({
            id: generateId(),
            assetId: asset.id,
            ownerId: asset.ownerId,
            date: formatDateToDisplay(date),
            timestamp: date.getTime(),
            type,
            quantity: qty,
            unitPrice: price,
            total,
            notes
        });
        saveInvestmentTxs(txs);

        closeTxModal();
        renderAll();
        if (selectedAssetId === asset.id) {
            openAssetDetail(asset.id);
        }
        notify(type === 'aporte' ? 'Aporte registrado.' : 'Resgate registrado.', 'success');
    }

    function deleteInvestmentTx(txId) {
        const txs = getInvestmentTxs();
        const tx = txs.find(t => t.id === txId);
        if (!tx) return;
        if (!confirm('Excluir esta movimentação?')) return;

        const filtered = txs.filter(t => t.id !== txId);
        saveInvestmentTxs(filtered);

        renderAll();
        if (selectedAssetId === tx.assetId) {
            openAssetDetail(tx.assetId);
        }
        notify('Movimentação excluída.', 'success');
    }

    // ========== RENDERIZAÇÃO GERAL ==========

    function renderAll() {
        refreshOwnerFilter();
        renderOwnerSubtotals();
        renderInvestmentsTable();
        if (selectedAssetId) {
            openAssetDetail(selectedAssetId);
        }
    }

    // ========== LISTENERS DO NÚCLEO ==========

    function setupCoreListeners() {
        const filterSel = document.getElementById('investments-owner-filter');
        if (filterSel) {
            filterSel.addEventListener('change', () => {
                ownerFilter = filterSel.value;
                localStorage.setItem(STORAGE_KEYS.OWNER_FILTER, ownerFilter);
                renderAll();
            });
        }

        const newAssetBtn = document.getElementById('investments-new-asset');
        if (newAssetBtn) {
            newAssetBtn.addEventListener('click', () => openAssetModal(null));
        }

        document.querySelectorAll('.investments-table thead th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.getAttribute('data-sort');
                if (!field) return;
                if (sortField === field) {
                    sortDir = (sortDir === 'asc') ? 'desc' : 'asc';
                } else {
                    sortField = field;
                    sortDir = 'asc';
                }
                localStorage.setItem(STORAGE_KEYS.SORT_FIELD, sortField);
                localStorage.setItem(STORAGE_KEYS.SORT_DIR, sortDir);
                renderInvestmentsTable();
            });
        });

        const tbody = document.getElementById('investments-table-body');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                if (e.target.closest('button')) {
                    const btn = e.target.closest('button');
                    const action = btn.getAttribute('data-action');
                    const assetId = btn.getAttribute('data-asset-id');
                    if (action === 'aporte' && assetId) {
                        e.stopPropagation();
                        openTxModal(assetId, 'aporte');
                        return;
                    }
                }
                const tr = e.target.closest('tr[data-asset-id]');
                if (!tr) return;
                openAssetDetail(tr.getAttribute('data-asset-id'));
            });
        }

        const typeSel = document.getElementById('asset-type');
        if (typeSel) typeSel.addEventListener('change', updateManualRateVisibility);

        const rateKindSel = document.getElementById('asset-rate-kind');
        if (rateKindSel) rateKindSel.addEventListener('change', updateRateKindFields);

        const assetCancel = document.getElementById('asset-form-cancel');
        if (assetCancel) assetCancel.addEventListener('click', closeAssetModal);

        const assetForm = document.getElementById('asset-form');
        if (assetForm) {
            assetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveAssetFromForm();
            });
        }

        const txCancel = document.getElementById('tx-form-cancel');
        if (txCancel) txCancel.addEventListener('click', closeTxModal);

        const txForm = document.getElementById('tx-form');
        if (txForm) {
            txForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveTxFromForm();
            });
        }

        const qtyEl = document.getElementById('tx-quantity');
        const priceEl = document.getElementById('tx-unit-price');
        if (qtyEl) qtyEl.addEventListener('input', recalcTxTotal);
        if (priceEl) priceEl.addEventListener('input', recalcTxTotal);

        const detailClose = document.getElementById('asset-detail-close');
        if (detailClose) detailClose.addEventListener('click', closeAssetDetail);

        const addAporteBtn = document.getElementById('asset-add-aporte');
        if (addAporteBtn) {
            addAporteBtn.addEventListener('click', () => {
                if (selectedAssetId) openTxModal(selectedAssetId, 'aporte');
            });
        }

        const addResgateBtn = document.getElementById('asset-add-resgate');
        if (addResgateBtn) {
            addResgateBtn.addEventListener('click', () => {
                if (selectedAssetId) openTxModal(selectedAssetId, 'resgate');
            });
        }

        const editBtn = document.getElementById('asset-edit');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (selectedAssetId) openAssetModal(selectedAssetId);
            });
        }

        const deleteBtn = document.getElementById('asset-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (selectedAssetId) deleteAsset(selectedAssetId);
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const assetModal = document.getElementById('assetModal');
                const txModal = document.getElementById('txModal');
                if (assetModal && assetModal.classList.contains('show')) closeAssetModal();
                if (txModal && txModal.classList.contains('show')) closeTxModal();
            }
        });
    }

    // ========== API PÚBLICA ==========

    window.Investimentos = {
        getAssets,
        getInvestmentTxs,
        getQuotesCache,
        saveQuotesCache,
        computeAssetAggregates,
        computeAssetValuation,
        renderAll,
        refreshOwnerFilter,
        _openAssetModal: openAssetModal,
        _openTxModal: openTxModal
    };

    // ============================================================
    // COTAÇÕES (brapi, BCB, USD)
    // ============================================================

    const BRAPI_BASE = 'https://brapi.dev/api';
    let usdBrlRate = null;

    async function callBrapi(path) {
        const key = (window.Configuracoes && window.Configuracoes.getBrapiKey)
            ? window.Configuracoes.getBrapiKey()
            : '';

        const url = key
            ? `${BRAPI_BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(key)}`
            : `${BRAPI_BASE}${path}`;

        if (window.Configuracoes && typeof window.Configuracoes.incrementApiUsage === 'function') {
            window.Configuracoes.incrementApiUsage(1);
        }

        const resp = await fetch(url);
        if (!resp.ok) {
            const err = new Error(`HTTP ${resp.status}`);
            err.status = resp.status;
            throw err;
        }
        return resp.json();
    }

    async function fetchQuoteForAsset(asset) {
        if (!asset || !asset.code) return null;

        const type = asset.type;
        if (type === 'cdb' || type === 'cofrinho' || type === 'acao_eua' || type === 'lci') {
            return null;
        }

        if (type === 'acao' || type === 'fii') {
            const data = await callBrapi(`/quote/${encodeURIComponent(asset.code)}`);
            if (data && Array.isArray(data.results) && data.results.length > 0) {
                const r = data.results[0];
                const price = Number(r.regularMarketPrice);
                if (Number.isFinite(price) && price > 0) {
                    return { price, currency: r.currency || 'BRL', source: 'brapi' };
                }
            }
            return null;
        }

        if (type === 'tesouro') {
            try {
                const data = await callBrapi(`/v2/treasury/bond/${encodeURIComponent(asset.code)}`);
                const bond = (data && data.bond) ? data.bond : (data && data.result ? data.result : data);
                const candidates = [
                    bond && bond.price,
                    bond && bond.unitPrice,
                    bond && bond.lastPrice,
                    bond && bond.value
                ];
                const price = candidates.map(Number).find(n => Number.isFinite(n) && n > 0);
                if (price) return { price, currency: 'BRL', source: 'brapi' };
            } catch (_) { /* ignore */ }
            return null;
        }

        return null;
    }

    async function refreshAllQuotes() {
        const assets = getAssets();
        if (assets.length === 0) {
            notify('Nenhum ativo para atualizar.', 'error');
            return { updated: 0, failed: 0, skipped: 0 };
        }

        const btn = document.getElementById('investments-refresh-quotes');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
        }

        const cache = getQuotesCache();
        let updated = 0, failed = 0, skipped = 0;

        for (const asset of assets) {
            try {
                const quote = await fetchQuoteForAsset(asset);
                if (quote) {
                    cache[asset.code] = {
                        price: quote.price,
                        currency: quote.currency || 'BRL',
                        source: quote.source,
                        at: Date.now(),
                        ok: true
                    };
                    updated++;
                } else {
                    skipped++;
                }
            } catch (err) {
                console.warn(`[investimentos.js] Falha ao atualizar ${asset.code}:`, err);
                if (cache[asset.code]) {
                    cache[asset.code].ok = false;
                    cache[asset.code].error = err.message || 'erro';
                }
                failed++;
            }
        }

        saveQuotesCache(cache);
        saveDailySnapshot();
        renderAll();
        renderInvestmentCharts();

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar cotações';
        }

        const parts = [];
        if (updated > 0) parts.push(`${updated} atualizado(s)`);
        if (failed > 0) parts.push(`${failed} com erro`);
        if (skipped > 0) parts.push(`${skipped} sem cotação (manual)`);
        notify(parts.length ? `Cotações: ${parts.join(', ')}.` : 'Nada a atualizar.', updated > 0 ? 'success' : 'error');

        return { updated, failed, skipped };
    }

    // ========== SNAPSHOTS ==========

    function saveDailySnapshot() {
        try {
            const history = getQuotesHistory();
            const today = formatDateToString(new Date());

            const byOwner = {};
            const byClass = {};

            getAssets().forEach(asset => {
                const v = computeAssetValuation(asset);
                byOwner[asset.ownerId] = (byOwner[asset.ownerId] || 0) + v.currentValue;
                byClass[asset.type] = (byClass[asset.type] || 0) + v.currentValue;
            });

            history[today] = { byOwner, byClass, at: Date.now() };
            saveQuotesHistory(history);
        } catch (err) {
            console.warn('[investimentos.js] Falha ao salvar snapshot:', err);
        }
    }

    // ========== GRÁFICOS ==========

    let chartOwnerPie = null;
    let chartTypeComposition = null;
    let chartPatrimony = null;

    function isDarkMode() {
        return document.body.classList.contains('dark-mode');
    }

    function renderInvestmentCharts() {
        renderOwnerPieChart();
        renderTypeCompositionChart();
        renderPatrimonyEvolutionChart();
    }

    function renderOwnerPieChart() {
        const canvas = document.getElementById('owner-pie-chart');
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');
        const dark = isDarkMode();
        const textColor = dark ? '#e8eaed' : '#2c3e50';

        const owners = getOwners();
        const totals = {};
        getAssets().forEach(asset => {
            const v = computeAssetValuation(asset);
            totals[asset.ownerId] = (totals[asset.ownerId] || 0) + v.currentValue;
        });

        const labels = [];
        const data = [];
        const colors = [];
        owners.forEach(o => {
            const value = totals[o.id] || 0;
            if (value > 0) {
                labels.push(o.name);
                data.push(value);
                colors.push(o.color || '#3498db');
            }
        });

        if (chartOwnerPie) chartOwnerPie.destroy();

        if (data.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = dark ? '#a0a4ab' : '#7f8c8d';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', ctx.canvas.width / 2, ctx.canvas.height / 2);
            chartOwnerPie = null;
            return;
        }

        chartOwnerPie = new Chart(ctx, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: dark ? '#242830' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const total = item.dataset.data.reduce((s, v) => s + v, 0);
                                const pct = total > 0 ? (item.parsed / total) * 100 : 0;
                                return `${item.label}: ${fmtBRL(item.parsed)} (${pct.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderTypeCompositionChart() {
        const canvas = document.getElementById('type-composition-chart');
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');
        const dark = isDarkMode();
        const textColor = dark ? '#e8eaed' : '#2c3e50';

        const ownerFiltered = getAssets().filter(a =>
            ownerFilter === '__all__' ? true : a.ownerId === ownerFilter
        );

        const totals = {};
        ownerFiltered.forEach(asset => {
            const v = computeAssetValuation(asset);
            totals[asset.type] = (totals[asset.type] || 0) + v.currentValue;
        });

        const palette = {
            acao: '#3498db',
            fii: '#9b59b6',
            tesouro: '#27ae60',
            cdb: '#e67e22',
            lci: '#16a085',
            cofrinho: '#f1c40f',
            acao_eua: '#e74c3c'
        };

        const labels = [];
        const data = [];
        const colors = [];
        Object.entries(totals).forEach(([type, value]) => {
            if (value > 0) {
                labels.push(getTypeLabel(type));
                data.push(value);
                colors.push(palette[type] || '#95a5a6');
            }
        });

        if (chartTypeComposition) chartTypeComposition.destroy();

        if (data.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = dark ? '#a0a4ab' : '#7f8c8d';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados para exibir', ctx.canvas.width / 2, ctx.canvas.height / 2);
            chartTypeComposition = null;
            return;
        }

        chartTypeComposition = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: dark ? '#242830' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const total = item.dataset.data.reduce((s, v) => s + v, 0);
                                const pct = total > 0 ? (item.parsed / total) * 100 : 0;
                                return `${item.label}: ${fmtBRL(item.parsed)} (${pct.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    let evolutionMode = 'owner';
    let evolutionClassOwnerId = null;

    function renderPatrimonyEvolutionChart() {
        const canvas = document.getElementById('patrimony-evolution-chart');
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');
        const dark = isDarkMode();
        const textColor = dark ? '#e8eaed' : '#2c3e50';
        const gridColor = dark ? '#3a3f47' : '#eeeeee';

        const history = getQuotesHistory();
        const dates = Object.keys(history).sort();

        if (dates.length === 0) {
            if (chartPatrimony) chartPatrimony.destroy();
            chartPatrimony = null;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '14px Arial';
            ctx.fillStyle = dark ? '#a0a4ab' : '#7f8c8d';
            ctx.textAlign = 'center';
            ctx.fillText('Sem histórico ainda. Atualize as cotações para começar a registrar.', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const labels = dates.map(d => {
            const [y, m, dd] = d.split('-');
            return `${dd}/${m}`;
        });

        const datasets = [];

        if (evolutionMode === 'owner' || !evolutionClassOwnerId) {
            const owners = getOwners();
            const ownerColors = {};
            owners.forEach(o => ownerColors[o.id] = o.color || '#3498db');

            owners.forEach(owner => {
                const data = dates.map(d => {
                    const snap = history[d];
                    return (snap && snap.byOwner && snap.byOwner[owner.id]) || 0;
                });
                if (data.some(v => v > 0)) {
                    datasets.push({
                        label: owner.name,
                        data,
                        borderColor: ownerColors[owner.id],
                        backgroundColor: ownerColors[owner.id] + '33',
                        tension: 0.25,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        borderWidth: 2
                    });
                }
            });
        } else {
            const palette = {
                acao: '#3498db',
                fii: '#9b59b6',
                tesouro: '#27ae60',
                cdb: '#e67e22',
                lci: '#16a085',
                cofrinho: '#f1c40f',
                acao_eua: '#e74c3c'
            };
            Object.keys(ASSET_TYPES).forEach(type => {
                const data = dates.map(d => {
                    const snap = history[d];
                    return (snap && snap.byClass && snap.byClass[type]) || 0;
                });
                if (data.some(v => v > 0)) {
                    datasets.push({
                        label: getTypeLabel(type),
                        data,
                        borderColor: palette[type] || '#95a5a6',
                        backgroundColor: (palette[type] || '#95a5a6') + '33',
                        tension: 0.25,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        borderWidth: 2
                    });
                }
            });
        }

        if (chartPatrimony) chartPatrimony.destroy();

        chartPatrimony = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor, maxRotation: 0, autoSkipPadding: 12 },
                        grid: { color: gridColor }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor },
                        onClick: (e, legendItem, legend) => {
                            const chart = legend.chart;
                            const idx = legendItem.datasetIndex;
                            const label = chart.data.datasets[idx].label;

                            if (evolutionMode === 'owner') {
                                const owners = getOwners();
                                const owner = owners.find(o => o.name === label);
                                if (owner) {
                                    evolutionMode = 'class';
                                    evolutionClassOwnerId = owner.id;
                                    renderPatrimonyEvolutionChart();
                                    return;
                                }
                            } else {
                                evolutionMode = 'owner';
                                evolutionClassOwnerId = null;
                                renderPatrimonyEvolutionChart();
                                return;
                            }

                            const meta = chart.getDatasetMeta(idx);
                            meta.hidden = meta.hidden === null ? !chart.data.datasets[idx].hidden : null;
                            chart.update();
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => `${item.dataset.label}: ${fmtBRL(item.parsed.y)}`
                        }
                    }
                }
            }
        });
    }

    // ============================================================
    // ETAPA 2.2.a — ÍNDICES DO BANCO CENTRAL (CDI, Selic, IPCA)
    // Fetch, cache e cálculo da correção para renda fixa.
    // ============================================================

    const BCB_CACHE_KEY = 'bcbCache';
    const BCB_START_DATE = '01/04/2022'; // início do histórico guardado

    // Série SGS do BCB:
    //   11  = Selic diária (% ao dia)
    //   12  = CDI diário (% ao dia)
    //   433 = IPCA mensal (% ao mês)
    const BCB_SERIES = {
        selic: 11,
        cdi:   12,
        ipca:  433
    };

    /**
     * Formata Date para "DD/MM/AAAA" (formato esperado pelo BCB).
     */
    function formatDateForBcb(d) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    /**
     * Lê o cache do BCB do localStorage.
     */
    function getBcbCache() {
        try {
            const raw = localStorage.getItem(BCB_CACHE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (_) { return {}; }
    }

    function saveBcbCache(cache) {
        localStorage.setItem(BCB_CACHE_KEY, JSON.stringify(cache));
    }

    /**
     * Busca uma série do BCB.
     * Retorna um array de { data: 'DD/MM/AAAA', valor: number } ou [] se falhar.
     * O valor retornado é em % (ex: 0.0523 = 0.0523% ao dia).
     */
    async function fetchBcbSerie(serieCode) {
        //const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados?formato=json&dataInicial=${BCB_START_DATE}`;
       const urlOriginal = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieCode}/dados?formato=json&dataInicial=${BCB_START_DATE}`;
       const url = `https://corsproxy.io/?${encodeURIComponent(urlOriginal)}`;
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (!Array.isArray(data)) return [];
            return data
                .map(item => ({
                    data: item.data,
                    valor: parseFloat(String(item.valor).replace(',', '.'))
                }))
                .filter(item => item.data && Number.isFinite(item.valor));
        } catch (err) {
            console.warn(`[investimentos.js] Falha ao buscar série ${serieCode}:`, err);
            return [];
        }
    }

    /**
     * Garante que o cache de uma série está atualizado (24h de validade).
     * Retorna o array de { data, valor } do cache.
     */
    async function ensureBcbSerie(kind) {
        const serieCode = BCB_SERIES[kind];
        if (!serieCode) return [];

        const cache = getBcbCache();
        const entry = cache[kind];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (entry && Array.isArray(entry.values) && (now - entry.at) < oneDayMs) {
            return entry.values;
        }

        // Busca
        const values = await fetchBcbSerie(serieCode);
        if (values.length > 0) {
            cache[kind] = { at: now, values };
            saveBcbCache(cache);
        }
        return values;
    }

    /**
     * Retorna a taxa diária de CDI (em decimal, ex: 0.000523 = 0.0523%/dia).
     * Se a data exata não existir na série, usa o último valor anterior.
     * Retorna null se não houver dados.
     */
    function getCdiDaily(date) {
        return getRateForDate('cdi', date);
    }

    function getSelicDaily(date) {
        return getRateForDate('selic', date);
    }

    /**
     * Retorna o IPCA do mês/ano (em decimal, ex: 0.005 = 0,5% no mês).
     * Retorna null se não houver dado.
     */
    function getIpcaMonthly(year, month) {
        const cache = getBcbCache();
        const entry = cache.ipca;
        if (!entry || !Array.isArray(entry.values)) return null;

        // IPCA é mensal. A série traz "01/MM/AAAA".
        const target = `01/${String(month + 1).padStart(2, '0')}/${year}`;
        const found = entry.values.find(v => v.data === target);
        return found ? found.valor / 100 : null;
    }

    /**
     * Helper: pega a taxa de uma série diária para uma data específica.
     * Usa o último valor da série <= data (ignora fins de semana/feriados).
     */
    function getRateForDate(kind, date) {
        const cache = getBcbCache();
        const entry = cache[kind];
        if (!entry || !Array.isArray(entry.values)) return null;

        const targetTs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

        // Série está em ordem crescente por data. Itera de trás para frente.
        for (let i = entry.values.length - 1; i >= 0; i--) {
            const v = entry.values[i];
            const [dd, mm, yyyy] = v.data.split('/').map(Number);
            const ts = new Date(yyyy, mm - 1, dd).getTime();
            if (ts <= targetTs) {
                return v.valor / 100; // 0.0523 → 0.000523
            }
        }
        return null;
    }

    /**
     * Conta dias úteis (aprox., sem considerar feriados) entre duas datas.
     */
    function countBusinessDays(fromDate, toDate) {
        let count = 0;
        const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        while (d < end) {
            d.setDate(d.getDate() + 1);
            const dow = d.getDay();
            if (dow !== 0 && dow !== 6) count++;
        }
        return count;
    }

    /**
     * Conta dias corridos entre duas datas.
     */
    function countCalendarDays(fromDate, toDate) {
        const a = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const b = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
        return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)));
    }

    /**
     * Aplica a correção de uma movimentação de renda fixa desde a data
     * do aporte até hoje.
     *
     * Parâmetros:
     *   tx         — a movimentação (com timestamp, total, type)
     *   rateConfig — { kind, percent, fixedRate, ipcaSpread }
     *   today      — Date de referência (hoje)
     *
     * Retorna:
     *   { valorOriginal, valorCorrigido, diasCorridos, diasUteis, valorBrutoAjustado }
     *   ou null se não houver dados suficientes para calcular.
     */
    function computeFixedIncomeReturnForTx(tx, rateConfig, today) {
        if (!rateConfig || !rateConfig.kind) return null;

        const startDate = new Date(tx.timestamp);
        const kind = rateConfig.kind;

        // Valor original (o que foi efetivamente pago/recebido)
        const valorOriginal = Number(tx.total) || 0;
        if (valorOriginal <= 0) return null;

        const diasCorridos = countCalendarDays(startDate, today);
        const diasUteis = countBusinessDays(startDate, today);

        let fator = 1; // multiplicador total

        if (kind === 'cdi' || kind === 'selic') {
            const percent = Number(rateConfig.percent) || 100;
            // Para cada dia útil, aplica a taxa do dia
            // Para simplificar, usa a taxa média diária do período (pega a taxa de hoje)
            // (evita varrer 620 dias × N aportes)
            const dailyRate = (kind === 'cdi')
                ? getCdiDaily(today)
                : getSelicDaily(today);
            if (dailyRate === null) return null;
            const adjusted = dailyRate * (percent / 100);
            fator = Math.pow(1 + adjusted, diasUteis);
        } else if (kind === 'prefixado') {
            const taxaAnual = Number(rateConfig.fixedRate) || 0;
            if (taxaAnual <= 0) return null;
            // Converte anual (252 dias úteis) para diária e compõe
            const dailyRate = Math.pow(1 + taxaAnual / 100, 1 / 252) - 1;
            fator = Math.pow(1 + dailyRate, diasUteis);
        } else if (kind === 'ipca') {
            const spreadAnual = Number(rateConfig.ipcaSpread) || 0;
            // Aplica IPCA mês a mês + spread diário
            // Simplificação: pega o IPCA acumulado dos últimos 12 meses e aplica proporcional
            const ipcaAcumulado = getIpcaAcumulado12m(today);
            const ipcaFator = (ipcaAcumulado !== null)
                ? Math.pow(1 + ipcaAcumulado, diasCorridos / 365)
                : 1;
            const dailySpread = Math.pow(1 + spreadAnual / 100, 1 / 365) - 1;
            fator = ipcaFator * Math.pow(1 + dailySpread, diasCorridos);
        } else {
            return null;
        }

        const valorCorrigido = valorOriginal * fator;

        return {
            valorOriginal,
            valorCorrigido,
            diasCorridos,
            diasUteis,
            fator
        };
    }

    /**
     * Retorna o IPCA acumulado dos últimos 12 meses (em decimal).
     * Ex: 0.045 = 4,5% acumulado.
     */
    function getIpcaAcumulado12m(today) {
        const cache = getBcbCache();
        const entry = cache.ipca;
        if (!entry || !Array.isArray(entry.values)) return null;

        // Percorre os últimos 12 meses
        let fator = 1;
        let found = 0;
        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const target = `01/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            const foundItem = entry.values.find(v => v.data === target);
            if (foundItem) {
                fator *= (1 + foundItem.valor / 100);
                found++;
            }
        }
        return found > 0 ? fator - 1 : null;
    }

    /**
     * Calcula a alíquota de IR regressivo com base no prazo (em dias corridos).
     */
    function getIrAliquota(diasCorridos) {
        if (diasCorridos <= 180) return 0.225;
        if (diasCorridos <= 360) return 0.20;
        if (diasCorridos <= 720) return 0.175;
        return 0.15;
    }

    /**
     * Para um ativo de renda fixa, calcula o valor atual bruto e líquido
     * considerando todas as movimentações.
     *
     * Retorna:
     *   {
     *     valorBrutoTotal,    // soma dos aportes corrigidos − resgates
     *     valorLiquidoTotal,  // igual, mas com IR descontado sobre o rendimento
     *     invested,           // soma dos aportes − resgates (custo)
     *     irTotal,            // IR estimado se resgatar hoje
     *     txsDetalhadas       // array com o detalhe de cada movimentação
     *   }
     */
    function computeFixedIncomeValuation(asset) {
        const txs = getInvestmentTxs().filter(t => t.assetId === asset.id);
        const rateConfig = asset.rateConfig;
        const today = new Date();

        if (!rateConfig || !rateConfig.kind || txs.length === 0) {
            return null;
        }

        // LCI é isenta de IR
        const isentoIr = (asset.type === 'lci');

        let valorBrutoTotal = 0;
        let valorLiquidoTotal = 0;
        let invested = 0;
        let irTotal = 0;
        const txsDetalhadas = [];

        for (const tx of txs) {
            const calc = computeFixedIncomeReturnForTx(tx, rateConfig, today);
            if (!calc) continue;

            const sinal = (tx.type === 'aporte') ? 1 : -1;

            const rendimento = calc.valorCorrigido - calc.valorOriginal;
            const aliquota = isentoIr ? 0 : getIrAliquota(calc.diasCorridos);
            const ir = rendimento * aliquota;
            const valorLiquidoTx = calc.valorCorrigido - ir;

            valorBrutoTotal += sinal * calc.valorCorrigido;
            valorLiquidoTotal += sinal * valorLiquidoTx;
            invested += sinal * calc.valorOriginal;
            irTotal += sinal * ir;

            txsDetalhadas.push({
                tx,
                ...calc,
                aliquota,
                ir,
                valorLiquidoTx
            });
        }

        return {
            valorBrutoTotal,
            valorLiquidoTotal,
            invested,
            irTotal,
            txsDetalhadas
        };
    }

    /**
     * Pré-carrega todas as séries do BCB (CDI, Selic, IPCA).
     * Chamada no init para garantir que o cálculo funcione.
     */
    async function preloadBcbSeries() {
        try {
            await Promise.all([
                ensureBcbSerie('cdi'),
                ensureBcbSerie('selic'),
                ensureBcbSerie('ipca')
            ]);
        } catch (err) {
            console.warn('[investimentos.js] Falha ao pré-carregar séries do BCB:', err);
        }
    }

   
    // ========== LISTENERS DE INTEGRAÇÃO ==========

    function setupIntegrationListeners() {
        const refreshBtn = document.getElementById('investments-refresh-quotes');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await refreshAllQuotes();
            });
        }
    }

    // ========== INICIALIZAÇÃO ==========

    function initInvestimentos() {
        setupCoreListeners();
        setupIntegrationListeners();
        renderAll();
        saveDailySnapshot();
        // Pré-carrega séries do BCB em background (não bloqueia a UI)
        preloadBcbSeries().then(() => {
            // Quando as séries estiverem prontas, re-renderiza para refletir
            // os valores corrigidos de CDB/LCI/Cofrinho/Tesouro
            renderAll();
        });
    }

    const observer = new MutationObserver(() => {
        const investmentsTab = document.getElementById('investments-tab');
        if (investmentsTab && investmentsTab.classList.contains('active')) {
            renderInvestmentCharts();
        }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    document.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab[data-tab="investments"]');
        if (!tab) return;
        setTimeout(() => {
            renderAll();
            renderInvestmentCharts();
        }, 60);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInvestimentos);
    } else {
        initInvestimentos();
    }

})();
// ============================================================
// FIM DO ARQUIVO INVESTIMENTOS.JS
// ============================================================
