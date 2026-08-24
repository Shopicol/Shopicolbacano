/* =====================================================================
   SHOPICOL BACANO — script.js
   Toda la lógica del catálogo: render de tarjetas, búsqueda en tiempo
   real, filtros por categoría/marca/disponibilidad, orden, modal de
   producto y modo de precio (Detal / Mayor).
   El catálogo (PRODUCTS) se carga en init() vía fetchCatalog(), definida
   en supabase-client.js: usa Supabase si está configurado en config.js,
   o el catálogo semilla local (SEED_PRODUCTS de products.js) si no.
   ===================================================================== */

(function () {
  "use strict";

  /* ---------------------------------------------------------------
     0. Estado global de la app
     --------------------------------------------------------------- */
  const state = {
    query: "",
    category: "Todas",
    brand: "",
    onlyAvailable: false,
    sort: "relevance",
    priceMode: "detal", // "detal" | "mayor"
  };

  // El catálogo se llena de forma asíncrona en init() — puede venir de
  // Supabase (en vivo) o del catálogo semilla local (SEED_PRODUCTS).
  let PRODUCTS = [];
  const CATEGORY_ORDER = [
    "Todas", "Rostro", "Ojos", "Labios", "Cejas",
    "Brochas y Pinceles", "Capilar", "Cuidado Corporal", "Cuidado Facial",
    "Accesorios", "Otros"
  ];

  /* ---------------------------------------------------------------
     1. Referencias al DOM
     --------------------------------------------------------------- */
  const el = {
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    categoryPills: document.getElementById("categoryPills"),
    brandSelect: document.getElementById("brandSelect"),
    onlyAvailable: document.getElementById("onlyAvailable"),
    sortSelect: document.getElementById("sortSelect"),
    resultsCount: document.getElementById("resultsCount"),
    productGrid: document.getElementById("productGrid"),
    emptyState: document.getElementById("emptyState"),
    resetFilters: document.getElementById("resetFilters"),
    modeToggle: document.getElementById("modeToggle"),
    modeWord: document.getElementById("modeWord"),
    statTotal: document.getElementById("statTotal"),
    statBrands: document.getElementById("statBrands"),
    statStock: document.getElementById("statStock"),
    marqueeTrack: document.getElementById("marqueeTrack"),
    footerBrandsList: document.getElementById("footerBrandsList"),
    footerBottom: document.getElementById("footerBottom"),

    // ajustes / marca dinámica
    headerLogoImg: document.getElementById("headerLogoImg"),
    headerTagline: document.getElementById("headerTagline"),
    footerLogoImg: document.getElementById("footerLogoImg"),
    footerTagline: document.getElementById("footerTagline"),
    footerDescription: document.getElementById("footerDescription"),
    metaDescription: document.getElementById("metaDescription"),
    eyebrowText: document.getElementById("eyebrowText"),
    heroTitle: document.getElementById("heroTitle"),
    heroSubtitle: document.getElementById("heroSubtitle"),
    heroNoteText: document.getElementById("heroNoteText"),
    contactSection: document.getElementById("contactSection"),
    contactTitle: document.getElementById("contactTitle"),
    contactSubtitle: document.getElementById("contactSubtitle"),
    contactLinks: document.getElementById("contactLinks"),
    // modal
    modalOverlay: document.getElementById("modalOverlay"),
    modalClose: document.getElementById("modalClose"),
    modalImg: document.getElementById("modalImg"),
    modalStamp: document.getElementById("modalStamp"),
    modalBrand: document.getElementById("modalBrand"),
    modalTitle: document.getElementById("modalTitle"),
    modalRef: document.getElementById("modalRef"),
    modalDetal: document.getElementById("modalDetal"),
    modalMayor: document.getElementById("modalMayor"),
    modalOffer: document.getElementById("modalOffer"),
    modalCategory: document.getElementById("modalCategory"),
    modalQtyMinus: document.getElementById("modalQtyMinus"),
    modalQtyPlus: document.getElementById("modalQtyPlus"),
    modalQty: document.getElementById("modalQty"),
    modalAddCart: document.getElementById("modalAddCart"),

    // carrito
    cartBtn: document.getElementById("cartBtn"),
    cartCount: document.getElementById("cartCount"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartClose: document.getElementById("cartClose"),
    cartItems: document.getElementById("cartItems"),
    cartEmptyState: document.getElementById("cartEmptyState"),
    cartFooter: document.getElementById("cartFooter"),
    cartPriceModeLabel: document.getElementById("cartPriceModeLabel"),
    cartTotal: document.getElementById("cartTotal"),
    mayorProgress: document.getElementById("mayorProgress"),
    mayorProgressFill: document.getElementById("mayorProgressFill"),
    mayorProgressText: document.getElementById("mayorProgressText"),
    checkoutBtn: document.getElementById("checkoutBtn"),

    // checkout
    checkoutOverlay: document.getElementById("checkoutOverlay"),
    checkoutClose: document.getElementById("checkoutClose"),
    checkoutForm: document.getElementById("checkoutForm"),
    checkoutTierNote: document.getElementById("checkoutTierNote"),
    custName: document.getElementById("custName"),
    custPhone: document.getElementById("custPhone"),
    custCity: document.getElementById("custCity"),
    custPayment: document.getElementById("custPayment"),
    custDelivery: document.getElementById("custDelivery"),
    custAddress: document.getElementById("custAddress"),
    addressField: document.getElementById("addressField"),
    pickupNote: document.getElementById("pickupNote"),
    nationalNote: document.getElementById("nationalNote"),
    custNote: document.getElementById("custNote"),
    submitOrderBtn: document.getElementById("submitOrderBtn"),
    checkoutError: document.getElementById("checkoutError"),
    checkoutSuccess: document.getElementById("checkoutSuccess"),
    checkoutDoneBtn: document.getElementById("checkoutDoneBtn"),

    // banners y destacados
    bannerCarousel: document.getElementById("bannerCarousel"),
    bannerTrack: document.getElementById("bannerTrack"),
    bannerPrev: document.getElementById("bannerPrev"),
    bannerNext: document.getElementById("bannerNext"),
    bannerDots: document.getElementById("bannerDots"),
    featuredSection: document.getElementById("featuredSection"),
    featuredScroll: document.getElementById("featuredScroll"),
  };

  /* ---------------------------------------------------------------
     2. Utilidades
     --------------------------------------------------------------- */
  function money(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return "$" + Number(n).toFixed(2).replace(/\.00$/, "");
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // quita tildes para búsqueda flexible
  }

  /* ---------------------------------------------------------------
     3. Construcción de filtros dinámicos (marcas + categorías)
     --------------------------------------------------------------- */
  function buildBrandOptions() {
    const brands = Array.from(new Set(PRODUCTS.map(p => p.brand))).sort((a, b) =>
      a.localeCompare(b, "es")
    );
    brands.forEach(brand => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      el.brandSelect.appendChild(opt);
    });

    // Footer: lista de marcas
    el.footerBrandsList.textContent = brands.join(" · ");

    // Marquee decorativo (se repite 2 veces para el loop continuo)
    const marqueeItems = [...brands, ...brands]
      .map(b => `<span>${b}</span>`)
      .join("");
    el.marqueeTrack.innerHTML = marqueeItems;
  }

  function buildCategoryPills() {
    const presentCats = new Set(PRODUCTS.map(p => p.category));
    const cats = ["Todas", ...CATEGORY_ORDER.filter(c => c !== "Todas" && presentCats.has(c))];

    el.categoryPills.innerHTML = "";
    cats.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "pill" + (cat === state.category ? " active" : "");
      btn.type = "button";
      btn.dataset.cat = cat;
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        state.category = cat;
        document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        render();
      });
      el.categoryPills.appendChild(btn);
    });
  }

  /* ---------------------------------------------------------------
     4. Filtrado + orden
     --------------------------------------------------------------- */
  function getFilteredProducts() {
    const q = normalize(state.query);

    let list = PRODUCTS.filter(p => {
      if (state.category !== "Todas" && p.category !== state.category) return false;
      if (state.brand && p.brand !== state.brand) return false;
      if (state.onlyAvailable && !p.avail) return false;

      if (q) {
        const haystack = normalize(`${p.name} ${p.brand} ${p.category} ${p.ref}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (state.sort) {
      case "price-asc":
        list = list.slice().sort((a, b) => (a[state.priceMode] || 0) - (b[state.priceMode] || 0));
        break;
      case "price-desc":
        list = list.slice().sort((a, b) => (b[state.priceMode] || 0) - (a[state.priceMode] || 0));
        break;
      case "name-asc":
        list = list.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      default:
        // "relevance": mantiene el orden original del catálogo,
        // pero sube los disponibles primero si no se filtró ya por eso
        if (!state.onlyAvailable) {
          list = list.slice().sort((a, b) => (b.avail === a.avail ? 0 : b.avail ? 1 : -1));
        }
    }

    return list;
  }

  /* ---------------------------------------------------------------
     5. Render de tarjetas
     --------------------------------------------------------------- */
  function cardTemplate(p, index) {
    const priceModeLabel = state.priceMode;
    const unavailableClass = p.avail ? "" : " is-unavailable";
    const badge = p.offer
      ? `<span class="card-badge">Antes ${money(p[priceModeLabel])}</span>`
      : "";
    const stamp = !p.avail
      ? `<span class="stamp-agotado">Agotado</span>`
      : "";
    const quickAdd = p.avail
      ? `<button class="card-quickadd" data-quickadd="${p.id}" aria-label="Agregar ${p.name} al carrito" title="Agregar al carrito">+</button>`
      : "";

    return `
      <article class="card${unavailableClass}" style="--delay:${Math.min(index * 0.03, 0.5)}s" data-id="${p.id}" tabindex="0" role="button" aria-label="Ver detalle de ${p.name}">
        <div class="card-img-wrap">
          <img src="${p.image}" alt="${p.name}" loading="lazy" width="300" height="300">
          ${badge}
          ${stamp}
          ${quickAdd}
        </div>
        <div class="card-body">
          <p class="card-brand">${p.brand}</p>
          <h3 class="card-name">${p.name}</h3>
          <p class="card-ref">${p.ref ? "Ref: " + p.ref : "Sin referencia"}</p>
          <div class="card-prices">
            <div class="price-chip detal">
              <span>Detal</span>
              <strong>${money(p.detal)}</strong>
            </div>
            <div class="price-chip mayor">
              <span>Mayor</span>
              <strong>${money(p.mayor)}</strong>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Conecta los eventos de una grilla de tarjetas ya pintada (abrir modal +
  // agregar rápido al carrito). Se reutiliza para el grid principal y para
  // el carrusel de destacados.
  function attachCardListeners(container) {
    container.querySelectorAll(".card").forEach(card => {
      const openModal = () => {
        const id = Number(card.dataset.id);
        const product = PRODUCTS.find(p => p.id === id);
        if (product) showModal(product);
      };
      card.addEventListener("click", openModal);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal();
        }
      });
    });

    container.querySelectorAll("[data-quickadd]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        addToCart(btn.dataset.quickadd, 1);
        btn.classList.add("added");
        btn.textContent = "✓";
        setTimeout(() => {
          btn.classList.remove("added");
          btn.textContent = "+";
        }, 700);
      });
    });
  }

  function render() {
    const filtered = getFilteredProducts();

    // contador de resultados
    el.resultsCount.innerHTML = filtered.length
      ? `Mostrando <strong>${filtered.length}</strong> de <strong>${PRODUCTS.length}</strong> productos`
      : "";

    if (!filtered.length) {
      el.productGrid.innerHTML = "";
      el.emptyState.hidden = false;
      return;
    }

    el.emptyState.hidden = true;
    el.productGrid.innerHTML = filtered.map(cardTemplate).join("");
    attachCardListeners(el.productGrid);
  }

  /* ---------------------------------------------------------------
     6. Modal de producto
     --------------------------------------------------------------- */
  let currentModalProduct = null;
  let modalQtyValue = 1;

  function showModal(p) {
    el.modalImg.src = p.image;
    el.modalImg.alt = p.name;
    el.modalStamp.hidden = p.avail;
    el.modalBrand.textContent = p.brand;
    el.modalTitle.textContent = p.name;
    el.modalRef.textContent = p.ref ? `Referencia: ${p.ref}` : "Referencia no especificada";
    el.modalDetal.textContent = money(p.detal);
    el.modalMayor.textContent = money(p.mayor);
    el.modalCategory.textContent = p.category;

    if (p.offer) {
      el.modalOffer.hidden = false;
      el.modalOffer.textContent = `🔥 Precio especial ahora: ${money(p.offer)}`;
    } else {
      el.modalOffer.hidden = true;
    }

    currentModalProduct = p;
    modalQtyValue = 1;
    el.modalQty.textContent = modalQtyValue;
    el.modalAddCart.disabled = !p.avail;
    el.modalAddCart.textContent = p.avail ? "Agregar al carrito" : "Agotado";

    el.modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    el.modalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.modalClose.addEventListener("click", closeModal);
  el.modalOverlay.addEventListener("click", e => {
    if (e.target === el.modalOverlay) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !el.modalOverlay.hidden) closeModal();
  });

  el.modalQtyMinus.addEventListener("click", () => {
    modalQtyValue = Math.max(1, modalQtyValue - 1);
    el.modalQty.textContent = modalQtyValue;
  });
  el.modalQtyPlus.addEventListener("click", () => {
    modalQtyValue += 1;
    el.modalQty.textContent = modalQtyValue;
  });
  el.modalAddCart.addEventListener("click", () => {
    if (!currentModalProduct || !currentModalProduct.avail) return;
    addToCart(currentModalProduct.id, modalQtyValue);
    el.modalAddCart.textContent = "¡Agregado! ✓";
    el.modalAddCart.classList.add("added");
    setTimeout(() => {
      el.modalAddCart.textContent = "Agregar al carrito";
      el.modalAddCart.classList.remove("added");
    }, 1100);
  });

  /* ---------------------------------------------------------------
     7. Listeners de filtros / búsqueda / orden
     --------------------------------------------------------------- */
  const debouncedSearch = debounce(() => {
    state.query = el.searchInput.value.trim();
    el.clearSearch.hidden = state.query.length === 0;
    render();
  }, 180);

  el.searchInput.addEventListener("input", debouncedSearch);

  el.clearSearch.addEventListener("click", () => {
    el.searchInput.value = "";
    state.query = "";
    el.clearSearch.hidden = true;
    render();
    el.searchInput.focus();
  });

  el.brandSelect.addEventListener("change", () => {
    state.brand = el.brandSelect.value;
    render();
  });

  el.onlyAvailable.addEventListener("change", () => {
    state.onlyAvailable = el.onlyAvailable.checked;
    render();
  });

  el.sortSelect.addEventListener("change", () => {
    state.sort = el.sortSelect.value;
    render();
  });

  el.resetFilters.addEventListener("click", () => {
    state.query = "";
    state.category = "Todas";
    state.brand = "";
    state.onlyAvailable = false;
    state.sort = "relevance";
    el.searchInput.value = "";
    el.clearSearch.hidden = true;
    el.brandSelect.value = "";
    el.onlyAvailable.checked = false;
    el.sortSelect.value = "relevance";
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    document.querySelector('.pill[data-cat="Todas"]')?.classList.add("active");
    render();
  });

  /* ---------------------------------------------------------------
     8. Toggle Detal / Mayor
     --------------------------------------------------------------- */
  el.modeToggle.addEventListener("click", () => {
    const isMayor = state.priceMode === "detal";
    state.priceMode = isMayor ? "mayor" : "detal";
    el.modeToggle.setAttribute("aria-pressed", String(isMayor));
    el.modeWord.textContent = isMayor ? "Mayor" : "Detal";
    // Reordena visualmente si el usuario está ordenando por precio
    if (state.sort === "price-asc" || state.sort === "price-desc") render();
    // Además resalta el chip de precio activo en las tarjetas ya pintadas
    document.querySelectorAll(".price-chip").forEach(chip => {
      chip.style.outline = "none";
    });
    const activeClass = state.priceMode; // "detal" | "mayor"
    document.querySelectorAll(`.price-chip.${activeClass}`).forEach(chip => {
      chip.style.outline = `2px solid ${activeClass === "mayor" ? "#E8A33D" : "#D6336C"}`;
    });
  });

  /* ---------------------------------------------------------------
     9. Stats del hero
     --------------------------------------------------------------- */
  function paintStats() {
    const total = PRODUCTS.length;
    const brands = new Set(PRODUCTS.map(p => p.brand)).size;
    const inStock = PRODUCTS.filter(p => p.avail).length;

    animateCount(el.statTotal, total);
    animateCount(el.statBrands, brands);
    animateCount(el.statStock, inStock);
  }

  function animateCount(node, target) {
    const duration = 900;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------
     9.5 Carrito de compras (persistido en localStorage del navegador)
     --------------------------------------------------------------- */
  const CART_KEY = "shopicol_cart_v1";
  // Regla de negocio: desde $50 (calculado a precio Detal) el pedido
  // completo pasa automáticamente a precio Mayor — "no es por cantidad
  // de piezas, sino por monto", tal como indica el catálogo original.
  const MAYOR_THRESHOLD = 50;
  let cart = loadCart();

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }
  function cartCount() {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }
  function addToCart(id, qty) {
    id = String(id);
    cart[id] = (cart[id] || 0) + qty;
    saveCart();
    renderCartBadge();
  }
  function setCartQty(id, qty) {
    id = String(id);
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    saveCart();
    renderCartBadge();
    renderCartPanel();
  }
  function removeFromCart(id) {
    delete cart[String(id)];
    saveCart();
    renderCartBadge();
    renderCartPanel();
  }

  // Subtotal de referencia SIEMPRE a precio Detal — es el monto que
  // determina si el pedido desbloquea el precio Mayor.
  function cartDetalSubtotal() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = PRODUCTS.find(pp => String(pp.id) === String(id));
      if (!p) return sum;
      const price = p.offer || p.detal || 0;
      return sum + qty * price;
    }, 0);
  }
  function isMayorUnlocked() {
    return cartDetalSubtotal() >= MAYOR_THRESHOLD;
  }
  function cartLineItems() {
    const mayorUnlocked = isMayorUnlocked();
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = PRODUCTS.find(pp => String(pp.id) === String(id));
        if (!p) return null;
        const tierPrice = mayorUnlocked ? (p.mayor || 0) : (p.detal || 0);
        const price = p.offer || tierPrice;
        return { id: p.id, name: p.name, image: p.image, qty, price };
      })
      .filter(Boolean);
  }
  function cartTotal() {
    return cartLineItems().reduce((sum, item) => sum + item.qty * item.price, 0);
  }
  function renderCartBadge() {
    const count = cartCount();
    el.cartCount.textContent = count;
    el.cartCount.hidden = count === 0;
  }
  function renderMayorProgress() {
    const subtotal = cartDetalSubtotal();
    const unlocked = subtotal >= MAYOR_THRESHOLD;
    const pct = Math.min(100, (subtotal / MAYOR_THRESHOLD) * 100);
    el.mayorProgressFill.style.width = pct + "%";
    el.mayorProgress.classList.toggle("unlocked", unlocked);
    if (unlocked) {
      el.mayorProgressText.innerHTML = `🎉 <strong>¡Desbloqueaste precio Mayor!</strong> Se aplicó a todo tu pedido.`;
    } else {
      const remaining = MAYOR_THRESHOLD - subtotal;
      el.mayorProgressText.innerHTML = `Te faltan <strong>${money(remaining)}</strong> en tu carrito para precio Mayor.`;
    }
    return unlocked;
  }
  function renderCartPanel() {
    const items = cartLineItems();
    if (!items.length) {
      el.cartItems.innerHTML = "";
      el.cartEmptyState.hidden = false;
      el.cartFooter.hidden = true;
      return;
    }
    el.cartEmptyState.hidden = true;
    el.cartFooter.hidden = false;
    const unlocked = renderMayorProgress();
    el.cartPriceModeLabel.textContent = unlocked ? "Mayor" : "Detal";
    el.cartTotal.textContent = money(cartTotal());
    el.cartItems.innerHTML = items.map(item => `
      <div class="cart-line">
        <img src="${item.image}" alt="">
        <div class="cart-line-info">
          <p class="cart-line-name">${item.name}</p>
          <p class="cart-line-price">${money(item.price)} c/u</p>
          <div class="cart-line-actions">
            <div class="qty-stepper">
              <button type="button" data-cart-minus="${item.id}" aria-label="Restar">−</button>
              <span>${item.qty}</span>
              <button type="button" data-cart-plus="${item.id}" aria-label="Sumar">+</button>
            </div>
            <button class="cart-remove" data-cart-remove="${item.id}">Quitar</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  function openCart() {
    renderCartPanel();
    el.cartOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    el.cartOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.cartBtn.addEventListener("click", openCart);
  el.cartClose.addEventListener("click", closeCart);
  el.cartOverlay.addEventListener("click", e => { if (e.target === el.cartOverlay) closeCart(); });

  el.cartItems.addEventListener("click", e => {
    const minusId = e.target.closest("[data-cart-minus]")?.dataset.cartMinus;
    const plusId = e.target.closest("[data-cart-plus]")?.dataset.cartPlus;
    const removeId = e.target.closest("[data-cart-remove]")?.dataset.cartRemove;
    if (minusId) setCartQty(minusId, (cart[minusId] || 1) - 1);
    if (plusId) setCartQty(plusId, (cart[plusId] || 0) + 1);
    if (removeId) removeFromCart(removeId);
  });

  /* ---------------------------------------------------------------
     9.6 Checkout: datos del cliente + envío a WhatsApp + Supabase
     --------------------------------------------------------------- */
  function resetCheckoutForm() {
    el.checkoutForm.reset();
    el.checkoutForm.hidden = false;
    el.checkoutSuccess.hidden = true;
    el.addressField.hidden = true;
    el.pickupNote.hidden = true;
    el.nationalNote.hidden = true;
    el.checkoutError.hidden = true;
  }

  function closeCheckout() {
    el.checkoutOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.checkoutBtn.addEventListener("click", () => {
    if (!cartLineItems().length) return;
    closeCart();
    resetCheckoutForm();
    const unlocked = isMayorUnlocked();
    el.checkoutTierNote.textContent = unlocked
      ? "🎉 Tu pedido califica para precio Mayor."
      : `Tu pedido va a precio Detal. Agrega ${money(MAYOR_THRESHOLD - cartDetalSubtotal())} más para precio Mayor.`;
    el.checkoutTierNote.classList.toggle("unlocked", unlocked);
    el.checkoutOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  });
  el.checkoutClose.addEventListener("click", closeCheckout);
  el.checkoutOverlay.addEventListener("click", e => { if (e.target === el.checkoutOverlay) closeCheckout(); });
  el.checkoutDoneBtn.addEventListener("click", () => {
    closeCheckout();
    resetCheckoutForm();
  });

  el.custDelivery.addEventListener("change", () => {
    const val = el.custDelivery.value;
    el.addressField.hidden = val !== "Delivery";
    el.custAddress.required = val === "Delivery";
    el.pickupNote.hidden = val !== "Pickup en Caracas";
    el.nationalNote.hidden = val !== "Envío nacional";
  });

  el.checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    el.checkoutError.hidden = true;

    const items = cartLineItems();
    if (!items.length) {
      el.checkoutError.textContent = "Tu carrito está vacío.";
      el.checkoutError.hidden = false;
      return;
    }

    const unlockedMayor = isMayorUnlocked();
    const order = {
      customer_name: el.custName.value.trim(),
      phone: el.custPhone.value.trim(),
      city: el.custCity.value.trim(),
      payment_method: el.custPayment.value,
      delivery_method: el.custDelivery.value,
      address: el.custAddress.value.trim(),
      note: el.custNote.value.trim(),
      items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
      total: cartTotal(),
      price_mode: unlockedMayor ? "mayor" : "detal",
      status: "nuevo",
    };

    el.submitOrderBtn.disabled = true;
    el.submitOrderBtn.textContent = "Enviando…";

    // Guarda el pedido en el panel de administración (si Supabase está listo)
    if (SUPABASE_READY) {
      try {
        await supabaseClient.from("orders").insert(order);
      } catch (err) {
        console.warn("No se pudo guardar el pedido en Supabase:", err);
      }
    }

    // Arma el mensaje de WhatsApp con el detalle del pedido
    const lines = [];
    lines.push("¡Hola! Quiero hacer este pedido 🩷");
    lines.push("");
    items.forEach(i => lines.push(`• ${i.qty}x ${i.name} — ${money(i.price)} c/u`));
    lines.push("");
    lines.push(`Total: ${money(order.total)} (${unlockedMayor ? "Mayor" : "Detal"})`);
    lines.push("");
    lines.push(`Nombre: ${order.customer_name}`);
    lines.push(`Teléfono: ${order.phone}`);
    lines.push(`Ciudad: ${order.city}`);
    lines.push(`Método de pago: ${order.payment_method}`);
    lines.push(`Entrega: ${order.delivery_method}`);
    if (order.address) lines.push(`Dirección: ${order.address}`);
    if (order.note) lines.push(`Nota: ${order.note}`);

    const rawNumber = typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "";
    const waConfigured = rawNumber && !rawNumber.includes("PEGA_AQUI");
    if (waConfigured) {
      const waDigits = rawNumber.replace(/\D/g, "");
      const message = encodeURIComponent(lines.join("\n"));
      window.open(`https://wa.me/${waDigits}?text=${message}`, "_blank");
    } else {
      console.warn("Configura WHATSAPP_NUMBER en config.js para poder enviar el pedido por WhatsApp.");
    }

    // Vacía el carrito y muestra la confirmación
    cart = {};
    saveCart();
    renderCartBadge();
    el.checkoutForm.hidden = true;
    el.checkoutSuccess.hidden = false;
    el.submitOrderBtn.disabled = false;
    el.submitOrderBtn.textContent = "Enviar pedido por WhatsApp";
  });

  /* ---------------------------------------------------------------
     9.7 Banners promocionales (carrusel superior)
     --------------------------------------------------------------- */
  let bannerSlides = [];
  let bannerIndex = 0;
  let bannerTimer = null;

  async function loadBanners() {
    if (!SUPABASE_READY) return; // se administran desde el panel una vez conectado
    const { data, error } = await supabaseClient
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data || !data.length) return;
    bannerSlides = data;
    renderBanners();
  }

  function renderBanners() {
    if (!bannerSlides.length) return;
    el.bannerCarousel.hidden = false;
    el.bannerTrack.innerHTML = bannerSlides.map(b => `
      <div class="banner-slide" style="background-image:url('${(b.image || "").replace(/'/g, "\\'")}')">
        <div class="banner-slide-content">
          <h3>${b.title}</h3>
          ${b.subtitle ? `<p>${b.subtitle}</p>` : ""}
          ${b.button_text ? `<a href="${b.button_link || "#"}">${b.button_text}</a>` : ""}
        </div>
      </div>
    `).join("");
    el.bannerDots.innerHTML = bannerSlides.map((_, i) =>
      `<button data-dot="${i}" class="${i === 0 ? "active" : ""}" aria-label="Ir al slide ${i + 1}"></button>`
    ).join("");
    el.bannerDots.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => goToBanner(Number(btn.dataset.dot)));
    });
    goToBanner(0);
    startBannerAutoplay();
  }

  function goToBanner(i) {
    bannerIndex = (i + bannerSlides.length) % bannerSlides.length;
    el.bannerTrack.style.transform = `translateX(-${bannerIndex * 100}%)`;
    el.bannerDots.querySelectorAll("button").forEach((b, idx) => b.classList.toggle("active", idx === bannerIndex));
  }
  function startBannerAutoplay() {
    clearInterval(bannerTimer);
    if (bannerSlides.length < 2) return;
    bannerTimer = setInterval(() => goToBanner(bannerIndex + 1), 5000);
  }
  el.bannerPrev.addEventListener("click", () => { goToBanner(bannerIndex - 1); startBannerAutoplay(); });
  el.bannerNext.addEventListener("click", () => { goToBanner(bannerIndex + 1); startBannerAutoplay(); });

  /* ---------------------------------------------------------------
     9.8 Destacados y en oferta (carrusel horizontal)
     --------------------------------------------------------------- */
  function renderFeatured() {
    const featured = PRODUCTS.filter(p => p.featured || p.offer);
    if (!featured.length) {
      el.featuredSection.hidden = true;
      return;
    }
    el.featuredSection.hidden = false;
    el.featuredScroll.innerHTML = featured.map((p, i) => cardTemplate(p, i)).join("");
    attachCardListeners(el.featuredScroll);
  }

  /* ---------------------------------------------------------------
     9.9 Ajustes del sitio (logo, colores, textos, contacto)
     --------------------------------------------------------------- */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
  function escapeRegExp(str) {
    return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const CONTACT_ICONS = {
    whatsapp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 12a8 8 0 1 1-3.6-6.7M20 12l-1.2 4.4L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10c0 3 2 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    instagram: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
    tiktok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 4v9.5a3.5 3.5 0 1 1-3-3.46" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 4c0 2.5 2 4.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    facebook: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M14 8.5h-1.5A1.5 1.5 0 0 0 11 10v2M9.5 12H14M12 12v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  function applySettings(settings) {
    // ---- Logo + tagline (header y footer) ----
    const logoSrc = settings.logo_url || "logo.png";
    el.headerLogoImg.src = logoSrc;
    el.footerLogoImg.src = logoSrc;
    el.headerTagline.textContent = settings.store_tagline || "Bacano";
    el.footerTagline.textContent = settings.store_tagline || "Bacano";

    // ---- Colores de marca (variables CSS) ----
    if (settings.primary_color) {
      document.documentElement.style.setProperty("--pink", settings.primary_color);
    }
    if (settings.accent_color) {
      document.documentElement.style.setProperty("--gold", settings.accent_color);
    }

    // ---- Meta descripción (SEO) ----
    if (el.metaDescription) el.metaDescription.setAttribute("content", settings.meta_description || "");

    // ---- Línea pequeña arriba del título ----
    el.eyebrowText.textContent = settings.eyebrow_text || "";

    // ---- Título y subtítulo del hero ----
    const isDefaultTitle = settings.hero_title === DEFAULT_SETTINGS.hero_title &&
      settings.hero_accent_word === DEFAULT_SETTINGS.hero_accent_word;

    if (isDefaultTitle) {
      el.heroTitle.innerHTML = 'Lo más <span class="ink-highlight">bacano</span><br>para ti.';
    } else {
      let titleHtml = escapeHtml(settings.hero_title || "");
      const accent = (settings.hero_accent_word || "").trim();
      if (accent) {
        const re = new RegExp(`(${escapeRegExp(accent)})`, "i");
        titleHtml = titleHtml.replace(re, '<span class="ink-highlight">$1</span>');
      }
      el.heroTitle.innerHTML = titleHtml;
    }

    if (settings.hero_subtitle === DEFAULT_SETTINGS.hero_subtitle) {
      el.heroSubtitle.innerHTML = 'Maquillaje, capilares y cuidado personal colombiano, directo del catálogo Shopicol.\n      Compra al <strong>detal</strong> sin mínimo, o accede a precio <strong>mayorista</strong> desde $50 en tu compra.';
    } else {
      el.heroSubtitle.textContent = settings.hero_subtitle || "";
    }

    // ---- Cuadro "¿Cómo comprar?" ----
    if (settings.hero_note_text === DEFAULT_SETTINGS.hero_note_text) {
      el.heroNoteText.innerHTML = '<strong>¿Cómo comprar?</strong> El precio <em>Detal</em> es por unidad, sin monto mínimo. El precio <em>Mayor</em> se activa al acumular <strong>$50 o más</strong> en tu pedido — no es por cantidad de piezas, sino por el monto total. ¡Gracias por preferirnos! 🩷';
    } else {
      el.heroNoteText.textContent = settings.hero_note_text || "";
    }

    // ---- Descripción bajo el logo en el pie de página ----
    el.footerDescription.textContent = settings.footer_description || "";

    // ---- Título y frase de la sección Contáctanos ----
    el.contactTitle.textContent = settings.contact_title || "";
    el.contactSubtitle.textContent = settings.contact_subtitle || "";

    // ---- Título de la pestaña del navegador y pie de página ----
    const fullName = `${settings.store_name || "Shopicol"} ${settings.store_tagline || "Bacano"}`;
    document.title = `${fullName} — ${settings.hero_title || "Lo más bacano para ti"}`;
    el.footerBottom.textContent = settings.footer_bottom_text || "";

    // ---- Sección Contáctanos ----
    const links = [];
    const rawWhatsapp = typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : "";
    if (rawWhatsapp && !rawWhatsapp.includes("PEGA_AQUI")) {
      links.push({ icon: "whatsapp", label: "WhatsApp", href: `https://wa.me/${rawWhatsapp.replace(/\D/g, "")}` });
    }
    if (settings.contact_email) {
      links.push({ icon: "email", label: settings.contact_email, href: `mailto:${settings.contact_email}` });
    }
    if (settings.instagram_url) links.push({ icon: "instagram", label: "Instagram", href: settings.instagram_url });
    if (settings.tiktok_url) links.push({ icon: "tiktok", label: "TikTok", href: settings.tiktok_url });
    if (settings.facebook_url) links.push({ icon: "facebook", label: "Facebook", href: settings.facebook_url });

    if (!links.length) {
      el.contactSection.hidden = true;
    } else {
      el.contactSection.hidden = false;
      el.contactLinks.innerHTML = links.map(l => `
        <a class="contact-link" href="${l.href}" target="_blank" rel="noopener">
          ${CONTACT_ICONS[l.icon]}<span>${l.label}</span>
        </a>
      `).join("");
    }
  }

  /* ---------------------------------------------------------------
     10. Init
     --------------------------------------------------------------- */
  async function init() {
    // Muestra un estado de carga breve mientras llega el catálogo
    // (instantáneo con datos locales; puede tardar un instante con Supabase).
    el.resultsCount.textContent = "Cargando catálogo…";

    const [products, settings] = await Promise.all([fetchCatalog(), fetchSettings()]);
    PRODUCTS = products;
    applySettings(settings);

    buildBrandOptions();
    buildCategoryPills();
    paintStats();
    renderCartBadge();
    renderFeatured();
    render();
    loadBanners();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
