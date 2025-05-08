// متغیرهای عمومی
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyZiwwiJn5oV9UqSgyaXCUOenDUEQu2g6meTo0UHz-d2fMppwKvtEodr2cCZMz0kriy/exec';
let allProducts = [];
let basket = [];
let newProductsBasket = [];
let allSuppliers = [];

// عناصر DOM
const loader = document.getElementById('loader');
const toast = document.getElementById('toast');
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');
const menuOverlay = document.getElementById('menuOverlay');
const pageTitle = document.getElementById('pageTitle');

// --- توابع عمومی ---
function showLoader() {
    loader.classList.add('active');
}

function hideLoader() {
    loader.classList.remove('active');
}

function showToast(message, isSuccess = true) {
    toast.textContent = message;
    toast.className = isSuccess ? 'toast' : 'toast error';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

async function fetchData(action, params = {}) {
    try {
        const url = new URL(WEB_APP_URL);
        url.searchParams.set('action', action);
        
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('خطا در ارتباط با سرور');
        }
        return await response.json();
    } catch (error) {
        console.error('خطا در دریافت داده:', error);
        throw error;
    }
}

// --- مدیریت سبد محصولات ---
function updateBasketUI() {
    const basketTable = document.getElementById('basketTable');
    const basketBody = document.getElementById('basketBody');
    const emptyBasket = document.getElementById('emptyBasket');
    
    basketBody.innerHTML = '';
    
    if (basket.length === 0) {
        basketTable.style.display = 'none';
        emptyBasket.style.display = 'block';
        return;
    }
    
    emptyBasket.style.display = 'none';
    basketTable.style.display = '';
    
    basket.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.brand}</td>
            <td>${item.animal}</td>
            <td>${item.price.toLocaleString()}</td>
            <td><button onclick="removeFromBasket(${index})" class="material-icons" style="border:none;background:none;color:red;cursor:pointer;">delete</button></td>
        `;
        basketBody.appendChild(row);
    });
}

function updateNewBasketUI() {
    const basketTable = document.getElementById('newBasketTable');
    const basketBody = document.getElementById('newBasketBody');
    const emptyBasket = document.getElementById('emptyNewBasket');
    
    basketBody.innerHTML = '';
    
    if (newProductsBasket.length === 0) {
        basketTable.style.display = 'none';
        emptyBasket.style.display = 'block';
        return;
    }
    
    emptyBasket.style.display = 'none';
    basketTable.style.display = '';
    
    newProductsBasket.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.brand}</td>
            <td>${item.animal}</td>
            <td>${item.category}</td>
            <td><button onclick="removeFromNewBasket(${index})" class="material-icons" style="border:none;background:none;color:red;cursor:pointer;">delete</button></td>
        `;
        basketBody.appendChild(row);
    });
}

// --- مدیریت منوی همبرگر ---
hamburger.addEventListener('click', () => {
    menu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
});

menuOverlay.addEventListener('click', () => {
    menu.classList.remove('active');
    menuOverlay.classList.remove('active');
});

// --- مدیریت تب‌ها ---
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', async () => {
        document.querySelectorAll('.menu-item').forEach(i => {
            i.classList.remove('active');
        });
        
        item.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tabId = `${item.dataset.tab}Tab`;
        document.getElementById(tabId).classList.add('active');
        
        const icon = item.querySelector('.material-icons').textContent;
        pageTitle.innerHTML = `<span class="material-icons">${icon}</span> ${item.textContent.trim()}`;
        
        menu.classList.remove('active');
        menuOverlay.classList.remove('active');
        
        if (item.dataset.tab === 'cache') {
            await loadProductsToCache();
        }
        
        if (item.dataset.tab === 'register') {
            await loadSuppliers();
        }
        
        if (item.dataset.tab === 'assign') {
            await loadSupplierNames();
        }
    });
});

// --- حالت شب ---
document.getElementById('darkToggle').addEventListener('change', function() {
    document.body.classList.toggle('dark', this.checked);
    localStorage.setItem('darkMode', this.checked);
});

if (localStorage.getItem('darkMode') === 'true') {
    document.getElementById('darkToggle').checked = true;
    document.body.classList.add('dark');
}

