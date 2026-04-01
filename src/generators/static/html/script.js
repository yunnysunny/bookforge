// BookForge 客户端脚本 (ESM)

let embeddingSearch = null;

(async () => {
    try {
        const mod = await import('./search-embedding.js');
        if (await mod.init()) {
            embeddingSearch = mod;
        }
    } catch {
        // Embedding search not available
    }
})();

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
    let searchIndexPromise;

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

    function normalizeText(text) {
        return text.toLowerCase().replace(/\s+/g, ' ').trim();
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

    function flattenHeadingMatches(headings, query) {
        const normalizedQuery = normalizeText(query);
        return headings.filter((heading) => normalizeText(heading.text).includes(normalizedQuery));
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

    async function textSearch(query) {
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

        let results = null;

        if (embeddingSearch) {
            try {
                const semanticResults = await embeddingSearch.search(query, maxResults);
                if (semanticResults?.length > 0) {
                    results = semanticResults.map(r => ({
                        ...r,
                        headingMatches: flattenHeadingMatches(r.headings || [], query),
                    }));
                }
            } catch {
                // Fall through to text search
            }
        }

        if (!results) {
            results = await textSearch(query);
        }

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
