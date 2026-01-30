// Kande VendTech Product Catalog - App Logic

// State
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 48;
let currentCategory = 'popular';
let currentSort = 'name';
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
// Default Top Picks - edit this list as needed
const DEFAULT_TOP_PICKS = ["60fbdc19-61b1-4c22-9e45-88dcc6252d1c","521b03fa-0ce0-4d2a-840e-a73189ce042a","366fb2a3-b5d8-428e-ba6d-c3edccce2f69","1c3878f3-0fc4-400b-a16c-1808d200a020","f8508bc5-7613-4911-bd6e-7f62c8066182","1e2e92b2-0ff1-42af-83ba-fa494c8bd525","b5d40cc1-4977-4286-bae3-c6def1239be3","2c7e562e-1cbb-46d0-afe7-8f33534e6fec","5aa3ba22-d9e3-4f6a-a9a6-269bd69791d3","15ac31b5-73eb-4a64-829a-0159a4a17aaa","7a912584-d5e6-43b0-8f0a-f474ccf1432f","8f92823c-ac18-4fbc-a0be-770d534f1698","337094a2-bef5-436e-92c5-d86b2399edc8","64bbd2d2-c4ae-4aea-a2a9-f3d9201ed18b","efae88e0-5622-427d-ba6b-1d69b35cc25c","f8678969-1651-4b6c-bafc-9e0c3ce67e3f","7b0fb406-35ba-4b3c-a264-1d87909e36c0","f2e53fb5-30ae-4986-83ee-7da2fd51e324","1a771bed-e249-4811-9172-c6e90eda4270","7b4882a7-6aeb-4cea-a011-e2f7f82d25e3","8ae8b772-5d76-4384-a96a-495d7c0d31e0","ba9311e2-7b0b-4437-b5c9-9616e643f4fd","6879c9f7-2d9f-45e4-921b-bbd937ac9583","53799b7d-694f-41f6-b2e9-bdc74f26725c","fe8d93d4-7343-4784-8212-9a2653cf4e4a","8965fdfd-756d-41e0-b75e-be2e05da79f0","f9f83c22-8957-4347-a30b-969e4a8f896b","17f5a8f4-3b45-408a-b23a-722fff5e7aec","b1596633-ccfd-45b4-b682-db9d828d47f9","fd95c191-6bf9-4644-ad1c-c3848dc13d5d","6a0a07d4-42a6-4e3f-898a-374dd88c8f9d","034580ec-0962-4caf-8acb-9a750f7fc399","ca2681f1-56ad-41c9-8b24-0ad257c5fa24","72b909fc-b5dd-44fd-8870-bd53d6cb15f6","66789c49-e530-4804-9b27-6a0c3f8a26a9","d87bc582-f600-4679-bbc4-0be7cab1e26c","d6af79e0-bdf8-4b16-9a84-a5993497e306","5c2b361a-8f1f-478e-9318-d8da1ff4ae9e","77059ae2-04c3-41d8-ba6e-fa0728b23c5f","5eaa291b-4af0-4248-8f3c-720d7639b059","8af334fb-243e-4375-8d41-213cb7825d3b","4d68acf1-dfe2-4915-83d3-a02f8d514ac2","2d6408af-aed8-49fa-a0c2-5c68fa733c6b","940ca6eb-6006-4340-bc7f-3b6655d0b416","905687a1-3e1f-4604-96b5-45df2e31e92e","5bec708a-6fd4-4dbe-8222-02ef72a9c0db","5fe6d2b5-b8f2-4833-8549-a257a8a4e93c","62b928ad-2e1d-49c5-a4da-e847b2de635a","cb923ea2-d9a2-42af-87c3-2892e04dfbf7","0e41b258-2e7b-4b2b-a285-3998b391da31","4c8659f9-1d40-4678-90a9-d18ec3f0840f","15a676a0-da3d-41a7-8a61-ac3fc004ca57","9c005dbf-3825-4255-bd9b-8bf2b73e1b52","9a51294c-4961-4856-8747-a85aa2a76f5c","ad5eaeab-7940-45eb-b047-b97e2550252e","d5fb4e01-3ea4-49f7-bf15-d539d14732e5","a6996e50-8220-42cd-adc9-34fcd49e1cca","4bab3eae-c031-4add-9bf9-6a0b79129d55","1aae9291-7bca-4671-97f6-ee8e54f0876e","e52cf1c2-e7a0-4991-85d1-314d456c4b55","fa22b317-47e4-4b5a-a2c4-e9b1ee667940","3dd96715-d06c-4bf9-a1a4-9d7953a8bf2e","1ef8e1e6-0b36-42ca-b9d6-90d3a9c73998","9a8db164-9ecb-46f4-8320-155cc8adec31","0d60e50d-642a-473c-a90f-1d56f493e20e","ba143e63-ca8f-4736-ae85-5b5220201a8c","874773e4-02c7-496b-ad80-41fbe2a95162","0f596005-23ae-491a-ae88-8555ad2de9da","3f067cf6-6213-4411-89c0-488434c0b3fa","d31fab76-5549-405c-960b-aea4324e6f63","783f785f-a806-481e-bba4-0a6d30cea18b","b9f90794-5edb-434e-b470-945dabe9ca12","9dd9ee55-38fd-42b8-ba19-e886d8578468","092456eb-bd99-495e-9b3c-920e7d530245","517eb386-c3e0-4a2b-8bcb-431ae9047a7a","28f5ec4e-382d-4b83-bb28-8ff60d22776c","642910e9-a096-4452-b9c7-b8b23848fa40","deb25c39-2c35-4828-8a48-ad5941af3f96","0aa50264-ba20-4678-840c-7304def1afef","5c78b887-3812-48d0-8917-f9a298584766","5d134563-542e-40cf-87c5-23b2c6a8a975","4f3bce31-c838-40a3-b950-cd338ebe828c","dd5809ff-5607-464f-afc4-70a4e267f383","e6c12e33-e876-402b-8bd5-f776eaa92a4c","96a33f88-72ef-4eba-a69f-faae2484a222","10abe6f2-bfe0-49c0-8982-bb9c9b317468","c74611a6-3ff4-49fa-8c81-765d24d3e779","40907e1a-21c2-4818-90b6-5c05f8e83c86","56d2f566-48ed-4143-981e-9ed77826d8a0","d16d98c6-45a3-4206-a6f0-7e34b3fddfcf","f2858e0a-9f41-4943-843d-623405e279b2","195e5c2c-e281-48c5-8295-76aed6b3007f","206d5637-d79d-427a-8793-99e8994979a7","1f716d53-bc99-43a4-82bf-f51509fadea1","e3cfa8a5-e85b-452f-a59d-3ef6ccf9badf","1b491ff3-9d87-4a30-8a38-caab0e6a4ec4","7a243f45-6c74-416c-b9e6-3f9ede873a4c","1b90f26f-2764-4c3b-9e28-301a43c2094b","c23b97b6-8ba4-45f2-a4f8-9a0cb577a044","21eccf90-2e08-44f7-a39d-74ca4fe94977","4b9605ba-31b0-47d0-8ecf-1e0a1cdd3e44","edf7ff5c-930a-4278-a6e0-01568414bb88","7d51185b-44b0-4db2-a33d-798cc83a0f84","14fa407f-9e36-48f3-861d-62b21976b538","de45b5a9-3423-403a-8138-91a97cd6ddf0","750a0e27-aa3b-44d3-8a11-e43081922ad1","8313eb18-0ae9-484c-8eba-61656e230bde","f832a818-83db-403e-9fca-96a914a17bf9","6f4590e5-1dd8-4063-81e0-55dbed736ec9","bf9fc288-3c35-433b-80dd-5f7f79f31a44","91753dcb-fb80-43ab-b5e7-8869952e18f4","74bc69cb-f22d-45a1-97ac-5975deac5fc8","2502caaf-168b-4dfa-b2c1-b6e744901b0a","5aa1adbe-f8eb-4f55-bc75-cac0f804ac2d","fe733489-6b94-4aef-87bb-e629fd43a027","06704003-7ec9-4de0-bb79-2bcdad0f34d6","56bb8b62-5298-4c5c-bfd7-1639b9e7f834","c1bde8e4-caaf-498a-998b-fe6abc936086","3cf9d8ca-7ee3-4ae9-89cc-c55babf2f85c","b8df19c2-f11d-41c2-9c77-7f8513b825e4","cc9374e9-7971-41b3-80ff-4f9e6ad16809","c19681b5-ab3c-4dd6-8774-3ce634476307","a2b3f294-0a75-4baa-ad6f-9109b7970726","ea906e82-dd35-4ba4-a1a1-8e7b06ef7114","190fff57-4f37-45f0-96d5-aac65900fdef","e5213204-b3b5-4487-9730-b4a95dffc663","02c6793f-e2ee-496a-ba48-765f507a4112","c1c63981-42d9-410f-9f2f-c8724d3b44c3","2942b20b-e3a3-4812-8d34-b8369ac25f65","c5aced90-d67a-4990-8c2a-f15a5a311b4d","66c298b0-9d99-4c92-b5f2-c9d27d343984","67180a5f-cbe8-43ae-bac9-de650b86bef7","5bce0345-561a-4177-babb-b3afffb25bbb","41ce7e1d-81bc-45fd-a74c-ae430460fb26","6da29f4b-ca0f-423e-8e10-cc5d9f7b7934","e6ecac63-d68f-4d48-912f-f2aa7069f0c4","1adcd178-e93d-463b-8d76-93ec782037e1","b1518fcb-3738-49a5-a195-145db1f1afae","b2eff31f-665c-4704-bdb0-39484cb3d7e4","3a268fc7-83e9-4081-b99a-23c2a2ceb7d9","b79efc74-f100-4f27-af86-78afe8486359","99e9ea43-d43d-4f58-a9ce-e7972a08d2fd","65a42421-a192-497c-b42b-e1fb514871e2","5b7698d4-cd37-4288-998a-23417c65891f","d8d03ed0-cf6b-417e-8971-a82eba3cc81b","bcb6bb11-590f-43ea-a3c9-084d9db6ab6b","3ba5dfa8-b6a6-4633-94bd-cbaac740a442","53724181-1db4-4d04-861e-f234f708ca57","d064aa0c-28ec-409f-8f11-598d2c22bffd","54b96d7d-8450-438b-91b2-d585e6d116ea","67d79b9d-1baf-47fd-948b-736fd8f9f328","4d1b9f4f-dfbe-4cf4-bec3-7e50357946b3","e306e0b0-c962-48f9-8605-2f8630f28e6e","4d9a2802-58bc-46c7-aab0-d9935008b078","93d41fa5-aa76-446c-8e5f-3c4f3982ff3e","cbc417d6-9769-465e-b75d-12029235d13a","58581152-27f2-43ef-b8eb-0da7d3ee8ccf","celsius-sparkling-orange","celsius-sparkling-watermelon","celsius-peach-mango","celsius-wild-berry","celsius-tropical-vibe","a1512e1b-4975-48ed-a893-4e133c2b3216","37757248-fe9d-41c5-86c4-d21b6096a177","dd4103b1-740a-40cb-921e-1596ca955213","6d29c7c4-cc62-49cd-b0ba-7950edef2b21","dd246419-c70d-4562-83c6-d9b1cb8f51b9","c1fa56f1-36df-4b63-934a-78458b855c0b","c4b568b3-6410-4e34-ad44-0afb1104622b","9ec5bc43-013f-48b0-83fe-092efdefc2ca","d06a1185-0c47-4c04-8a9f-33a28619c192","647b0555-3e99-4b25-8f54-be933fae11c7","0df3b0db-8e94-4e12-87f7-3790b140e708","3d6ccec9-814b-4e42-a31d-e2c644f5546f","dfd9504d-8b4a-4880-bc08-dca610840c7a","13c36a7b-a0b7-4c80-a9ef-f07566c7ec13","e69df238-89dd-48b1-a177-b4c05bda058c","f73f5e11-d5ab-49e6-b6ca-cfa8a01165ae","b1b24f72-4336-4d67-b037-11fdae3250b4","35117a89-2c0e-4305-aeb7-04a8ffd588ee","dad66746-03db-47e9-a747-b2ec83e4d480","3dd50dfe-3028-493c-a914-7394c3033c6f","1ed6957c-f7a9-4043-83b7-1b1a2a39d2dd","712df88c-8c25-4baa-a29f-0c35bfd3ed04","1393aec9-7df6-498f-bfce-d54015d0cdaa","bb6afcf9-b45e-4385-b5ce-3206c1113002","4893ad86-2bc9-4380-8a6c-cc0aea8daaa4","faaee464-4fa4-4af6-ac26-67e088c66481","2876f924-7dd0-405f-bd3c-bed5f4114420","4b5d5566-1014-47b9-bf8c-c84c3a6a9db9","f630a1f9-f0db-4800-9b63-fe4a97709f75","49b6a846-0722-4a17-a355-2fd5333bcce0","6944f639-3a57-4fe9-8d87-2499f3e41f1e","ef8ea3fb-2d05-4cbe-8877-18a1a9966f71","079dd5c2-5566-4f47-a0a1-836d2c520d00","cf8731d1-54c9-469e-8d67-b1573a2928a6","77c20ccf-77ea-409b-9da5-82e4e0d06779","ba3b1dce-05b3-4e42-ae73-49548fca1db3","d4d34cc7-d9fe-40af-a1a8-69f032566fd5","0d48c67d-c028-4def-a97b-c54ec8b08aed","54414e60-5968-4f4d-8387-6b780e212020","77e6403b-7641-4f1b-bcbc-e600173563db","7b9f3653-00b4-47ea-867c-178c2aff14c3","9010a160-8aa7-4fd8-b949-81cc6bd79b89","cc7446d4-df3b-4fdc-b38a-f137993401bb","f37f383d-2e12-4ae6-a5d6-66bdf775c8a0","e5dc7c46-cb6f-45dd-97c2-2d01595b2080","ee3ea3bc-2561-4b3c-9eeb-a873b30fbe11","1129a86a-5b20-4ac6-b988-fa4bb2ab3fc8","e4574ddd-82a6-44a1-a5da-98966c39509f","3bbab71a-f120-412c-99d0-df0b3fec15ee","5ba22c40-cf71-492d-943e-e81750175933","ea0a80dc-c368-4112-b64a-e8439d5ab0cd","0091ff6e-1d7a-41b1-871d-9a9171802fa3","4fd778ee-a71e-42b7-8730-c04b9a42d0ec","187a8207-242d-4b4b-a537-6615a869106b","0b6b2cba-7ad8-480f-a5e1-a6e239ac207d","9ac47175-b508-4f3c-9136-515c931061a9","3c311524-6e30-4025-9c29-88658e1f2781","a27c0c6e-b0da-4746-8f7c-4e95e83b1a80","72352cc8-f1fa-415c-9dd1-19bb264eedfb","0e67b289-8dfe-4401-9840-bfafde981dd8","88b6ee82-7d87-4cb2-98b8-710221befe94","57c73f06-ef73-414c-852e-284b1e3ad29a","40f7bfc6-873e-4233-9369-9068a78d13ba","f79775a1-8b61-4c19-8771-990314abbad6","bff393e6-36f9-4755-93ae-243db6148554","47fa9509-7ed1-477f-9405-f9f1fb462c91","030c7b07-2b10-4249-8192-1edaab1bba74","c471b01e-d676-404d-9b5f-58e9d77f8943","35e8eee6-937f-4962-adb8-fc9dbd999b26","16ecf599-1b06-4083-b077-ec35e277a569","141bf369-9f4e-4089-a4e1-86ae3b24630d","fefca277-18e6-4340-94f1-e47466d32f84","5716fd67-391d-424f-8425-e5bef3b9a383","1c320214-28bf-4c1c-a708-1cc80ddcf76e","c6e1ebb3-f356-4c1a-807d-4cd0f1cf803d"];