// --- مدیریت کش محصولات ---
async function loadProductsToCache() {
    showLoader();
    try {
        // بارگذاری از localStorage
        if (localStorage.getItem('productsCache')) {
            allProducts = JSON.parse(localStorage.getItem('productsCache'));
            document.getElementById('cacheCount').textContent = allProducts.length;
            document.getElementById('lastUpdate').textContent = new Date(localStorage.getItem('lastCacheUpdate') || new Date()).toLocaleString('fa-IR');
            
            updateCacheTable();
        }
        
        // بارگذاری از سرور
        const data = await fetchData('getProducts');
        
        if (Array.isArray(data)) {
            allProducts = data;
            localStorage.setItem('productsCache', JSON.stringify(allProducts));
            localStorage.setItem('lastCacheUpdate', new Date().toISOString());
            
            document.getElementById('cacheCount').textContent = allProducts.length;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('fa-IR');
            
            updateCacheTable();
            showToast('کش محصولات با موفقیت بروزرسانی شد');
        }
    } catch (error) {
        console.error('خطا در بارگذاری کش:', error);
        if (allProducts.length === 0) {
            showToast('خطا در دریافت داده از سرور. از داده‌های محلی استفاده می‌شود', false);
        }
    } finally {
        hideLoader();
    }
}

