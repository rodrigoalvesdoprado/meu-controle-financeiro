/* ============================================================
   CONFIGURACOES.JS
   - Painel de Configurações (abre/fecha pela engrenagem)
   - Chave da API brapi.dev (input, testar, salvar, limpar)
   - Contador de uso da API (badge + barra + números)
   - Gerenciamento de Titulares (owners)
   - Delegação dos botões de backup para window.Backup
   ============================================================ */

(function () {
    'use strict';

    // ========== CONSTANTES ==========

    const BRAPI_KEY_STORAGE = 'brapiKey';
    const API_USAGE_STORAGE = 'apiUsage';
    const API_LIMIT_DEFAULT = 15000;

    const DEFAULT_OWNERS = [
        { id: 'rodrigo',     name: 'Rodrigo',     color: '#3498db', isDefault: true  },
        { id: 'catarse',     name: 'Catarse',     color: '#9b59b6', isDefault: false },
        { id: 'guitarrista', name: 'Guitarrista', color: '#e67e22', isDefault: false }
    ];

    // ========== UTILITÁRIOS ==========

    function escapeHtmlText(str) {
        if (!str) return '';
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

    function currentMonthKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function daysUntilNextMonth() {
        const today = new Date();
        const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
        return diff;
    }

    // ========== USO DA API ==========

    /**
     * Lê o estado atual do contador do localStorage.
     * Se o mês armazenado for diferente do mês atual, reinicia.
     */
    function getApiUsage() {
        let usage = null;
        try {
            const raw = localStorage.getItem(API_USAGE_STORAGE);
            if (raw) usage = JSON.parse(raw);
        } catch (_) { usage = null; }

        const monthKey = currentMonthKey();

        if (!usage || typeof usage !== 'object' || usage.month !== monthKey) {
            usage = {
                month: monthKey,
                count: 0,
                limit: (usage && usage.limit) || API_LIMIT_DEFAULT
            };
            saveApiUsage(usage);
        } else {
            // Garante campos obrigatórios
            if (typeof usage.count !== 'number') usage.count = 0;
            if (typeof usage.limit !== 'number') usage.limit = API_LIMIT_DEFAULT;
        }
        return usage;
    }

    function saveApiUsage(usage) {
        localStorage.setItem(API_USAGE_STORAGE, JSON.stringify(usage));
    }

    /**
     * Incrementa o contador de uso da API.
     * Chamado por investimentos.js quando dispara um fetch.
     */
    function incrementApiUsage(by) {
        const usage = getApiUsage();
        usage.count += (typeof by === 'number' && by > 0) ? by : 1;
        saveApiUsage(usage);
        refreshApiUsageUI();
    }

    /**
     * Reinicia o contador manualmente (botão "Zerar contador").
     */
    function resetApiUsage() {
        const usage = getApiUsage();
        usage.count = 0;
        saveApiUsage(usage);
        refreshApiUsageUI();
        notify('Contador de uso da API foi zerado.', 'success');
    }

    /**
     * Retorna o status do consumo em uma escala qualitativa.
     */
    function getApiUsageStatus(usage) {
        const pct = (usage.count / usage.limit) * 100;
        if (pct >= 95) return 'danger';
        if (pct >= 80) return 'warn';
        return 'ok';
    }

    /**
     * Atualiza os elementos visuais do contador:
     * - badge no topo da aba Investimentos
     * - barra + números no painel de Configurações
     */
    function refreshApiUsageUI() {
        const usage = getApiUsage();
        const pct = (usage.count / usage.limit) * 100;
        const status = getApiUsageStatus(usage);
        const pctStr = pct.toFixed(1).replace('.', ',') + '%';
        const countStr = usage.count.toLocaleString('pt-BR');
        const limitStr = usage.limit.toLocaleString('pt-BR');

        // Badge na aba Investimentos
        const badge = document.getElementById('apiUsageBadge');
        const badgeText = document.getElementById('apiUsageText');
        if (badge && badgeText) {
            badgeText.textContent = `${countStr} / ${limitStr} (${pctStr})`;
            badge.classList.remove('warn', 'danger');
            if (status === 'warn') badge.classList.add('warn');
            if (status === 'danger') badge.classList.add('danger');
        }

        // Barra no painel de Configurações
        const bar = document.getElementById('apiUsageBar');
        if (bar) {
            bar.style.width = Math.min(pct, 100) + '%';
            bar.classList.remove('warn', 'danger');
            if (status === 'warn') bar.classList.add('warn');
            if (status === 'danger') bar.classList.add('danger');
        }

        const numbersEl = document.getElementById('apiUsageNumbers');
        if (numbersEl) {
            numbersEl.textContent = `${countStr} / ${limitStr} (${pctStr})`;
        }

        const resetEl = document.getElementById('apiUsageReset');
        if (resetEl) {
            const days = daysUntilNextMonth();
            resetEl.textContent = days === 1
                ? 'Reinicia em 1 dia'
                : `Reinicia em ${days} dias`;
        }
    }

    // ========== CHAVE DA API ==========

    function getBrapiKey() {
        return localStorage.getItem(BRAPI_KEY_STORAGE) || '';
    }

    function setBrapiKey(key) {
        if (key && key.trim()) {
            localStorage.setItem(BRAPI_KEY_STORAGE, key.trim());
        } else {
            localStorage.removeItem(BRAPI_KEY_STORAGE);
        }
    }

    function updateKeyStatus(text, kind) {
        const el = document.getElementById('brapiKeyStatus');
        if (!el) return;
        el.className = 'settings-status';
        if (kind === 'ok') el.classList.add('ok');
        if (kind === 'error') el.classList.add('error');
        el.textContent = text;
    }

    /**
     * Carrega a chave salva no input e atualiza o status visual.
     */
    function loadSavedKey() {
        const input = document.getElementById('brapiKeyInput');
        if (!input) return;
        const key = getBrapiKey();
        if (key) {
            input.value = key;
            updateKeyStatus('⚪ Chave salva (clique em "Testar chave" para validar)', null);
        } else {
            input.value = '';
            updateKeyStatus('⚪ Não configurada', null);
        }
    }

    function saveKeyFromInput() {
        const input = document.getElementById('brapiKeyInput');
        if (!input) return;
        const value = input.value.trim();
        if (!value) {
            notify('Digite uma chave antes de salvar.', 'error');
            return;
        }
        setBrapiKey(value);
        notify('Chave salva com sucesso.', 'success');
        updateKeyStatus('⚪ Chave salva (clique em "Testar chave" para validar)', null);
    }

    function clearKey() {
        const input = document.getElementById('brapiKeyInput');
        if (input) input.value = '';
        setBrapiKey('');
        notify('Chave removida.', 'success');
        updateKeyStatus('⚪ Não configurada', null);
    }

    /**
     * Testa a chave atual (do input ou do storage) contra a brapi.
     * Consome 1 requisição do contador.
     */
    async function testKey() {
        const input = document.getElementById('brapiKeyInput');
        const key = (input && input.value.trim()) || getBrapiKey();

        if (!key) {
            updateKeyStatus('❌ Nenhuma chave para testar', 'error');
            return;
        }

        updateKeyStatus('⏳ Testando...', null);

        // Incrementa o contador antes de chamar (a chamada conta mesmo se falhar)
        incrementApiUsage(1);

        try {
            const url = `https://brapi.dev/api/quote/PETR4?token=${encodeURIComponent(key)}`;
            const resp = await fetch(url);
            const data = await resp.json().catch(() => null);

            if (!resp.ok) {
                // 401, 403, 429 etc.
                const msg = (data && data.message) ? data.message : `HTTP ${resp.status}`;
                updateKeyStatus(`❌ Chave inválida ou sem permissão (${msg})`, 'error');
                return;
            }

            if (data && data.results && data.results.length > 0) {
                updateKeyStatus('✅ Chave válida e funcionando', 'ok');
                // Salva automaticamente se veio do input
                if (input && input.value.trim()) {
                    setBrapiKey(input.value.trim());
                }
                notify('Chave validada com sucesso.', 'success');
            } else {
                updateKeyStatus('⚠️ Resposta inesperada da API', 'error');
            }
        } catch (err) {
            console.error('[configuracoes.js] Erro ao testar chave:', err);
            updateKeyStatus('❌ Erro de rede ao testar chave', 'error');
        }
    }

    // ========== PAINEL DE CONFIGURAÇÕES ==========

    function openSettings() {
        const panel = document.getElementById('settingsPanel');
        if (!panel) return;
        panel.classList.add('show');
        document.body.style.overflow = 'hidden';
        refreshApiUsageUI();
        loadSavedKey();
        renderOwners();
    }

    function closeSettings() {
        const panel = document.getElementById('settingsPanel');
        if (!panel) return;
        panel.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ========== TITULARES (OWNERS) ==========

    function getOwners() {
        try {
            const raw = localStorage.getItem('owners');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) {}
        // Inicializa com defaults
        const defaults = DEFAULT_OWNERS.map(o => ({ ...o }));
        localStorage.setItem('owners', JSON.stringify(defaults));
        return defaults;
    }

    function saveOwners(owners) {
        localStorage.setItem('owners', JSON.stringify(owners));
    }

    function makeOwnerId(name) {
        return String(name)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function addOwner(name, color) {
        const trimmed = (name || '').trim();
        if (!trimmed) {
            notify('Digite um nome para o titular.', 'error');
            return;
        }
        const owners = getOwners();
        const id = makeOwnerId(trimmed);
        if (!id) {
            notify('Nome inválido.', 'error');
            return;
        }
        if (owners.find(o => o.id === id)) {
            notify('Já existe um titular com esse nome.', 'error');
            return;
        }
        owners.push({
            id,
            name: trimmed,
            color: color || '#3498db',
            isDefault: false
        });
        saveOwners(owners);
        renderOwners();
        // Notifica o investimentos.js para atualizar o dropdown de filtro
        if (typeof window.refreshOwnerFilter === 'function') {
            window.refreshOwnerFilter();
        }
        notify('Titular adicionado.', 'success');
    }

    function deleteOwner(id) {
        const owners = getOwners();
        const owner = owners.find(o => o.id === id);
        if (!owner) return;
        if (owner.isDefault) {
            notify('Não é possível excluir o titular padrão.', 'error');
            return;
        }
        // Verifica se há ativos vinculados
        try {
            const assetsRaw = localStorage.getItem('assets');
            const assets = assetsRaw ? JSON.parse(assetsRaw) : [];
            const linked = assets.filter(a => a.ownerId === id).length;
            if (linked > 0) {
                notify(`Existem ${linked} ativo(s) vinculados a este titular.`, 'error');
                return;
            }
        } catch (_) {}

        if (!confirm(`Excluir o titular "${owner.name}"?`)) return;
        const filtered = owners.filter(o => o.id !== id);
        saveOwners(filtered);
        renderOwners();
        if (typeof window.refreshOwnerFilter === 'function') {
            window.refreshOwnerFilter();
        }
        notify('Titular removido.', 'success');
    }

    function renderOwners() {
        const container = document.getElementById('owners-list');
        if (!container) return;
        const owners = getOwners();
        container.innerHTML = '';

        owners.forEach(owner => {
            const el = document.createElement('div');
            el.className = 'category-card';
            const badges = [];
            if (owner.isDefault) {
                badges.push('<span class="holder-badge" style="background:var(--accent-blue);color:white;border:none">padrão</span>');
            }
            el.innerHTML = `
                <div class="category-color" style="background-color: ${escapeHtmlText(owner.color)}"></div>
                <div class="category-name">${escapeHtmlText(owner.name)} ${badges.join(' ')}</div>
                ${!owner.isDefault
                    ? `<button class="danger" data-owner-id="${escapeHtmlText(owner.id)}"><i class="fas fa-trash"></i></button>`
                    : ''}
            `;
            container.appendChild(el);
        });

        // Listeners dos botões de excluir
        container.querySelectorAll('button[data-owner-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-owner-id');
                deleteOwner(id);
            });
        });
    }

    // ========== INICIALIZAÇÃO DOS LISTENERS ==========

    function setupConfiguracoesListeners() {
        // Botão de engrenagem
        const settingsToggle = document.getElementById('settingsToggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', openSettings);
        }

        // Fechar painel
        const settingsClose = document.getElementById('settingsClose');
        if (settingsClose) {
            settingsClose.addEventListener('click', closeSettings);
        }

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const panel = document.getElementById('settingsPanel');
                if (panel && panel.classList.contains('show')) {
                    closeSettings();
                }
            }
        });

        // Fechar clicando fora do painel
        const panel = document.getElementById('settingsPanel');
        if (panel) {
            panel.addEventListener('click', (e) => {
                if (e.target === panel) closeSettings();
            });
        }

        // Badge de uso da API (na aba Investimentos) → abre Configurações
        const apiBadge = document.getElementById('apiUsageBadge');
        if (apiBadge) {
            apiBadge.addEventListener('click', openSettings);
        }

        // Chave da API
        const saveKeyBtn = document.getElementById('brapiKeySaveBtn');
        if (saveKeyBtn) saveKeyBtn.addEventListener('click', saveKeyFromInput);

        const testKeyBtn = document.getElementById('brapiKeyTestBtn');
        if (testKeyBtn) testKeyBtn.addEventListener('click', testKey);

        const clearKeyBtn = document.getElementById('brapiKeyClearBtn');
        if (clearKeyBtn) clearKeyBtn.addEventListener('click', clearKey);

        // Contador de uso
        const resetUsageBtn = document.getElementById('apiUsageResetBtn');
        if (resetUsageBtn) resetUsageBtn.addEventListener('click', resetApiUsage);

        // Formulário de titulares
        const ownerForm = document.getElementById('owner-form');
        if (ownerForm) {
            ownerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('new-owner-name');
                const colorInput = document.getElementById('new-owner-color');
                if (!nameInput) return;
                addOwner(nameInput.value, colorInput ? colorInput.value : '#3498db');
                nameInput.value = '';
                if (colorInput) colorInput.value = '#3498db';
            });
        }

        // Backup — delega para o backup.js
        const exportBtn = document.getElementById('backupExportBtn');
        if (exportBtn && window.Backup && typeof window.Backup.exportBackup === 'function') {
            // O backup.js já adiciona o listener diretamente.
            // Não adicionamos aqui para não duplicar.
        }

        // Estado inicial do contador
        refreshApiUsageUI();
    }

    // ========== API PÚBLICA ==========

    window.Configuracoes = {
        // Uso da API
        getApiUsage,
        incrementApiUsage,
        resetApiUsage,
        refreshApiUsageUI,

        // Chave
        getBrapiKey,
        setBrapiKey,

        // Titulares
        getOwners,
        saveOwners,

        // Painel
        openSettings,
        closeSettings,

        // Debug
        _testKey: testKey
    };

    // Atualiza o badge periodicamente (a cada 60s) para refletir reset de mês
    setInterval(() => {
        refreshApiUsageUI();
    }, 60000);

    // Auto-inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupConfiguracoesListeners);
    } else {
        setupConfiguracoesListeners();
    }

})();
