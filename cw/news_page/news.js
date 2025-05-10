const NEWS_API_KEY = '37a5a1b6a2aa4bce88fb36928a537a9a'; // Consider using environment variables
const newsGrid = document.getElementById('news-grid');
const loadMoreBtn = document.getElementById('load-more');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.querySelector('.theme-toggle');

let currentPage = 1;
let currentQuery = 'cryptocurrency OR crypto OR blockchain';

// Trusted English crypto news sources
const CRYPTO_SOURCES = [
    'coindesk.com', 
    'cointelegraph.com',
    'decrypt.com',
    'theblock.co',
    'cryptoslate.com',
    'news.bitcoin.com',
    'crypto.news'
];

// Initialize theme and news
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    loadNews();
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    
    document.getElementById('search-input').addEventListener('input', debounce((e) => {
        currentQuery = `${e.target.value} ${CRYPTO_SOURCES.map(s => `site:${s}`).join(' OR ')}`;
        resetNewsGrid();
        loadNews();
    }, 300));

    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentQuery = button.dataset.filter === 'all' ? 
                'cryptocurrency OR crypto OR blockchain' : 
                `${button.dataset.filter} (crypto OR blockchain)`;
            resetNewsGrid();
            loadNews();
        });
    });

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadNews();
    });
}

// Theme functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// News functions
async function fetchNews() {
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const apiUrl = encodeURIComponent(
            `https://newsapi.org/v2/everything?` +
            `q=${encodeURIComponent(currentQuery)}&` +
            `domains=${CRYPTO_SOURCES.join(',')}&` +
            `page=${currentPage}&` +
            `pageSize=11&` +  // Reduced for better CORS handling
            `language=en&` + 
            `sortBy=publishedAt&` +
            `apiKey=${NEWS_API_KEY}`
        );

        const response = await fetch(proxyUrl + apiUrl);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        const parsedData = JSON.parse(data.contents);
        
        if (parsedData.status !== 'ok') throw new Error(parsedData.message);
        
        return parsedData.articles || [];
    } catch (error) {
        console.error('News fetch failed:', error);
        showError(`Failed to load news: ${error.message}`);
        return [];
    }
}

function createNewsCard(article) {
    const cryptoKeywords = ['crypto', 'blockchain', 'nft', 'defi', 'web3', 'dapp'];
    const hasCryptoContent = cryptoKeywords.some(keyword => 
        article.title?.toLowerCase().includes(keyword) ||
        article.description?.toLowerCase().includes(keyword)
    );

    if (!hasCryptoContent) return null;

    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
        <div class="news-image">
            <img src="${article.urlToImage || getPlaceholderImage(article.source.name)}" 
                 alt="${article.title}" 
                 loading="lazy"
                 onerror="this.src='${getPlaceholderImage(article.source.name)}'">
        </div>
        <div class="news-content">
            <div class="news-meta">
                <span class="news-source">${article.source.name}</span>
                <span class="news-date">${new Date(article.publishedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                })}</span>
            </div>
            <h3 class="news-title">${article.title}</h3>
            <div class="news-footer">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-read-more">
                    Read More →
                </a>
            </div>
        </div>
    `;
    return card;
}

async function loadNews() {
    try {
        showLoading();
        const articles = await fetchNews();
        
        if (articles.length === 0 && currentPage === 1) {
            showError('No news articles found');
            return;
        }

        articles.forEach(article => {
            const card = createNewsCard(article);
            if (card) newsGrid.appendChild(card);
        });

        loadMoreBtn.style.display = articles.length >= 10 ? 'block' : 'none';
    } finally {
        hideLoading();
    }
}

// Helper functions
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function resetNewsGrid() {
    newsGrid.innerHTML = '';
    currentPage = 1;
    loadMoreBtn.style.display = 'none';
}

function getPlaceholderImage(source) {
    const baseUrl = 'https://placehold.co/600x400';
    const colors = ['008080', '9400D3', '4B0082'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `${baseUrl}/${randomColor}/FFF?font=oswald&text=${encodeURIComponent(source)}`;
}

function showLoading() {
    loadingSpinner.classList.add('active');
    loadMoreBtn.disabled = true;
}

function hideLoading() {
    loadingSpinner.classList.remove('active');
    loadMoreBtn.disabled = false;
}

function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    newsGrid.parentNode.insertBefore(errorElement, newsGrid.nextSibling);
    setTimeout(() => errorElement.remove(), 5000);
}