function getTop40Products() {
    const top40 = localStorage.getItem('top40Products');
    if (top40) {
        return JSON.parse(top40);
    }
    // Initialize with defaults if empty
    localStorage.setItem('top40Products', JSON.stringify(DEFAULT_TOP_PICKS));
    return DEFAULT_TOP_PICKS;
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

// Client Interest List Management
function getClientInfo() {
    const info = localStorage.getItem('clientInfo');
    return info ? JSON.parse(info) : null;
}

function setClientInfo(name, email, company) {
    localStorage.setItem('clientInfo', JSON.stringify({ name, email, company }));
    updateClientDisplay();
}

function getInterestList() {
    const list = localStorage.getItem('interestList');
    return list ? JSON.parse(list) : [];
}

function addToInterestList(productId) {
    const list = getInterestList();
    if (!list.includes(productId)) {
        list.push(productId);
        localStorage.setItem('interestList', JSON.stringify(list));
        updateInterestCount();
        renderInterestList();
        
        // Auto-open sidebar
        const info = getClientInfo();
        const sidebar = document.getElementById('interestSidebar');
        if (!info) {
            document.getElementById('clientModal').classList.remove('hidden');
            document.getElementById('clientModal').classList.add('flex');
        } else if (sidebar) {
            sidebar.classList.remove('translate-x-full');
        }
        
        const scrollY = window.scrollY;
        filterProducts({ preservePage: true });
        requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
}

function removeFromInterestList(productId) {
    let list = getInterestList();
    list = list.filter(id => id !== productId);
    localStorage.setItem('interestList', JSON.stringify(list));
    updateInterestCount();
    renderInterestList();
    
    const scrollY = window.scrollY;
    filterProducts({ preservePage: true });
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function isInInterestList(productId) {
    return getInterestList().includes(productId);
}

function updateInterestCount() {
    const count = getInterestList().length;
    const el = document.getElementById('interestCount');
    if (el) el.textContent = count;
}

function updateClientDisplay() {
    const info = getClientInfo();
    const el = document.getElementById('clientInfoDisplay');
    if (el && info) {
        el.textContent = info.name + (info.company ? ' • ' + info.company : '');
    }
}

function renderInterestList() {
    const container = document.getElementById('interestListItems');
    if (!container) return;
    
    const list = getInterestList();
    if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Click the + button on products to add them here</p>';
        return;
    }
    
    const items = list.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    container.innerHTML = items.map(p => {
        const price = calculateVendingPrice(p.unitPrice, p.competitivePrice, p.id, p.vendingPriceOverride);
        return `
            <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <img src="${(p.imageUrl && p.imageUrl.length > 0) ? p.imageUrl : 'https://placehold.co/50x50/f3f4f6/9ca3af?text=No+Img'}" 
                     class="w-12 h-12 object-contain rounded" onerror="this.onerror=null; this.src='https://placehold.co/50x50/f3f4f6/9ca3af?text=No+Img'">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${p.name}</p>
                    <p class="text-xs text-gray-500">${p.size} • $${price.toFixed(2)}</p>
                </div>
                <button onclick="removeFromInterestList('${p.id}')" class="text-red-500 hover:text-red-700 p-1">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
        `;
    }).join('');
}

function submitInterestList() {
    const info = getClientInfo();
    const list = getInterestList();
    
    if (!info) {
        document.getElementById('clientModal').classList.remove('hidden');
        document.getElementById('clientModal').classList.add('flex');
        return;
    }
    
    if (list.length === 0) {
        alert('Please add some products to your interest list first!');
        return;
    }
    
    const items = list.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    const productList = items.map(p => {
        return `• ${p.name} (${p.size})`;
    }).join('\n');
    
    const submitBtn = document.getElementById('submitInterestBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Sending...';
    submitBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('name', info.name);
    formData.append('email', info.email);
    formData.append('company', info.company || 'N/A');
    formData.append('_subject', 'Product Interest List from ' + info.name);
    formData.append('message', 'Name: ' + info.name + '\nEmail: ' + info.email + '\nCompany: ' + (info.company || 'N/A') + '\n\nInterested Products:\n' + productList);
    formData.append('_captcha', 'false');
    formData.append('_template', 'table');
    
    fetch('https://formsubmit.co/ajax/hello@kandevendtech.com', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.innerHTML = '✅ Submitted!';
        submitBtn.classList.remove('from-primary-500', 'to-primary-600');
        submitBtn.classList.add('from-green-500', 'to-green-600');
        
        // Show confirmation
        setTimeout(() => {
            alert('✅ Your interest list has been submitted to Kande VendTech!\n\nWe\'ll be in touch at ' + info.email);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('from-green-500', 'to-green-600');
            submitBtn.classList.add('from-primary-500', 'to-primary-600');
        }, 500);
    })
    .catch(error => {
        console.error('Error:', error);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        alert('There was an error submitting. Please try again or email hello@kandevendtech.com directly.');
    });
}

function exportInterestList() {
    const info = getClientInfo();
    const list = getInterestList();
    
    if (list.length === 0) {
        alert('Please add some products to your interest list first!');
        return;
    }
    
    const items = list.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    
    // CSV with each product on its own row
    let csv = 'Product Name,Size,Brand\n';
    items.forEach(p => {
        csv += '"' + p.name + '","' + p.size + '","' + p.brand + '"\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kande-interest-list.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function clearInterestList() {
    if (confirm('Are you sure you want to clear your interest list?')) {
        localStorage.removeItem('interestList');
        updateInterestCount();
        renderInterestList();
        filterProducts({ preservePage: true });
    }
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
    
    // Show rank in "All Products" and "Popular" views
    const showRank = currentCategory === 'all' || currentCategory === 'popular';
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
                    ${displayRank ? `<div class="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-lg shadow-lg">⭐</div>` : ''}
                    ${isHidden ? `<div class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-lg">HIDDEN</div>` : ''}
                    ${!isHidden && !displayRank && has7ElevenPricing ? `<div class="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-lg">7-11</div>` : ''}
                    ${isHealthy && !has7ElevenPricing && !displayRank ? `<div class="absolute top-3 right-3 healthy-badge text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg">💪 Healthy</div>` : ''}
                    <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                        <img src="${(product.imageUrl && product.imageUrl.length > 0) ? product.imageUrl : (product.image && product.image.length > 0) ? product.image : 'https://via.placeholder.com/200?text=No+Image'}" 
                             alt="${product.name}"
                             class="max-w-full max-h-full object-contain"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=No+Image'">
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
                ${displayRank ? `<div class="absolute top-3 left-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-lg shadow-lg">⭐</div>` : ''}
                ${isHealthy && !displayRank ? `<div class="absolute top-3 right-3 healthy-badge text-white text-xs px-2.5 py-1 rounded-lg font-medium shadow-lg">💪 Healthy</div>` : ''}
                <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <img src="${(product.imageUrl && product.imageUrl.length > 0) ? product.imageUrl : (product.image && product.image.length > 0) ? product.image : 'https://via.placeholder.com/200?text=No+Image'}" 
                         alt="${product.name}"
                         class="max-w-full max-h-full object-contain"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=No+Image'">
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
                <button onclick="event.stopPropagation(); ${isInInterestList(product.id) ? `removeFromInterestList('${product.id}')` : `addToInterestList('${product.id}')`}" 
                        class="mt-2 w-full py-2 text-sm rounded-lg transition-colors ${isInInterestList(product.id) ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}">
                    ${isInInterestList(product.id) ? '✓ Added' : '+ Add to Interest List'}
                </button>
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
            if (!isHidden) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return product.name.toLowerCase().includes(query) ||
                       product.brand.toLowerCase().includes(query);
            }
            return true;
        }
        
        // Popular category - show only Top Picks items
        if (currentCategory === 'popular') {
            if (!isInTop40(product.id)) return false;
            // Apply search filter for popular too
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return product.name.toLowerCase().includes(query) ||
                       product.brand.toLowerCase().includes(query);
            }
            return true;
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
        // Regular sorting
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
    updateInterestCount();
    renderInterestList();
    updateClientDisplay();
    
    // Interest List Sidebar
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebar = document.getElementById('closeSidebar');
    const interestSidebar = document.getElementById('interestSidebar');
    
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => {
            const info = getClientInfo();
            if (!info) {
                document.getElementById('clientModal').classList.remove('hidden');
                document.getElementById('clientModal').classList.add('flex');
            } else {
                interestSidebar.classList.remove('translate-x-full');
            }
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            interestSidebar.classList.add('translate-x-full');
        });
    }
    
    // Client Form
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('clientName').value.trim();
            const email = document.getElementById('clientEmail').value.trim();
            const company = document.getElementById('clientCompany').value.trim();
            
            if (name && email) {
                setClientInfo(name, email, company);
                document.getElementById('clientModal').classList.add('hidden');
                document.getElementById('clientModal').classList.remove('flex');
                interestSidebar.classList.remove('translate-x-full');
            }
        });
    }
    
    // Interest List Buttons
    const submitBtn = document.getElementById('submitInterestBtn');
    const exportBtn = document.getElementById('exportInterestBtn');
    const clearBtn = document.getElementById('clearInterestBtn');
    
    if (submitBtn) submitBtn.addEventListener('click', submitInterestList);
    if (exportBtn) exportBtn.addEventListener('click', exportInterestList);
    if (clearBtn) clearBtn.addEventListener('click', clearInterestList);
    
    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'name';
        document.getElementById('brandSelect').value = '';
        document.getElementById('priceSelect').value = '';
        searchQuery = '';
        currentSort = 'name';
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
