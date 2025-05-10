// DOM Elements
const cryptoTableBody = document.getElementById('crypto-table-body');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const themeToggle = document.querySelector('.theme-toggle');

// Global variables
let currentPage = 1;
let coinsData = [];
let filteredCoins = [];
const coinsPerPage = 20;
let currency = 'usd';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
let cache = {
    marketData: null,
    coinsData: null,
    timestamp: null
};

// Market stats elements
const totalCoinsElement = document.getElementById('total-coins');
const totalExchangesElement = document.getElementById('total-exchanges');
const totalMarketCapElement = document.getElementById('total-market-cap');
const totalVolumeElement = document.getElementById('total-volume');
const btcDominanceElement = document.getElementById('btc-dominance');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Load market data
    fetchMarketData();
    fetchCoinsData();

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Search functionality
    searchInput.addEventListener('input', () => {
        filterCoins();
        currentPage = 1;
        renderTable();
        updatePagination();
    });

    // Pagination buttons
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredCoins.length / coinsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });

    // Filter buttons
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            filterCoins();
            currentPage = 1;
            renderTable();
            updatePagination();
        });
    });
}

// Toggle between light and dark theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Fetch global market data
async function fetchMarketData() {
    try {
        if (cache.marketData && Date.now() - cache.timestamp < CACHE_TTL) {
            updateMarketStats(cache.marketData);
            return;
        }
        
        const response = await fetchWithTimeout('https://api.coingecko.com/api/v3/global', 5000);
        const data = await response.json();
        cache.marketData = data.data;
        cache.timestamp = Date.now();
        updateMarketStats(data.data);
    } catch (error) {
        console.error('Error fetching market data:', error);
        if (cache.marketData) updateMarketStats(cache.marketData);
    }
}

// Update market stats in the UI
function updateMarketStats(data) {
    totalCoinsElement.textContent = data.active_cryptocurrencies.toLocaleString();
    totalExchangesElement.textContent = data.markets.toLocaleString();
    
    // Market cap with compact formatting
    const marketCapFormatted = formatCompactNumber(data.total_market_cap.usd);
    totalMarketCapElement.innerHTML = `$${marketCapFormatted}`;
    
    totalVolumeElement.textContent = `$${formatCompactNumber(data.total_volume.usd)}`;
    btcDominanceElement.textContent = `${data.market_cap_percentage.btc.toFixed(1)}%`;
}

