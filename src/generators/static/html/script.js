// BookForge 客户端脚本 (ESM)

let searchIndexPromise = null;

function normalizeText(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function flattenHeadingMatches(headings, query) {
    const normalizedQuery = normalizeText(query);
    return (headings || []).filter((heading) => normalizeText(heading.text).includes(normalizedQuery));
}

function scoreEntry(entry, query) {
    const normalizedQuery = normalizeText(query);
    const titleText = normalizeText(entry.title);
    const contentText = normalizeText(entry.content);
    const headingMatches = flattenHeadingMatches(entry.headings || [], query);
    let score = 0;

    if (titleText.includes(normalizedQuery)) {
        score += titleText === normalizedQuery ? 120 : 80;
    }
    if (headingMatches.length > 0) {
        score += 40 + headingMatches.length * 8;
    }
    if (contentText.includes(normalizedQuery)) {
        score += 20;
    }

    return {
        score,
        headingMatches
    };
}

async function loadSearchIndex() {
    if (!searchIndexPromise) {
        searchIndexPromise = fetch('./search-index.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load search index: ${response.status}`);
                }
                return response.json();
            })
            .then(data => Array.isArray(data.pages) ? data.pages : [])
            .catch(error => {
                console.error(error);
                return [];
            });
    }
    return searchIndexPromise;
}

async function textSearch(query, maxResults = 8) {
    const pages = await loadSearchIndex();
    return pages
        .map(entry => {
            const result = scoreEntry(entry, query);
            return { ...entry, ...result };
        })
        .filter(entry => entry.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, maxResults);
}

// 平滑滚动到锚点
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = (this.getAttribute('href') || '').substring(1);
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// 侧边栏切换功能
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const hasSidebar = Boolean(sidebarToggle && sidebar);
const SIDEBAR_STORAGE_KEY = 'sidebar-hidden';

function isMobile() {
    return window.innerWidth <= 768;
}

function toggleSidebar() {
    if (!hasSidebar) {
        return;
    }
    if (isMobile()) {
        sidebar.classList.toggle('open');
        return;
    }

    const isCurrentlyHidden = sidebar.classList.contains('hidden');
    if (isCurrentlyHidden) {
        sidebar.classList.remove('hidden');
        localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
    } else {
        sidebar.classList.add('hidden');
        localStorage.setItem(SIDEBAR_STORAGE_KEY, 'true');
    }
}

function initSidebar() {
    if (!hasSidebar) {
        return;
    }
    if (isMobile()) {
        sidebar.classList.remove('hidden');
        sidebar.classList.remove('open');
        return;
    }

    const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (savedState === 'true') {
        sidebar.classList.add('hidden');
    } else {
        sidebar.classList.remove('hidden');
    }
    sidebar.classList.remove('open');
}

if (hasSidebar) {
    sidebarToggle.addEventListener('click', toggleSidebar);
    initSidebar();
    window.addEventListener('resize', initSidebar);
}

// 右侧目录树（TOC）切换功能
const tocToggle = document.getElementById('tocToggle');
const toc = document.getElementById('toc');

if (tocToggle && toc) {
    const tocStorageKey = 'toc-hidden';

    function toggleToc() {
        const isCurrentlyHidden = toc.classList.contains('hidden');

        if (isCurrentlyHidden) {
            toc.classList.remove('hidden');
            localStorage.setItem(tocStorageKey, 'false');
        } else {
            toc.classList.add('hidden');
            localStorage.setItem(tocStorageKey, 'true');
        }
    }

    function initToc() {
        const savedState = localStorage.getItem(tocStorageKey);
        if (savedState === 'true') {
            toc.classList.add('hidden');
        } else {
            toc.classList.remove('hidden');
        }
    }

    tocToggle.addEventListener('click', toggleToc);
    initToc();
}

// 全局搜索功能
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

