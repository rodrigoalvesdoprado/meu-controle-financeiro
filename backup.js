/* ============================================================
   BACKUP.JS
   Exportação e importação de todos os dados do app em arquivo .txt.
   - Exportação: serializa o localStorage em um arquivo legível.
   - Importação: lê o arquivo, valida, e substitui TODOS os dados.
   - Sem criptografia (decisão de projeto).
   - A chave da API NÃO é incluída por segurança.
   ============================================================ */

(function () {
    'use strict';

    // ========== CONSTANTES ==========

    // Chaves do localStorage que NÃO entram no backup (segurança)
    const EXCLUDED_KEYS = ['brapiKey'];

    // Cabeçalhos do arquivo de backup
    const HEADER_START = '=== MEU CONTROLE FINANCEIRO - BACKUP ===';
    const DATA_START   = '--- INÍCIO DOS DADOS (JSON) ---';
    const DATA_END     = '--- FIM DOS DADOS (JSON) ---';

    // Versão do formato do backup (para futuras migrações)
    const BACKUP_VERSION = '1.0';

    // ========== UTILITÁRIOS ==========

    /**
     * Coleta todas as chaves do localStorage que pertencem ao app
     * (exceto as excluídas por segurança).
     */
    function collectAppData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (EXCLUDED_KEYS.includes(key)) continue;

            const raw = localStorage.getItem(key);
            if (raw === null) continue;

            // Tenta parsear como JSON; se não for JSON, guarda como string
            try {
                data[key] = JSON.parse(raw);
            } catch (_) {
                data[key] = raw;
            }
        }
        return data;
    }

    /**
     * Formata a data atual no padrão DD-MM-AAAA-HHhMM
     * para compor o nome do arquivo.
     */
    function formatBackupFileName(date) {
        const d = date || new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `backup-financeiro-${dd}-${mm}-${yyyy}-${hh}h${min}.txt`;
    }

    /**
     * Formata a data por extenso (para o cabeçalho legível do arquivo).
     */
    function formatHumanDate(date) {
        const d = date || new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const sec = String(d.getSeconds()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;
    }

    /**
     * Conta itens de um array com segurança.
     */
    function countArray(arr) {
        return Array.isArray(arr) ? arr.length : 0;
    }

    /**
     * Mostra toast (reaproveita o showToast do app.js, se existir).
     * Se não existir, cai num alert simples.
     */
    function notify(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'success');
        } else {
            alert(message);
        }
    }

    // ========== EXPORTAÇÃO ==========

    /**
     * Monta o conteúdo textual do arquivo de backup.
     */
    function buildBackupContent() {
        const data = collectAppData();
        const now = new Date();

        const summary = {
            titulares:     countArray(data.owners),
            ativos:        countArray(data.assets),
            movimentacoes: countArray(data.investmentTxs),
            transacoes:    countArray(data.transactions),
            categorias:    countArray(data.categories),
            portadores:    countArray(data.holders)
        };

        const lines = [];
        lines.push(HEADER_START);
        lines.push(`Versão do backup: ${BACKUP_VERSION}`);
        lines.push(`Data do backup: ${formatHumanDate(now)}`);
        lines.push('');
        lines.push(`Titulares: ${summary.titulares}`);
        lines.push(`Ativos: ${summary.ativos}`);
        lines.push(`Movimentações: ${summary.movimentacoes}`);
        lines.push(`Transações: ${summary.transacoes}`);
        lines.push(`Categorias: ${summary.categorias}`);
        lines.push(`Portadores: ${summary.portadores}`);
        lines.push('');
        lines.push('Aviso: este arquivo NÃO é criptografado. Guarde em local seguro.');
        lines.push('Aviso: a chave da API brapi.dev NÃO é incluída neste backup.');
        lines.push('');
        lines.push(DATA_START);
        lines.push(JSON.stringify(data, null, 2));
        lines.push(DATA_END);
        lines.push('');
        lines.push(`=== FIM DO BACKUP - ${formatHumanDate(now)} ===`);

        return { content: lines.join('\n'), summary, data };
    }

    /**
     * Dispara o download do arquivo de backup.
     */
    function exportBackup() {
        try {
            const { content, summary } = buildBackupContent();
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = formatBackupFileName(new Date());
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Libera o objeto após um pequeno delay (alguns navegadores precisam)
            setTimeout(() => URL.revokeObjectURL(url), 1000);

            notify(
                `Backup exportado: ${summary.transacoes} transações, ${summary.ativos} ativos.`,
                'success'
            );
        } catch (err) {
            console.error('[backup.js] Erro ao exportar:', err);
            notify('Erro ao exportar backup.', 'error');
        }
    }

    // ========== IMPORTAÇÃO ==========

    /**
     * Extrai o JSON do conteúdo do arquivo de backup.
     * Retorna o objeto parseado ou lança erro.
     */
    function extractDataFromBackup(content) {
        if (typeof content !== 'string' || content.trim().length === 0) {
            throw new Error('Arquivo vazio.');
        }

        const startIdx = content.indexOf(DATA_START);
        const endIdx   = content.indexOf(DATA_END);

        if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
            throw new Error('Cabeçalhos do backup não encontrados.');
        }

        const jsonText = content.substring(startIdx + DATA_START.length, endIdx).trim();

        let parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (err) {
            throw new Error('JSON inválido no arquivo de backup.');
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Estrutura de dados inesperada.');
        }

        return parsed;
    }

    /**
     * Valida minimamente o objeto de backup.
     * Não é rigoroso — apenas verifica se tem as chaves essenciais.
     */
    function validateBackupData(data) {
        // Pelo menos uma dessas chaves precisa existir e ser array
        const requiredAny = ['transactions', 'categories', 'holders'];
        const hasAny = requiredAny.some(k => Array.isArray(data[k]));
        if (!hasAny) {
            throw new Error('Backup não parece ser deste app.');
        }
        return true;
    }

    /**
     * Lê o arquivo selecionado e abre o modal de confirmação.
     */
    function handleImportFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const content = e.target.result;
                const data = extractDataFromBackup(content);
                validateBackupData(data);

                // Guarda temporariamente para confirmar depois
                pendingImport = { data, fileName: file.name };

                openBackupModal(data, file.name);
            } catch (err) {
                console.error('[backup.js] Erro ao ler backup:', err);
                notify('Arquivo de backup inválido.', 'error');
            }
        };
        reader.onerror = function () {
            notify('Erro ao ler o arquivo.', 'error');
        };
        reader.readAsText(file, 'UTF-8');
    }

    // Estado temporário do backup pendente de confirmação
    let pendingImport = null;

    /**
     * Abre o modal de confirmação exibindo o resumo do backup.
     */
    function openBackupModal(data, fileName) {
        const contentEl = document.getElementById('backupModalContent');
        const summaryEl = document.getElementById('backupModalSummary');
        if (!contentEl || !summaryEl) return;

        const counts = {
            transactions:    countArray(data.transactions),
            categories:      countArray(data.categories),
            holders:         countArray(data.holders),
            owners:          countArray(data.owners),
            assets:          countArray(data.assets),
            investmentTxs:   countArray(data.investmentTxs),
            quotesCache:     (data.quotesCache && typeof data.quotesCache === 'object') ? Object.keys(data.quotesCache).length : 0,
            quotesHistory:   (data.quotesHistory && typeof data.quotesHistory === 'object') ? Object.keys(data.quotesHistory).length : 0
        };

        const dateInfo = data.__backupDate || 'data desconhecida';

        contentEl.innerHTML = `
            <p style="margin-bottom:12px;">
                Arquivo: <strong>${escapeHtmlText(fileName)}</strong>
            </p>
            <ul>
                <li><span class="label">Transações</span><span class="value">${counts.transactions}</span></li>
                <li><span class="label">Categorias</span><span class="value">${counts.categories}</span></li>
                <li><span class="label">Portadores</span><span class="value">${counts.holders}</span></li>
                <li><span class="label">Titulares</span><span class="value">${counts.owners}</span></li>
                <li><span class="label">Ativos</span><span class="value">${counts.assets}</span></li>
                <li><span class="label">Movimentações</span><span class="value">${counts.investmentTxs}</span></li>
                <li><span class="label">Cotações em cache</span><span class="value">${counts.quotesCache}</span></li>
                <li><span class="label">Snapshots de histórico</span><span class="value">${counts.quotesHistory}</span></li>
            </ul>
            <div class="warning-box">
                ⚠️ <strong>Atenção:</strong> ao confirmar, <u>todos</u> os dados atuais do app serão
                <strong>substituídos</strong> pelos dados deste arquivo. Esta ação não pode ser desfeita.
            </div>
        `;

        summaryEl.innerHTML = `
            <span>Pronto para substituir tudo</span>
        `;

        const modal = document.getElementById('backupModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Fecha o modal de backup.
     */
    function closeBackupModal() {
        const modal = document.getElementById('backupModal');
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = '';
        pendingImport = null;

        // Limpa o input de arquivo (para permitir reimportar o mesmo arquivo)
        const fileInput = document.getElementById('backupImportFile');
        if (fileInput) fileInput.value = '';
    }

    /**
     * Aplica o backup pendente: substitui tudo no localStorage e recarrega.
     */
    function confirmBackupImport() {
        if (!pendingImport || !pendingImport.data) {
            notify('Nenhum backup pendente.', 'error');
            return;
        }

        try {
            const data = pendingImport.data;

            // Remove apenas as chaves do app (preserva outras que possam existir)
            // Como o backup é "substituir tudo", removemos todas as chaves do app
            // que NÃO estão no backup (exceto as excluídas por segurança).
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (EXCLUDED_KEYS.includes(key)) continue;
                if (!(key in data)) keysToRemove.push(key);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Escreve todos os dados do backup
            Object.keys(data).forEach(key => {
                if (EXCLUDED_KEYS.includes(key)) return;
                const value = data[key];
                const serialized = (typeof value === 'string') ? value : JSON.stringify(value);
                localStorage.setItem(key, serialized);
            });

            // Fecha modal e recarrega
            const modal = document.getElementById('backupModal');
            if (modal) modal.classList.remove('show');
            document.body.style.overflow = '';
            pendingImport = null;

            notify('Backup restaurado. Recarregando...', 'success');

            // Pequeno delay para o toast aparecer antes do reload
            setTimeout(() => window.location.reload(), 900);
        } catch (err) {
            console.error('[backup.js] Erro ao restaurar:', err);
            notify('Erro ao restaurar backup.', 'error');
        }
    }

    /**
     * Escape simples para HTML (evita injeção no nome do arquivo).
     */
    function escapeHtmlText(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[m]);
    }

    // ========== INICIALIZAÇÃO ==========

    /**
     * Conecta os botões de exportação e importação.
     * Chamado quando o DOM estiver pronto.
     */
    function setupBackupListeners() {
        const exportBtn = document.getElementById('backupExportBtn');
        const importBtn = document.getElementById('backupImportBtn');
        const importFile = document.getElementById('backupImportFile');
        const cancelBtn = document.getElementById('backupCancelBtn');
        const confirmBtn = document.getElementById('backupConfirmBtn');

        if (exportBtn) {
            exportBtn.addEventListener('click', exportBackup);
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleImportFile(file);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeBackupModal);
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmBackupImport);
        }

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('backupModal');
                if (modal && modal.classList.contains('show')) {
                    closeBackupModal();
                }
            }
        });
    }

    // Expõe API pública
    window.Backup = {
        exportBackup,
        setupListeners: setupBackupListeners,
        // Debug:
        _collectAppData: collectAppData,
        _buildBackupContent: buildBackupContent,
        _extractDataFromBackup: extractDataFromBackup
    };

    // Auto-inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupBackupListeners);
    } else {
        setupBackupListeners();
    }

})();
