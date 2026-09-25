document.addEventListener('DOMContentLoaded', function() {
    // ========== DOM ==========
    const form = document.getElementById('transaction-form');
    const categoryForm = document.getElementById('category-form');
    const holderForm = document.getElementById('holder-form');
    const transactionsList = document.getElementById('transactions-list');
    const categoriesList = document.getElementById('categories-list');
    const holdersList = document.getElementById('holders-list');
    const categorySelect = document.getElementById('category');
    const holderSelect = document.getElementById('holder');
    const totalIncomeElement = document.getElementById('total-income');
    const totalExpenseElement = document.getElementById('total-expense');
    const balanceElement = document.getElementById('balance');
    const countIncomeEl = document.getElementById('count-income');
    const countExpenseEl = document.getElementById('count-expense');
    const countTotalEl = document.getElementById('count-total');
    const transactionsCountEl = document.getElementById('transactions-count');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    const prevPeriodBtn = document.getElementById('prev-period');
    const nextPeriodBtn = document.getElementById('next-period');
    const currentPeriodElement = document.getElementById('current-period');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyPeriodBtn = document.getElementById('apply-period');
    const periodStandardBtn = document.getElementById('period-standard');
    const periodCustomBtn = document.getElementById('period-custom');
    const periodNav = document.getElementById('period-nav');

    const categoryDetail = document.getElementById('category-detail');
    const detailCategoryName = document.getElementById('detail-category-name');
    const detailTransactionsList = document.getElementById('detail-transactions-list');
    const detailTotal = document.getElementById('detail-total');
    const closeDetailBtn = document.getElementById('close-detail');

    const holderTotalsContainer = document.getElementById('holder-totals-container');
    const holderDetail = document.getElementById('holder-detail');
    const holderDetailTitle = document.getElementById('holder-detail-title');
    const holderDetailList = document.getElementById('holder-detail-list');
    const holderDetailTotal = document.getElementById('holder-detail-total');
    const holderDetailClose = document.getElementById('holder-detail-close');

    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const voiceStatusText = document.getElementById('voiceStatusText');
    const voiceStatusClose = document.getElementById('voiceStatusClose');
    const voiceFeedback = document.getElementById('voiceFeedback');
    const voiceFeedbackText = document.getElementById('voiceFeedbackText');

    const transactionDateInput = document.getElementById('transaction-date');

    const installBanner = document.getElementById('installBanner');
    const installButton = document.getElementById('installButton');
    let deferredPrompt;

    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeColorMeta = document.getElementById('themeColorMeta');

    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const importFeedback = document.getElementById('importFeedback');
    const reviewModal = document.getElementById('reviewModal');
    const reviewSummary = document.getElementById('reviewSummary');
    const validationInfo = document.getElementById('validationInfo');
    const reviewTableContainer = document.getElementById('reviewTableContainer');
    const reviewTotal = document.getElementById('reviewTotal');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const confirmImportBtn = document.getElementById('confirmImportBtn');

    // ========== DADOS ==========
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 'alimentacao', name: 'Alimentação', type: 'despesa', color: '#e74c3c' },
        { id: 'transporte', name: 'Transporte', type: 'despesa', color: '#3498db' },
        { id: 'moradia', name: 'Moradia', type: 'despesa', color: '#2ecc71' },
        { id: 'saude', name: 'Saúde', type: 'despesa', color: '#9b59b6' },
        { id: 'lazer', name: 'Lazer', type: 'despesa', color: '#f1c40f' },
        { id: 'educacao', name: 'Educação', type: 'despesa', color: '#1abc9c' },
        { id: 'vestuario', name: 'Vestuário', type: 'despesa', color: '#d35400' },
        { id: 'servicos', name: 'Serviços', type: 'despesa', color: '#7f8c8d' },
        { id: 'salario', name: 'Salário', type: 'receita', color: '#27ae60' },
        { id: 'freelance', name: 'Freelance', type: 'receita', color: '#2980b9' },
        { id: 'investimentos', name: 'Investimentos', type: 'receita', color: '#8e44ad' },
        { id: 'presentes', name: 'Presentes', type: 'receita', color: '#e67e22' },
        { id: 'outros', name: 'Outros', type: 'despesa', color: '#95a5a6' }
    ];

    const DEFAULT_HOLDERS = [
        { id: 'rodrigo-a-prado', name: 'Rodrigo A Prado', active: true, isDefault: true },
        { id: 'gisela-pinto-a-prado', name: 'Gisela Pinto A Prado', active: true, isDefault: false },
        { id: 'eduardo-pinto-a-prado', name: 'Eduardo Pinto A Prado', active: true, isDefault: false }
    ];

    let holders = JSON.parse(localStorage.getItem('holders')) || DEFAULT_HOLDERS.slice();

    // ========== TAGS DE CATEGORIZAÇÃO ==========
    const CATEGORY_TAGS = {
        'transporte': ['posto', 'auto posto', 'autoposto', 'autopostodatorre', 'auto-posto', 'combustivel', 'gasolina', 'etanol', 'uber', '99 ', 'taxi', 'estacionamento', 'pedagio', 'sem parar', 'semparar', 'veloe', 'lr transportes', 'l r transportes'],
        'alimentacao': ['supermercado', 'supermercad', 'mercado', 'hipermerc', 'atacad', 'atacado', 'padaria', 'panificad', 'restaurante', 'restaur', 'lanchonet', 'pizzaria', 'pizza', 'ifood', 'ifd ', 'food', 'comida', 'cheiro', 'cheirin', 'sabor', 'assaggiare', 'churrasc', 'churrasco', 'peixe', 'sushi', 'nippon', 'mcdonald', 'burger', 'bar ', 'bar', 'cerveja', 'bebida', 'mineirinha', 'velhote', 'mach enio', 'machenio', 'jim com', 'madrugadao', 'bfs alimentacao', 'bfs aliment', 'gri', 'grill', 'fe bar', 'espartanos', 'fuganti'],
        'saude': ['drogasil', 'drogaria', 'farmacia', 'farmácia', 'farmac', 'manipulacao', 'manipulação', 'manipulac', 'laborat', 'clinica', 'clínica', 'hospital', 'medic', 'médic', 'odonto', 'dentista', 'otica', 'ótica', 'academia', 'wellhub', 'smart fit', 'smartfit'],
        'moradia': ['casa ', 'construc', 'construção', 'material', 'leroy', 'telha', 'tinta', 'moveis', 'móveis', 'eletro', 'compensados', 'guara compensados', 'casa petropolis', 'casa do tapec', 'tapec'],
        'educacao': ['curso', 'escola', 'faculdade', 'universidade', 'colegio', 'colégio', 'ensino', 'hotmart', 'udemy', 'alura', 'livraria', 'livro'],
        'lazer': ['cinema', 'cinemark', 'netflix', 'spotify', 'deezer', 'amazon music', 'amazon prime', 'disney', 'hbo', 'max ', 'prime video', 'paramount', 'globoplay', 'crunchyroll', 'streaming', 'game', 'playstation', 'xbox', 'nintendo', 'ingresso', 'show ', 'teatro', 'hotel', 'pousada', 'viagem', 'elegance', 'ks eventos'],
        'vestuario': ['riachuelo', 'renner', 'c&a', 'ce a', 'zara', 'hering', 'colcci', 'oakley', 'nike', 'adidas', 'puma', 'calcado', 'calçado', 'sapat', 'tenis', 'tênis', 'roupa', 'moda', 'mercado da moda', 'edegenius', 'jeans', 'loja unanime', 'unanime', 'hortela tricot', 'hortelã tricot', 'basari'],
        'servicos': ['net ', 'net pgt', 'claro', 'vivo', 'tim ', 'oi ', 'internet', 'telefone', 'celular', 'conta ', 'fatura', 'seguro', 'mapfre', 'porto seguro', 'cpfl', 'energia', 'agua', 'água', 'gas ', 'gás ', 'iptu', 'condominio', 'condomínio', 'anuidade', 'google', 'apple com', 'apple.com', 'microsoft', 'adobe'],
        'presentes': ['presente', 'etc e tal', 'etc e tal presentes', 'flor', 'floresta'],
        'investimentos': ['investimento', 'cdb', 'tesouro', 'poupanca', 'poupança', 'acao', 'ação', 'fundo'],
        'salario': ['salario', 'salário', 'holerite', 'pagamento salario'],
        'freelance': ['freelance', 'freela', 'servico prestado', 'serviço prestado']
    };

    // ========== ESTADO ==========
    let periodMode = 'standard';
    let customStartDate = null;
    let customEndDate = null;
    let recognition = null;
    let isListening = false;
    let importPreview = null;
    let currentDueDate = null;

    // ========== TEMA ==========
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeColorMeta.setAttribute('content', '#1a1d23');
        } else {
            document.body.classList.remove('dark-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            themeColorMeta.setAttribute('content', '#3498db');
        }
        const reportsTab = document.getElementById('reports-tab');
        if (reportsTab && reportsTab.classList.contains('active')) {
            setTimeout(() => { renderCharts(); renderHolderTotals(); }, 50);
        }
    }
    function toggleTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    }
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) { applyTheme(savedTheme); return; }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
        });
    }

    // ========== UTILITÁRIOS DATA ==========
    function createDateFromString(ds) {
        if (!ds) return null;
        const p = ds.split('-');
        if (p.length !== 3) return null;
        return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }
    function formatDateToString(d) {
        if (!d || isNaN(d.getTime())) return '';
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    function formatDateToDisplay(d) {
        if (!d || isNaN(d.getTime())) return '';
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }
    function getStartOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    function getEndOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
    }
    function fmtBRL(v) {
        return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // ========== UTILITÁRIOS DE PORTADOR ==========
    function normalizeName(name) {
        if (!name) return '';
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    function holderKeyFromName(name) {
        const n = normalizeName(name);
        if (!n) return '';
        const parts = n.split(' ').filter(Boolean);
        if (parts.length === 0) return '';
        if (parts.length === 1) return parts[0];
        return `${parts[0]}|${parts[parts.length - 1]}`;
    }

    function makeHolderIdFromName(name) {
        return normalizeName(name)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function ensureHolderFromFatura(name, cardNumber) {
        const key = holderKeyFromName(name);
        if (!key) return null;

        let found = holders.find(h => holderKeyFromName(h.name) === key);
        if (found) return found;

        const idFromName = makeHolderIdFromName(name);
        found = holders.find(h => h.id === idFromName);
        if (found) return found;

        let newId = idFromName;
        let suffix = 2;
        while (holders.find(h => h.id === newId)) {
            newId = `${idFromName}-${suffix++}`;
        }
        const novo = {
            id: newId,
            name: name.trim(),
            active: true,
            isDefault: false
        };
        holders.push(novo);
        saveHolders();
        return novo;
    }

    function ensureDefaultHolders() {
        let changed = false;
        DEFAULT_HOLDERS.forEach(def => {
            const exists = holders.find(h => h.id === def.id);
            if (!exists) {
                const sameKey = holders.find(h => holderKeyFromName(h.name) === holderKeyFromName(def.name));
                if (!sameKey) {
                    holders.push({ ...def });
                    changed = true;
                }
            }
        });
        const defaults = holders.filter(h => h.isDefault);
        if (defaults.length === 0 && holders.length > 0) {
            holders[0].isDefault = true;
            changed = true;
        } else if (defaults.length > 1) {
            let first = true;
            holders.forEach(h => {
                if (h.isDefault) {
                    if (first) { first = false; }
                    else { h.isDefault = false; changed = true; }
                }
            });
        }
        if (changed) saveHolders();
    }

    // ========== INICIALIZAÇÃO ==========
    init();

    function init() {
        initTheme();
        if (!localStorage.getItem('categories')) localStorage.setItem('categories', JSON.stringify(categories));
        else categories = JSON.parse(localStorage.getItem('categories'));

        if (!localStorage.getItem('holders')) localStorage.setItem('holders', JSON.stringify(holders));
        else holders = JSON.parse(localStorage.getItem('holders'));

        ensureDefaultHolders();

        transactionDateInput.value = formatDateToString(new Date());
        setupStandardPeriod();
        updateCategoriesDropdown();
        updateHoldersDropdown();
        renderCategories();
        renderHolders();
        updateSummary();
        renderTransactions();
        renderHolderTotals();
        setupEventListeners();
        setupTabs();
        setupPWA();
        setupVoiceRecognition();
    }

    function setupStandardPeriod() {
        const today = new Date();
        let s = new Date(today.getFullYear(), today.getMonth(), 14);
        let e = new Date(today.getFullYear(), today.getMonth() + 1, 14);
        if (today.getDate() < 14) {
            s = new Date(today.getFullYear(), today.getMonth() - 1, 14);
            e = new Date(today.getFullYear(), today.getMonth(), 14);
        }
        customStartDate = s;
        customEndDate = e;
        startDateInput.value = formatDateToString(s);
        endDateInput.value = formatDateToString(e);
        updatePeriodDisplay();
    }

    function updatePeriodDisplay() {
        const mn = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        if (periodMode === 'standard') {
            const s = new Date(customStartDate), e = new Date(customEndDate);
            currentPeriodElement.textContent = `${s.getDate()} ${mn[s.getMonth()]} - ${e.getDate()} ${mn[e.getMonth()]} ${e.getFullYear()}`;
        } else {
            currentPeriodElement.textContent = `${formatDateToDisplay(customStartDate)} - ${formatDateToDisplay(customEndDate)}`;
        }
        updateSummary();
        renderTransactions();
        renderHolderTotals();
        const rt = document.getElementById('reports-tab');
        if (rt.classList.contains('active')) renderCharts();
    }

    function getPeriodTransactions() {
        const s = getStartOfDay(new Date(customStartDate));
        const e = getEndOfDay(new Date(customEndDate));
        return transactions.filter(t => {
            const d = new Date(t.timestamp);
            return d >= s && d <= e;
        });
    }

    // ========== PWA ==========
    function setupPWA() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(() => installBanner.classList.add('show'), 3000);
        });
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                installBanner.classList.remove('show');
                deferredPrompt = null;
            }
        });
        window.addEventListener('appinstalled', () => {
            installBanner.classList.remove('show');
            deferredPrompt = null;
        });
    }

    // ========== VOZ ==========
    function setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.style.display = 'none';
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SR();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = function(event) {
            let final = '', interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += t; else interim += t;
            }
            const text = final || interim;
            if (text) {
                showVoiceFeedback(text, final ? 'final' : 'interim');
                if (final) processVoiceCommand(final);
            }
        };
        recognition.onend = function() {
            stopListening();
            if (voiceStatus.classList.contains('show')) {
                voiceStatusText.textContent = '⏱️ Nada foi ouvido. Tente novamente.';
                setTimeout(hideVoiceStatus, 3000);
            }
        };
        recognition.onerror = function(event) {
            let msg = 'Erro ao capturar áudio. ';
            switch(event.error) {
                case 'not-allowed': msg += 'Permissão negada.'; break;
                case 'no-speech': msg += 'Nenhuma fala detectada.'; break;
                case 'audio-capture': msg += 'Microfone não encontrado.'; break;
                case 'network': msg += 'Erro de rede.'; break;
                default: msg += 'Tente novamente.';
            }
            voiceStatusText.textContent = '❌ ' + msg;
            setTimeout(hideVoiceStatus, 3000);
            stopListening();
        };
    }
    function startListening() {
        if (!recognition) { alert('Reconhecimento de voz não disponível.'); return; }
        try {
            recognition.start();
            isListening = true;
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i> Parar';
            voiceStatus.classList.add('show');
            voiceStatusText.textContent = '🎤 Ouvindo... Fale agora';
            voiceFeedback.classList.remove('show');
        } catch (e) { alert('Erro ao iniciar microfone.'); }
    }
    function stopListening() {
        if (recognition && isListening) { try { recognition.stop(); } catch(e){} }
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Falar';
    }
    function toggleListening() { isListening ? stopListening() : startListening(); }
    function hideVoiceStatus() {
        voiceStatus.classList.remove('show');
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Falar';
        isListening = false;
    }
    function showVoiceFeedback(text, type) {
        voiceFeedback.classList.add('show');
        if (type === 'final') voiceFeedbackText.innerHTML = `<span class="highlight">${text}</span>`;
        else voiceFeedbackText.textContent = text + ' (processando...)';
    }
    function processVoiceCommand(text) {
        const lower = text.toLowerCase().trim();
        let tipo = null, valor = null, categoria = null, data = null, parcelas = 1;
        if (lower.includes('receita') || lower.includes('ganhei') || lower.includes('salário') || lower.includes('salario')) tipo = 'receita';
        else if (lower.includes('despesa') || lower.includes('gastei') || lower.includes('paguei')) tipo = 'despesa';
        const vMatch = lower.match(/(\d+[\.,]\d+|\d+)\s*(reais|r\$|real)/i) || lower.match(/(\d+[\.,]\d+|\d+)/);
        if (vMatch) valor = parseFloat(vMatch[1].replace(',', '.'));
        const catsDisp = categories.map(c => c.name.toLowerCase());
        for (const cat of catsDisp) {
            if (lower.includes(cat)) {
                const obj = categories.find(c => c.name.toLowerCase() === cat);
                if (obj) { categoria = obj.id; break; }
            }
        }
        const kw = { 'alimentação':'alimentacao','mercado':'alimentacao','comida':'alimentacao','transporte':'transporte','uber':'transporte','gasolina':'transporte','moradia':'moradia','aluguel':'moradia','saúde':'saude','médico':'saude','lazer':'lazer','cinema':'lazer','educação':'educacao','curso':'educacao','vestuário':'vestuario','roupa':'vestuario','serviços':'servicos','salário':'salario' };
        if (!categoria) {
            for (const [k, v] of Object.entries(kw)) {
                if (lower.includes(k)) {
                    const obj = categories.find(c => c.id === v);
                    if (obj) { categoria = obj.id; break; }
                }
            }
        }
        let desc = text;
        ['receita','despesa','gastei','paguei','ganhei','reais','real','r$'].forEach(p => desc = desc.replace(new RegExp(p, 'gi'), ''));
        desc = desc.replace(/\d+[\.,]\d+|\d+/g, '');
        catsDisp.forEach(c => desc = desc.replace(new RegExp(c, 'gi'), ''));
        desc = desc.trim() || (tipo === 'receita' ? 'Receita' : 'Despesa');
        const dMatch = lower.match(/dia\s*(\d+)/i);
        if (dMatch) {
            const dia = parseInt(dMatch[1]);
            const hoje = new Date();
            let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
            if (d > hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, dia);
            data = d;
        }
        const pMatch = lower.match(/(\d+)\s*(x|vezes|parcela|parcelas)/i);
        if (pMatch) parcelas = parseInt(pMatch[1]);

        const dEl = document.getElementById('description');
        const aEl = document.getElementById('amount');
        const tEl = document.getElementById('type');
        const cEl = document.getElementById('category');
        const dtEl = document.getElementById('transaction-date');
        const pEl = document.getElementById('parcelas');
        if (desc) dEl.value = desc;
        if (valor) aEl.value = valor;
        if (tipo) tEl.value = tipo;
        if (categoria) cEl.value = categoria;
        if (data) dtEl.value = formatDateToString(data);
        if (parcelas > 1) pEl.value = parcelas;

        voiceStatusText.textContent = '✅ Transação preenchida!';
        voiceStatusText.style.color = '#27ae60';
        setTimeout(() => { hideVoiceStatus(); voiceStatusText.style.color = ''; }, 4000);
    }

    // ==================================================
    // IMPORTAÇÃO DE FATURA
    // ==================================================

    function extractDueDateFromFilename(filename) {
        const m = filename.match(/fatura(\d{2})(\d{2})(\d{4})\.txt/i);
        if (!m) return null;
        return { day: parseInt(m[1]), month: parseInt(m[2]) - 1, year: parseInt(m[3]) };
    }

    function normalizeLine(l) { return l.trim().replace(/\s+/g, ' '); }

    function isIgnoredLine(line) {
        const l = line.toLowerCase().trim();
        if (!l) return true;
        if (l === 'demonstrativo') return true;
        if (l.startsWith('data descrição cidade')) return true;
        if (l.startsWith('data descricao cidade')) return true;
        if (l.startsWith('valor original cotação')) return true;
        if (l.startsWith('crédito/débito r$')) return true;
        if (l.startsWith('credito/debito r$')) return true;
        return false;
    }

    function isNoiseTransaction(description) {
        const d = description.toLowerCase();
        const noiseKeywords = [
            'total da fatura anterior', 'obrigado pelo pagamento',
            'ajuste cred', 'ajuste crédito', 'ajuste credito', 'ajuste de',
            'pagamento efetuado', 'saldo anterior', 'juros', 'iof',
            'anuidade', 'isent',
            'total compras', 'total final', 'valor total desta fatura',
            'total '
        ];
        return noiseKeywords.some(k => d.includes(k));
    }

    function extractInstallment(description) {
        const m = description.match(/^(.+?)\s+(\d{2})\s+DE\s+(\d{2})\s+(.+)$/i);
        if (m) {
            return {
                description: `${m[1].trim()} ${m[4].trim()}`,
                installment: `${m[2]}/${m[3]}`
            };
        }
        return { description, installment: null };
    }

    function parseHolderLine(line) {
        const l = line.trim();
        if (/^(COMPRAS|COMPRAS\s+PARCELADAS|ANUIDADE|DEMONSTRATIVO)\b/i.test(l)) return null;
        const m = l.match(/^(.+?)\s*\(Cartão\s+(\d+)\)\s*$/i);
        if (!m) return null;
        return { name: m[1].trim(), cardNumber: m[2] };
    }

    function parseTotalLine(line) {
        const l = line.trim();
        let m;

        m = l.match(/^Total\s+COMPRAS\s+([\d.]+,\d{2})\s*D?$/i);
        if (m) return { type: 'compras', value: parseFloat(m[1].replace(/\./g, '').replace(',', '.')) };

        m = l.match(/^Total\s+COMPRAS\s+PARCELADAS\s+([\d.]+,\d{2})\s*D?$/i);
        if (m) return { type: 'parceladas', value: parseFloat(m[1].replace(/\./g, '').replace(',', '.')) };

        m = l.match(/^Total\s+final\s+\(cartão\s+(\d+)\)\s+([\d.]+,\d{2})\s*D?$/i);
        if (m) return { type: 'final-cartao', cardNumber: m[1], value: parseFloat(m[2].replace(/\./g, '').replace(',', '.')) };

        m = l.match(/^Valor\s+total\s+desta\s+fatura\s+R\$\s+([\d.]+,\d{2})\s*D?$/i);
        if (m) return { type: 'total-fatura', value: parseFloat(m[1].replace(/\./g, '').replace(',', '.')) };

        m = l.match(/^Total\s+([\d.]+,\d{2})\s*([CD])?$/i);
        if (m) return { type: 'total-simples', value: parseFloat(m[1].replace(/\./g, '').replace(',', '.')), letter: (m[2] || '').toUpperCase() };

        return null;
    }

    function parseTransactionLine(line) {
        const regex = /^(\d{2})\/(\d{2})\s+(.+?)\s+([\d.]+,\d{2})\s*([CD])\s*$/i;
        const m = line.match(regex);
        if (!m) return null;
        const amountStr = m[4].replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return null;
        return {
            day: parseInt(m[1]),
            month: parseInt(m[2]) - 1,
            description: m[3].trim(),
            amount,
            type: m[5].toUpperCase() === 'D' ? 'despesa' : 'receita'
        };
    }

    function categorizeDescription(description) {
        const d = description.toLowerCase();
        for (const [categoryId, tags] of Object.entries(CATEGORY_TAGS)) {
            const cat = categories.find(c => c.id === categoryId);
            if (!cat) continue;
            const sorted = [...tags].sort((a, b) => b.length - a.length);
            for (const tag of sorted) {
                if (d.includes(tag.toLowerCase())) return categoryId;
            }
        }
        return 'outros';
    }

    function processInvoiceFile(content) {
        const lines = content.split(/\r?\n/);
        const transactions = [];
        const validation = {
            perCard: {},
            creditsTotal: 0,
            cardExpensesTotal: 0,
            netCalculated: 0,
            declaredTotal: null,
            demonstrativoTotalDeclared: null
        };

        let currentHolder = null;
        let currentCard = null;
        let currentScope = 'demonstrativo';

        const anoVenc = currentDueDate.year;
        const mesVenc = currentDueDate.month;

        const mesAnteriorVenc = mesVenc === 0 ? 11 : mesVenc - 1;
        const anoMesAnteriorVenc = mesVenc === 0 ? anoVenc - 1 : anoVenc;

        for (let i = 0; i < lines.length; i++) {
            const line = normalizeLine(lines[i]);
            if (isIgnoredLine(line)) continue;

            const holderInfo = parseHolderLine(line);
            if (holderInfo) {
                currentHolder = holderInfo.name;
                currentCard = holderInfo.cardNumber;
                currentScope = 'card';
                if (!validation.perCard[currentCard]) {
                    validation.perCard[currentCard] = { holder: currentHolder, compras: 0, parceladas: 0, final: 0 };
                }
                continue;
            }

            const upper = line.toUpperCase();
            if (/^COMPRAS(\s*\(Cartão\s*\d+\))?\s*$/i.test(line)) continue;
            if (/^COMPRAS\s+PARCELADAS(\s*\(Cartão\s*\d+\))?\s*$/i.test(line)) continue;
            if (upper === 'ANUIDADE') continue;

            const totalInfo = parseTotalLine(line);
            if (totalInfo) {
                if (totalInfo.type === 'compras' && currentCard) {
                    validation.perCard[currentCard].compras = totalInfo.value;
                } else if (totalInfo.type === 'parceladas' && currentCard) {
                    validation.perCard[currentCard].parceladas = totalInfo.value;
                } else if (totalInfo.type === 'final-cartao') {
                    if (!validation.perCard[totalInfo.cardNumber]) {
                        validation.perCard[totalInfo.cardNumber] = { holder: null, compras: 0, parceladas: 0, final: 0 };
                    }
                    validation.perCard[totalInfo.cardNumber].final = totalInfo.value;
                } else if (totalInfo.type === 'total-fatura') {
                    validation.declaredTotal = totalInfo.value;
                } else if (totalInfo.type === 'total-simples') {
                    if (currentScope === 'demonstrativo' && totalInfo.letter === 'C') {
                        validation.demonstrativoTotalDeclared = totalInfo.value;
                    }
                }
                continue;
            }

            const tx = parseTransactionLine(line);
            if (!tx) continue;
            if (isNoiseTransaction(tx.description)) continue;

            if (currentScope === 'demonstrativo') {
                if (tx.type === 'receita') validation.creditsTotal += tx.amount;
                continue;
            }

            const { description: cleanDesc, installment } = extractInstallment(tx.description);
            const categoryId = categorizeDescription(cleanDesc);

            let date;
            let finalDescription;

            const diaStr = String(tx.day).padStart(2, '0');
            const mesStr = String(tx.month + 1).padStart(2, '0');
            const dataCompraStr = `${diaStr}/${mesStr}`;

            if (installment) {
                date = new Date(anoVenc, mesVenc, 13);
                finalDescription = `${cleanDesc} (${dataCompraStr} - ${installment})`;
            } else {
                if (tx.month === mesVenc) {
                    date = new Date(anoVenc, mesVenc, 2);
                } else {
                    date = new Date(anoMesAnteriorVenc, mesAnteriorVenc, 28);
                }
                finalDescription = `${cleanDesc} (${dataCompraStr})`;
            }

            const transaction = {
                id: Date.now() + Math.random() + Math.random(),
                description: finalDescription,
                amount: tx.amount,
                type: tx.type,
                category: categoryId,
                date: formatDateToDisplay(date),
                timestamp: date.getTime(),
                month: date.getMonth(),
                year: date.getFullYear(),
                holder: currentHolder,
                cardNumber: currentCard,
                installment: installment
            };

            transactions.push(transaction);
            validation.cardExpensesTotal += tx.amount;
        }

        validation.netCalculated = validation.cardExpensesTotal - validation.creditsTotal;
        return { transactions, validation };
    }

    function handleImportFile(file) {
        if (!file) return;
        const dueInfo = extractDueDateFromFilename(file.name);
        if (!dueInfo) {
            showImportFeedback('error', 'Nome do arquivo inválido. Esperado: faturaDDMMAAAA.txt (ex: fatura23092026.txt)');
            return;
        }
        currentDueDate = dueInfo;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const { transactions: parsed, validation } = processInvoiceFile(e.target.result);
                if (parsed.length === 0) {
                    showImportFeedback('error', 'Nenhum lançamento encontrado. Verifique o formato.');
                    return;
                }
                importPreview = { transactions: parsed, validation };
                openReviewModal();
            } catch (err) {
                console.error(err);
                showImportFeedback('error', 'Erro ao processar: ' + err.message);
            }
        };
        reader.onerror = function() { showImportFeedback('error', 'Erro ao ler o arquivo.'); };
        reader.readAsText(file, 'UTF-8');
    }

    function showImportFeedback(type, message) {
        importFeedback.className = 'import-feedback show ' + type;
        importFeedback.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        if (type === 'success') setTimeout(() => importFeedback.classList.remove('show'), 6000);
    }

    function openReviewModal() {
        const { transactions, validation } = importPreview;
        reviewSummary.innerHTML = `
            <span><strong>${transactions.length}</strong> lançamentos</span>
            <span>Vencimento: <strong>${String(currentDueDate.day).padStart(2,'0')}/${String(currentDueDate.month+1).padStart(2,'0')}/${currentDueDate.year}</strong></span>
        `;
        renderValidationInfo(validation);
        renderReviewTable(transactions);
        updateReviewTotal();
        reviewModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function renderValidationInfo(validation) {
        let html = '';
        html += '<div class="v-header"><i class="fas fa-calculator"></i> Validação da Fatura</div>';

        const cardEntries = Object.entries(validation.perCard);
        if (cardEntries.length > 0) {
            html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">Por cartão:</div>';
            cardEntries.forEach(([card, data]) => {
                const declared = (data.compras || 0) + (data.parceladas || 0);
                const final = data.final || 0;
                const diff = Math.abs(declared - final);
                const ok = diff < 0.01;
                html += `<div class="v-row" style="font-size:12px;">
                    <span class="label">Cartão ${card}:</span>
                    <span class="value">${fmtBRL(declared)} <span class="${ok ? 'ok' : 'fail'}">${ok ? '✓' : '✗ (' + fmtBRL(diff) + ')'}</span></span>
                </div>`;
            });
        }

        html += '<div class="v-divider"></div>';
        html += `<div class="v-row"><span class="label">Total das compras (bruto):</span><span class="value">${fmtBRL(validation.cardExpensesTotal)}</span></div>`;
        html += `<div class="v-row"><span class="label">Créditos/estornos do Demonstrativo:</span><span class="value" style="color:var(--accent-green)">− ${fmtBRL(validation.creditsTotal)}</span></div>`;
        html += '<div class="v-divider"></div>';
        html += `<div class="v-row"><span class="label"><strong>Total líquido calculado:</strong></span><span class="value">${fmtBRL(validation.netCalculated)}</span></div>`;

        if (validation.declaredTotal !== null) {
            const match = Math.abs(validation.netCalculated - validation.declaredTotal) < 0.01;
            const diff = Math.abs(validation.netCalculated - validation.declaredTotal);
            html += `<div class="v-row"><span class="label"><strong>Total declarado na fatura:</strong></span><span class="value">${fmtBRL(validation.declaredTotal)}</span></div>`;
            html += `<div class="v-row" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border);">
                <span class="label"><strong>Resultado:</strong></span>
                <span class="${match ? 'ok' : 'fail'}">${match ? '✓ VALORES BATEM' : '✗ DIVERGÊNCIA DE ' + fmtBRL(diff)}</span>
            </div>`;
        }

        validationInfo.innerHTML = html;
    }

    function renderReviewTable(transactions) {
        const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        const holderOptions = holders.map(h => `<option value="${h.id}" ${!h.active ? 'disabled' : ''}>${h.name}${!h.active ? ' (excluído)' : ''}</option>`).join('');

        let html = '<table class="review-table"><thead><tr>';
        html += '<th class="col-date">Data</th><th class="col-desc">Descrição</th><th class="col-amount">Valor</th>';
        html += '<th class="col-cat">Categoria</th><th class="col-holder">Portador</th><th class="col-type">Tipo</th><th class="col-actions"></th>';
        html += '</tr></thead><tbody>';

        transactions.forEach((tx, idx) => {
            const isLow = tx.category === 'outros';
            html += `<tr class="${isLow ? 'row-low-confidence' : ''}" data-idx="${idx}">`;
            html += `<td class="col-date" data-label="Data"><input type="date" class="review-date" data-idx="${idx}" value="${formatDateToString(new Date(tx.timestamp))}"></td>`;
            html += `<td class="col-desc" data-label="Descrição"><input type="text" class="review-desc" data-idx="${idx}" value="${escapeHtml(tx.description)}"></td>`;
            html += `<td class="col-amount" data-label="Valor"><input type="number" step="0.01" min="0" class="review-amount amount-field" data-idx="${idx}" value="${tx.amount.toFixed(2)}"></td>`;
            html += `<td class="col-cat" data-label="Categoria"><select class="review-cat" data-idx="${idx}"><option value="${tx.category}" selected>${getCategoryName(tx.category)}</option>${categoryOptions}</select></td>`;
            html += `<td class="col-holder" data-label="Portador"><select class="review-holder" data-idx="${idx}">${holderOptions}</select></td>`;
            html += `<td class="col-type" data-label="Tipo"><select class="review-type" data-idx="${idx}"><option value="despesa" ${tx.type === 'despesa' ? 'selected' : ''}>Despesa</option><option value="receita" ${tx.type === 'receita' ? 'selected' : ''}>Receita</option></select></td>`;
            html += `<td class="col-actions" data-label=""><button class="btn-remove-row" data-idx="${idx}"><i class="fas fa-trash"></i></button></td>`;
            html += `</tr>`;
        });

        html += '</tbody></table>';
        reviewTableContainer.innerHTML = html;

        transactions.forEach((tx, idx) => {
            const sel = reviewTableContainer.querySelector(`.review-holder[data-idx="${idx}"]`);
            if (!sel || !tx.holder) return;

            const holder = ensureHolderFromFatura(tx.holder, tx.cardNumber);
            if (!holder) return;

            if (!sel.querySelector(`option[value="${holder.id}"]`)) {
                const o = document.createElement('option');
                o.value = holder.id;
                o.textContent = holder.name;
                sel.appendChild(o);
            }
            sel.value = holder.id;

            reviewTableContainer.querySelectorAll('.review-holder').forEach(s => {
                if (!s.querySelector(`option[value="${holder.id}"]`)) {
                    const o = document.createElement('option');
                    o.value = holder.id;
                    o.textContent = holder.name;
                    s.appendChild(o);
                }
            });
        });

        reviewTableContainer.querySelectorAll('.review-date, .review-desc, .review-amount, .review-cat, .review-holder, .review-type').forEach(el => {
            el.addEventListener('change', updateReviewTotal);
            el.addEventListener('input', updateReviewTotal);
        });

        reviewTableContainer.querySelectorAll('.btn-remove-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                removeReviewRow(idx);
            });
        });
    }

    function getCategoryName(id) {
        const c = categories.find(x => x.id === id);
        return c ? c.name : 'Outros';
    }

    function removeReviewRow(idx) {
        importPreview.transactions.splice(idx, 1);
        renderReviewTable(importPreview.transactions);
        updateReviewTotal();
    }

    function updateReviewTotal() {
        let total = 0;
        reviewTableContainer.querySelectorAll('.review-amount').forEach(inp => {
            const v = parseFloat(inp.value);
            if (!isNaN(v)) total += v;
        });

        let html = `<span class="main-total">Total importado: ${fmtBRL(total)}</span>`;
        if (importPreview && importPreview.validation) {
            const v = importPreview.validation;
            if (v.creditsTotal > 0 && v.declaredTotal !== null) {
                html += `<span class="sub-total">Total da fatura: ${fmtBRL(v.declaredTotal)} (já com créditos de ${fmtBRL(v.creditsTotal)})</span>`;
            } else if (v.declaredTotal !== null) {
                html += `<span class="sub-total">Total da fatura: ${fmtBRL(v.declaredTotal)}</span>`;
            }
        }
        reviewTotal.innerHTML = html;
    }

    function collectReviewData() {
        const rows = reviewTableContainer.querySelectorAll('tr[data-idx]');
        const collected = [];
        rows.forEach(row => {
            const idx = parseInt(row.getAttribute('data-idx'));
            const dateStr = row.querySelector('.review-date').value;
            const desc = row.querySelector('.review-desc').value;
            const amount = parseFloat(row.querySelector('.review-amount').value);
            const cat = row.querySelector('.review-cat').value;
            const holderId = row.querySelector('.review-holder').value;
            const type = row.querySelector('.review-type').value;
            const date = createDateFromString(dateStr);
            if (!date || !desc || isNaN(amount)) return;
            const holder = holders.find(h => h.id === holderId);
            collected.push({
                id: Date.now() + Math.random() + idx,
                description: desc, amount, type, category: cat,
                date: formatDateToDisplay(date),
                timestamp: date.getTime(),
                month: date.getMonth(),
                year: date.getFullYear(),
                holder: holder ? holder.name : (holders.find(h => h.isDefault)?.name || 'Rodrigo A Prado'),
                holderId: holder ? holder.id : null,
                cardNumber: importPreview.transactions[idx]?.cardNumber || null,
                installment: importPreview.transactions[idx]?.installment || null
            });
        });
        return collected;
    }

    function confirmImport() {
        try {
            const collected = collectReviewData();
            if (collected.length === 0) {
                alert('Nenhum lançamento válido para salvar.');
                return;
            }

            collected.forEach(tx => transactions.push(tx));
            saveTransactions();

            renderTransactions();
            updateSummary();
            renderHolders();
            updateHoldersDropdown();
            renderHolderTotals();
            closeReviewModal();
            showImportFeedback('success', `${collected.length} lançamentos importados com sucesso!`);
        } catch(err) {
            console.error('[ERRO em confirmImport]:', err);
            alert('Erro ao salvar: ' + err.message);
        }
    }

    function closeReviewModal() {
        reviewModal.classList.remove('show');
        document.body.style.overflow = '';
        importPreview = null;
        importFile.value = '';
    }

    // ========== EVENT LISTENERS ==========
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImportFile(file);
        });
        cancelImportBtn.addEventListener('click', closeReviewModal);
        confirmImportBtn.addEventListener('click', confirmImport);

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;
            const holderId = document.getElementById('holder').value;
            const dateString = document.getElementById('transaction-date').value;
            const date = createDateFromString(dateString);
            if (!date) { alert('Data inválida!'); return; }
            const parcelas = parseInt(document.getElementById('parcelas').value) || 1;

            let holderName = 'Rodrigo A Prado', finalHolderId = null;
            if (holderId) {
                const h = holders.find(x => x.id === holderId);
                if (h) { holderName = h.name; finalHolderId = h.id; }
            } else {
                const def = holders.find(x => x.isDefault);
                if (def) { holderName = def.name; finalHolderId = def.id; }
            }

            if (parcelas > 1) {
                for (let i = 0; i < parcelas; i++) {
                    const pd = new Date(date);
                    pd.setMonth(pd.getMonth() + i);
                    addTransaction(`${description} (${i+1}/${parcelas})`, amount / parcelas, type, category, pd, holderName, finalHolderId);
                }
            } else {
                addTransaction(description, amount, type, category, date, holderName, finalHolderId);
            }
            form.reset();
            transactionDateInput.value = formatDateToString(new Date());
        });

        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('new-category-name').value;
            const type = document.getElementById('new-category-type').value;
            const color = document.getElementById('new-category-color').value;
            addCategory(name, type, color);
            categoryForm.reset();
            document.getElementById('new-category-color').value = '#3498db';
        });

        holderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('new-holder-name').value;
            addHolder(name);
            holderForm.reset();
        });

        prevPeriodBtn.addEventListener('click', function() {
            if (periodMode === 'standard') {
                const s = new Date(customStartDate), e2 = new Date(customEndDate);
                s.setMonth(s.getMonth() - 1); e2.setMonth(e2.getMonth() - 1);
                customStartDate = s; customEndDate = e2;
                startDateInput.value = formatDateToString(s);
                endDateInput.value = formatDateToString(e2);
                updatePeriodDisplay();
            }
        });
        nextPeriodBtn.addEventListener('click', function() {
            if (periodMode === 'standard') {
                const s = new Date(customStartDate), e2 = new Date(customEndDate);
                s.setMonth(s.getMonth() + 1); e2.setMonth(e2.getMonth() + 1);
                customStartDate = s; customEndDate = e2;
                startDateInput.value = formatDateToString(s);
                endDateInput.value = formatDateToString(e2);
                updatePeriodDisplay();
            }
        });
        periodStandardBtn.addEventListener('click', function() {
            periodMode = 'standard';
            periodStandardBtn.classList.add('active-mode');
            periodCustomBtn.classList.remove('active-mode');
            setupStandardPeriod();
            periodNav.style.display = 'flex';
        });
        periodCustomBtn.addEventListener('click', function() {
            periodMode = 'custom';
            periodCustomBtn.classList.add('active-mode');
            periodStandardBtn.classList.remove('active-mode');
            customStartDate = createDateFromString(startDateInput.value);
            customEndDate = createDateFromString(endDateInput.value);
            updatePeriodDisplay();
            periodNav.style.display = 'none';
        });
        applyPeriodBtn.addEventListener('click', function() {
            if (periodMode === 'custom') {
                const s = createDateFromString(startDateInput.value);
                const e2 = createDateFromString(endDateInput.value);
                if (s && e2 && s <= e2) {
                    customStartDate = s; customEndDate = e2;
                    updatePeriodDisplay();
                } else { alert('Período inválido.'); }
            }
        });

        closeDetailBtn.addEventListener('click', () => categoryDetail.classList.remove('show'));
        if (holderDetailClose) {
            holderDetailClose.addEventListener('click', () => holderDetail.classList.remove('show'));
        }
        voiceBtn.addEventListener('click', toggleListening);
        voiceStatusClose.addEventListener('click', () => { stopListening(); hideVoiceStatus(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && reviewModal.classList.contains('show')) closeReviewModal();
        });
    }

    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                if (tabId === 'reports') {
                    renderCharts();
                    renderHolderTotals();
                }
            });
        });
    }

    // ========== TRANSAÇÕES ==========
    function addTransaction(description, amount, type, category, date, holderName, holderId) {
        transactions.push({
            id: Date.now() + Math.random(),
            description, amount, type, category,
            date: formatDateToDisplay(date),
            timestamp: date.getTime(),
            month: date.getMonth(),
            year: date.getFullYear(),
            holder: holderName || null,
            holderId: holderId || null,
            installment: null
        });
        saveTransactions();
        renderTransactions();
        updateSummary();
        renderHolderTotals();
    }

    function deleteTransaction(id) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactions();
        updateSummary();
        renderHolderTotals();
    }

    function saveTransactions() { localStorage.setItem('transactions', JSON.stringify(transactions)); }

    function renderTransactions() {
        transactionsList.innerHTML = '';
        const period = getPeriodTransactions();

        transactionsCountEl.textContent = period.length === 1
            ? '1 lançamento'
            : `${period.length} lançamentos`;

        if (period.length === 0) {
            transactionsList.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhuma transação cadastrada para este período</p></div>`;
            return;
        }
        [...period].sort((a, b) => b.timestamp - a.timestamp).forEach(tx => {
            const li = document.createElement('li');
            const cat = categories.find(c => c.id === tx.category);
            const catColor = cat ? cat.color : '#95a5a6';
            const catName = cat ? cat.name : tx.category;
            const holderHtml = tx.holder ? `<span class="holder-badge"><i class="fas fa-user"></i> ${escapeHtml(tx.holder)}</span>` : '';
            li.innerHTML = `
                <div class="transaction-info">
                    <strong>${escapeHtml(tx.description)}</strong>
                    <small>
                        <span class="category-badge" style="background-color: ${catColor}">${catName}</span>
                        ${holderHtml}
                        • ${tx.date}
                    </small>
                </div>
                <div class="transaction-amount" style="color: ${tx.type === 'receita' ? 'var(--accent-green)' : 'var(--accent-red)'}">
                    ${tx.type === 'receita' ? '+' : '-'} R$ ${tx.amount.toFixed(2)}
                </div>
                <div class="transaction-actions">
                    <button class="danger" onclick="window.deleteTransaction(${tx.id})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            transactionsList.appendChild(li);
        });
    }

    function updateSummary() {
        const period = getPeriodTransactions();
        const incTx = period.filter(t => t.type === 'receita');
        const expTx = period.filter(t => t.type === 'despesa');
        const inc = incTx.reduce((s, t) => s + parseFloat(t.amount), 0);
        const exp = expTx.reduce((s, t) => s + parseFloat(t.amount), 0);
        const totalCount = period.length;

        totalIncomeElement.textContent = `R$ ${inc.toFixed(2)}`;
        totalExpenseElement.textContent = `R$ ${exp.toFixed(2)}`;
        balanceElement.textContent = `R$ ${(inc - exp).toFixed(2)}`;
        balanceElement.className = (inc - exp) >= 0 ? 'positive' : 'negative';

        countIncomeEl.textContent = incTx.length === 1 ? '(1 lançamento)' : `(${incTx.length} lançamentos)`;
        countExpenseEl.textContent = expTx.length === 1 ? '(1 lançamento)' : `(${expTx.length} lançamentos)`;
        countTotalEl.textContent = totalCount === 1 ? '(1 lançamento no total)' : `(${totalCount} lançamentos no total)`;
    }

    // ========== TOTAIS POR PORTADOR ==========
    function renderHolderTotals() {
        if (!holderTotalsContainer) return;
        holderTotalsContainer.innerHTML = '';

        const period = getPeriodTransactions();
        if (period.length === 0) {
            holderTotalsContainer.innerHTML = `
                <div class="holder-totals-empty">
                    <i class="fas fa-users"></i>
                    Nenhum lançamento no período selecionado.
                </div>
            `;
            return;
        }

        // Agrupar por portador (usa holderId se existir; senão casa por nome)
        const byHolder = new Map(); // holderId -> { holder, cards: Map(cardNumber -> {despesas, receitas, txs}) }

        function resolveHolderId(tx) {
            if (tx.holderId && holders.find(h => h.id === tx.holderId)) return tx.holderId;
            if (tx.holder) {
                const key = holderKeyFromName(tx.holder);
                const found = holders.find(h => holderKeyFromName(h.name) === key);
                if (found) return found.id;
            }
            return null; // sem portador identificado
        }

        period.forEach(tx => {
            const hid = resolveHolderId(tx);
            const holderObj = hid ? holders.find(h => h.id === hid) : null;
            const groupKey = hid || '__sem_portador__';
            if (!byHolder.has(groupKey)) {
                byHolder.set(groupKey, {
                    holder: holderObj || { id: '__sem_portador__', name: 'Sem portador', active: true, isDefault: false },
                    cards: new Map()
                });
            }
            const entry = byHolder.get(groupKey);
            const cardKey = tx.cardNumber || '__sem_cartao__';
            if (!entry.cards.has(cardKey)) {
                entry.cards.set(cardKey, { despesas: 0, receitas: 0, count: 0, txs: [] });
            }
            const cardEntry = entry.cards.get(cardKey);
            if (tx.type === 'receita') cardEntry.receitas += parseFloat(tx.amount);
            else cardEntry.despesas += parseFloat(tx.amount);
            cardEntry.count++;
            cardEntry.txs.push(tx);
        });

        // Ordenar: portadores ativos primeiro, "Sem portador" por último
        const sortedEntries = [...byHolder.entries()].sort((a, b) => {
            const ha = a[1].holder, hb = b[1].holder;
            if (ha.id === '__sem_portador__') return 1;
            if (hb.id === '__sem_portador__') return -1;
            return ha.name.localeCompare(hb.name, 'pt-BR');
        });

        sortedEntries.forEach(([holderId, data]) => {
            const card = document.createElement('div');
            card.className = 'holder-totals-card' + (data.holder.active === false ? ' inactive' : '');

            // Soma total do portador
            let totalDesp = 0, totalRec = 0;
            data.cards.forEach(c => { totalDesp += c.despesas; totalRec += c.receitas; });
            const totalLiquido = totalDesp - totalRec;

            const badges = [];
            if (data.holder.isDefault) badges.push('<span class="holder-badge" style="background:var(--accent-blue);color:white;border:none">padrão</span>');
            if (data.holder.active === false) badges.push('<span class="holder-badge">excluído</span>');

            // Cabeçalho
            const header = document.createElement('div');
            header.className = 'holder-card-header';
            header.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <div class="holder-name">${escapeHtml(data.holder.name)} ${badges.join(' ')}</div>
            `;
            card.appendChild(header);

            // Resumo do portador
            const summary = document.createElement('div');
            summary.className = 'holder-card-summary';
            const summaryValueClass = (totalRec > 0 && totalDesp === 0) ? 'summary-value receita-only' : 'summary-value';
            let summaryHtml = `<span class="summary-label">Total no período</span>`;
            if (totalRec > 0) {
                summaryHtml += `<span class="${summaryValueClass}">${fmtBRL(totalLiquido)}</span>`;
            } else {
                summaryHtml += `<span class="${summaryValueClass}">${fmtBRL(totalDesp)}</span>`;
            }
            summary.innerHTML = summaryHtml;
            card.appendChild(summary);

            // Lista de cartões
            const cardsList = document.createElement('div');
            cardsList.className = 'holder-card-cards-list';

            // Ordenar cartões: com número primeiro (asc), "Sem cartão" por último
            const sortedCards = [...data.cards.entries()].sort((a, b) => {
                if (a[0] === '__sem_cartao__') return 1;
                if (b[0] === '__sem_cartao__') return -1;
                return a[0].localeCompare(b[0]);
            });

            sortedCards.forEach(([cardNumber, cdata]) => {
                const chip = document.createElement('div');
                chip.className = 'card-chip';
                chip.setAttribute('role', 'button');
                chip.setAttribute('tabindex', '0');

                const label = cardNumber === '__sem_cartao__' ? 'Sem cartão' : `Cartão ${cardNumber}`;
                const icon = cardNumber === '__sem_cartao__' ? 'fa-tag' : 'fa-credit-card';

                const total = cdata.despesas - cdata.receitas;
                const valueClass = (cdata.receitas > 0 && cdata.despesas === 0) ? 'chip-value receita' : 'chip-value';
                const countLabel = cdata.count === 1 ? '1 lançamento' : `${cdata.count} lançamentos`;

                chip.innerHTML = `
                    <div class="chip-left">
                        <i class="fas ${icon}"></i>
                        <span class="chip-label">${escapeHtml(label)}</span>
                    </div>
                    <div class="chip-right">
                        <span class="${valueClass}">${fmtBRL(total)}</span>
                        <span class="chip-count">${countLabel}</span>
                    </div>
                `;

                chip.addEventListener('click', () => {
                    showCardDetails(data.holder, cardNumber, cdata.txs);
                });
                chip.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showCardDetails(data.holder, cardNumber, cdata.txs);
                    }
                });

                cardsList.appendChild(chip);
            });

            card.appendChild(cardsList);
            holderTotalsContainer.appendChild(card);
        });
    }

    function showCardDetails(holder, cardNumber, txs) {
        if (!holderDetail || !holderDetailTitle || !holderDetailList || !holderDetailTotal) return;

        const cardLabel = cardNumber === '__sem_cartao__' ? 'Sem cartão' : `Cartão ${cardNumber}`;
        holderDetailTitle.textContent = `${holder.name} — ${cardLabel}`;

        const sorted = [...txs].sort((a, b) => b.timestamp - a.timestamp);

        let totalDesp = 0, totalRec = 0;
        sorted.forEach(tx => {
            if (tx.type === 'receita') totalRec += parseFloat(tx.amount);
            else totalDesp += parseFloat(tx.amount);
        });
        const liquido = totalDesp - totalRec;

        const ul = document.createElement('ul');
        sorted.forEach(tx => {
            const li = document.createElement('li');
            const cat = categories.find(c => c.id === tx.category);
            const catColor = cat ? cat.color : '#95a5a6';
            const catName = cat ? cat.name : tx.category;
            const valueClass = tx.type === 'receita' ? 'tx-value receita' : 'tx-value despesa';
            const sign = tx.type === 'receita' ? '+' : '-';

            li.innerHTML = `
                <div class="tx-info">
                    <strong>${escapeHtml(tx.description)}</strong>
                    <small>
                        <span class="category-badge" style="background-color: ${catColor}">${catName}</span>
                        • ${tx.date}
                        ${tx.installment ? ' • Parcela ' + escapeHtml(tx.installment) : ''}
                    </small>
                </div>
                <div class="${valueClass}">${sign} ${fmtBRL(parseFloat(tx.amount))}</div>
            `;
            ul.appendChild(li);
        });

        holderDetailList.innerHTML = '';
        holderDetailList.appendChild(ul);

        let totalHtml = `Total: <strong>${fmtBRL(liquido)}</strong>`;
        if (totalRec > 0) {
            totalHtml += ` <small style="color:var(--text-secondary);font-weight:normal;">(despesas ${fmtBRL(totalDesp)} − receitas ${fmtBRL(totalRec)})</small>`;
        }
        holderDetailTotal.innerHTML = totalHtml;

        holderDetail.classList.add('show');
        holderDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ========== PORTADORES ==========
    function addHolder(name) {
        const id = makeHolderIdFromName(name);
        if (!id) return;
        if (holders.find(h => h.id === id)) { alert('Já existe!'); return; }
        const key = holderKeyFromName(name);
        if (key && holders.find(h => holderKeyFromName(h.name) === key)) {
            alert('Já existe um portador com esse nome (mesmo primeiro e último nome).');
            return;
        }
        holders.push({ id, name, active: true, isDefault: false });
        saveHolders();
        updateHoldersDropdown();
        renderHolders();
        renderHolderTotals();
    }
    function editHolder(id, newName) {
        const h = holders.find(x => x.id === id);
        if (!h) return;
        const oldName = h.name;
        h.name = newName;
        saveHolders();
        let changed = 0;
        transactions.forEach(tx => { if (tx.holder === oldName) { tx.holder = newName; changed++; } });
        if (changed > 0) saveTransactions();
        updateHoldersDropdown();
        renderHolders();
        renderTransactions();
        renderHolderTotals();
    }
    function deleteHolder(id) {
        const h = holders.find(x => x.id === id);
        if (!h) return;
        if (h.isDefault) { alert('Não é possível excluir o portador padrão.'); return; }
        const count = transactions.filter(t => t.holder === h.name).length;
        if (!confirm(`Marcar "${h.name}" como excluído?\n\n${count} transações continuam no histórico.`)) return;
        h.active = false;
        saveHolders();
        updateHoldersDropdown();
        renderHolders();
        renderHolderTotals();
    }
    function saveHolders() { localStorage.setItem('holders', JSON.stringify(holders)); }
    function updateHoldersDropdown() {
        holderSelect.innerHTML = '<option value="">(usar padrão)</option>';
        holders.filter(h => h.active).forEach(h => {
            const o = document.createElement('option');
            o.value = h.id;
            o.textContent = h.name + (h.isDefault ? ' (padrão)' : '');
            holderSelect.appendChild(o);
        });
    }
    function renderHolders() {
        holdersList.innerHTML = '';
        const active = holders.filter(h => h.active);
        const inactive = holders.filter(h => !h.active);
        if (active.length) {
            const h = document.createElement('h3'); h.textContent = 'Ativos'; h.style.gridColumn = '1 / -1'; h.style.marginTop = '20px';
            holdersList.appendChild(h);
            active.forEach(x => holdersList.appendChild(createHolderElement(x)));
        }
        if (inactive.length) {
            const h = document.createElement('h3'); h.textContent = 'Excluídos'; h.style.gridColumn = '1 / -1'; h.style.marginTop = '20px'; h.style.color = 'var(--text-secondary)';
            holdersList.appendChild(h);
            inactive.forEach(x => holdersList.appendChild(createHolderElement(x)));
        }
    }
    function createHolderElement(holder) {
        const el = document.createElement('div');
        el.className = 'category-card';
        if (!holder.active) el.style.opacity = '0.5';
        const badges = [];
        if (holder.isDefault) badges.push('<span class="holder-badge" style="background:var(--accent-blue);color:white;border:none">padrão</span>');
        if (!holder.active) badges.push('<span class="holder-badge">excluído</span>');
        el.innerHTML = `
            <i class="fas fa-user-circle" style="font-size:1.5rem;color:var(--accent-blue)"></i>
            <div class="category-name">${escapeHtml(holder.name)} ${badges.join(' ')}</div>
            <button class="secondary" onclick="window.editHolder('${holder.id}')"><i class="fas fa-edit"></i></button>
            ${!holder.isDefault ? `<button class="danger" onclick="window.deleteHolder('${holder.id}')"><i class="fas fa-trash"></i></button>` : ''}
        `;
        return el;
    }

    // ========== CATEGORIAS ==========
    function addCategory(name, type, color) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        if (categories.find(c => c.id === id)) { alert('Já existe!'); return; }
        categories.push({ id, name, type, color });
        saveCategories();
        updateCategoriesDropdown();
        renderCategories();
    }
    function deleteCategory(id) {
        if (transactions.filter(t => t.category === id).length > 0) {
            alert('Não é possível excluir: existem transações vinculadas!');
            return;
        }
        categories = categories.filter(c => c.id !== id);
        saveCategories();
        updateCategoriesDropdown();
        renderCategories();
    }
    function saveCategories() { localStorage.setItem('categories', JSON.stringify(categories)); }
    function updateCategoriesDropdown() {
        categorySelect.innerHTML = '';
        const exp = categories.filter(c => c.type === 'despesa');
        const inc = categories.filter(c => c.type === 'receita');
        if (exp.length) {
            const g = document.createElement('optgroup'); g.label = 'Despesas';
            exp.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; g.appendChild(o); });
            categorySelect.appendChild(g);
        }
        if (inc.length) {
            const g = document.createElement('optgroup'); g.label = 'Receitas';
            inc.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; g.appendChild(o); });
            categorySelect.appendChild(g);
        }
    }
    function renderCategories() {
        categoriesList.innerHTML = '';
        const exp = categories.filter(c => c.type === 'despesa');
        const inc = categories.filter(c => c.type === 'receita');
        if (exp.length) {
            const h = document.createElement('h3'); h.textContent = 'Despesas'; h.style.gridColumn = '1 / -1'; h.style.marginTop = '20px';
            categoriesList.appendChild(h);
            exp.forEach(c => categoriesList.appendChild(createCategoryElement(c)));
        }
        if (inc.length) {
            const h = document.createElement('h3'); h.textContent = 'Receitas'; h.style.gridColumn = '1 / -1'; h.style.marginTop = '20px';
            categoriesList.appendChild(h);
            inc.forEach(c => categoriesList.appendChild(createCategoryElement(c)));
        }
    }
    function createCategoryElement(category) {
        const el = document.createElement('div');
        el.className = 'category-card';
        el.innerHTML = `
            <div class="category-color" style="background-color: ${category.color}"></div>
            <div class="category-name">${escapeHtml(category.name)}</div>
            <button class="danger" onclick="window.deleteCategory('${category.id}')"><i class="fas fa-trash"></i></button>
        `;
        return el;
    }

    // ========== GRÁFICOS ==========
    function isDarkMode() { return document.body.classList.contains('dark-mode'); }
    function renderCharts() { renderExpensesChart(); renderIncomeVsExpensesChart(); }

    function renderExpensesChart() {
        const ctx = document.getElementById('expenses-chart').getContext('2d');
        const dark = isDarkMode();
        const textColor = dark ? '#e8eaed' : '#2c3e50';
        const period = getPeriodTransactions();
        const byCat = {};
        period.filter(t => t.type === 'despesa').forEach(t => {
            byCat[t.category] = (byCat[t.category] || 0) + parseFloat(t.amount);
        });
        const labels = [], data = [], bg = [], catIds = [];
        Object.keys(byCat).forEach(cid => {
            const c = categories.find(x => x.id === cid);
            if (c) { labels.push(c.name); data.push(byCat[cid]); bg.push(c.color); catIds.push(cid); }
        });
        if (window.expensesChart) window.expensesChart.destroy();
        if (data.length > 0) {
            window.expensesChart = new Chart(ctx, {
                type: 'pie',
                data: { labels, datasets: [{ data, backgroundColor: bg, borderWidth: 1, borderColor: dark ? '#242830' : '#ffffff' }] },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
                    onClick: (e, els) => { if (els.length > 0) showCategoryDetails(catIds[els[0].index]); }
                }
            });
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = dark ? '#a0a4ab' : '#7f8c8d'; ctx.textAlign = 'center';
            ctx.fillText('Nenhuma despesa para exibir', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }

    function showCategoryDetails(categoryId) {
        const period = getPeriodTransactions();
        const cat = categories.find(c => c.id === categoryId);
        if (!cat) return;
        const txs = period.filter(t => t.category === categoryId && t.type === 'despesa').sort((a, b) => b.timestamp - a.timestamp);
        if (txs.length === 0) { alert('Nenhuma transação.'); return; }
        const total = txs.reduce((s, t) => s + parseFloat(t.amount), 0);
        detailCategoryName.textContent = `${cat.name} (Despesas)`;
        detailTotal.textContent = `R$ ${total.toFixed(2)}`;
        detailTransactionsList.innerHTML = '';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none'; ul.style.padding = '0';
        txs.forEach(tx => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid var(--border-light)';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            const holderHtml = tx.holder ? ` • <span class="holder-badge">${escapeHtml(tx.holder)}</span>` : '';
            li.innerHTML = `
                <div>
                    <strong>${escapeHtml(tx.description)}</strong><br>
                    <small style="color:var(--text-secondary)">${tx.date}${holderHtml}</small>
                </div>
                <div style="font-weight: bold; color: var(--accent-red);">- R$ ${tx.amount.toFixed(2)}</div>
            `;
            ul.appendChild(li);
        });
        detailTransactionsList.appendChild(ul);
        categoryDetail.classList.add('show');
        categoryDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderIncomeVsExpensesChart() {
        const ctx = document.getElementById('income-vs-expenses-chart').getContext('2d');
        const dark = isDarkMode();
        const textColor = dark ? '#e8eaed' : '#2c3e50';
        const gridColor = dark ? '#3a3f47' : '#eeeeee';
        const monthly = {};
        const mn = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = `${mn[d.getMonth()]}/${d.getFullYear()}`;
            monthly[label] = { income: 0, expense: 0 };
            transactions.forEach(tx => {
                if (tx.month === d.getMonth() && tx.year === d.getFullYear()) {
                    if (tx.type === 'receita') monthly[label].income += parseFloat(tx.amount);
                    else monthly[label].expense += parseFloat(tx.amount);
                }
            });
        }
        const labels = Object.keys(monthly);
        const incData = labels.map(l => monthly[l].income);
        const expData = labels.map(l => monthly[l].expense);
        if (window.incomeVsExpensesChart) window.incomeVsExpensesChart.destroy();
        if (labels.length > 0) {
            window.incomeVsExpensesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Receitas', data: incData, backgroundColor: '#27ae60', borderWidth: 1 },
                        { label: 'Despesas', data: expData, backgroundColor: '#e74c3c', borderWidth: 1 }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
                        x: { ticks: { color: textColor }, grid: { color: gridColor } }
                    },
                    plugins: { legend: { labels: { color: textColor } } }
                }
            });
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial'; ctx.fillStyle = dark ? '#a0a4ab' : '#7f8c8d'; ctx.textAlign = 'center';
            ctx.fillText('Nenhum dado para exibir', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }

    // ========== GLOBAIS ==========
    window.deleteTransaction = deleteTransaction;
    window.deleteCategory = deleteCategory;
    window.deleteHolder = deleteHolder;
    window.editHolder = function(id) {
        const h = holders.find(x => x.id === id);
        if (!h) return;
        const newName = prompt('Novo nome:', h.name);
        if (newName && newName.trim() && newName.trim() !== h.name) editHolder(id, newName.trim());
    };

    window.debugImport = {
        getPreview: () => importPreview,
        getTransactions: () => transactions,
        collectReviewData,
        confirmImport
    };
});