if (searchInput instanceof HTMLInputElement && searchResults) {
    const maxResults = 8;
    let searchTimeout;
    let activeIndex = -1;

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!query) {
            return escapeHtml(text);
        }
        const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig');
        return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    function buildSnippet(content, query) {
        if (!content) {
            return '未提取到正文内容';
        }

        const normalizedContent = content.replace(/\s+/g, ' ').trim();
        if (!query) {
            return normalizedContent.slice(0, 120);
        }

        const lowerContent = normalizedContent.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIndex = lowerContent.indexOf(lowerQuery);

        if (matchIndex === -1) {
            return normalizedContent.slice(0, 120);
        }

        const start = Math.max(0, matchIndex - 40);
        const end = Math.min(normalizedContent.length, matchIndex + query.length + 80);
        const prefix = start > 0 ? '...' : '';
        const suffix = end < normalizedContent.length ? '...' : '';
        return `${prefix}${normalizedContent.slice(start, end)}${suffix}`;
    }

    function setActiveResult(index) {
        const items = searchResults.querySelectorAll('.search-result-item');
        items.forEach((item, itemIndex) => {
            item.classList.toggle('active', itemIndex === index);
        });
        activeIndex = index;
    }

    function closeSearchResults() {
        searchResults.classList.remove('visible');
        searchResults.innerHTML = '';
        activeIndex = -1;
    }

    function renderSearchResults(results, query) {
        if (!query) {
            closeSearchResults();
            return;
        }

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-empty-state">
                    <div class="search-empty-title">未找到匹配结果</div>
                    <div class="search-empty-subtitle">试试更短的关键词，或换一个标题/正文片段。</div>
                </div>
            `;
            searchResults.classList.add('visible');
            activeIndex = -1;
            return;
        }

        searchResults.innerHTML = results.map((result, index) => {
            const heading = result.headingMatches[0];
            const resultUrl = heading ? `${result.url}#${heading.id}` : result.url;
            const snippet = buildSnippet(result.content, query);

            return `
                <a
                    href="${resultUrl}"
                    class="search-result-item"
                    data-result-index="${index}"
                >
                    <div class="search-result-header">
                        <span class="search-result-title">${highlightText(result.title, query)}</span>
                        <span class="search-result-url">${escapeHtml(result.url)}</span>
                    </div>
                    ${heading ? `
                        <div class="search-result-heading">
                            跳转到：${highlightText(heading.text, query)}
                        </div>
                    ` : ''}
                    <div class="search-result-snippet">${highlightText(snippet, query)}</div>
                </a>
            `;
        }).join('');
        searchResults.classList.add('visible');
        setActiveResult(-1);
    }

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            closeSearchResults();
            return;
        }

        searchResults.innerHTML = `
            <div class="search-loading-state">正在检索全站内容...</div>
        `;
        searchResults.classList.add('visible');

        const results = await textSearch(query, maxResults);

        renderSearchResults(results, query);
    }

    function openActiveResult() {
        if (activeIndex < 0) {
            const firstResult = searchResults.querySelector('.search-result-item');
            if (firstResult instanceof HTMLAnchorElement) {
                window.location.href = firstResult.href;
            }
            return;
        }

        const target = searchResults.querySelector(`[data-result-index="${activeIndex}"]`);
        if (target instanceof HTMLAnchorElement) {
            window.location.href = target.href;
        }
    }

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 200);
    });

    searchInput.addEventListener('keydown', function(event) {
        const items = searchResults.querySelectorAll('.search-result-item');

        if (event.key === 'ArrowDown') {
            if (items.length === 0) {
                return;
            }
            event.preventDefault();
            const nextIndex = activeIndex >= items.length - 1 ? 0 : activeIndex + 1;
            setActiveResult(nextIndex);
            return;
        }

        if (event.key === 'ArrowUp') {
            if (items.length === 0) {
                return;
            }
            event.preventDefault();
            const nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
            setActiveResult(nextIndex);
            return;
        }

        if (event.key === 'Enter') {
            if (searchInput.value.trim()) {
                event.preventDefault();
                openActiveResult();
            }
            return;
        }

        if (event.key === 'Escape') {
            closeSearchResults();
            searchInput.blur();
        }
    });

    searchResults.addEventListener('mousemove', function(event) {
        const target = event.target.closest('.search-result-item');
        if (!target) {
            return;
        }
        const index = Number(target.getAttribute('data-result-index'));
        if (!Number.isNaN(index)) {
            setActiveResult(index);
        }
    });

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (
            target instanceof Node
            && !searchResults.contains(target)
            && target !== searchInput
        ) {
            closeSearchResults();
        }
    });

    if (window.location.hash) {
        const targetElement = document.getElementById(window.location.hash.slice(1));
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }
}

