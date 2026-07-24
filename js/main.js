/**
 * 情侣主题静态页面 - 主逻辑
 * 使用 fetch API 读取 JSON 数据
 */

// ==================== 全局变量 ====================
let photos = [];
let anniversaries = [];
let articles = [];
let currentSlide = 0;
let autoSlideInterval = null;

// ==================== DOM 元素 ====================
const elements = {
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    carouselTrack: document.getElementById('carouselTrack'),
    carouselIndicators: document.getElementById('carouselIndicators'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    photoGrid: document.getElementById('photoGrid'),
    anniversaryTimeline: document.getElementById('anniversaryTimeline'),
    articlesContainer: document.getElementById('articlesContainer'),
    modal: document.getElementById('articleModal'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    footerDate: document.querySelector('.footer-date')
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAllData();
        initTabs();
        initCarousel();
        initModal();
        initAPlayer();
        renderAll();
        updateFooterDate();
        // 欢迎遮罩显示时禁止滚动
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('初始化失败:', error);
        showError('数据加载失败，请刷新页面重试');
    }
});

// ==================== 数据加载 ====================
/**
 * 加载所有JSON数据
 * 使用 fetch API 读取本地JSON文件
 */
async function loadAllData() {
    try {
        // 并行加载所有数据文件
        const [photosRes, anniversariesRes, articlesRes] = await Promise.all([
            fetch('data/photos.json'),
            fetch('data/anniversaries.json'),
            fetch('data/articles.json')
        ]);

        // 检查响应状态
        if (!photosRes.ok || !anniversariesRes.ok || !articlesRes.ok) {
            throw new Error('数据文件加载失败');
        }

        // 解析JSON
        const photosData = await photosRes.json();
        const anniversariesData = await anniversariesRes.json();
        const articlesData = await articlesRes.json();

        // 存储数据
        photos = photosData.photos || [];
        anniversaries = anniversariesData.anniversaries || [];
        articles = articlesData.articles || [];

        console.log('数据加载成功:', { photos, anniversaries, articles });
    } catch (error) {
        console.error('数据加载错误:', error);
        throw error;
    }
}

// ==================== Tab 切换 ====================
function initTabs() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // 更新按钮状态
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 更新内容显示
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });

    // 如果切换到照片tab，重置轮播
    if (tabId === 'photos') {
        resetCarousel();
    }
}

// ==================== 轮播功能 ====================
function initCarousel() {
    elements.prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });

    elements.nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });

    // 自动轮播
    startAutoSlide();

    // 鼠标悬停暂停
    const carousel = document.querySelector('.carousel');
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
}

function renderCarousel() {
    if (photos.length === 0) return;

    // 渲染轮播项
    elements.carouselTrack.innerHTML = photos.map(photo => `
        <div class="carousel-slide">
            <img src="${photo.src}" alt="${photo.title}" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 450%22><rect fill=%22%23ffb3c6%22 width=%22800%22 height=%22450%22/><text x=%22400%22 y=%22225%22 text-anchor=%22middle%22 fill=%22%23ff6b9d%22 font-size=%2240%22>💕</text></svg>'">
            <div class="carousel-slide-info">
                <h3>${photo.title}</h3>
                <p>${photo.description}</p>
            </div>
        </div>
    `).join('');

    // 渲染指示器
    elements.carouselIndicators.innerHTML = photos.map((_, index) => `
        <div class="carousel-indicator ${index === 0 ? 'active' : ''}" 
             data-index="${index}"></div>
    `).join('');

    // 指示器点击事件
    elements.carouselIndicators.querySelectorAll('.carousel-indicator').forEach(indicator => {
        indicator.addEventListener('click', () => {
            goToSlide(parseInt(indicator.dataset.index));
        });
    });
}

function goToSlide(index) {
    const totalSlides = photos.length;
    if (totalSlides === 0) return;

    // 循环处理
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;

    currentSlide = index;

    // 移动轮播
    elements.carouselTrack.style.transform = `translateX(-${index * 100}%)`;

    // 更新指示器
    elements.carouselIndicators.querySelectorAll('.carousel-indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 4000);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

function resetCarousel() {
    currentSlide = 0;
    goToSlide(0);
    startAutoSlide();
}

// ==================== 照片网格 ====================
function renderPhotoGrid() {
    if (photos.length === 0) {
        elements.photoGrid.innerHTML = '<p class="no-data">暂无照片数据</p>';
        return;
    }

    elements.photoGrid.innerHTML = photos.reverse().map(photo => `
        <div class="photo-card">
            <div class="photo-card-img-wrapper">
                <img class="photo-card-img" src="${photo.src}" alt="${photo.title}"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 280 220%22><rect fill=%22%23ffb3c6%22 width=%22280%22 height=%22220%22/><text x=%22140%22 y=%22110%22 text-anchor=%22middle%22 fill=%22%23ff6b9d%22 font-size=%2230%22>💕</text></svg>'">
                <span class="photo-card-date">${formatDate(photo.date)}</span>
            </div>
            <div class="photo-card-content">
                <h3 class="photo-card-title">${photo.title}</h3>
                <p class="photo-card-desc">${photo.description}</p>
            </div>
        </div>
    `).join('');
}

// ==================== 纪念日时间线 ====================
function renderAnniversaries() {
    if (anniversaries.length === 0) {
        elements.anniversaryTimeline.innerHTML = '<p class="no-data">暂无纪念日数据</p>';
        return;
    }

    elements.anniversaryTimeline.innerHTML = anniversaries.reverse().map(item => `
        <div class="anniversary-card">
            <div class="anniversary-icon">${item.icon || '🎉'}</div>
            <h3 class="anniversary-title">${item.title}</h3>
            <div class="anniversary-meta">
                <span>📅 ${formatDate(item.date)}</span>
                <span>📍 ${item.location}</span>
            </div>
            <p class="anniversary-content">${item.content}</p>
        </div>
    `).join('');
}

// ==================== 文章列表 ====================
function renderArticles() {
    if (articles.length === 0) {
        elements.articlesContainer.innerHTML = '<p class="no-data">暂无文章数据</p>';
        return;
    }

    elements.articlesContainer.innerHTML = articles.reverse().map(article => `
        <div class="article-card" data-id="${article.id}">
            <span class="article-date">${formatDate(article.date)}</span>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-excerpt">${article.content.substring(0, 150)}...</p>
            <span class="article-read-more">
                阅读全文 <span>→</span>
            </span>
        </div>
    `).join('');

    // 添加点击事件
    elements.articlesContainer.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => {
            const articleId = parseInt(card.dataset.id);
            openArticleModal(articleId);
        });
    });
}

