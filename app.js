// Kande VendTech Product Catalog - App Logic

// State
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 24;
let currentCategory = 'all';
let currentSort = 'popularity';
let currentBrand = '';
let currentPriceRange = '';
let searchQuery = '';

// Calculate vending price based on wholesale cost
function calculateVendingPrice(wholesalePrice) {
    // Pricing strategy:
    // - Under $1: 3x-3.5x markup
    // - $1-$2: 2.75x-3x markup
    // - $2-$4: 2.5x markup
    // - Over $4: 2x-2.25x markup
    // Round to nearest $0.25 or $0.50 for vending-friendly prices
    
    let multiplier;
    if (wholesalePrice < 1) {
        multiplier = 3.25;
    } else if (wholesalePrice < 2) {
        multiplier = 2.75;
    } else if (wholesalePrice < 4) {
        multiplier = 2.5;
    } else {
        multiplier = 2.25;
    }
    
    const rawPrice = wholesalePrice * multiplier;
    
    // Round to vending-friendly price
    if (rawPrice < 2) {
        return Math.ceil(rawPrice * 4) / 4; // Round to nearest $0.25
    } else if (rawPrice < 5) {
        return Math.ceil(rawPrice * 2) / 2; // Round to nearest $0.50
    } else {
        return Math.ceil(rawPrice); // Round to nearest dollar
    }
}

// Calculate margin percentage
function calculateMargin(wholesale, vending) {
    return ((vending - wholesale) / vending * 100).toFixed(1);
}

// Format currency
function formatPrice(price) {
    return '$' + price.toFixed(2);
}

// Get price class for color coding
function getPriceClass(vendingPrice) {
    if (vendingPrice <= 2.50) return 'price-good';
    if (vendingPrice <= 4.00) return 'price-medium';
    return 'price-high';
}

// Render a single product card
function renderProductCard(product, rank = null) {
    const vendingPrice = calculateVendingPrice(product.unitPrice);
    const margin = calculateMargin(product.unitPrice, vendingPrice);
    const isHealthy = product.category === 'healthy' || product.isHealthy;
    
    return `
        <div class="product-card rounded-2xl overflow-hidden">
            <div class="relative">
                ${rank ? `<div class="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-lg">${rank}</div>` : ''}
                ${isHealthy ? `<div class="absolute top-3 right-3 healthy-badge text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg">💪 Healthy</div>` : ''}
                <div class="aspect-square bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center p-6">
                    <img src="${product.image || 'https://via.placeholder.com/200?text=No+Image'}" 
                         alt="${product.name}"
                         class="max-w-full max-h-full object-contain drop-shadow-lg"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                </div>
            </div>
            <div class="p-5">
                <div class="text-xs text-primary-400 uppercase tracking-wider mb-1 font-medium">${product.brand}</div>
                <h3 class="font-semibold text-white mb-1 line-clamp-2" title="${product.name}">${product.name}</h3>
                <div class="text-sm text-gray-500 mb-4">${product.size}</div>
                
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">Wholesale:</span>
                        <span class="text-sm font-medium text-gray-400">${formatPrice(product.unitPrice)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">Vending Price:</span>
                        <span class="text-xl font-bold ${getPriceClass(vendingPrice)}">${formatPrice(vendingPrice)}</span>
                    </div>
                    <div class="flex justify-between items-center pt-3 border-t border-white/10">
                        <span class="text-sm text-gray-500">Margin:</span>
                        <span class="text-sm font-semibold text-primary-400">${margin}%</span>
                    </div>
                </div>
                
                ${product.rebate ? `<div class="mt-4 text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/30">${product.rebate}</div>` : ''}
                
                <div class="mt-4 text-xs text-gray-600">
                    Case: ${product.unitCount}ct @ ${formatPrice(product.casePrice)}
                </div>
            </div>
        </div>
    `;
}

