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
     0. Estadísticas de visitas (Google Analytics) — opcional
     --------------------------------------------------------------- */
  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  /* ---------------------------------------------------------------
     0.6 Disponibilidad efectiva (considera el stock, si está definido)
     --------------------------------------------------------------- */
  function isEffectivelyAvailable(p) {
    if (!p.avail) return false;
    if (p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0) return false;
    return true;
  }

  /* ---------------------------------------------------------------
     0. Estado global de la app
     --------------------------------------------------------------- */
  const state = {
    query: "",
    category: "Todas",
    brand: "",
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
    sortSelect: document.getElementById("sortSelect"),
    resultsCount: document.getElementById("resultsCount"),
    productGrid: document.getElementById("productGrid"),
    emptyState: document.getElementById("emptyState"),
    resetFilters: document.getElementById("resetFilters"),
    modeToggle: document.getElementById("modeToggle"),
    modeWord: document.getElementById("modeWord"),
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
    modalStockNote: document.getElementById("modalStockNote"),
    modalCategory: document.getElementById("modalCategory"),
    modalQtyMinus: document.getElementById("modalQtyMinus"),
    modalQtyPlus: document.getElementById("modalQtyPlus"),
    modalQty: document.getElementById("modalQty"),
    modalAddCart: document.getElementById("modalAddCart"),
    modalGalleryPrev: document.getElementById("modalGalleryPrev"),
    modalGalleryNext: document.getElementById("modalGalleryNext"),
    modalThumbs: document.getElementById("modalThumbs"),
    modalTones: document.getElementById("modalTones"),
    toneChips: document.getElementById("toneChips"),

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
    custEmail: document.getElementById("custEmail"),
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
    recentSection: document.getElementById("recentSection"),
    recentScroll: document.getElementById("recentScroll"),
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
        setCategoryInURL(cat);
        trackEvent("view_category", { category: cat });
        render();
      });
      el.categoryPills.appendChild(btn);
    });
  }

  // Lee la categoría desde la URL (ej. ?categoria=Ojos) al cargar la página,
  // así los links compartidos abren directo en esa categoría.
  function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("categoria");
  }

  // Lee el término de búsqueda desde la URL (ej. ?buscar=ojos+grises),
  // así los links compartidos (o el buscador de la página de producto)
  // abren directo con esa búsqueda ya aplicada.
  function getSearchFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("buscar");
  }

  // Actualiza la URL (sin recargar la página) cuando cambia la categoría
  // o el término de búsqueda, para que el link se pueda copiar y compartir
  // tal cual — igual que hacen la mayoría de tiendas online.
  function setCategoryInURL(cat) {
    const params = new URLSearchParams(window.location.search);
    if (!cat || cat === "Todas") {
      params.delete("categoria");
    } else {
      params.set("categoria", cat);
    }
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? "?" + query : "");
    window.history.pushState({ categoria: cat }, "", newUrl);
  }

  function setSearchInURL(q) {
    const params = new URLSearchParams(window.location.search);
    if (!q) {
      params.delete("buscar");
    } else {
      params.set("buscar", q);
    }
    const query = params.toString();
    const newUrl = window.location.pathname + (query ? "?" + query : "");
    window.history.replaceState({ buscar: q }, "", newUrl);
  }

  // Si el usuario usa los botones atrás/adelante del navegador, respeta
  // la categoría y la búsqueda que correspondan a esa URL.
  window.addEventListener("popstate", () => {
    const fromUrlCat = getCategoryFromURL();
    const validCats = new Set(PRODUCTS.map(p => p.category));
    state.category = (fromUrlCat && validCats.has(fromUrlCat)) ? fromUrlCat : "Todas";
    document.querySelectorAll(".pill").forEach(p => {
      p.classList.toggle("active", p.dataset.cat === state.category);
    });

    const fromUrlSearch = getSearchFromURL() || "";
    state.query = fromUrlSearch;
    el.searchInput.value = fromUrlSearch;
    el.clearSearch.hidden = fromUrlSearch.length === 0;

    render();
  });

  /* ---------------------------------------------------------------
     4. Filtrado + orden
     --------------------------------------------------------------- */
  function getFilteredProducts() {
    const q = normalize(state.query);

    let list = PRODUCTS.filter(p => {
      if (!isEffectivelyAvailable(p)) return false; // los agotados nunca se muestran al público
      if (state.category !== "Todas" && p.category !== state.category) return false;
      if (state.brand && p.brand !== state.brand) return false;

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
        // "relevance": mantiene el orden original del catálogo (ya vienen
        // todos disponibles, así que no hace falta reordenar por eso)
    }

    return list;
  }

  /* ---------------------------------------------------------------
     5. Render de tarjetas
     --------------------------------------------------------------- */
  function cardTemplate(p, index) {
    const priceModeLabel = state.priceMode;
    const avail = isEffectivelyAvailable(p);
    const unavailableClass = avail ? "" : " is-unavailable";
    const badge = p.offer
      ? `<span class="card-badge">Antes ${money(p[priceModeLabel])}</span>`
      : "";
    const stamp = !avail
      ? `<span class="stamp-agotado">Agotado</span>`
      : "";
    const lowStock = (avail && p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) > 0 && Number(p.stock) <= 5)
      ? `<span class="card-lowstock">¡Solo quedan ${p.stock}!</span>`
      : "";
    const quickAdd = (avail && !(p.tones || "").trim())
      ? `<button class="card-quickadd" data-quickadd="${p.id}" aria-label="Agregar ${p.name} al carrito" title="Agregar al carrito">+</button>`
      : "";

    return `
      <article class="card${unavailableClass}" style="--delay:${Math.min(index * 0.03, 0.5)}s" data-id="${p.id}" tabindex="0" role="button" aria-label="Ver detalle de ${p.name}">
        <div class="card-img-wrap">
          ${lowStock}
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
      const goToProduct = () => {
        window.location.href = `producto.html?id=${card.dataset.id}`;
      };
      card.addEventListener("click", goToProduct);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToProduct();
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
  let currentGalleryImages = [];
  let currentGalleryIndex = 0;
  let currentTones = [];
  let selectedTone = null;

  function renderModalGalleryImage() {
    el.modalImg.src = currentGalleryImages[currentGalleryIndex] || "";
    el.modalThumbs.querySelectorAll("img").forEach((img, i) => {
      img.classList.toggle("active", i === currentGalleryIndex);
    });
  }
  function goToModalImage(i) {
    if (!currentGalleryImages.length) return;
    currentGalleryIndex = (i + currentGalleryImages.length) % currentGalleryImages.length;
    renderModalGalleryImage();
  }
  el.modalGalleryPrev.addEventListener("click", () => goToModalImage(currentGalleryIndex - 1));
  el.modalGalleryNext.addEventListener("click", () => goToModalImage(currentGalleryIndex + 1));
  el.modalThumbs.addEventListener("click", (e) => {
    const idx = e.target.closest("[data-thumb-index]")?.dataset.thumbIndex;
    if (idx != null) goToModalImage(Number(idx));
  });

  function renderToneChips() {
    el.toneChips.innerHTML = currentTones.map(t => `
      <button type="button" class="tone-chip ${t === selectedTone ? "active" : ""}" data-tone="${t}">${t}</button>
    `).join("");
  }
  el.toneChips.addEventListener("click", (e) => {
    const tone = e.target.closest("[data-tone]")?.dataset.tone;
    if (tone) {
      selectedTone = tone;
      renderToneChips();
    }
  });

  function showModal(p) {
    trackEvent("view_item", { item_name: p.name, item_brand: p.brand, item_category: p.category });
    const avail = isEffectivelyAvailable(p);
    el.modalImg.alt = p.name;
    el.modalStamp.hidden = avail;
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

    // Aviso de pocas unidades (si el stock está definido y es bajo)
    if (avail && p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) > 0 && Number(p.stock) <= 5) {
      el.modalStockNote.hidden = false;
      el.modalStockNote.textContent = `⚠️ ¡Solo quedan ${p.stock} unidades!`;
    } else {
      el.modalStockNote.hidden = true;
    }

    // Galería: imagen principal + fotos adicionales (si las hay)
    const gallery = [p.image, ...(Array.isArray(p.gallery_images) ? p.gallery_images : [])].filter(Boolean);
    currentGalleryImages = gallery.length ? gallery : [p.image];
    currentGalleryIndex = 0;
    renderModalGalleryImage();

    if (currentGalleryImages.length > 1) {
      el.modalGalleryPrev.hidden = false;
      el.modalGalleryNext.hidden = false;
      el.modalThumbs.hidden = false;
      el.modalThumbs.innerHTML = currentGalleryImages.map((src, i) => `
        <img src="${src}" alt="" data-thumb-index="${i}" class="${i === 0 ? "active" : ""}">
      `).join("");
    } else {
      el.modalGalleryPrev.hidden = true;
      el.modalGalleryNext.hidden = true;
      el.modalThumbs.hidden = true;
      el.modalThumbs.innerHTML = "";
    }

    // Tonos: se muestran solo si el producto tiene alguno definido
    currentTones = (p.tones || "").split(",").map(s => s.trim()).filter(Boolean);
    selectedTone = currentTones.length ? currentTones[0] : null;
    if (currentTones.length) {
      el.modalTones.hidden = false;
      renderToneChips();
    } else {
      el.modalTones.hidden = true;
      el.toneChips.innerHTML = "";
    }

    currentModalProduct = p;
    modalQtyValue = 1;
    el.modalQty.textContent = modalQtyValue;
    el.modalAddCart.disabled = !avail;
    el.modalAddCart.textContent = avail ? "Agregar al carrito" : "Agotado";

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
    if (!currentModalProduct || !isEffectivelyAvailable(currentModalProduct)) return;
    addToCart(currentModalProduct.id, modalQtyValue, selectedTone);
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
    setSearchInURL(state.query);
    render();
  }, 180);

  el.searchInput.addEventListener("input", debouncedSearch);

  el.clearSearch.addEventListener("click", () => {
    el.searchInput.value = "";
    state.query = "";
    el.clearSearch.hidden = true;
    setSearchInURL("");
    render();
    el.searchInput.focus();
  });

  el.brandSelect.addEventListener("change", () => {
    state.brand = el.brandSelect.value;
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
    state.sort = "relevance";
    el.searchInput.value = "";
    el.clearSearch.hidden = true;
    el.brandSelect.value = "";
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
  /* ---------------------------------------------------------------
     9. (sección de estadísticas del hero — removida a pedido)
     --------------------------------------------------------------- */

  /* ---------------------------------------------------------------
     9.5 Carrito de compras (persistido en localStorage del navegador)
     --------------------------------------------------------------- */
  const CART_KEY = "shopicol_cart_v1";
  // Regla de negocio: desde $50 (calculado a precio Detal) el pedido
  // completo pasa automáticamente a precio Mayor — "no es por cantidad
  // de piezas, sino por monto", tal como indica el catálogo original.
  const MAYOR_THRESHOLD = 50;
  let cart = loadCart();

  // Las claves del carrito son el id del producto solo, o "id::Tono" cuando
  // el cliente eligió un tono específico — así cada tono queda como línea
  // independiente en el carrito.
  function cartKey(id, tone) {
    return tone ? `${id}::${tone}` : String(id);
  }
  function parseCartKey(key) {
    const idx = key.indexOf("::");
    if (idx === -1) return { id: key, tone: null };
    return { id: key.slice(0, idx), tone: key.slice(idx + 2) };
  }

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
  function addToCart(id, qty, tone) {
    const key = cartKey(id, tone);
    cart[key] = (cart[key] || 0) + qty;
    saveCart();
    renderCartBadge();
    const product = PRODUCTS.find(p => String(p.id) === String(id));
    if (product) trackEvent("add_to_cart", { item_name: product.name, item_brand: product.brand, quantity: qty, tone: tone || "" });
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
    return Object.entries(cart).reduce((sum, [key, qty]) => {
      const { id } = parseCartKey(key);
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
      .map(([key, qty]) => {
        const { id, tone } = parseCartKey(key);
        const p = PRODUCTS.find(pp => String(pp.id) === String(id));
        if (!p) return null;
        const tierPrice = mayorUnlocked ? (p.mayor || 0) : (p.detal || 0);
        const price = p.offer || tierPrice;
        const displayName = tone ? `${p.name} (${tone})` : p.name;
        return { key, id: p.id, name: displayName, image: p.image, qty, price, tone };
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
              <button type="button" data-cart-minus="${item.key}" aria-label="Restar">−</button>
              <span>${item.qty}</span>
              <button type="button" data-cart-plus="${item.key}" aria-label="Sumar">+</button>
            </div>
            <button class="cart-remove" data-cart-remove="${item.key}">Quitar</button>
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
      email: el.custEmail.value.trim(),
      city: el.custCity.value.trim(),
      payment_method: el.custPayment.value,
      delivery_method: el.custDelivery.value,
      address: el.custAddress.value.trim(),
      note: el.custNote.value.trim(),
      items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, tone: i.tone || null })),
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

    // Envía una notificación por correo (si EmailJS está configurado)
    sendOrderEmailNotification(order, items);

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
    trackEvent("generate_lead", { value: order.total, currency: "USD", payment_method: order.payment_method });
    cart = {};
    saveCart();
    renderCartBadge();
    el.checkoutForm.hidden = true;
    el.checkoutSuccess.hidden = false;
    el.submitOrderBtn.disabled = false;
    el.submitOrderBtn.textContent = "Enviar pedido por WhatsApp";
  });

  /* ---------------------------------------------------------------
     9.65 Notificación por correo cuando entra un pedido (EmailJS)
     --------------------------------------------------------------- */
  function sendOrderEmailNotification(order, items) {
    const cfg = typeof EMAILJS_CONFIG !== "undefined" ? EMAILJS_CONFIG : null;
    const ready = cfg && cfg.publicKey && !cfg.publicKey.includes("PEGA_AQUI") &&
      cfg.serviceId && !cfg.serviceId.includes("PEGA_AQUI") &&
      cfg.templateId && !cfg.templateId.includes("PEGA_AQUI") &&
      typeof emailjs !== "undefined";

    if (!ready) {
      console.warn("EmailJS no está configurado en config.js — no se envió notificación por correo.");
      return;
    }

    const itemsText = items.map(i => `${i.qty}x ${i.name} — ${money(i.price)} c/u`).join("\n");

    emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: cfg.notifyEmail,
      customer_name: order.customer_name,
      phone: order.phone,
      city: order.city,
      payment_method: order.payment_method,
      delivery_method: order.delivery_method,
      address: order.address || "—",
      note: order.note || "—",
      items_text: itemsText,
      total: money(order.total),
      price_mode: order.price_mode === "mayor" ? "Mayor" : "Detal",
    }, cfg.publicKey).then(
      () => console.log("Notificación de pedido enviada por correo."),
      (err) => console.warn("No se pudo enviar la notificación por correo:", err)
    );
  }

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
     9.75 Recién llegado (4 productos más recientes: nuevos o editados)
     --------------------------------------------------------------- */
  function renderRecentSection() {
    const recent = PRODUCTS
      .filter(p => isEffectivelyAvailable(p) && (p.updated_at || p.created_at))
      .slice()
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 4);

    if (!recent.length) {
      el.recentSection.hidden = true;
      return;
    }
    el.recentSection.hidden = false;
    el.recentScroll.innerHTML = recent.map((p, i) => cardTemplate(p, i)).join("");
    attachCardListeners(el.recentScroll);
  }

  /* ---------------------------------------------------------------
     9.8 Destacados y en oferta (carrusel horizontal)
     --------------------------------------------------------------- */
  function renderFeatured() {
    const featured = PRODUCTS.filter(p => isEffectivelyAvailable(p) && (p.featured || p.offer));
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
    if (settings.bg_color) {
      document.documentElement.style.setProperty("--cream", settings.bg_color);
    }
    if (settings.text_color) {
      document.documentElement.style.setProperty("--ink", settings.text_color);
    }

    // ---- Bordes de las tarjetas ----
    if (settings.card_radius !== null && settings.card_radius !== undefined && settings.card_radius !== "") {
      document.documentElement.style.setProperty("--radius-card", settings.card_radius + "px");
    }

    // ---- Tipografía (par de fuentes) ----
    const fontPair = FONT_PAIRS[settings.font_pair] || FONT_PAIRS.clasica;
    if (fontPair.googleFontsUrl && !document.querySelector(`link[data-font-pair="${settings.font_pair}"]`)) {
      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = fontPair.googleFontsUrl;
      fontLink.dataset.fontPair = settings.font_pair;
      document.head.appendChild(fontLink);
    }
    document.documentElement.style.setProperty("--font-display", fontPair.display);
    document.documentElement.style.setProperty("--font-body", fontPair.body);

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

    // (El cuadro "¿Cómo comprar?" se quitó de la portada a pedido del cliente;
    // el ajuste "hero_note_text" queda guardado pero ya no se muestra aquí.)

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

    // Si el link trae ?categoria=Ojos (por ejemplo), abre directo ahí
    const urlCat = getCategoryFromURL();
    if (urlCat) {
      const validCats = new Set(PRODUCTS.map(p => p.category));
      if (validCats.has(urlCat)) state.category = urlCat;
    }

    // Si el link trae ?buscar=ojos+grises (ej. viniendo del buscador de
    // la página de un producto), precarga esa búsqueda ya escrita.
    const urlSearch = getSearchFromURL();
    if (urlSearch) {
      state.query = urlSearch;
      el.searchInput.value = urlSearch;
      el.clearSearch.hidden = false;
    }

    buildBrandOptions();
    buildCategoryPills();
    renderCartBadge();
    renderRecentSection();
    renderFeatured();
    render();
    loadBanners();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
