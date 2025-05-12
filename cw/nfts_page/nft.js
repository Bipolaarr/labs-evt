// DOM Elements
const nftTableBody = document.getElementById('nft-table-body');
const loadingSpinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById('search-input');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const themeToggles = document.querySelectorAll('.theme-toggle');
const burgerMenu = document.querySelector('.burger-menu');
const mainNav = document.querySelector('.main-navigation');

// Global variables
let currentPage = 1;
let collectionsData = [];
let filteredCollections = [];
const itemsPerPage = 20;

// Market stats elements
const totalCollectionsElement = document.getElementById('total-collections');
const totalVolumeElement = document.getElementById('total-volume');
const totalOwnersElement = document.getElementById('total-owners');
const floorCapElement = document.getElementById('floor-cap');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    generateMockData();
    setupEventListeners();
});

burgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    burgerMenu.classList.toggle('active');
    mainNav.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !burgerMenu.contains(e.target)) {
        burgerMenu.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        burgerMenu.classList.remove('active');
        mainNav.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
});

themeToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleTheme);
    });

    function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
    themeToggles.forEach(toggle => {
        const icon = toggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    });
}

function generateMockData() {
    loadingSpinner.classList.add('active');
    
    // Top 20 real NFT collections for more realistic data
    const topCollections = [
        { name: "Bored Ape Yacht Club", symbol: "BAYC", floorPrice: 32.5 },
        { name: "CryptoPunks", symbol: "PUNK", floorPrice: 65.2 },
        { name: "Mutant Ape Yacht Club", symbol: "MAYC", floorPrice: 6.3 },
        { name: "Azuki", symbol: "AZUKI", floorPrice: 15.8 },
        { name: "CloneX", symbol: "CLONEX", floorPrice: 4.2 },
        { name: "Doodles", symbol: "DOODLE", floorPrice: 7.5 },
        { name: "Cool Cats", symbol: "COOL", floorPrice: 2.1 },
        { name: "Moonbirds", symbol: "MOONBIRD", floorPrice: 5.7 },
        { name: "World of Women", symbol: "WOW", floorPrice: 3.4 },
        { name: "Meebits", symbol: "MEEB", floorPrice: 1.8 },
        { name: "Otherdeed", symbol: "OTHR", floorPrice: 1.2 },
        { name: "Pudgy Penguins", symbol: "PUDGY", floorPrice: 8.9 },
        { name: "Bored Ape Kennel Club", symbol: "BAKC", floorPrice: 2.5 },
        { name: "DeGods", symbol: "DGOD", floorPrice: 3.7 },
        { name: "Murakami.Flowers", symbol: "FLOWER", floorPrice: 4.1 },
        { name: "VeeFriends", symbol: "VEE", floorPrice: 1.5 },
        { name: "Invisible Friends", symbol: "INVSBLE", floorPrice: 2.3 },
        { name: "Gutter Cat Gang", symbol: "GCG", floorPrice: 1.9 },
        { name: "Karafuru", symbol: "KARAFURU", floorPrice: 2.8 },
        { name: "RTFKT - MNLTH", symbol: "MNLTH", floorPrice: 3.6 }
    ];

    // Generate 100 mock collections
    collectionsData = [];
    
    // First add the real top collections
    for (let i = 0; i < topCollections.length; i++) {
        const col = topCollections[i];
        collectionsData.push({
            name: col.name,
            symbol: col.symbol,
            floorPrice: col.floorPrice,
            dayChange: (Math.random() * 20 - 10).toFixed(2),
            weekChange: (Math.random() * 30 - 15).toFixed(2),
            totalSupply: Math.floor(Math.random() * 10000) + 5000,
            volume24h: (Math.random() * 500 + 50).toFixed(2),
            owners: Math.floor(Math.random() * 8000) + 2000,
            image: `https://via.placeholder.com/40?text=${col.symbol}`
        });
    }
    
    // Then generate more random collections to reach 100
    for (let i = topCollections.length; i < 100; i++) {
        const name = `NFT Collection ${i+1}`;
        const symbol = `NFT${i+1}`;
        const floorPrice = (Math.random() * 30 + 0.5).toFixed(2);
        
        collectionsData.push({
            name: name,
            symbol: symbol,
            floorPrice: parseFloat(floorPrice),
            dayChange: (Math.random() * 20 - 10).toFixed(2),
            weekChange: (Math.random() * 30 - 15).toFixed(2),
            totalSupply: Math.floor(Math.random() * 10000) + 1000,
            volume24h: (Math.random() * 300 + 10).toFixed(2),
            owners: Math.floor(Math.random() * 5000) + 1000,
            image: `https://via.placeholder.com/40?text=${symbol}`
        });
    }

    updateMarketStats(collectionsData);
    filteredCollections = [...collectionsData];
    renderTable();
    updatePagination();
    loadingSpinner.classList.remove('active');
}

function updateMarketStats(collections) {
    totalCollectionsElement.textContent = collections.length;
    
    const totalVolume = collections.reduce((sum, col) => sum + parseFloat(col.volume24h), 0);
    totalVolumeElement.textContent = `${(totalVolume / 1000).toFixed(1)}K`;

    const totalOwners = collections.reduce((sum, col) => sum + col.owners, 0);
    totalOwnersElement.textContent = totalOwners.toLocaleString();

    const floorCap = collections.reduce((sum, col) => sum + (col.floorPrice * col.totalSupply), 0);
    floorCapElement.textContent = `${(floorCap / 1000).toFixed(1)}K`;
}

function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredCollections.slice(start, end);

    nftTableBody.innerHTML = pageData.map((col, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>
                <div class="crypto-name">
                    <img src="../assets/mock_nft_avatar.png" alt="${col.name}" width="40" height="40"
                         onerror="this.src='placeholder.png'">
                    <div>
                        <span>${col.name}</span>
                        <span class="crypto-symbol">${col.symbol}</span>
                    </div>
                </div>
            </td>
            <td>${col.floorPrice?.toFixed(1) || 'N/A'} ETH</td>
            <td class="price-change ${col.dayChange >= 0 ? 'positive' : 'negative'}">
                ${col.dayChange >= 0 ? '+' : ''}${col.dayChange || 0}%
            </td>
            <td class="price-change ${col.weekChange >= 0 ? 'positive' : 'negative'}">
                ${col.weekChange >= 0 ? '+' : ''}${col.weekChange || 0}%
            </td>
            <td>${col.totalSupply?.toLocaleString()}</td>
            <td>${(col.volume24h / 1000)?.toFixed(1)}K ETH</td>
            <td>${col.owners?.toLocaleString()}</td>
        </tr>
    `).join('');
}


function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        filterCollections(e.target.value);
        currentPage = 1;
        renderTable();
        updatePagination();
    });
    
    // Pagination
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
        }
    });
    
    nextPageBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(filteredCollections.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            renderTable();
            updatePagination();
        }
    });
}

function filterCollections(searchTerm) {
    if (!searchTerm) {
        filteredCollections = [...collectionsData];
        return;
    }
    
    const term = searchTerm.toLowerCase();
    filteredCollections = collectionsData.filter(collection => 
        collection.name.toLowerCase().includes(term) || 
        collection.symbol.toLowerCase().includes(term)
    );
}

function updatePagination() {
    const maxPage = Math.ceil(filteredCollections.length / itemsPerPage);
    pageInfo.textContent = `Page ${currentPage}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === maxPage || maxPage === 0;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}