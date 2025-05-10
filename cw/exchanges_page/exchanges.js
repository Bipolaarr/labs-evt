// DOM Elements
const exchangesTableBody = document.getElementById('exchanges-table-body');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const themeToggle = document.querySelector('.theme-toggle');
const trustFilter = document.getElementById('trust-filter');

// Market stats elements
const totalExchangesElement = document.getElementById('total-exchanges');
const totalVolumeElement = document.getElementById('total-volume');
const btcDominanceElement = document.getElementById('btc-dominance');
const topExchangeElement = document.getElementById('top-exchange');

// Global variables
let currentPage = 1;
let exchangesData = [];
let filteredExchanges = [];
const exchangesPerPage = 20;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Load market data
    fetchMarketData();
    fetchExchangesData();

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Search functionality
    searchInput.addEventListener('input', () => {
        filterExchanges();
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
        const maxPage = Math.ceil(filteredExchanges.length / exchangesPerPage);
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
            
            filterExchanges();
            currentPage = 1;
            renderTable();
            updatePagination();
        });
    });

    // Trust filter
    trustFilter.addEventListener('change', () => {
        filterExchanges();
        currentPage = 1;
        renderTable();
        updatePagination();
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
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        const data = await response.json();
        updateMarketStats(data.data);
    } catch (error) {
        console.error('Error fetching market data:', error);
        // Fallback data if API fails
        updateMarketStats({
            markets: 500,
            total_volume: { usd: 50000000000 },
            market_cap_percentage: { btc: 40 }
        });
    }
}

// Update market stats in the UI
function updateMarketStats(data) {
    totalExchangesElement.textContent = data.markets.toLocaleString();
    totalVolumeElement.textContent = `$${formatCompactNumber(data.total_volume.usd)}`;
    btcDominanceElement.textContent = `${data.market_cap_percentage.btc.toFixed(1)}%`;
    topExchangeElement.textContent = 'Loading...';
}

// Fetch exchanges data
async function fetchExchangesData() {
    loadingSpinner.classList.add('active');
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/exchanges?per_page=250');
        exchangesData = await response.json();
        
        // Sort by trust score rank (lower is better)
        exchangesData.sort((a, b) => (a.trust_score_rank || 999) - (b.trust_score_rank || 999));
        
        filteredExchanges = [...exchangesData];
        
        // Update market stats with exchange-specific data
        updateExchangeStats();
        
        renderTable();
        updatePagination();
    } catch (error) {
        console.error('Error fetching exchanges data:', error);
        // Fallback data if API fails
        exchangesData = [
            {
                id: "binance",
                name: "Binance",
                year_established: 2017,
                country: "Cayman Islands",
                image: "https://assets.coingecko.com/markets/images/52/small/binance.jpg?1519353250",
                trust_score: 10,
                trust_score_rank: 1,
                trade_volume_24h_btc: 500000,
                trade_volume_24h_btc_normalized: 400000,
                has_trading_incentive: false
            },
            // Add more fallback exchanges as needed
        ];
        filteredExchanges = [...exchangesData];
        updateExchangeStats();
        renderTable();
        updatePagination();
    } finally {
        loadingSpinner.classList.remove('active');
    }
}

// Update exchange-specific stats
function updateExchangeStats() {
    if (exchangesData.length > 0) {
        // Top exchange by trust score
        const topExchange = exchangesData.find(ex => ex.trust_score_rank === 1) || exchangesData[0];
        topExchangeElement.textContent = topExchange.name;
    }
}

function formatCompactNumber(number) {
    if (typeof number !== 'number') return 'N/A';
    if (number < 1000) return number.toLocaleString();
    if (number < 1000000) return `${(number/1000).toFixed(1)}K`;
    if (number < 1000000000) return `${(number/1000000).toFixed(1)}M`;
    return `${(number/1000000000).toFixed(1)}B`;
}

// Filter exchanges based on search input and active filter
function filterExchanges() {
    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-button.active').textContent.toLowerCase();
    const trustFilterValue = trustFilter.value;
    
    let filtered = exchangesData.filter(exchange => {
        const matchesSearch = exchange.name.toLowerCase().includes(searchTerm) || 
                            (exchange.id && exchange.id.toLowerCase().includes(searchTerm));
        
        const matchesTrust = trustFilterValue === 'all' || 
                           (exchange.trust_score && exchange.trust_score >= parseInt(trustFilterValue));
        
        return matchesSearch && matchesTrust;
    });

    // Apply sorting/filtering based on active filter
    switch(activeFilter) {
        case 'top 10':
            filtered = filtered.slice(0, 10);
            break;
        case 'spot':
            filtered = filtered.filter(ex => ex.has_trading_incentive === false);
            break;
        case 'derivatives':
            filtered = filtered.filter(ex => ex.has_trading_incentive === true);
            break;
        // 'all' doesn't need special sorting
    }

    filteredExchanges = filtered;
}

// Render the exchanges table
function renderTable() {
    const startIndex = (currentPage - 1) * exchangesPerPage;
    const endIndex = startIndex + exchangesPerPage;
    const exchangesToDisplay = filteredExchanges.slice(startIndex, endIndex);
    
    exchangesTableBody.innerHTML = '';
    
    if (exchangesToDisplay.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="9" style="text-align: center;">No exchanges found matching your criteria</td>`;
        exchangesTableBody.appendChild(row);
        return;
    }
    
    exchangesToDisplay.forEach((exchange, index) => {
        const row = document.createElement('tr');
        const globalIndex = startIndex + index + 1;
        
        // Determine trust score color
        let trustClass = '';
        if (exchange.trust_score) {
            if (exchange.trust_score >= 8) trustClass = 'high';
            else if (exchange.trust_score >= 6) trustClass = 'medium';
            else trustClass = 'low';
        }
        
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td>
                <div class="crypto-name">
                    ${exchange.image ? `<img src="${exchange.image}" alt="${exchange.name}" width="24" height="24">` : ''}
                    <div>
                        <span>${exchange.name}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="trust-indicator ${trustClass}">
                    ${exchange.trust_score || 'N/A'}${exchange.trust_score ? '/10' : ''}
                </span>
            </td>
            <td>$${formatCompactNumber(exchange.trade_volume_24h_btc)} BTC</td>
            <td>${exchange.country || 'N/A'}</td>
            <td>${exchange.year_established || 'N/A'}</td>
            <td>${exchange.has_trading_incentive ? 'Derivatives' : 'Spot'}</td>
            <td>${exchange.trade_volume_24h_btc_normalized ? 
                formatCompactNumber(exchange.trade_volume_24h_btc_normalized) : 'N/A'}</td>
            <td>${exchange.open_interest_btc ? 
                formatCompactNumber(exchange.open_interest_btc) : 'N/A'}</td>
        `;
        
        exchangesTableBody.appendChild(row);
    });
}

// Update pagination controls
function updatePagination() {
    const maxPage = Math.ceil(filteredExchanges.length / exchangesPerPage);
    
    pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= maxPage || maxPage === 0;
}