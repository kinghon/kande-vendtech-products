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

// Calculate vending price - use custom price, product override, competitive price, or tiered markup
function calculateVendingPrice(wholesalePrice, competitivePrice, productId, vendingPriceOverride) {
    // Check for custom price override first (from localStorage - admin edits)
    if (productId) {
        const customPrice = getCustomPrice(productId);
        if (customPrice !== undefined) {
            return customPrice;
        }
    }
    
    // Check for product-level price override (from products.js)
    if (vendingPriceOverride !== undefined && vendingPriceOverride !== null) {
        return vendingPriceOverride;
    }
    
    // Use 7-Eleven competitive pricing if available
    if (competitivePrice) {
        return competitivePrice;
    }
    
    // Pricing for items without 7-Eleven competitive pricing:
    // 70% markup (1.7x wholesale)
    // Round to nearest $0.25 for vending-friendly prices
    const multiplier = 1.7; // 70% markup
    const rawPrice = wholesalePrice * multiplier;
    
    // Round to nearest $0.25
    return Math.ceil(rawPrice * 4) / 4;
}

// Hidden products management
function getHiddenProducts() {
    const hidden = localStorage.getItem('hiddenProducts');
    return hidden ? JSON.parse(hidden) : [];
}

function hideProduct(productId) {
    const hidden = getHiddenProducts();
    if (!hidden.includes(productId)) {
        hidden.push(productId);
        localStorage.setItem('hiddenProducts', JSON.stringify(hidden));
        updateHiddenCount();
        
        // Save scroll position
        const scrollY = window.scrollY;
        
        // Preserve page and scroll position
        filterProducts({ preservePage: true });
        
        // Restore scroll position after render
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
        });
    }
}

function unhideProduct(productId) {
    let hidden = getHiddenProducts();
    hidden = hidden.filter(id => id !== productId);
    localStorage.setItem('hiddenProducts', JSON.stringify(hidden));
    updateHiddenCount();
    
    // Save scroll position
    const scrollY = window.scrollY;
    
    // Preserve page and scroll position
    filterProducts({ preservePage: true });
    
    // Restore scroll position after render
    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
    });
}

function isProductHidden(productId) {
    return getHiddenProducts().includes(productId);
}

function updateHiddenCount() {
    const count = getHiddenProducts().length;
    const el = document.getElementById('hiddenCount');
    if (el) el.textContent = count;
}

// Top 40 management
function getTop40Products() {
    const top40 = localStorage.getItem('top40Products');
    return top40 ? JSON.parse(top40) : [];
}

function addToTop40(productId) {
    const top40 = getTop40Products();
    if (!top40.includes(productId) && true) {
        top40.push(productId);
        localStorage.setItem('top40Products', JSON.stringify(top40));
        updateTop40Count();
        
        const scrollY = window.scrollY;
        filterProducts({ preservePage: true });
        requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } else if (false) {
        
    }
}

