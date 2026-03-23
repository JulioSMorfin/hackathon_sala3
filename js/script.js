document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm");
  const formMessage = document.getElementById("formMessage");
  const navLinks = document.querySelectorAll('.navbar a[href^="#"]');

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      formMessage.textContent = "¡Gracias! Hemos recibido tu mensaje.";
      contactForm.reset();
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ======= VARIABLES DEL CARRITO Y REFERENCIAS =======
  const STORAGE_KEY = 'skate_cart';
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartBadge = document.getElementById('cart-badge');
  const emptyCartMsg = document.getElementById('empty-cart-msg');

  const btnOpenCart = document.getElementById('btn-open-cart');
  const btnCloseCart = document.getElementById('btn-close-cart');
  const btnCheckout = document.getElementById('btn-checkout');
  const toastAdd = document.getElementById('toast-add');
  const toastSuccess = document.getElementById('toast-success');

  // Seguridad: si algún elemento no existe, evitamos errores
  const safeToggle = () => {
    if (cartSidebar) cartSidebar.classList.toggle('open');
    if (cartOverlay) cartOverlay.classList.toggle('open');
  };

  if (btnOpenCart) btnOpenCart.addEventListener('click', safeToggle);
  if (btnCloseCart) btnCloseCart.addEventListener('click', safeToggle);
  if (cartOverlay) cartOverlay.addEventListener('click', safeToggle);

  // ======= FUNCIONES DE ALMACENAMIENTO =======
  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  // ======= AGREGAR PRODUCTOS (agrupa por name+price) =======
  const botonesAgregar = document.querySelectorAll('.add-cart-btn');
  botonesAgregar.forEach((boton) => {
    boton.addEventListener('click', (evento) => {
      const tarjeta = evento.target.closest('.product-card') || evento.target.closest('.card');
      if (!tarjeta) return;

      // Extraer datos con selectores robustos
      const titleEl = tarjeta.querySelector('h3') || tarjeta.querySelector('.h5') || tarjeta.querySelector('.card-title');
      const priceEl = tarjeta.querySelector('.price');
      const imgEl = tarjeta.querySelector('.product-img') || tarjeta.querySelector('img');

      const nombre = titleEl ? titleEl.innerText.trim() : 'Skate Item';
      const precioTexto = priceEl ? priceEl.innerText.replace(/[^0-9.-]+/g, '') : '0';
      const precioNumero = parseFloat(precioTexto) || 0;
      const imagen = imgEl ? imgEl.src : '';

      // Usamos una "key" para agrupar productos iguales
      const productKey = `${nombre}|${precioNumero}`;

      // Buscar si ya existe ese producto en el carrito
      const existing = cart.find(it => it.key === productKey);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        // Guardamos key para identificar el item (se usa para eliminar)
        cart.push({
          key: productKey,
          name: nombre,
          price: precioNumero,
          img: imagen,
          quantity: 1
        });
      }

      saveCart();
      actualizarPantalla();
      mostrarToast(toastAdd);
    });
  });

  // ======= CHECKOUT (vaciar carrito) =======
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      if (cart.length === 0) return;
      cart = [];
      saveCart();
      actualizarPantalla();
      safeToggle();
      mostrarToast(toastSuccess);
    });
  }

  // ======= RENDER / UI =======
  function actualizarPantalla() {
    // Total
    const totalDinero = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    if (cartTotalEl) cartTotalEl.textContent = `$${totalDinero.toFixed(2)}`;

    // Badge
    if (cartBadge) {
      if (cart.length > 0) {
        cartBadge.style.display = 'inline-block';
        // mostramos la suma de cantidades, no solo la longitud del array
        const totalItems = cart.reduce((s, it) => s + (it.quantity || 1), 0);
        cartBadge.textContent = totalItems;
      } else {
        cartBadge.style.display = 'none';
      }
    }

    // Lista de items
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
      // No movemos el nodo original; insertamos una copia para evitar "perderlo"
      if (emptyCartMsg) {
        const clone = emptyCartMsg.cloneNode(true);
        clone.style.display = 'block';
        cartItemsContainer.appendChild(clone);
      }
      return;
    }

    // Dibujar cada producto
    cart.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item text-white mb-2 d-flex align-items-center';
      itemDiv.innerHTML = `
        <img src="${item.img}" alt="${item.name}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">
        <div class="ms-3 flex-grow-1">
          <h6 class="mb-0 fw-bold" style="font-size:0.9rem;">${item.name}</h6>
          <small style="color:var(--text-muted);">${item.quantity} x $${(item.price).toFixed(2)}</small>
        </div>
        <div class="d-flex align-items-center">
          <button class="btn-decrease btn btn-sm btn-outline-light border-0 me-2" data-key="${item.key}" aria-label="Decrease ${item.name}">&times;</button>
          <button class="btn-delete btn btn-sm btn-outline-danger border-0" data-key="${item.key}" aria-label="Remove ${item.name}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;
      cartItemsContainer.appendChild(itemDiv);
    });
  }

  // ======= EVENT DELEGATION PARA BORRAR / DISMINUIR CANTIDAD =======
  if (cartItemsContainer) {
    cartItemsContainer.addEventListener('click', (ev) => {
      const btnDelete = ev.target.closest('.btn-delete');
      const btnDecrease = ev.target.closest('.btn-decrease');

      if (btnDelete) {
        const key = btnDelete.dataset.key;
        if (!key) return;
        // eliminar el item por key
        cart = cart.filter(it => String(it.key) !== String(key));
        saveCart();
        actualizarPantalla();
        return;
      }

      if (btnDecrease) {
        const key = btnDecrease.dataset.key;
        if (!key) return;
        const item = cart.find(it => String(it.key) === String(key));
        if (!item) return;
        item.quantity = (item.quantity || 1) - 1;
        if (item.quantity <= 0) {
          cart = cart.filter(it => String(it.key) !== String(key));
        }
        saveCart();
        actualizarPantalla();
        return;
      }
    });
  }

  // ======= TOASTS =======
  function mostrarToast(elementoToast) {
    if (!elementoToast) return;
    elementoToast.classList.add('show');
    setTimeout(() => {
      elementoToast.classList.remove('show');
    }, 2500);
  }

  // Inicializar UI desde localStorage al cargar
  actualizarPantalla();
});