// Fetch coins data
async function fetchCoinsData() {
    loadingSpinner.classList.add('active');
    try {
        if (cache.coinsData && Date.now() - cache.timestamp < CACHE_TTL) {
            coinsData = cache.coinsData;
            filteredCoins = [...coinsData];
            renderTable();
            updatePagination();
            return;
        }

        const response = await fetchWithTimeout(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`,
            10000
        );
        
        const data = await response.json();
        coinsData = data.map(coin => ({
            ...coin,
            // Use 7-day sparkline instead of fetching hourly data
            sparkline_in_24h: {
                price: coin.sparkline_in_7d.price.slice(-24) // Last 24 data points
            }
        }));
        
        cache.coinsData = coinsData;
        cache.timestamp = Date.now();
        filteredCoins = [...coinsData];
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error fetching coins data:', error);
        if (cache.coinsData) {
            coinsData = cache.coinsData;
            filteredCoins = [...coinsData];
            renderTable();
            updatePagination();
        }
    } finally {
        loadingSpinner.classList.remove('active');
    }
}

function formatCompactNumber(number) {
    if (number < 1000) return number.toLocaleString();
    if (number < 1000000) return `${(number/1000).toFixed(1)}K`;
    if (number < 1000000000) return `${(number/1000000).toFixed(1)}M`;
    return `${(number/1000000000).toFixed(1)}B`;
}

async function fetchWithTimeout(resource, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(resource, {
        signal: controller.signal
    });
    clearTimeout(id);
    
    return response;
}

// Filter coins based on search input and active filter
let searchTimeout;

function filterCoins() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-button.active').textContent.toLowerCase();
        
        let filtered = coinsData.filter(coin => {
            return coin.name.toLowerCase().includes(searchTerm) || 
                   coin.symbol.toLowerCase().includes(searchTerm);
        });

        switch(activeFilter) {
            case 'top 10':
                filtered = filtered.slice(0, 10);
                break;
            case 'gainers':
                filtered = filtered.sort((a, b) => 
                    b.price_change_percentage_24h - a.price_change_percentage_24h);
                break;
            case 'losers':
                filtered = filtered.sort((a, b) => 
                    a.price_change_percentage_24h - b.price_change_percentage_24h);
                break;
        }

        filteredCoins = filtered;
        currentPage = 1;
        renderTable();
        updatePagination();
    }, 300); // 300ms debounce
}

// Render the coins table
function renderTable() {
    const startIndex = (currentPage - 1) * coinsPerPage;
    const endIndex = startIndex + coinsPerPage;
    const coinsToDisplay = filteredCoins.slice(startIndex, endIndex);
    
    cryptoTableBody.innerHTML = '';
    
    coinsToDisplay.forEach(coin => {
        const row = document.createElement('tr');
        
        // Format price change percentages
        const priceChange24h = coin.price_change_percentage_24h || 0;
        const priceChange7d = coin.price_change_percentage_7d_in_currency || 0;
        
        row.innerHTML = `
            <td>${coin.market_cap_rank}</td>
            <td>
                <div class="crypto-name">
                    <img src="${coin.image}" alt="${coin.name}" width="24" height="24">
                    <div>
                        <span>${coin.name}</span>
                        <span class="crypto-symbol">${coin.symbol.toUpperCase()}</span>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(coin.current_price, 'usd')}</td>
            <td class="price-change ${priceChange24h >= 0 ? 'positive' : 'negative'}">
                ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%
            </td>
            <td class="price-change ${priceChange7d >= 0 ? 'positive' : 'negative'}">
                ${priceChange7d >= 0 ? '+' : ''}${priceChange7d.toFixed(2)}%
            </td>
            <td>${formatCurrency(coin.market_cap, 'usd')}</td>
            <td>${formatCurrency(coin.total_volume, 'usd')}</td>
            <td>
                <div class="sparkline sparkline-24h" 
                     data-sparkline="${JSON.stringify(coin.sparkline_in_24h?.price || [])}" 
                     data-trend="${priceChange24h >= 0 ? 'up' : 'down'}"></div>
            </td>
        `;
        
        cryptoTableBody.appendChild(row);
    });
    
    renderSparklines();
}

// Format currency values
function formatCurrency(value, currencyCode) {
    if (value < 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 4,
            maximumFractionDigits: 6
        }).format(value);
    } else {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
}

// Update pagination controls
function updatePagination() {
    const maxPage = Math.ceil(filteredCoins.length / coinsPerPage);
    
    pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= maxPage;
}

// Render sparkline charts
function renderSparklines() {
    const sparklineElements = document.querySelectorAll('.sparkline');
    
    sparklineElements.forEach(element => {
        const prices = JSON.parse(element.getAttribute('data-sparkline'));
        const trend = element.getAttribute('data-trend');
        
        if (!prices || prices.length < 2) {
            element.innerHTML = '<span class="no-data">N/A</span>';
            return;
        }

        const color = trend === 'up' ? '#16c784' : '#ea3943';
        const width = 100;
        const height = 40;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        // Calculate path
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1; // Prevent division by zero
        
        let pathData = '';
        prices.forEach((price, i) => {
            const x = (i / (prices.length - 1)) * width;
            const y = height - ((price - min) / range) * (height - 2);
            pathData += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
        });
        
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        
        // Add gradient fill
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'sparkline-gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        
        gradient.innerHTML = `
            <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        `;
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(gradient);
        
        // Create filled area
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaPath.setAttribute('d', `${pathData} L ${width} ${height} L 0 ${height} Z`);
        areaPath.setAttribute('fill', 'url(#sparkline-gradient)');
        
        svg.appendChild(defs);
        svg.appendChild(areaPath);
        svg.appendChild(path);
        
        element.innerHTML = '';
        element.appendChild(svg);
    });
}