// Render product grid
function renderProducts() {
    const grid = document.getElementById('productGrid');
    const start = 0;
    const end = currentPage * productsPerPage;
    const productsToShow = filteredProducts.slice(start, end);
    
    if (productsToShow.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="text-6xl mb-4">🔍</div>
                <h3 class="text-xl font-semibold text-white mb-2">No products found</h3>
                <p class="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productsToShow.map((product, index) => {
        const rank = currentCategory === 'all' && currentSort === 'popularity' ? index + 1 : null;
        return renderProductCard(product, rank <= 200 ? rank : null);
    }).join('');
    
    // Update load more button
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (end >= filteredProducts.length) {
        loadMoreContainer.style.display = 'none';
    } else {
        loadMoreContainer.style.display = 'block';
    }
    
    // Update product count
    document.getElementById('productCount').textContent = filteredProducts.length;
}

// Filter products
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        // Category filter
        if (currentCategory !== 'all') {
            if (currentCategory === 'healthy' && !product.isHealthy && product.category !== 'healthy') {
                return false;
            } else if (currentCategory !== 'healthy' && product.category !== currentCategory) {
                return false;
            }
        }
        
        // Brand filter
        if (currentBrand && product.brand !== currentBrand) {
            return false;
        }
        
        // Price filter
        if (currentPriceRange) {
            const vendingPrice = calculateVendingPrice(product.unitPrice);
            if (currentPriceRange === '0-2' && vendingPrice >= 2) return false;
            if (currentPriceRange === '2-4' && (vendingPrice < 2 || vendingPrice >= 4)) return false;
            if (currentPriceRange === '4-6' && (vendingPrice < 4 || vendingPrice >= 6)) return false;
            if (currentPriceRange === '6+' && vendingPrice < 6) return false;
        }
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return product.name.toLowerCase().includes(query) ||
                   product.brand.toLowerCase().includes(query);
        }
        
        return true;
    });
    
    // Sort products
    sortProducts();
    
    // Reset pagination
    currentPage = 1;
    renderProducts();
}

// Sort products
function sortProducts() {
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'popularity':
                return (a.popularity || 0) - (b.popularity || 0);
            case 'price-low':
                return a.unitPrice - b.unitPrice;
            case 'price-high':
                return b.unitPrice - a.unitPrice;
            case 'margin':
                const marginA = calculateVendingPrice(a.unitPrice) - a.unitPrice;
                const marginB = calculateVendingPrice(b.unitPrice) - b.unitPrice;
                return marginB - marginA;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
}

// Populate brand dropdown
function populateBrands() {
    const brands = [...new Set(allProducts.map(p => p.brand))].sort();
    const select = document.getElementById('brandSelect');
    select.innerHTML = '<option value="">All Brands</option>' +
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join('');
    
    document.getElementById('totalBrands').textContent = brands.length;
}

// Event Listeners
function initEventListeners() {
    // Category tabs
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterProducts();
        });
    });
    
    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterProducts();
    });
    
    // Brand select
    document.getElementById('brandSelect').addEventListener('change', (e) => {
        currentBrand = e.target.value;
        filterProducts();
    });
    
    // Price select
    document.getElementById('priceSelect').addEventListener('change', (e) => {
        currentPriceRange = e.target.value;
        filterProducts();
    });
    
    // Search input
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            filterProducts();
        }, 300);
    });
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'popularity';
        document.getElementById('brandSelect').value = '';
        document.getElementById('priceSelect').value = '';
        searchQuery = '';
        currentSort = 'popularity';
        currentBrand = '';
        currentPriceRange = '';
        filterProducts();
    });
    
    // Load more
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentPage++;
        renderProducts();
    });
}

// Initialize
function init() {
    if (typeof PRODUCTS !== 'undefined') {
        allProducts = PRODUCTS;
        filteredProducts = [...allProducts];
        document.getElementById('totalProducts').textContent = allProducts.length;
        populateBrands();
        filterProducts();
    } else {
        console.error('Products data not loaded');
        document.getElementById('productGrid').innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">⚠️</div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Loading Error</h3>
                <p class="text-gray-500">Could not load product data. Please refresh the page.</p>
            </div>
        `;
    }
    
    initEventListeners();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