function removeFromTop40(productId) {
    let top40 = getTop40Products();
    top40 = top40.filter(id => id !== productId);
    localStorage.setItem('top40Products', JSON.stringify(top40));
    updateTop40Count();
    
    const scrollY = window.scrollY;
    filterProducts({ preservePage: true });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function isInTop40(productId) {
    return getTop40Products().includes(productId);
}

function getTop40Rank(productId) {
    const top40 = getTop40Products();
    const index = top40.indexOf(productId);
    return index >= 0 ? index + 1 : null;
}

function updateTop40Count() {
    const count = getTop40Products().length;
    const el = document.getElementById('top40Count');
    if (el) el.textContent = count;
}

// Custom pricing management
function getCustomPrices() {
    const prices = localStorage.getItem('customPrices');
    return prices ? JSON.parse(prices) : {};
}

function setCustomPrice(productId, price) {
    const prices = getCustomPrices();
    prices[productId] = price;
    localStorage.setItem('customPrices', JSON.stringify(prices));
    
    // Save scroll position and re-render
    const scrollY = window.scrollY;
    filterProducts({ preservePage: true });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function clearCustomPrice(productId) {
    const prices = getCustomPrices();
    delete prices[productId];
    localStorage.setItem('customPrices', JSON.stringify(prices));
    
    const scrollY = window.scrollY;
    filterProducts({ preservePage: true });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function getCustomPrice(productId) {
    return getCustomPrices()[productId];
}

function editPrice(productId, currentPrice) {
    const newPrice = prompt('Enter new vending price:', currentPrice.toFixed(2));
    if (newPrice !== null) {
        const parsed = parseFloat(newPrice);
        if (!isNaN(parsed) && parsed > 0) {
            setCustomPrice(productId, parsed);
        } else {
            alert('Please enter a valid price');
        }
    }
}

// Calculate markup percentage (how much above wholesale)
function calculateMarkup(wholesale, vending) {
    return ((vending - wholesale) / wholesale * 100).toFixed(0);
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
    const vendingPrice = calculateVendingPrice(product.unitPrice, product.competitivePrice, product.id, product.vendingPriceOverride);
    const markup = calculateMarkup(product.unitPrice, vendingPrice);
    const isHealthy = product.category === 'healthy' || product.isHealthy;
    const adminMode = typeof window.isAdmin === 'function' && window.isAdmin();
    
    // Only show rank in "All Products" view
    const showRank = currentCategory === 'all';
    const top40Rank = getTop40Rank(product.id);
    const displayRank = showRank ? top40Rank : null;
    const inTop40 = isInTop40(product.id);
    
    // Admin view - shows all pricing details
    const isHidden = isProductHidden(product.id);
    const has7ElevenPricing = product.sevenElevenPrice || product.competitivePrice;
    if (adminMode) {
        return `
            <div class="product-card rounded-2xl overflow-hidden ${isHidden ? 'opacity-50 border-2 border-red-300' : inTop40 ? 'border-2 border-purple-400 bg-purple-50/30' : has7ElevenPricing ? 'border-2 border-orange-300 bg-orange-50/30' : ''}">
                <div class="relative">
                    ${displayRank ? `<div class="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-lg">${displayRank}</div>` : ''}
                    ${isHidden ? `<div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-lg">HIDDEN</div>` : ''}
                    ${!isHidden && !displayRank && has7ElevenPricing ? `<div class="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-lg">7-11</div>` : ''}
                    ${isHealthy && !has7ElevenPricing && !displayRank ? `<div class="absolute top-3 right-3 healthy-badge text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg">💪 Healthy</div>` : ''}
                    <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                        <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/200?text=No+Image'}" 
                             alt="${product.name}"
                             class="max-w-full max-h-full object-contain"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                    </div>
                </div>
                <div class="p-4">
                    <div class="text-xs text-primary-600 uppercase tracking-wider mb-1 font-medium">${product.brand}</div>
                    <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2" title="${product.name}">${product.name}</h3>
                    <div class="text-sm text-gray-500 mb-4">${product.size}</div>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">Wholesale:</span>
                            <span class="text-sm font-medium text-gray-600">${formatPrice(product.unitPrice)}</span>
                        </div>
                        ${product.sevenElevenPrice ? `
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">7-Eleven:</span>
                            <span class="text-sm font-medium text-blue-600">${formatPrice(product.sevenElevenPrice)}</span>
                        </div>` : ''}
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">Vending Price:</span>
                            <div class="flex items-center gap-2">
                                <span class="text-xl font-bold ${getPriceClass(vendingPrice)}">${formatPrice(vendingPrice)}</span>
                                ${getCustomPrice(product.id) !== undefined ? '<span class="text-xs bg-blue-100 text-blue-700 px-1 rounded">Custom</span>' : ''}
                                <button onclick="editPrice('${product.id}', ${vendingPrice})" class="text-xs text-gray-400 hover:text-primary-600">✏️</button>
                            </div>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-sm text-gray-500">Markup:</span>
                            <span class="text-sm font-semibold text-primary-600">${markup}%</span>
                        </div>
                    </div>
                    
                    ${product.rebate ? `<div class="mt-4 text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">${product.rebate}</div>` : ''}
                    
                    <div class="mt-4 text-xs text-gray-400">
                        Case: ${product.unitCount}ct @ ${formatPrice(product.casePrice)}
                    </div>
                    
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${inTop40
                            ? `<button onclick="removeFromTop40('${product.id}')" class="flex-1 text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-colors">⭐ #${top40Rank} Top ⭐</button>`
                            : `<button onclick="addToTop40('${product.id}')" class="flex-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors">⭐ Add to Top</button>`
                        }
                        ${isProductHidden(product.id) 
                            ? `<button onclick="unhideProduct('${product.id}')" class="flex-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">👁 Show</button>`
                            : `<button onclick="hideProduct('${product.id}')" class="flex-1 text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">🚫 Hide</button>`
                        }
                        ${getCustomPrice(product.id) !== undefined 
                            ? `<button onclick="clearCustomPrice('${product.id}')" class="flex-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">↩️ Reset</button>`
                            : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    // Public view - shows vending price only
    return `
        <div class="product-card rounded-2xl overflow-hidden">
            <div class="relative">
                ${displayRank ? `<div class="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-lg">${displayRank}</div>` : ''}
                ${isHealthy && !displayRank ? `<div class="absolute top-3 right-3 healthy-badge text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg">💪 Healthy</div>` : ''}
                <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <img src="${product.imageUrl || product.image || 'https://via.placeholder.com/200?text=No+Image'}" 
                         alt="${product.name}"
                         class="max-w-full max-h-full object-contain"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
                </div>
            </div>
            <div class="p-4">
                <div class="text-xs text-primary-600 uppercase tracking-wider mb-1 font-medium">${product.brand}</div>
                <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm" title="${product.name}">${product.name}</h3>
                <div class="text-xs text-gray-500 mb-2">${product.size}</div>
                ${inTop40 ? `
                    <div class="text-xs text-gray-500 mb-1">Vending Price</div>
                    <div class="text-lg font-bold text-green-600">${formatPrice(vendingPrice)}</div>
                ` : ''}
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
                <h3 class="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p class="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = productsToShow.map((product, index) => {
        // Show ranking for top 30 products when sorted by popularity
        const rank = currentSort === 'popularity' && index < 30 ? index + 1 : null;
        return renderProductCard(product, rank);
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
function filterProducts(options = {}) {
    const adminMode = typeof window.isAdmin === 'function' && window.isAdmin();
    const hiddenProducts = getHiddenProducts();
    const showHiddenToggle = document.getElementById('showHiddenToggle');
    const showHidden = showHiddenToggle && showHiddenToggle.checked;
    
    filteredProducts = allProducts.filter(product => {
        const isHidden = hiddenProducts.includes(product.id);
        
        // Hidden category - show only hidden products (admin only)
        if (currentCategory === 'hidden') {
            return isHidden;
        }
        
        // Hide products for non-admin users (unless showHidden is checked in admin mode)
        if (isHidden) {
            if (!adminMode) return false;
            if (!showHidden) return false;
        }
        
        // Category filter
        if (currentCategory !== 'all') {
            if (currentCategory === 'healthy') {
                // Check for healthy products by exact brand match or specific product types
                const name = (product.name || '').toLowerCase();
                const brand = (product.brand || '').toLowerCase();
                // Actual health food brands (exact match)
                const healthyBrands = ['quest', 'rxbar', 'clif', 'larabar', 'thinkth', 'bareblls', 'built', 'onenbar', 'perfectb', 'natureva', 'fiberone', 'belvita', 'nutrigra', 'kashi', 'smartwat', 'vitawat', 'bodyarmo', 'corepower', 'fairlife', 'chobani', 'siggi', 'oikos', 'atkins', 'gopicnic', 'sahale', 'biena', 'hippeas', 'lesserev', 'skinnypo', 'smartfoo', 'popchips', 'veggistr', 'foodshld', 'thatsit', 'madegood', 'rxbar', 'premier', 'muscle', 'optimum', 'bai'];
                // Kind brand but not Kinder
                const isKindBrand = brand === 'kind' || brand.startsWith('kind ');
                // Specific healthy product indicators
                const healthyProducts = ['protein bar', 'protein shake', 'granola bar', 'greek yogurt', 'yogurt cup', 'yogurt drink', 'yogurt flip', 'trail mix', 'veggie chips', 'veggie straw', 'rice cake', 'protein cookie', 'energy bar', 'nutrition bar', 'keto bar'];
                const isHealthyBrand = healthyBrands.some(b => brand === b || brand.startsWith(b));
                const isHealthyProduct = healthyProducts.some(p => name.includes(p));
                if (!product.isHealthy && product.category !== 'healthy' && !isHealthyBrand && !isKindBrand && !isHealthyProduct) {
                    return false;
                }
            } else if (currentCategory === 'meals') {
                // Meals category: actual prepared food items only
                const validCategories = ['hot_foods', 'refrigerated', 'frozen_foods'];
                if (!validCategories.includes(product.category)) return false;
                const name = product.name.toLowerCase();
                // Exclude non-meal items
                const isExcluded = name.includes('ice cream') || name.includes('ice crm') || name.includes('cracker') || name.includes('cookie') || 
                                   name.includes('candy') || name.includes('gum ') || name.includes('stir ') ||
                                   name.includes('wrapped') || name.includes('sour wedge');
                if (isExcluded) return false;
                // Match actual meals
                const isMeal = name.includes('sandwich') || name.includes(' wrap') || name.includes('salad') || 
                               name.includes('burger') || name.includes(' sub ') || name.includes('wedge') || name.includes('bowl');
                if (!isMeal) return false;
            } else if (currentCategory === 'beverages') {
                // Handle both "beverages" and "cold_beverage" category names
                if (product.category !== 'beverages' && product.category !== 'cold_beverage') return false;
            } else if (currentCategory !== 'healthy' && currentCategory !== 'meals' && product.category !== currentCategory) {
                return false;
            }
        }
        
        // Brand filter
        if (currentBrand && product.brand !== currentBrand) {
            return false;
        }
        
        // Price filter
        if (currentPriceRange) {
            const vendingPrice = calculateVendingPrice(product.unitPrice, product.competitivePrice, product.id, product.vendingPriceOverride);
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
    
    // Reset pagination (unless preserving state)
    if (!options.preservePage) {
        currentPage = 1;
    }
    renderProducts();
}

// Sort products
function sortProducts() {
    filteredProducts.sort((a, b) => {
        // In "All Products" view, Top 40 items always come first in their rank order
        if (currentCategory === 'all') {
            const aTop40 = getTop40Rank(a.id);
            const bTop40 = getTop40Rank(b.id);
            
            // Both in Top 40 - sort by rank
            if (aTop40 && bTop40) return aTop40 - bTop40;
            // Only a in Top 40 - a comes first
            if (aTop40) return -1;
            // Only b in Top 40 - b comes first
            if (bTop40) return 1;
        }
        
        // Regular sorting for non-Top 40 items
        switch (currentSort) {
            case 'popularity':
                return (b.popularity || 0) - (a.popularity || 0);
            case 'price-low':
                return a.unitPrice - b.unitPrice;
            case 'price-high':
                return b.unitPrice - a.unitPrice;
            case 'margin':
                const markupA = (calculateVendingPrice(a.unitPrice, a.competitivePrice, a.id, a.vendingPriceOverride) - a.unitPrice) / a.unitPrice;
                const markupB = (calculateVendingPrice(b.unitPrice, b.competitivePrice, b.id, b.vendingPriceOverride) - b.unitPrice) / b.unitPrice;
                return markupB - markupA;
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
    
    // Show hidden toggle
    const showHiddenToggle = document.getElementById('showHiddenToggle');
    if (showHiddenToggle) {
        showHiddenToggle.addEventListener('change', filterProducts);
    }
    
    // Update hidden count and Top 40 count
    updateHiddenCount();
    updateTop40Count();
    
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

// Filter out non-food items
function isFood(product) {
    const name = (product.name || '').toLowerCase();
    const nonFoodKeywords = [
        'stirrer', 'stir stk', 'straw ', 'straws', 'napkin', 'fork ', 'forks', 'spoon ', 'spoons', 
        'knife ', 'knives', 'utensil', 'plate ', 'plates', 'tray ', 'trays', 'container', 'sleeve',
        'filter coffee', 'filter paper', 'filter tea', 'filter urn', 'coffee filter',
        'sugar ind', 'sugar packet', 'sweetener packet', 'splenda', 'equal packet',
        'creamer cup', 'creamer lqd', 'creamer frnch', 'deodorant', 'sanitizer', 'soap', 'cleaner',
        'towel', 'tissue', 'glove', 'foil wrap', 'plastic wrap', 'cling wrap'
    ];
    return !nonFoodKeywords.some(keyword => name.includes(keyword));
}

// Initialize
function init() {
    if (typeof PRODUCTS !== 'undefined') {
        // Filter out non-food items
        allProducts = PRODUCTS.filter(isFood);
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
