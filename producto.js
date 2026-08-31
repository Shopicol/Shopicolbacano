/* =====================================================================
   SHOPICOL BACANO — producto.js
   Página de detalle de producto (URL propia, ej. producto.html?id=123).
   Reutiliza la misma lógica de carrito/checkout que el catálogo, para
   que comprar desde aquí funcione exactamente igual.
   ===================================================================== */
(function () {
  "use strict";

  function trackEvent(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }
  function isEffectivelyAvailable(p) {
    if (!p.avail) return false;
    if (p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) <= 0) return false;
    return true;
  }
  function money(n) {
    const v = Number(n) || 0;
    return "$" + (Number.isInteger(v) ? v : v.toFixed(2)).toString().replace(/\.00$/, "");
  }

  const el = {
    searchInput: document.getElementById("searchInput"),
    modeToggle: document.getElementById("modeToggle"),
    modeWord: document.getElementById("modeWord"),
    cartBtn: document.getElementById("cartBtn"),
    cartCount: document.getElementById("cartCount"),

    headerLogoImg: document.getElementById("headerLogoImg"),
    headerTagline: document.getElementById("headerTagline"),
    footerLogoImg: document.getElementById("footerLogoImg"),
    footerTagline: document.getElementById("footerTagline"),
    footerBottom: document.getElementById("footerBottom"),
    metaDescription: document.getElementById("metaDescription"),
    pageTitle: document.getElementById("pageTitle"),

    productLoading: document.getElementById("productLoading"),
    productNotFound: document.getElementById("productNotFound"),
    productCard: document.getElementById("productCard"),

    modalImg: document.getElementById("modalImg"),
    modalStamp: document.getElementById("modalStamp"),
    modalGalleryPrev: document.getElementById("modalGalleryPrev"),
    modalGalleryNext: document.getElementById("modalGalleryNext"),
    modalThumbs: document.getElementById("modalThumbs"),
    modalBrand: document.getElementById("modalBrand"),
    modalTitle: document.getElementById("modalTitle"),
    modalRef: document.getElementById("modalRef"),
    modalDetal: document.getElementById("modalDetal"),
    modalMayor: document.getElementById("modalMayor"),
    modalOffer: document.getElementById("modalOffer"),
    modalStockNote: document.getElementById("modalStockNote"),
    modalCategory: document.getElementById("modalCategory"),
    modalTones: document.getElementById("modalTones"),
    modalToneHint: document.getElementById("modalToneHint"),
    toneChips: document.getElementById("toneChips"),
    modalQtyMinus: document.getElementById("modalQtyMinus"),
    modalQtyPlus: document.getElementById("modalQtyPlus"),
    modalQty: document.getElementById("modalQty"),
    modalAddCart: document.getElementById("modalAddCart"),

    relatedSection: document.getElementById("relatedSection"),
    relatedScroll: document.getElementById("relatedScroll"),

    cartOverlay: document.getElementById("cartOverlay"),
    cartClose: document.getElementById("cartClose"),
    cartItems: document.getElementById("cartItems"),
    cartEmptyState: document.getElementById("cartEmptyState"),
    cartFooter: document.getElementById("cartFooter"),
    mayorProgress: document.getElementById("mayorProgress"),
    mayorProgressFill: document.getElementById("mayorProgressFill"),
    mayorProgressText: document.getElementById("mayorProgressText"),
    cartPriceModeLabel: document.getElementById("cartPriceModeLabel"),
    cartTotal: document.getElementById("cartTotal"),
    checkoutBtn: document.getElementById("checkoutBtn"),

    checkoutOverlay: document.getElementById("checkoutOverlay"),
    checkoutClose: document.getElementById("checkoutClose"),
    checkoutForm: document.getElementById("checkoutForm"),
    checkoutTierNote: document.getElementById("checkoutTierNote"),
    custName: document.getElementById("custName"),
    custPhone: document.getElementById("custPhone"),
    custEmail: document.getElementById("custEmail"),
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
  };

  let PRODUCTS = [];
  let state = { priceMode: "detal" };

  /* ---------------------------------------------------------------
     Buscador (redirige al catálogo con el término)
     --------------------------------------------------------------- */
  el.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && el.searchInput.value.trim()) {
      window.location.href = `index.html?buscar=${encodeURIComponent(el.searchInput.value.trim())}`;
    }
  });

  /* ---------------------------------------------------------------
     Toggle Detal / Mayor
     --------------------------------------------------------------- */
  el.modeToggle.addEventListener("click", () => {
    const isMayor = state.priceMode === "detal";
    state.priceMode = isMayor ? "mayor" : "detal";
    el.modeToggle.setAttribute("aria-pressed", String(isMayor));
    el.modeWord.textContent = isMayor ? "Mayor" : "Detal";
    document.querySelectorAll(".price-chip").forEach(chip => { chip.style.outline = "none"; });
    document.querySelectorAll(`.price-chip.${state.priceMode}`).forEach(chip => {
      chip.style.outline = `2px solid ${state.priceMode === "mayor" ? "#E8A33D" : "#D6336C"}`;
    });
  });

  /* ---------------------------------------------------------------
     Tarjeta de producto reutilizable (para "también te puede gustar")
     --------------------------------------------------------------- */
  function cardTemplate(p, index) {
    const avail = isEffectivelyAvailable(p);
    const unavailableClass = avail ? "" : " is-unavailable";
    const badge = p.offer ? `<span class="card-badge">Antes ${money(p[state.priceMode])}</span>` : "";
    const stamp = !avail ? `<span class="stamp-agotado">Agotado</span>` : "";
    const lowStock = (avail && p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) > 0 && Number(p.stock) <= 5)
      ? `<span class="card-lowstock">¡Solo quedan ${p.stock}!</span>` : "";
    const quickAdd = (avail && !(p.tones || "").trim())
      ? `<button class="card-quickadd" data-quickadd="${p.id}" aria-label="Agregar ${p.name} al carrito" title="Agregar al carrito">+</button>` : "";

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
            <div class="price-chip detal"><span>Detal</span><strong>${money(p.detal)}</strong></div>
            <div class="price-chip mayor"><span>Mayor</span><strong>${money(p.mayor)}</strong></div>
          </div>
        </div>
      </article>
    `;
  }

  function attachCardListeners(container) {
    container.querySelectorAll(".card").forEach(card => {
      const goToProduct = () => { window.location.href = `producto.html?id=${card.dataset.id}`; };
      card.addEventListener("click", goToProduct);
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToProduct(); }
      });
    });
    container.querySelectorAll("[data-quickadd]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        addToCart(btn.dataset.quickadd, 1);
        btn.classList.add("added");
        btn.textContent = "✓";
        setTimeout(() => { btn.classList.remove("added"); btn.textContent = "+"; }, 700);
      });
    });
  }

  /* ---------------------------------------------------------------
     Galería de fotos + selector de tonos
     --------------------------------------------------------------- */
  let currentGalleryImages = [];
  let currentGalleryIndex = 0;
  let currentTones = [];
  let selectedTone = null;

  function renderGalleryImage() {
    el.modalImg.src = currentGalleryImages[currentGalleryIndex] || "";
    el.modalThumbs.querySelectorAll("img").forEach((img, i) => img.classList.toggle("active", i === currentGalleryIndex));
  }
  function goToGalleryImage(i) {
    currentGalleryIndex = (i + currentGalleryImages.length) % currentGalleryImages.length;
    renderGalleryImage();
  }
  el.modalGalleryPrev.addEventListener("click", () => goToGalleryImage(currentGalleryIndex - 1));
  el.modalGalleryNext.addEventListener("click", () => goToGalleryImage(currentGalleryIndex + 1));
  el.modalThumbs.addEventListener("click", (e) => {
    const idx = e.target.closest("[data-thumb-index]")?.dataset.thumbIndex;
    if (idx !== undefined) goToGalleryImage(Number(idx));
  });

  function renderToneChips() {
    el.toneChips.innerHTML = currentTones.map(t => `
      <button type="button" class="tone-chip${t === selectedTone ? " active" : ""}" data-tone="${t}">${t}</button>
    `).join("");
    el.toneChips.querySelectorAll(".tone-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        selectedTone = chip.dataset.tone;
        el.toneChips.querySelectorAll(".tone-chip").forEach(c => c.classList.toggle("active", c === chip));
      });
    });
  }

  /* ---------------------------------------------------------------
     Render del producto principal
     --------------------------------------------------------------- */
  let currentProduct = null;
  let modalQtyValue = 1;

  function renderProduct(p) {
    trackEvent("view_item", { item_name: p.name, item_brand: p.brand, item_category: p.category });
    const avail = isEffectivelyAvailable(p);

    document.title = `${p.name} — Shopicol Bacano`;
    el.pageTitle.textContent = `${p.name} — Shopicol Bacano`;
    el.metaDescription.setAttribute("content", `${p.name} de ${p.brand}. Detal ${money(p.detal)} · Mayor ${money(p.mayor)}. Catálogo Shopicol Bacano.`);
    const ogTitleTxt = `${p.name} — Shopicol Bacano`;
    const ogDescTxt = `${p.name} de ${p.brand}. Detal ${money(p.detal)} · Mayor ${money(p.mayor)}.`;
    document.getElementById("ogTitle")?.setAttribute("content", ogTitleTxt);
    document.getElementById("ogDescription")?.setAttribute("content", ogDescTxt);
    document.getElementById("twitterTitle")?.setAttribute("content", ogTitleTxt);
    document.getElementById("twitterDescription")?.setAttribute("content", ogDescTxt);
    if (p.image) {
      document.getElementById("ogImage")?.setAttribute("content", p.image);
      document.getElementById("twitterImage")?.setAttribute("content", p.image);
    }

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

    if (avail && p.stock !== null && p.stock !== undefined && p.stock !== "" && Number(p.stock) > 0 && Number(p.stock) <= 5) {
      el.modalStockNote.hidden = false;
      el.modalStockNote.textContent = `⚠️ ¡Solo quedan ${p.stock} unidades!`;
    } else {
      el.modalStockNote.hidden = true;
    }

    const gallery = [p.image, ...(Array.isArray(p.gallery_images) ? p.gallery_images : [])].filter(Boolean);
    currentGalleryImages = gallery.length ? gallery : [p.image];
    currentGalleryIndex = 0;
    renderGalleryImage();

    if (currentGalleryImages.length > 1) {
      el.modalGalleryPrev.hidden = false;
      el.modalGalleryNext.hidden = false;
      el.modalThumbs.hidden = false;
      el.modalThumbs.innerHTML = currentGalleryImages.map((src, i) => `<img src="${src}" alt="" data-thumb-index="${i}" class="${i === 0 ? "active" : ""}">`).join("");
    } else {
      el.modalGalleryPrev.hidden = true;
      el.modalGalleryNext.hidden = true;
      el.modalThumbs.hidden = true;
      el.modalThumbs.innerHTML = "";
    }

    currentTones = (p.tones || "").split(",").map(s => s.trim()).filter(Boolean);
    selectedTone = currentTones.length ? currentTones[0] : null;
    if (currentTones.length) {
      el.modalTones.hidden = false;
      renderToneChips();
      el.modalToneHint.hidden = true;
    } else {
      el.modalTones.hidden = true;
      el.toneChips.innerHTML = "";
      el.modalToneHint.hidden = false;
    }

    currentProduct = p;
    modalQtyValue = 1;
    el.modalQty.textContent = modalQtyValue;
    el.modalAddCart.disabled = !avail;
    el.modalAddCart.textContent = avail ? "Agregar al carrito" : "Agotado";
  }

  el.modalQtyMinus.addEventListener("click", () => { modalQtyValue = Math.max(1, modalQtyValue - 1); el.modalQty.textContent = modalQtyValue; });
  el.modalQtyPlus.addEventListener("click", () => { modalQtyValue += 1; el.modalQty.textContent = modalQtyValue; });
  el.modalAddCart.addEventListener("click", () => {
    if (!currentProduct || !isEffectivelyAvailable(currentProduct)) return;
    addToCart(currentProduct.id, modalQtyValue, selectedTone);
    el.modalAddCart.textContent = "¡Agregado! ✓";
    el.modalAddCart.classList.add("added");
    setTimeout(() => { el.modalAddCart.textContent = "Agregar al carrito"; el.modalAddCart.classList.remove("added"); }, 1100);
  });

  function renderRelated(p) {
    const related = PRODUCTS
      .filter(x => x.id !== p.id && x.category === p.category && isEffectivelyAvailable(x))
      .slice(0, 6);
    if (!related.length) { el.relatedSection.hidden = true; return; }
    el.relatedSection.hidden = false;
    el.relatedScroll.innerHTML = related.map((x, i) => cardTemplate(x, i)).join("");
    attachCardListeners(el.relatedScroll);
  }

  /* ---------------------------------------------------------------
     Carrito (idéntico al del catálogo)
     --------------------------------------------------------------- */
  const CART_KEY = "shopicol_cart_v1";
  const MAYOR_THRESHOLD = 50;
  let cart = loadCart();

  function cartKey(id, tone) { return tone ? `${id}::${tone}` : String(id); }
  function parseCartKey(key) {
    const idx = key.indexOf("::");
    if (idx === -1) return { id: key, tone: null };
    return { id: key.slice(0, idx), tone: key.slice(idx + 2) };
  }
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  }
  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }
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
    if (qty <= 0) delete cart[id]; else cart[id] = qty;
    saveCart(); renderCartBadge(); renderCartPanel();
  }
  function removeFromCart(id) {
    delete cart[String(id)];
    saveCart(); renderCartBadge(); renderCartPanel();
  }
  function cartDetalSubtotal() {
    return Object.entries(cart).reduce((sum, [key, qty]) => {
      const { id } = parseCartKey(key);
      const p = PRODUCTS.find(pp => String(pp.id) === String(id));
      if (!p) return sum;
      return sum + qty * (p.offer || p.detal || 0);
    }, 0);
  }
  function isMayorUnlocked() { return cartDetalSubtotal() >= MAYOR_THRESHOLD; }
  function cartLineItems() {
    const mayorUnlocked = isMayorUnlocked();
    return Object.entries(cart).map(([key, qty]) => {
      const { id, tone } = parseCartKey(key);
      const p = PRODUCTS.find(pp => String(pp.id) === String(id));
      if (!p) return null;
      const tierPrice = mayorUnlocked ? (p.mayor || 0) : (p.detal || 0);
      const price = p.offer || tierPrice;
      const displayName = tone ? `${p.name} (${tone})` : p.name;
      return { key, id: p.id, name: displayName, image: p.image, qty, price, tone };
    }).filter(Boolean);
  }
  function cartTotal() { return cartLineItems().reduce((sum, item) => sum + item.qty * item.price, 0); }
  function renderCartBadge() {
    const count = cartCount();
    el.cartCount.textContent = count;
    el.cartCount.hidden = count === 0;
  }
  function renderMayorProgress() {
    const subtotal = cartDetalSubtotal();
    const unlocked = subtotal >= MAYOR_THRESHOLD;
    el.mayorProgressFill.style.width = Math.min(100, (subtotal / MAYOR_THRESHOLD) * 100) + "%";
    el.mayorProgress.classList.toggle("unlocked", unlocked);
    el.mayorProgressText.innerHTML = unlocked
      ? `🎉 <strong>¡Desbloqueaste precio Mayor!</strong> Se aplicó a todo tu pedido.`
      : `Te faltan <strong>${money(MAYOR_THRESHOLD - subtotal)}</strong> en tu carrito para precio Mayor.`;
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
  function openCart() { renderCartPanel(); el.cartOverlay.hidden = false; document.body.style.overflow = "hidden"; }
  function closeCart() { el.cartOverlay.hidden = true; document.body.style.overflow = ""; }

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
     Checkout (idéntico al del catálogo)
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
  function closeCheckout() { el.checkoutOverlay.hidden = true; document.body.style.overflow = ""; }

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
  el.checkoutDoneBtn.addEventListener("click", () => { closeCheckout(); resetCheckoutForm(); });

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

    if (typeof SUPABASE_READY !== "undefined" && SUPABASE_READY) {
      try { await supabaseClient.from("orders").insert(order); }
      catch (err) { console.warn("No se pudo guardar el pedido en Supabase:", err); }
    }
    sendOrderEmailNotification(order, items);

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
      window.open(`https://wa.me/${waDigits}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
    }

    trackEvent("generate_lead", { value: order.total, currency: "USD", payment_method: order.payment_method });
    cart = {};
    saveCart();
    renderCartBadge();
    el.checkoutForm.hidden = true;
    el.checkoutSuccess.hidden = false;
    el.submitOrderBtn.disabled = false;
    el.submitOrderBtn.textContent = "Enviar pedido por WhatsApp";
  });

  function sendOrderEmailNotification(order, items) {
    const cfg = typeof EMAILJS_CONFIG !== "undefined" ? EMAILJS_CONFIG : null;
    const ready = cfg && cfg.publicKey && !cfg.publicKey.includes("PEGA_AQUI") &&
      cfg.serviceId && !cfg.serviceId.includes("PEGA_AQUI") &&
      cfg.templateId && !cfg.templateId.includes("PEGA_AQUI") &&
      typeof emailjs !== "undefined";
    if (!ready) { console.warn("EmailJS no está configurado en config.js."); return; }
    const itemsText = items.map(i => `${i.qty}x ${i.name} — ${money(i.price)} c/u`).join("\n");
    emailjs.send(cfg.serviceId, cfg.templateId, {
      to_email: cfg.notifyEmail,
      customer_name: order.customer_name, phone: order.phone, city: order.city,
      payment_method: order.payment_method, delivery_method: order.delivery_method,
      address: order.address || "—", note: order.note || "—",
      items_text: itemsText, total: money(order.total),
      price_mode: order.price_mode === "mayor" ? "Mayor" : "Detal",
    }, cfg.publicKey).then(
      () => console.log("Notificación de pedido enviada por correo."),
      (err) => console.warn("No se pudo enviar la notificación por correo:", err)
    );
  }

  /* ---------------------------------------------------------------
     Ajustes de marca (logo, colores, tipografía) — versión simplificada
     --------------------------------------------------------------- */
  function applyBrandSettings(settings) {
    const logoSrc = settings.logo_url || "logo.png";
    el.headerLogoImg.src = logoSrc;
    el.footerLogoImg.src = logoSrc;
    el.headerTagline.textContent = settings.store_tagline || "Bacano";
    el.footerTagline.textContent = settings.store_tagline || "Bacano";
    el.footerBottom.textContent = settings.footer_bottom_text || "Shopicol Bacano · Gracias por preferirnos ✦";

    if (settings.primary_color) document.documentElement.style.setProperty("--pink", settings.primary_color);
    if (settings.accent_color) document.documentElement.style.setProperty("--gold", settings.accent_color);
    if (settings.bg_color) document.documentElement.style.setProperty("--cream", settings.bg_color);
    if (settings.text_color) document.documentElement.style.setProperty("--ink", settings.text_color);
    if (settings.card_radius) document.documentElement.style.setProperty("--radius-card", settings.card_radius + "px");

    if (typeof FONT_PAIRS !== "undefined") {
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
    }
  }

  /* ---------------------------------------------------------------
     Init
     --------------------------------------------------------------- */
  async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const [products, settings] = await Promise.all([fetchCatalog(), fetchSettings()]);
    PRODUCTS = products;
    applyBrandSettings(settings);
    renderCartBadge();

    const product = PRODUCTS.find(p => String(p.id) === String(id));
    el.productLoading.hidden = true;

    if (!product) {
      el.productNotFound.hidden = false;
      return;
    }

    renderProduct(product);
    renderRelated(product);
    el.productCard.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