// ==================== 文章弹窗 ====================
function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openArticleModal(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    elements.modalBody.innerHTML = `
        <h2 class="modal-title">${article.title}</h2>
        <p class="modal-date">${formatDate(article.date)}</p>
        <div class="modal-content-text">${article.content}</div>
        <p class="modal-signature">${article.signature}</p>
    `;

    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 重置弹窗滚动位置到顶部（延迟确保DOM更新）
    requestAnimationFrame(() => {
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    });
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== 工具函数 ====================
/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {string} 格式化后的日期
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}年${month}月${day}日`;
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
    const containers = [
        elements.carouselTrack,
        elements.photoGrid,
        elements.anniversaryTimeline,
        elements.articlesContainer
    ];

    containers.forEach(container => {
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px; color: #ff6b9d;">
                    <p>💕 ${message}</p>
                    <p style="font-size: 0.9rem; color: #7a7a7a; margin-top: 10px;">
                        提示：请检查网络连接，确保数据文件存在，并刷新页面重试。
                    </p>
                </div>
            `;
        }
    });
}

/**
 * 更新页脚日期
 */
function updateFooterDate() {
    const now = new Date();
    // const options = { year: 'numeric', month: 'long', day: 'numeric' };
    elements.footerDate.textContent = "2021-" + now.getFullYear();
}

// ==================== 渲染所有内容 ====================
function renderAll() {
    renderCarousel();
    renderPhotoGrid();
    renderAnniversaries();
    renderArticles();
}

// ==================== 触摸滑动支持 ====================
let touchStartX = 0;
let touchEndX = 0;

document.querySelector('.carousel')?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

document.querySelector('.carousel')?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // 左滑 -> 下一张
            goToSlide(currentSlide + 1);
        } else {
            // 右滑 -> 上一张
            goToSlide(currentSlide - 1);
        }
    }
}

// ==================== APlayer 音乐播放器 ====================
function initAPlayer() {
    const container = document.getElementById('aplayer');
    if (!container || typeof APlayer === 'undefined') {
        console.warn('APlayer 未加载，跳过音乐播放器初始化');
        return;
    }

    window.ap = new APlayer({
        container: container,
        fixed: true,
        lrcType: 3,
        listFolded: true,
        listMaxHeight: 90,
        audio: [{
            name: '嫁给我(民谣版)',
            artist: '不可撤销乐队',
            url: './assets/mp3/jgw.mp3',
            cover: './assets/mp3/jgw.jpg',
            lrc: './assets/mp3/jgw.lrc'
        }, {
            name: '海鸥',
            artist: '逃跑计划',
            url: './assets/mp3/ho.mp3',
            cover: './assets/mp3/ho.jpg',
            lrc: './assets/mp3/ho.lrc'
        }, {
            name: '米店',
            artist: '张玮玮&郭龙',
            url: './assets/mp3/md.mp3',
            cover: './assets/mp3/md.jpg',
            lrc: './assets/mp3/md.lrc'
        }, {
            name: '想见你想见你想见你',
            artist: '八三夭',
            url: './assets/mp3/xjn.mp3',
            cover: './assets/mp3/xjn.jpg',
            lrc: './assets/mp3/xjn.lrc'
        }, {
            name: '多远都要在一起',
            artist: '邓紫棋',
            url: './assets/mp3/dydyzyq.mp3',
            cover: './assets/mp3/dydyzyq.jpg',
            lrc: './assets/mp3/dydyzyq.lrc'
        }, {
            name: '给你一瓶魔法药水',
            artist: '告五人',
            url: './assets/mp3/gnypmfys.mp3',
            cover: './assets/mp3/gnypmfys.jpg',
            lrc: './assets/mp3/gnypmfys.lrc'
        }, {
            name: 'Love Story',
            artist: 'Taylor Swift',
            url: './assets/mp3/Love Story.mp3',
            cover: './assets/mp3/Love Story.jpg',
            lrc: './assets/mp3/Love Story.lrc'
        }]
    });

    initScrollAutoPlay();
}


// ==================== 点击触发自动播放 ====================
function initScrollAutoPlay() {
    // 监听欢迎按钮点击
    const welcomeBtn = document.getElementById('welcomeBtn');
    if (welcomeBtn) {
        welcomeBtn.addEventListener('click', () => {
            // 隐藏欢迎遮罩
            const overlay = document.getElementById('welcomeOverlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
            // 恢复页面滚动
            document.body.style.overflow = '';
            // 播放音乐
            if (window.ap) {
                window.ap.play();
            }
        });
    }
}
