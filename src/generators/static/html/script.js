// GitBook 脚本
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动到锚点
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 侧边栏切换功能
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!sidebarToggle || !sidebar) {
        return;
    }
    
    // 从localStorage读取用户偏好
    const STORAGE_KEY = 'sidebar-hidden';
    
    // 判断是否为移动端
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // 切换侧边栏显示/隐藏
    function toggleSidebar() {
        if (isMobile()) {
            // 移动端：使用.open类控制显示
            sidebar.classList.toggle('open');
        } else {
            // 桌面端：使用.hidden类控制显示，并保存到localStorage
            const isCurrentlyHidden = sidebar.classList.contains('hidden');
            
            if (isCurrentlyHidden) {
                sidebar.classList.remove('hidden');
                localStorage.setItem(STORAGE_KEY, 'false');
            } else {
                sidebar.classList.add('hidden');
                localStorage.setItem(STORAGE_KEY, 'true');
            }
        }
    }
    
    // 初始化侧边栏状态
    function initSidebar() {
        if (isMobile()) {
            // 移动端：默认隐藏
            sidebar.classList.remove('hidden');
            sidebar.classList.remove('open');
        } else {
            // 桌面端：根据localStorage决定
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState === 'true') {
                sidebar.classList.add('hidden');
            } else {
                sidebar.classList.remove('hidden');
            }
            sidebar.classList.remove('open');
        }
    }
    
    // 响应窗口大小变化
    function handleResize() {
        initSidebar();
    }
    
    // 绑定点击事件
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 初始化
    initSidebar();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    // 右侧目录树（TOC）切换功能
    const tocToggle = document.getElementById('tocToggle');
    const toc = document.getElementById('toc');
    
    if (tocToggle && toc) {
        // 从localStorage读取TOC显示偏好
        const TOC_STORAGE_KEY = 'toc-hidden';
        
        // 切换TOC显示/隐藏
        function toggleToc() {
            const isCurrentlyHidden = toc.classList.contains('hidden');
            
            if (isCurrentlyHidden) {
                toc.classList.remove('hidden');
                localStorage.setItem(TOC_STORAGE_KEY, 'false');
            } else {
                toc.classList.add('hidden');
                localStorage.setItem(TOC_STORAGE_KEY, 'true');
            }
        }
        
        // 初始化TOC状态
        function initToc() {
            const savedState = localStorage.getItem(TOC_STORAGE_KEY);
            if (savedState === 'true') {
                toc.classList.add('hidden');
            } else {
                toc.classList.remove('hidden');
            }
        }
        
        // 绑定点击事件
        tocToggle.addEventListener('click', toggleToc);
        
        // 初始化
        initToc();
    }
    
    // 搜索功能
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        let searchTimeout;
        
        // 搜索功能
        function performSearch() {
            const query = searchInput.value.trim().toLowerCase();
            
            // 在当前页面内容中搜索
            const contentBody = document.querySelector('.content-body');
            if (!contentBody) {
                return;
            }
            
            // 移除之前的高亮
            const highlightedElements = contentBody.querySelectorAll('.search-highlight');
            highlightedElements.forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            });
            
            // 如果搜索词为空，不执行搜索
            if (query === '') {
                return;
            }
            
            // 搜索并高亮
            const walker = document.createTreeWalker(
                contentBody,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.toLowerCase().includes(query)) {
                    textNodes.push(node);
                }
            }
            
            // 高亮匹配的文本
            textNodes.forEach(textNode => {
                const text = textNode.textContent;
                const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                const highlightedText = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                
                if (highlightedText !== text) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = highlightedText;
                    textNode.parentNode.replaceChild(wrapper, textNode);
                    
                    
                }
            });
            // 滚动到第一个匹配项
            const firstMatch = document.querySelector('mark');
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // 绑定搜索事件 - 使用防抖优化性能
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 300); // 300ms 防抖
        });
        
        // 按回车键立即搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch();
            }
        });
    }
    

});