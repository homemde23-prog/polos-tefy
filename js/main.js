document.addEventListener('DOMContentLoaded', () => {
    setupMenu();

    Promise.all([
        loadProductsData(),
        loadPricesData()
    ]).then(() => {
        setupPricingAndColorLogic();
        initDefaultGalleries();
        renderPriceTable();
    }).catch(() => {
        // Si algo falla, al menos configuramos tallas y la tabla
        setupPricingAndColorLogic();
        renderPriceTable();
    });
});

let productsData = {};
let pricesData = {};   // { talla: precio }
let pricesList = [];   // lista ordenada para tabla

// ---------------------------
//  Menú responsive
// ---------------------------
function setupMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-list a');

    if (!menuToggle || !navList) return;

    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
        });
    });

    if (window.innerWidth < 768) {
        const style = document.createElement('style');
        style.textContent = `
            .nav-list {
                display: block !important;
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background-color: var(--color-bg-light);
                box-shadow: 0 4px 5px rgba(0,0,0,0.1);
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-in-out;
            }
            .nav-list.active {
                max-height: 300px; 
            }
            .nav-list li {
                text-align: center;
                padding: 0.5rem 0;
            }
        `;
        document.head.appendChild(style);
    }
}

// ---------------------------
//  Carga de JSONs
// ---------------------------
function loadProductsData() {
    return fetch('data/products.json')
        .then(res => res.json())
        .then(data => {
            productsData = data;
        });
}

function loadPricesData() {
    return fetch('data/prices.json')
        .then(res => res.json())
        .then(data => {
            pricesList = data.precios || [];
            pricesData = {};
            pricesList.forEach(item => {
                pricesData[item.talla] = item.precio;
            });
        });
}

// ---------------------------
//  WhatsApp y precios
// ---------------------------

// CAMBIA ESTE NÚMERO POR EL TUYO REAL
const whatsappNumber = "51987654321"; // Ej: +51 987 654 321
const whatsappBaseURL = `https://wa.me/${whatsappNumber}?text=`;

// Actualiza precio + botón WhatsApp
function actualizarProducto(productCard) {
    if (!productCard) return;

    const selectTalla = productCard.querySelector('.select-talla');
    const selectColor = productCard.querySelector('.select-color');

    if (!selectTalla) return;

    const modeloID = selectTalla.dataset.modeloId;
    const tallaSeleccionada = selectTalla.value;
    const colorSeleccionado = selectColor ? selectColor.value : null;

    const precioSpan = document.getElementById(`precio-${modeloID}`);
    const whatsappButton = document.getElementById(`btn-whatsapp-${modeloID}`);
    const nombreModelo = productCard.dataset.modelo || 'Producto';

    if (!precioSpan || !whatsappButton) return;

    const requiereColor = !!selectColor;
    const precio = pricesData[tallaSeleccionada];

    if (typeof precio === 'number' && (!requiereColor || colorSeleccionado)) {
        // Mostrar precio
        precioSpan.textContent = precio;

        // Activar botón
        whatsappButton.removeAttribute('disabled');
        whatsappButton.textContent = `¡Pedir ${precio} S/ por WhatsApp!`;

        const textoColor = colorSeleccionado 
            ? `%0A*Color:* ${colorSeleccionado}` 
            : "";

        const mensaje = `Hola, me interesa la camiseta: ${nombreModelo}.` +
                        `%0A*Talla:* ${tallaSeleccionada}` +
                        textoColor +
                        `%0A*Precio:* ${precio} S/.` +
                        `%0A*Calidad:* Algodón Jersey 20/1 Reactivo.`;

        whatsappButton.href = whatsappBaseURL + mensaje;
    } else {
        // Falta talla / color o no hay precio en JSON
        precioSpan.textContent = '--';
        whatsappButton.setAttribute('disabled', 'true');
        whatsappButton.textContent = requiereColor 
            ? 'Selecciona talla y color' 
            : 'Selecciona talla';
        whatsappButton.href = '#';
    }
}

// Escuchar cambios en tallas y colores
function setupPricingAndColorLogic() {
    // Tallas
    const selectoresTalla = document.querySelectorAll('.select-talla');
    selectoresTalla.forEach(selectElement => {
        selectElement.addEventListener('change', function() {
            const productCard = this.closest('.product-card');
            actualizarProducto(productCard);
        });
    });

    // Colores
    const selectoresColor = document.querySelectorAll('.select-color');
    selectoresColor.forEach(selectColor => {
        selectColor.addEventListener('change', function() {
            const productId = this.dataset.productId;
            const color = this.value;
            actualizarGaleria(productId, color);
            const productCard = this.closest('.product-card');
            actualizarProducto(productCard);
        });
    });
}

// ---------------------------
//  Tabla de precios desde JSON
// ---------------------------
function renderPriceTable() {
    const tbody = document.getElementById('price-table-body');
    if (!tbody || !Array.isArray(pricesList)) return;

    tbody.innerHTML = "";

    pricesList.forEach(item => {
        const tr = document.createElement('tr');

        const tdTalla = document.createElement('td');
        tdTalla.innerHTML = `<strong>${item.talla}</strong>`;

        const tdPrecio = document.createElement('td');
        tdPrecio.textContent = item.precio;

        tr.appendChild(tdTalla);
        tr.appendChild(tdPrecio);

        tbody.appendChild(tr);
    });
}

// ---------------------------
//  Galerías de productos
// ---------------------------
function initDefaultGalleries() {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const productId = card.dataset.productId;
        const selectColor = card.querySelector('.select-color');

        if (selectColor) {
            // Si hay selector de color → usar primer color válido
            let colorDefault = selectColor.value;
            if (!colorDefault) {
                const firstOption = Array.from(selectColor.options).find(opt => opt.value);
                if (firstOption) {
                    colorDefault = firstOption.value;
                    selectColor.value = colorDefault;
                }
            }
            if (colorDefault) {
                actualizarGaleria(productId, colorDefault);
            }
        } else {
            // Sin colores → usar "default" si existe
            actualizarGaleria(productId, 'default');
        }
    });
}

function actualizarGaleria(productId, color) {
    if (!productsData || !productsData[productId]) return;

    const productInfo = productsData[productId];
    const colores = productInfo.colores || {};

    if (!colores[color]) {
        if (colores['default']) {
            color = 'default';
        } else {
            return;
        }
    }

    const imagenes = colores[color];
    if (!Array.isArray(imagenes) || imagenes.length === 0) return;

    const galleryContainer = document.getElementById(`gallery-${productId}`);
    if (!galleryContainer) return;

    galleryContainer.innerHTML = "";

    const mainDiv = document.createElement('div');
    mainDiv.className = 'product-gallery-main';

    const mainImg = document.createElement('img');
    mainImg.src = imagenes[0];
    mainImg.alt = `${productInfo.nombre} - ${color}`;
    mainDiv.appendChild(mainImg);

    const thumbsDiv = document.createElement('div');
    thumbsDiv.className = 'product-gallery-thumbs';

    imagenes.forEach((src, idx) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.alt = `${productInfo.nombre} - ${color} - imagen ${idx + 1}`;
        if (idx === 0) thumb.classList.add('active');

        thumb.addEventListener('click', () => {
            mainImg.src = src;
            thumbsDiv.querySelectorAll('img').forEach(img => img.classList.remove('active'));
            thumb.classList.add('active');
        });

        thumbsDiv.appendChild(thumb);
    });

    galleryContainer.appendChild(mainDiv);
    galleryContainer.appendChild(thumbsDiv);
}
