const NEWS_API_KEY = '37a5a1b6a2aa4bce88fb36928a537a9a';
const newsGrid = document.getElementById('news-grid');
const loadMoreBtn = document.getElementById('load-more');
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
    // Theme setup
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    themeToggle.addEventListener('click', toggleTheme);

    // News setup
    loadNews();
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        currentQuery = `${e.target.value} ${CRYPTO_SOURCES.map(s => `site:${s}`).join(' OR ')}`;
        newsGrid.innerHTML = '';
        currentPage = 1;
        loadNews();
    });

    // Filter buttons
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.textContent.toLowerCase();
            currentQuery = filter === 'all' ? 
                'cryptocurrency OR crypto OR blockchain' : 
                `${filter} (crypto OR blockchain)`;
                
            newsGrid.innerHTML = '';
            currentPage = 1;
            loadNews();
        });
    });

    // Load more
    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadNews();
    });
});

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
        const response = await fetch(
            `https://newsapi.org/v2/everything?` +
            `q=${encodeURIComponent(currentQuery)}&` +
            `domains=${CRYPTO_SOURCES.join(',')}&` +
            `page=${currentPage}&` +
            `pageSize=25&` +  // Changed from default 20 to 18
            `language=en&` + 
            `sortBy=publishedAt&` +
            `apiKey=${NEWS_API_KEY}`
        );
        
        const data = await response.json();
        return data.articles || [];
    } catch (error) {
        console.error('Error fetching news:', error);
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
            <img src="${article.urlToImage || 'placeholder.jpg'}" alt="${article.title}" 
                 onerror="this.src='placeholder.jpg'">
        </div>
        <div class="news-content">
            <div class="news-meta">
                <span class="news-source">${article.source.name}</span>
                <span class="news-date">${new Date(article.publishedAt).toLocaleDateString('en-US')}</span>
            </div>
            <h3 class="news-title">${article.title}</h3>
            <div class="news-footer">
                <a href="${article.url}" target="_blank" class="news-read-more">Read More →</a>
            </div>
        </div>
    `;
    return card;
}

async function loadNews() {
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.classList.add('active');
    
    try {
        const articles = await fetchNews();
        articles.forEach(article => {
            const card = createNewsCard(article);
            if (card) newsGrid.appendChild(card);
        });
        
        loadMoreBtn.style.display = articles.length >= 18 ? 'block' : 'none';
    } finally {
        loadingSpinner.classList.remove('active');
    }
}