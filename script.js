// 🚨 YOUR GOOGLE SHEET ID
const SHEET_ID = '19W33pFurvp8OHdVYSzcBsH2xjML6p5PStGCZeUblIsM'; 

document.getElementById('year').innerText = new Date().getFullYear();

let allProducts = [];
const grid = document.getElementById('product-grid');
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Check URL for direct product link
const hash = window.location.hash.substring(1); 
const urlParams = new URLSearchParams(hash);
const productLinkId = urlParams.get('product');

async function loadProducts() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true, 
            skipEmptyLines: true,
            transformHeader: function(header) { return header.trim().toLowerCase(); },
            complete: function(results) {
                const today = new Date();
                today.setHours(0,0,0,0);

                // Filter out expired products
                allProducts = results.data.filter(product => {
                    if (!product.expiry || product.expiry.trim() === '') return true;
                    const expiryDate = new Date(product.expiry);
                    if (isNaN(expiryDate.getTime())) return true; 
                    return today <= expiryDate;
                });
                
                document.getElementById('product-counter').innerHTML = `<i class="fa-solid fa-box"></i> ${allProducts.length} Products`;

                // If a specific product was linked, filter to just that one
                if (productLinkId) {
                    const filtered = allProducts.filter(p => {
                        const cleanName = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return cleanName === productLinkId;
                    });
                    
                    if (filtered.length > 0) {
                        document.getElementById('searchInput').value = filtered[0].name;
                        renderProducts(filtered);
                        return;
                    }
                }
                renderProducts(allProducts);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Error loading store. Please check permissions.</p>';
    }
}

function renderProducts(products) {
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h3>No products found</h3>
                <p>Try searching for something else.</p>
            </div>
        `;
        return;
    }

    products.forEach((product, index) => {
        let selarLink = product['selar link'] ? product['selar link'].trim() : '#';
        const rawPrice = product['price usd'];
        const formattedPrice = rawPrice && rawPrice.trim() !== '' ? `$${rawPrice}` : 'Free';

        let imgUrl = product.image ? product.image.trim() : '';
        if (imgUrl.includes('drive.google.com')) {
            const fileId = imgUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileId && fileId[1]) imgUrl = `https://drive.google.com/uc?export=view&id=${fileId[1]}`;
        }
        const fallbackImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
        if (!imgUrl) imgUrl = fallbackImage;

        const cleanName = (product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const storeLink = `${window.location.origin}${window.location.pathname}#product=${cleanName}`;

        const card = document.createElement('div');
        card.className = 'card';
        
        // Stagger the 3D Assembly Animation
        card.style.animationDelay = `${index * 0.15}s`;
        
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${imgUrl}" alt="${product.name}" class="card-image" onerror="this.src='${fallbackImage}'">
                <div class="share-btn" onclick="shareProduct('${storeLink}', event)">
                    <i class="fa-solid fa-link"></i>
                </div>
            </div>
            <div class="card-content">
                <h3>${product.name || 'Untitled Product'}</h3>
                <p class="description">${product.description || 'No description available.'}</p>
                <div class="price-row">
                    <div class="price">${formattedPrice}</div>
                </div>
                <a href="${selarLink}" target="_blank" class="buy-btn">
                    Buy Now
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Copy Share Link Function
window.shareProduct = function(link, event) {
    event.stopPropagation();
    navigator.clipboard.writeText(link).then(() => {
        const btn = event.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: #4ade80;"></i>';
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }).catch(err => alert('Could not copy link: ' + link));
}

// Search Functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => {
        const name = (product.name || '').toLowerCase();
        const desc = (product.description || '').toLowerCase();
        return name.includes(searchTerm) || desc.includes(searchTerm);
    });
    renderProducts(filteredProducts);
});

// Start the engine
loadProducts();