function updateCacheTable() {
    const tbody = document.getElementById('productCacheBody');
    tbody.innerHTML = '';
    
    if (allProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">محصولی یافت نشد</td></tr>';
        return;
    }
    
    allProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product[0] || '-'}</td>
            <td>${product[1] || '-'}</td>
            <td>${product[2] || '-'}</td>
            <td>${product[3] || '-'}</td>
            <td>${product[4] || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('refreshCache').addEventListener('click', loadProductsToCache);

document.getElementById('clearCache').addEventListener('click', () => {
    allProducts = [];
    localStorage.removeItem('productsCache');
    localStorage.removeItem('lastCacheUpdate');
    document.getElementById('productCacheBody').innerHTML = '<tr><td colspan="5">داده‌ای وجود ندارد</td></tr>';
    document.getElementById('cacheCount').textContent = '0';
    document.getElementById('lastUpdate').textContent = 'هرگز';
    showToast('کش محصولات پاک شد');
});

// جستجو در کش محصولات
document.getElementById('searchCacheBtn').addEventListener('click', () => {
    const productQuery = document.getElementById('cacheProductSearch').value.trim().toLowerCase();
    const brandQuery = document.getElementById('cacheBrandSearch').value.trim().toLowerCase();
    
    if (allProducts.length === 0) {
        showToast('کش محصولات خالی است', false);
        return;
    }
    
    const filtered = allProducts.filter(product => {
        const productName = (product[0] || '').toString().toLowerCase();
        const productBrand = (product[1] || '').toString().toLowerCase();
        
        const matchesProduct = productQuery ? productName.includes(productQuery) : true;
        const matchesBrand = brandQuery ? productBrand.includes(brandQuery) : true;
        
        return matchesProduct && matchesBrand;
    });
    
    const tbody = document.getElementById('productCacheBody');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">محصولی یافت نشد</td></tr>';
        return;
    }
    
    filtered.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product[0] || '-'}</td>
            <td>${product[1] || '-'}</td>
            <td>${product[2] || '-'}</td>
            <td>${product[3] || '-'}</td>
            <td>${product[4] || '-'}</td>
        `;
        tbody.appendChild(row);
    });
});

// --- مدیریت تأمین‌کنندگان ---
async function loadSuppliers() {
    showLoader();
    try {
        const data = await fetchData('getSuppliers');
        
        if (Array.isArray(data)) {
            allSuppliers = data;
            updateSuppliersTable();
        }
    } catch (error) {
        console.error('خطا در بارگذاری تأمین‌کنندگان:', error);
        showToast('خطا در دریافت لیست تأمین‌کنندگان', false);
    } finally {
        hideLoader();
    }
}

async function loadSupplierNames() {
    showLoader();
    try {
        const result = await fetchData('getSupplierNames');
        
        if (result.success) {
            const select = document.getElementById('assignSupplier');
            select.innerHTML = '<option value="">انتخاب تأمین‌کننده</option>';
            
            result.data.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        showToast('خطا در بارگذاری تأمین‌کنندگان', false);
    } finally {
        hideLoader();
    }
}

function updateSuppliersTable(filter = '') {
    const tbody = document.getElementById('supplierResults');
    tbody.innerHTML = '';
    
    if (allSuppliers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">تأمین‌کننده‌ای یافت نشد</td></tr>';
        return;
    }
    
    const filtered = filter ? 
        allSuppliers.filter(s => s[0].toLowerCase().includes(filter.toLowerCase())) : 
        allSuppliers;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">تأمین‌کننده‌ای یافت نشد</td></tr>';
        return;
    }
    
    filtered.forEach(supplier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${supplier[0] || '-'}</td>
            <td>${supplier[1] || '-'}</td>
            <td>${supplier[2] || '-'}</td>
            <td>${supplier[3] || '-'}</td>
            <td>${supplier[4] || '-'}</td>
            <td>${supplier[5] || '-'}</td>
            <td>${supplier[6] || '0'}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('searchSuppliersBtn').addEventListener('click', () => {
    const query = document.getElementById('supplierSearch').value.trim();
    updateSuppliersTable(query);
});

// ثبت تأمین‌کننده جدید
document.getElementById('submitSupplier').addEventListener('click', async () => {
    const name = document.getElementById('supplierName').value.trim();
    const phone = document.getElementById('supplierPhone').value.trim();
    const province = document.getElementById('supplierProvince').value;
    const city = document.getElementById('supplierCity').value.trim();
    const district = document.getElementById('supplierDistrict').value.trim();
    const profit = document.getElementById('supplierProfit').value.trim();
    const address = document.getElementById('supplierAddress').value.trim();
    
    if (!name || !phone || !province || !city || !district || !profit) {
        showToast('لطفاً تمام فیلدهای ضروری را پر کنید', false);
        return;
    }
    
    showLoader();
    
    try {
        const result = await fetchData('addSupplierInfo', {
            name,
            phone,
            province,
            city,
            district,
            profit,
            address
        });
        
        if (result.success) {
            document.getElementById('supplierName').value = '';
            document.getElementById('supplierPhone').value = '';
            document.getElementById('supplierProvince').value = '';
            document.getElementById('supplierCity').value = '';
            document.getElementById('supplierDistrict').value = '';
            document.getElementById('supplierProfit').value = '';
            document.getElementById('supplierAddress').value = '';
            
            await loadSuppliers();
            await loadSupplierNames();
            
            showToast(result.message || 'تأمین‌کننده با موفقیت ثبت شد');
        } else {
            throw new Error(result.error || 'خطا در ثبت تأمین‌کننده');
        }
    } catch (error) {
        showToast('خطا در ثبت تأمین‌کننده: ' + error.message, false);
    } finally {
        hideLoader();
    }
});

// --- جستجوی محصولات ---
function filterProducts() {
    const productQuery = document.getElementById('productSearch').value.trim().toLowerCase();
    const brandQuery = document.getElementById('brandSearch').value.trim().toLowerCase();
    
    if (allProducts.length === 0) {
        showToast('لطفاً ابتدا کش محصولات را بارگذاری کنید', false);
        return;
    }
    
    const filtered = allProducts.filter(product => {
        const productName = (product[0] || '').toString().toLowerCase();
        const productBrand = (product[1] || '').toString().toLowerCase();
        
        const matchesProduct = productQuery ? productName.includes(productQuery) : true;
        const matchesBrand = brandQuery ? productBrand.includes(brandQuery) : true;
        
        return matchesProduct && matchesBrand;
    });
    
    const tbody = document.getElementById('productResults');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">محصولی یافت نشد</td></tr>';
        return;
    }
    
    filtered.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="checkbox-large"></td>
            <td>${product[0] || '-'}</td>
            <td>${product[1] || '-'}</td>
            <td>${product[2] || '-'}</td>
            <td><input type="number" placeholder="قیمت" class="price-input"></td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('searchProductsBtn').addEventListener('click', filterProducts);

// --- مدیریت سبد محصولات ---
document.getElementById('addToBasket').addEventListener('click', () => {
    if (allProducts.length === 0) {
        showToast('لطفاً ابتدا کش محصولات را بارگذاری کنید', false);
        return;
    }
    
    const rows = document.querySelectorAll('#productResults tr');
    let addedCount = 0;
    let hasError = false;
    
    rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const cells = row.querySelectorAll('td');
            const priceInput = row.querySelector('.price-input');
            
            if (!priceInput.value) {
                hasError = true;
                return;
            }
            
            basket.push({
                name: cells[1].textContent,
                brand: cells[2].textContent,
                animal: cells[3].textContent,
                price: parseFloat(priceInput.value)
            });
            
            addedCount++;
            checkbox.checked = false;
            priceInput.value = '';
        }
    });
    
    if (hasError) {
        showToast('لطفاً قیمت را برای تمام محصولات انتخاب شده وارد کنید', false);
        return;
    }
    
    if (addedCount > 0) {
        updateBasketUI();
        showToast(`${addedCount} محصول به سبد اضافه شد`);
    } else {
        showToast('هیچ محصولی انتخاب نشده است', false);
    }
});

// --- افزودن محصول جدید به سبد ---
document.getElementById('addToBasketNew').addEventListener('click', () => {
    const name = document.getElementById('newProductName').value.trim();
    const brand = document.getElementById('newProductBrand').value.trim();
    const animal = document.getElementById('newProductAnimal').value;
    const category = document.getElementById('newProductCategory').value;
    
    if (!name || !brand || !animal || !category) {
        showToast('لطفاً تمام فیلدهای ضروری را پر کنید', false);
        return;
    }
    
    newProductsBasket.push({
        name,
        brand,
        animal,
        category
    });
    
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductBrand').value = '';
    document.getElementById('newProductAnimal').value = '';
    document.getElementById('newProductCategory').value = '';
    
    updateNewBasketUI();
    showToast('محصول جدید به سبد اضافه شد');
});

// --- ثبت نهایی محصولات جدید ---
document.getElementById('submitNewProducts').addEventListener('click', async () => {
    if (newProductsBasket.length === 0) {
        showToast('سبد محصولات خالی است', false);
        return;
    }
    
    showLoader();
    
    try {
        for (const item of newProductsBasket) {
            const result = await fetchData('addProduct', {
                name: item.name,
                brand: item.brand,
                animal: item.animal,
                category: item.category
            });
            
            if (!result.success) {
                throw new Error(result.error || 'خطا در ثبت محصول');
            }
        }
        
        newProductsBasket = [];
        updateNewBasketUI();
        
        await loadProductsToCache();
        
        showToast('محصولات جدید با موفقیت ثبت شدند');
    } catch (error) {
        showToast('خطا در ثبت محصولات: ' + error.message, false);
    } finally {
        hideLoader();
    }
});

// --- اساین محصول به تأمین‌کننده ---
document.getElementById('assignProductBtn').addEventListener('click', async () => {
    const name = document.getElementById('assignSupplier').value.trim();
    
    if (!name) {
        showToast('لطفاً نام تأمین‌کننده را انتخاب کنید', false);
        return;
    }
    
    if (basket.length === 0) {
        showToast('سبد محصولات خالی است', false);
        return;
    }
    
    showLoader();
    
    try {
        for (const item of basket) {
            const result = await fetchData('assignProduct', {
                name,
                productName: item.name,
                brand: item.brand,
                animal: item.animal,
                price: item.price
            });
            
            if (!result.success) {
                throw new Error(result.error || 'خطا در ثبت اطلاعات');
            }
        }
        
        basket = [];
        updateBasketUI();
        
        showToast('محصولات با موفقیت به تأمین‌کننده اساین شدند');
    } catch (error) {
        showToast('خطا در ثبت اطلاعات: ' + error.message, false);
    } finally {
        hideLoader();
    }
});

// --- بروزرسانی نرخ‌ها ---
document.getElementById('updateSearch').addEventListener('click', async () => {
    const name = document.getElementById('searchName').value.trim();
    const brand = document.getElementById('searchBrand').value.trim();
    const product = document.getElementById('searchProduct').value.trim();
    
    if (!name && !brand && !product) {
        showToast('حداقل یک فیلد جستجو را پر کنید', false);
        return;
    }
    
    showLoader();
    
    try {
        const data = await fetchData('searchForUpdate', {
            name,
            brand,
            product
        });
        
        const tbody = document.getElementById('updateResults');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">موردی یافت نشد</td></tr>';
            return;
        }
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item[0]}</td>
                <td>${item[4]}</td>
                <td>${item[5]}</td>
                <td>${item[7] ? item[7].toLocaleString() : '-'}</td>
                <td>${item[8] || '-'}%</td>
                <td><input type="number" id="newPrice${index}" placeholder="قیمت جدید" class="price-input"></td>
                <td><input type="number" id="newProfit${index}" placeholder="سود جدید" class="profit-input"></td>
                <td><button onclick="updateSupplierRate(${index}, '${item[0]}', '${item[4]}', '${item[5]}')" class="material-icons" style="border:none;background:none;color:#3498db;cursor:pointer;">save</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        showToast('خطا در جستجو: ' + error.message, false);
    } finally {
        hideLoader();
    }
});

// --- توابع عمومی برای حذف از سبد ---
window.removeFromBasket = function(index) {
    basket.splice(index, 1);
    updateBasketUI();
    showToast('محصول از سبد حذف شد');
};

window.removeFromNewBasket = function(index) {
    newProductsBasket.splice(index, 1);
    updateNewBasketUI();
    showToast('محصول از سبد حذف شد');
};

window.updateSupplierRate = async function(index, name, product, brand) {
    const newPrice = document.getElementById(`newPrice${index}`).value;
    const newProfit = document.getElementById(`newProfit${index}`).value;
    
    if (!newPrice || !newProfit) {
        showToast('لطفاً قیمت و سود جدید را وارد کنید', false);
        return;
    }
    
    showLoader();
    
    try {
        const result = await fetchData('updateRate', {
            name,
            product,
            brand,
            price: newPrice,
            profit: newProfit
        });
        
        if (result.success) {
            showToast('نرخ با موفقیت به‌روز شد');
            document.getElementById('updateSearch').click();
        } else {
            throw new Error(result.error || 'خطا در به‌روزرسانی');
        }
    } catch (error) {
        showToast('خطا در به‌روزرسانی: ' + error.message, false);
    } finally {
        hideLoader();
    }
};

// --- بارگذاری اولیه ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadProductsToCache();
    await loadSuppliers();
    await loadSupplierNames();
    document.querySelector('[data-tab="register"]').click();
});