// 页面级 AI 问答
const aiEntryButton = document.getElementById('aiEntryButton');
const aiChatOverlay = document.getElementById('aiChatOverlay');
const aiChatPanel = document.getElementById('aiChatPanel');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatStatus = document.getElementById('aiChatStatus');
const aiChatForm = document.getElementById('aiChatForm');
const aiQuestionInput = document.getElementById('aiQuestionInput');
const aiSendButton = document.getElementById('aiSendButton');
const aiSaveConfigButton = document.getElementById('aiSaveConfigButton');
const aiBaseUrlInput = document.getElementById('aiBaseUrlInput');
const aiApiKeyInput = document.getElementById('aiApiKeyInput');
const aiModelInput = document.getElementById('aiModelInput');
const AI_STORAGE_KEYS = {
    baseUrl: 'bookforge-ai-base-url',
    apiKey: 'bookforge-ai-api-key',
    model: 'bookforge-ai-model',
};
const AI_CONTEXT_LIMIT = 12000;
const AI_SUPPLEMENT_LIMIT = 3;
const AI_SUPPLEMENT_SNIPPET_LIMIT = 1200;

if (
    aiEntryButton
    && aiChatOverlay
    && aiChatPanel
    && aiChatClose
    && aiChatMessages
    && aiChatStatus
    && aiChatForm instanceof HTMLFormElement
    && aiQuestionInput instanceof HTMLTextAreaElement
    && aiSendButton instanceof HTMLButtonElement
    && aiSaveConfigButton instanceof HTMLButtonElement
    && aiBaseUrlInput instanceof HTMLInputElement
    && aiApiKeyInput instanceof HTMLInputElement
    && aiModelInput instanceof HTMLInputElement
) {
    let aiRequestPending = false;

    function readAiConfig() {
        return {
            baseUrl: localStorage.getItem(AI_STORAGE_KEYS.baseUrl) || '',
            apiKey: localStorage.getItem(AI_STORAGE_KEYS.apiKey) || '',
            model: localStorage.getItem(AI_STORAGE_KEYS.model) || '',
        };
    }

    function saveAiConfig() {
        localStorage.setItem(AI_STORAGE_KEYS.baseUrl, aiBaseUrlInput.value.trim());
        localStorage.setItem(AI_STORAGE_KEYS.apiKey, aiApiKeyInput.value.trim());
        localStorage.setItem(AI_STORAGE_KEYS.model, aiModelInput.value.trim());
        setAiStatus('配置已保存到当前浏览器。', 'success');
    }

    function syncAiConfigInputs() {
        const config = readAiConfig();
        aiBaseUrlInput.value = config.baseUrl;
        aiApiKeyInput.value = config.apiKey;
        aiModelInput.value = config.model;
    }

    function setAiStatus(message, state = 'info') {
        aiChatStatus.textContent = message;
        aiChatStatus.dataset.state = state;
    }

    function setAiSending(isSending) {
        aiRequestPending = isSending;
        aiSendButton.disabled = isSending;
        aiQuestionInput.disabled = isSending;
        aiBaseUrlInput.disabled = isSending;
        aiApiKeyInput.disabled = isSending;
        aiModelInput.disabled = isSending;
        aiSaveConfigButton.disabled = isSending;
        aiSendButton.textContent = isSending ? '发送中...' : '发送';
    }

    function appendAiMessage(role, content, options = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = `ai-chat-message ai-chat-message-${role}`;
        if (options.pending) {
            wrapper.classList.add('is-pending');
        }

        const roleNode = document.createElement('div');
        roleNode.className = 'ai-chat-message-role';
        roleNode.textContent = role === 'user' ? '你' : 'AI';

        const contentNode = document.createElement('div');
        contentNode.className = 'ai-chat-message-content';
        contentNode.textContent = content;

        wrapper.appendChild(roleNode);
        wrapper.appendChild(contentNode);
        aiChatMessages.appendChild(wrapper);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        return {
            wrapper,
            contentNode,
        };
    }

    function setAiPanelOpen(isOpen) {
        aiChatOverlay.hidden = !isOpen;
        aiChatPanel.classList.toggle('open', isOpen);
        aiChatPanel.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('ai-chat-open', isOpen);
        if (isOpen) {
            setTimeout(() => {
                aiQuestionInput.focus();
            }, 0);
        }
    }

    function normalizeAiBaseUrl(baseUrl) {
        return baseUrl.trim().replace(/\/+$/, '');
    }

    function getCurrentDocumentContext() {
        const contentBody = document.querySelector('.content-body');
        const pageHeading = contentBody?.querySelector('h1');
        const title = (pageHeading?.textContent || document.title || '').trim();
        const rawText = (contentBody?.textContent || '')
            .replace(/\r\n?/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
        return {
            title,
            content: rawText.slice(0, AI_CONTEXT_LIMIT),
        };
    }

    function getCurrentPageUrl() {
        const pathname = window.location.pathname || '';
        if (!pathname || pathname.endsWith('/')) {
            return 'index.html';
        }
        return pathname.split('/').pop() || 'index.html';
    }

    function buildSupplementSnippet(content, query) {
        const normalizedContent = String(content || '').replace(/\s+/g, ' ').trim();
        if (!normalizedContent) {
            return '';
        }

        if (!query) {
            return normalizedContent.slice(0, AI_SUPPLEMENT_SNIPPET_LIMIT);
        }

        const lowerContent = normalizedContent.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIndex = lowerContent.indexOf(lowerQuery);
        if (matchIndex === -1) {
            return normalizedContent.slice(0, AI_SUPPLEMENT_SNIPPET_LIMIT);
        }

        const start = Math.max(0, matchIndex - 120);
        const end = Math.min(
            normalizedContent.length,
            matchIndex + query.length + AI_SUPPLEMENT_SNIPPET_LIMIT,
        );
        return normalizedContent.slice(start, end);
    }

    async function getSupplementalContext(question) {
        const currentPageUrl = getCurrentPageUrl();
        const relatedEntries = await textSearch(question, AI_SUPPLEMENT_LIMIT + 2);
        return relatedEntries
            .filter(entry => entry.url !== currentPageUrl)
            .slice(0, AI_SUPPLEMENT_LIMIT)
            .map(entry => [
                `文档标题：${entry.title}`,
                `文档地址：${entry.url}`,
                '相关片段：',
                buildSupplementSnippet(entry.content, question),
            ].join('\n'))
            .join('\n\n---\n\n');
    }

    function extractAssistantText(data) {
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
            return content.trim();
        }
        if (Array.isArray(content)) {
            return content
                .map(item => {
                    if (typeof item === 'string') {
                        return item;
                    }
                    return item?.text || '';
                })
                .join('\n')
                .trim();
        }
        return '';
    }

    async function requestAiAnswer(question, config) {
        const context = getCurrentDocumentContext();
        if (!context.content) {
            throw new Error('当前页面没有可用于问答的正文内容。');
        }

        const supplementalContext = await getSupplementalContext(question);

        const response = await fetch(`${normalizeAiBaseUrl(config.baseUrl)}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content:
                            '你是文档问答助手。请优先依据当前页面内容回答；如果当前页面信息不足，可以参考附带的全站相关片段。不得编造未提供的信息；如果上下文仍不足，请明确说明未找到答案。',
                    },
                    {
                        role: 'user',
                        content: [
                            `页面标题：${context.title || '未命名页面'}`,
                            '当前页面正文：',
                            context.content,
                            '',
                            supplementalContext
                                ? ['全站补充片段（仅在当前页不足时参考）：', supplementalContext].join('\n')
                                : '全站补充片段：未找到相关内容',
                            '',
                            `用户问题：${question}`,
                        ].join('\n'),
                    },
                ],
            }),
        });

        if (!response.ok) {
            let detail = '';
            try {
                const errorData = await response.json();
                detail = errorData?.error?.message || '';
            } catch {
                detail = '';
            }
            throw new Error(detail || `AI 请求失败：HTTP ${response.status}`);
        }

        const data = await response.json();
        const answer = extractAssistantText(data);
        if (!answer) {
            throw new Error('AI 返回内容为空。');
        }
        return answer;
    }

    async function handleAiSubmit(event) {
        event.preventDefault();
        if (aiRequestPending) {
            return;
        }

        const question = aiQuestionInput.value.trim();
        if (!question) {
            setAiStatus('请输入问题。', 'error');
            aiQuestionInput.focus();
            return;
        }

        const config = {
            baseUrl: aiBaseUrlInput.value.trim(),
            apiKey: aiApiKeyInput.value.trim(),
            model: aiModelInput.value.trim(),
        };

        if (!config.baseUrl || !config.apiKey || !config.model) {
            setAiStatus('请先填写并保存 Base URL、API Key 和 Model。', 'error');
            return;
        }

        saveAiConfig();
        appendAiMessage('user', question);
        aiQuestionInput.value = '';
        setAiSending(true);
        setAiStatus('正在结合当前页与全站相关片段生成回答...', 'info');

        const pendingMessage = appendAiMessage('assistant', '正在思考中，请稍候...', { pending: true });

        try {
            const answer = await requestAiAnswer(question, config);
            pendingMessage.wrapper.classList.remove('is-pending');
            pendingMessage.contentNode.textContent = answer;
            setAiStatus('回答已生成。', 'success');
        } catch (error) {
            pendingMessage.wrapper.classList.remove('is-pending');
            pendingMessage.contentNode.textContent =
                error instanceof Error ? error.message : 'AI 请求失败，请稍后再试。';
            setAiStatus('本次请求失败，请检查配置或接口连通性。', 'error');
        } finally {
            setAiSending(false);
            aiQuestionInput.focus();
        }
    }

    aiEntryButton.addEventListener('click', () => {
        syncAiConfigInputs();
        setAiPanelOpen(true);
    });

    aiChatClose.addEventListener('click', () => {
        setAiPanelOpen(false);
    });

    aiChatOverlay.addEventListener('click', () => {
        setAiPanelOpen(false);
    });

    aiSaveConfigButton.addEventListener('click', () => {
        saveAiConfig();
    });

    [aiBaseUrlInput, aiApiKeyInput, aiModelInput].forEach(input => {
        input.addEventListener('change', () => {
            localStorage.setItem(AI_STORAGE_KEYS.baseUrl, aiBaseUrlInput.value.trim());
            localStorage.setItem(AI_STORAGE_KEYS.apiKey, aiApiKeyInput.value.trim());
            localStorage.setItem(AI_STORAGE_KEYS.model, aiModelInput.value.trim());
            setAiStatus('配置已自动保存。', 'success');
        });
    });

    aiChatForm.addEventListener('submit', handleAiSubmit);
    aiQuestionInput.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            aiChatForm.requestSubmit();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && aiChatPanel.classList.contains('open')) {
            setAiPanelOpen(false);
        }
    });

    syncAiConfigInputs();
    setAiStatus('请先填写接口配置，然后开始提问。');
}

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        panels[i].classList.add('active');
    });
});

// 回到顶部功能
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    function handleScroll() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }

    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    handleScroll();
    window.addEventListener('scroll', handleScroll);
}
