/* =====================================================================
   SHOPICOL BACANO — admin.js
   Lógica del panel: login/logout, listar/filtrar productos, crear,
   editar, eliminar, subir imágenes, e importar el catálogo semilla.
   Requiere que config.js tenga las claves reales de Supabase — sin
   ellas, este panel no puede iniciar sesión (solo el sitio público
   puede funcionar sin Supabase, mostrando el catálogo local).
   ===================================================================== */

(function () {
  "use strict";

  const el = {
    loginScreen: document.getElementById("loginScreen"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    loginBtn: document.getElementById("loginBtn"),
    loginError: document.getElementById("loginError"),
    configWarning: document.getElementById("configWarning"),

    adminApp: document.getElementById("adminApp"),
    adminUserEmail: document.getElementById("adminUserEmail"),
    logoutBtn: document.getElementById("logoutBtn"),

    statTotal: document.getElementById("statTotal"),
    statAvail: document.getElementById("statAvail"),
    statBrands: document.getElementById("statBrands"),

    importBtn: document.getElementById("importBtn"),
    importHint: document.getElementById("importHint"),
    confirmImportBtn: document.getElementById("confirmImportBtn"),
    cancelImportBtn: document.getElementById("cancelImportBtn"),
    newProductBtn: document.getElementById("newProductBtn"),

    bulkUploadBtn: document.getElementById("bulkUploadBtn"),
    bulkUploadFile: document.getElementById("bulkUploadFile"),
    bulkModalOverlay: document.getElementById("bulkModalOverlay"),
    bulkModalClose: document.getElementById("bulkModalClose"),
    bulkSummary: document.getElementById("bulkSummary"),
    bulkErrorsList: document.getElementById("bulkErrorsList"),
    cancelBulkBtn: document.getElementById("cancelBulkBtn"),
    confirmBulkBtn: document.getElementById("confirmBulkBtn"),
    bulkFormError: document.getElementById("bulkFormError"),

    adminSearch: document.getElementById("adminSearch"),
    adminCategoryFilter: document.getElementById("adminCategoryFilter"),
    adminBrandFilter: document.getElementById("adminBrandFilter"),
    adminAvailFilter: document.getElementById("adminAvailFilter"),
    adminResultsCount: document.getElementById("adminResultsCount"),

    adminTableBody: document.getElementById("adminTableBody"),
    adminEmpty: document.getElementById("adminEmpty"),

    // modal producto
    productModalOverlay: document.getElementById("productModalOverlay"),
    productModalClose: document.getElementById("productModalClose"),
    productModalTitle: document.getElementById("productModalTitle"),
    productForm: document.getElementById("productForm"),
    fieldId: document.getElementById("fieldId"),
    fieldName: document.getElementById("fieldName"),
    fieldBrand: document.getElementById("fieldBrand"),
    fieldCategory: document.getElementById("fieldCategory"),
    fieldRef: document.getElementById("fieldRef"),
    fieldAvail: document.getElementById("fieldAvail"),
    fieldDetal: document.getElementById("fieldDetal"),
    fieldMayor: document.getElementById("fieldMayor"),
    fieldOffer: document.getElementById("fieldOffer"),
    fieldStock: document.getElementById("fieldStock"),
    fieldImageFile: document.getElementById("fieldImageFile"),
    fieldImageUrl: document.getElementById("fieldImageUrl"),
    imagePreview: document.getElementById("imagePreview"),
    imageUploadStatus: document.getElementById("imageUploadStatus"),
    fieldNote: document.getElementById("fieldNote"),
    deleteProductBtn: document.getElementById("deleteProductBtn"),
    cancelProductBtn: document.getElementById("cancelProductBtn"),
    saveProductBtn: document.getElementById("saveProductBtn"),
    productFormError: document.getElementById("productFormError"),
    brandOptions: document.getElementById("brandOptions"),
    categoryOptions: document.getElementById("categoryOptions"),
    fieldFeatured: document.getElementById("fieldFeatured"),
    adminFeaturedFilter: document.getElementById("adminFeaturedFilter"),
    galleryList: document.getElementById("galleryList"),
    addGalleryPhotoBtn: document.getElementById("addGalleryPhotoBtn"),
    fieldTones: document.getElementById("fieldTones"),

    toast: document.getElementById("toast"),

    // tabs
    tabButtons: document.querySelectorAll(".admin-tab"),
    tabProducts: document.getElementById("tabProducts"),
    tabOrders: document.getElementById("tabOrders"),
    tabBanners: document.getElementById("tabBanners"),

    // pedidos
    ordersBadge: document.getElementById("ordersBadge"),
    statOrdersTotal: document.getElementById("statOrdersTotal"),
    statOrdersNew: document.getElementById("statOrdersNew"),
    statOrdersTotalSum: document.getElementById("statOrdersTotalSum"),
    refreshOrdersBtn: document.getElementById("refreshOrdersBtn"),
    orderStatusFilter: document.getElementById("orderStatusFilter"),
    ordersTableBody: document.getElementById("ordersTableBody"),
    ordersEmpty: document.getElementById("ordersEmpty"),
    orderModalOverlay: document.getElementById("orderModalOverlay"),
    orderModalClose: document.getElementById("orderModalClose"),
    orderModalBody: document.getElementById("orderModalBody"),
    downloadReceiptBtn: document.getElementById("downloadReceiptBtn"),

    // banners
    newBannerBtn: document.getElementById("newBannerBtn"),
    bannersGrid: document.getElementById("bannersGrid"),
    bannersEmpty: document.getElementById("bannersEmpty"),
    bannerModalOverlay: document.getElementById("bannerModalOverlay"),
    bannerModalClose: document.getElementById("bannerModalClose"),
    bannerModalTitle: document.getElementById("bannerModalTitle"),
    bannerForm: document.getElementById("bannerForm"),
    bannerFieldId: document.getElementById("bannerFieldId"),
    bannerFieldTitle: document.getElementById("bannerFieldTitle"),
    bannerFieldSubtitle: document.getElementById("bannerFieldSubtitle"),
    bannerFieldImageFile: document.getElementById("bannerFieldImageFile"),
    bannerFieldImageUrl: document.getElementById("bannerFieldImageUrl"),
    bannerImagePreview: document.getElementById("bannerImagePreview"),
    bannerImageUploadStatus: document.getElementById("bannerImageUploadStatus"),
    bannerFieldButtonText: document.getElementById("bannerFieldButtonText"),
    bannerFieldButtonLink: document.getElementById("bannerFieldButtonLink"),
    bannerFieldOrder: document.getElementById("bannerFieldOrder"),
    bannerFieldActive: document.getElementById("bannerFieldActive"),
    deleteBannerBtn: document.getElementById("deleteBannerBtn"),
    cancelBannerBtn: document.getElementById("cancelBannerBtn"),
    saveBannerBtn: document.getElementById("saveBannerBtn"),
    bannerFormError: document.getElementById("bannerFormError"),

    // ajustes
    tabSettings: document.getElementById("tabSettings"),
    tabCustomers: document.getElementById("tabCustomers"),
    statCustomersTotal: document.getElementById("statCustomersTotal"),
    statCustomersOrders: document.getElementById("statCustomersOrders"),
    statCustomersSpent: document.getElementById("statCustomersSpent"),
    exportCustomersBtn: document.getElementById("exportCustomersBtn"),
    customersTableBody: document.getElementById("customersTableBody"),
    customersEmpty: document.getElementById("customersEmpty"),
    settingsLogoPreview: document.getElementById("settingsLogoPreview"),
    settingsLogoFile: document.getElementById("settingsLogoFile"),
    settingsLogoUrl: document.getElementById("settingsLogoUrl"),
    settingsLogoStatus: document.getElementById("settingsLogoStatus"),
    settingsStoreName: document.getElementById("settingsStoreName"),
    settingsTagline: document.getElementById("settingsTagline"),
    settingsPrimaryColor: document.getElementById("settingsPrimaryColor"),
    settingsPrimaryColorHex: document.getElementById("settingsPrimaryColorHex"),
    settingsAccentColor: document.getElementById("settingsAccentColor"),
    settingsAccentColorHex: document.getElementById("settingsAccentColorHex"),
    settingsBgColor: document.getElementById("settingsBgColor"),
    settingsBgColorHex: document.getElementById("settingsBgColorHex"),
    settingsTextColor: document.getElementById("settingsTextColor"),
    settingsTextColorHex: document.getElementById("settingsTextColorHex"),
    settingsFontPair: document.getElementById("settingsFontPair"),
    settingsCardRadius: document.getElementById("settingsCardRadius"),
    settingsHeroTitle: document.getElementById("settingsHeroTitle"),
    settingsHeroAccent: document.getElementById("settingsHeroAccent"),
    settingsHeroSubtitle: document.getElementById("settingsHeroSubtitle"),
    settingsEyebrow: document.getElementById("settingsEyebrow"),
    settingsHeroNote: document.getElementById("settingsHeroNote"),
    settingsFooterDescription: document.getElementById("settingsFooterDescription"),
    settingsFooterBottom: document.getElementById("settingsFooterBottom"),
    settingsMetaDescription: document.getElementById("settingsMetaDescription"),
    settingsContactTitle: document.getElementById("settingsContactTitle"),
    settingsContactSubtitle: document.getElementById("settingsContactSubtitle"),
    settingsEmail: document.getElementById("settingsEmail"),
    settingsInstagram: document.getElementById("settingsInstagram"),
    settingsTiktok: document.getElementById("settingsTiktok"),
    settingsFacebook: document.getElementById("settingsFacebook"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    settingsFormError: document.getElementById("settingsFormError"),
  };

  let allProducts = [];
  let pendingImageFile = null;
  let galleryRows = [];
  let galleryRowSeq = 0;

  /* ---------------------------------------------------------------
     Galería de fotos adicionales por producto
     --------------------------------------------------------------- */
  function renderGalleryList() {
    el.galleryList.innerHTML = galleryRows.map(row => {
      const previewSrc = row.file ? URL.createObjectURL(row.file) : (row.url ? resolveImagePath(row.url) : "");
      return `
        <div class="gallery-row-empty" data-gallery-row="${row.id}">
          <button type="button" class="gallery-remove" data-gallery-remove="${row.id}" title="Quitar">✕</button>
          ${previewSrc ? `<img src="${previewSrc}" alt="" style="width:100%;height:34px;object-fit:cover;border-radius:6px;">` : ""}
          <input type="file" accept="image/*" data-gallery-file="${row.id}">
          <input type="text" placeholder="o URL" value="${row.file ? "" : (row.url || "")}" data-gallery-url="${row.id}">
        </div>
      `;
    }).join("");
  }

  function addGalleryRow(url = "") {
    galleryRows.push({ id: galleryRowSeq++, url, file: null });
    renderGalleryList();
  }
  function removeGalleryRow(id) {
    galleryRows = galleryRows.filter(r => r.id !== id);
    renderGalleryList();
  }

  el.addGalleryPhotoBtn.addEventListener("click", () => addGalleryRow());

  el.galleryList.addEventListener("click", (e) => {
    const removeId = e.target.closest("[data-gallery-remove]")?.dataset.galleryRemove;
    if (removeId) removeGalleryRow(Number(removeId));
  });

  el.galleryList.addEventListener("change", (e) => {
    const fileId = e.target.closest("[data-gallery-file]")?.dataset.galleryFile;
    const urlId = e.target.closest("[data-gallery-url]")?.dataset.galleryUrl;
    if (fileId != null) {
      const row = galleryRows.find(r => r.id === Number(fileId));
      if (row && e.target.files[0]) {
        row.file = e.target.files[0];
        row.url = "";
        renderGalleryList();
      }
    }
    if (urlId != null) {
      const row = galleryRows.find(r => r.id === Number(urlId));
      if (row) {
        row.url = e.target.value.trim();
        row.file = null;
        renderGalleryList();
      }
    }
  });

  async function buildGalleryImagesArray() {
    const urls = [];
    for (const row of galleryRows) {
      if (row.file) {
        const ext = row.file.name.split(".").pop();
        const path = `producto-galeria-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
        const { error } = await supabaseClient.storage.from("product-images").upload(path, row.file, { upsert: false });
        if (error) throw new Error("No se pudo subir una foto de la galería: " + error.message);
        const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      } else if (row.url) {
        urls.push(row.url);
      }
    }
    return urls;
  }

  /* ---------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------- */
  function money(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return "$" + Number(n).toFixed(2).replace(/\.00$/, "");
  }

  // Las rutas de imagen del catálogo semilla son relativas a la RAÍZ del
  // sitio (ej. "images/p3_tl.jpg"). Siempre devolvemos una ruta absoluta
  // (empezando con "/") para que funcione sin importar cómo esté escrita
  // la URL del panel (con o sin barra final).
  function resolveImagePath(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
    return "/" + path;
  }

  function showToast(msg, isError) {
    el.toast.textContent = msg;
    el.toast.classList.toggle("error", Boolean(isError));
    el.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.toast.hidden = true; }, 3200);
  }

  function normalize(str) {
    return (str || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------------------------------------------------------------
     Arranque: si Supabase no está listo, avisar y detener aquí
     --------------------------------------------------------------- */
  if (!SUPABASE_READY) {
    el.configWarning.hidden = false;
    el.loginBtn.disabled = true;
    el.loginBtn.textContent = "Configura Supabase primero";
  }

  /* ---------------------------------------------------------------
     Autenticación
     --------------------------------------------------------------- */
  async function checkSession() {
    if (!SUPABASE_READY) return;
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      enterAdmin(data.session.user);
    }
  }

  el.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!SUPABASE_READY) return;

    el.loginError.hidden = true;
    el.loginBtn.disabled = true;
    el.loginBtn.textContent = "Entrando…";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: el.loginEmail.value.trim(),
      password: el.loginPassword.value,
    });

    el.loginBtn.disabled = false;
    el.loginBtn.textContent = "Entrar al panel";

    if (error) {
      el.loginError.textContent = "Correo o contraseña incorrectos. Verifica con quien administra el equipo.";
      el.loginError.hidden = false;
      return;
    }
    enterAdmin(data.user);
  });

  el.logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.reload();
  });

  function enterAdmin(user) {
    el.loginScreen.hidden = true;
    el.adminApp.hidden = false;
    el.adminUserEmail.textContent = user.email;
    loadProducts();
    loadOrders();
    loadBanners();
    loadSettings();
  }

  /* ---------------------------------------------------------------
     Pestañas (Productos / Pedidos / Banners)
     --------------------------------------------------------------- */
  const tabPanels = { products: el.tabProducts, orders: el.tabOrders, banners: el.tabBanners, settings: el.tabSettings, customers: el.tabCustomers };
  el.tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      el.tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      Object.entries(tabPanels).forEach(([key, panel]) => {
        panel.hidden = key !== btn.dataset.tab;
      });
    });
  });

  /* ---------------------------------------------------------------
     Cargar / listar productos
     --------------------------------------------------------------- */
  async function loadProducts() {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      showToast("No se pudo cargar el catálogo: " + error.message, true);
      return;
    }
    allProducts = data || [];
    paintStats();
    buildFilterOptions();
    buildFormDatalists();
    renderTable();
  }

  function paintStats() {
    el.statTotal.textContent = allProducts.length;
    el.statAvail.textContent = allProducts.filter(p => p.avail).length;
    el.statBrands.textContent = new Set(allProducts.map(p => p.brand)).size;
  }

  function buildFilterOptions() {
    const cats = Array.from(new Set(allProducts.map(p => p.category))).sort((a, b) => a.localeCompare(b, "es"));
    const brands = Array.from(new Set(allProducts.map(p => p.brand))).sort((a, b) => a.localeCompare(b, "es"));

    el.adminCategoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
      cats.map(c => `<option value="${c}">${c}</option>`).join("");
    el.adminBrandFilter.innerHTML = '<option value="">Todas las marcas</option>' +
      brands.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  function buildFormDatalists() {
    const cats = Array.from(new Set(allProducts.map(p => p.category))).sort((a, b) => a.localeCompare(b, "es"));
    const brands = Array.from(new Set(allProducts.map(p => p.brand))).sort((a, b) => a.localeCompare(b, "es"));
    el.categoryOptions.innerHTML = cats.map(c => `<option value="${c}">`).join("");
    el.brandOptions.innerHTML = brands.map(b => `<option value="${b}">`).join("");
  }

  function getFiltered() {
    const q = normalize(el.adminSearch.value.trim());
    const cat = el.adminCategoryFilter.value;
    const brand = el.adminBrandFilter.value;
    const availFilter = el.adminAvailFilter.value; // "", "true", "false"
    const onlyFeatured = el.adminFeaturedFilter.checked;

    return allProducts.filter(p => {
      if (cat && p.category !== cat) return false;
      if (brand && p.brand !== brand) return false;
      if (availFilter && String(p.avail) !== availFilter) return false;
      if (onlyFeatured && !p.featured) return false;
      if (q) {
        const haystack = normalize(`${p.name} ${p.brand} ${p.category} ${p.ref}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }

  function renderTable() {
    const list = getFiltered();
    el.adminResultsCount.textContent = `Mostrando ${list.length} de ${allProducts.length} productos`;

    if (!list.length) {
      el.adminTableBody.innerHTML = "";
      el.adminEmpty.hidden = false;
      return;
    }
    el.adminEmpty.hidden = true;

    el.adminTableBody.innerHTML = list.map(p => `
      <tr data-id="${p.id}">
        <td class="col-img"><img class="row-thumb" src="${resolveImagePath(p.image)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"></td>
        <td>
          <div class="row-name">${p.featured ? "⭐ " : ""}${p.name}</div>
          <div class="row-ref">${p.ref ? "Ref: " + p.ref : "Sin referencia"}</div>
        </td>
        <td>${p.brand}</td>
        <td>${p.category}</td>
        <td>${money(p.detal)}</td>
        <td>${money(p.mayor)}</td>
        <td class="stock-cell">${p.stock === null || p.stock === undefined ? "<span class=\"stock-unlimited\">—</span>" : (Number(p.stock) <= 5 ? `<span class="stock-low">${p.stock}</span>` : p.stock)}</td>
        <td>
          <button class="status-chip ${p.avail ? "avail" : "unavail"}" data-toggle-avail="${p.id}">
            ${p.avail ? "Disponible" : "Agotado"}
          </button>
        </td>
        <td class="col-actions">
          <div class="row-actions">
            <button data-edit="${p.id}" title="Editar">✎</button>
            <button data-delete="${p.id}" title="Eliminar">🗑</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  [el.adminSearch, el.adminCategoryFilter, el.adminBrandFilter, el.adminAvailFilter, el.adminFeaturedFilter].forEach(node => {
    node.addEventListener("input", renderTable);
    node.addEventListener("change", renderTable);
  });

  // Delegación de eventos sobre la tabla (editar, borrar, toggle disponible)
  el.adminTableBody.addEventListener("click", async (e) => {
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const delId = e.target.closest("[data-delete]")?.dataset.delete;
    const toggleId = e.target.closest("[data-toggle-avail]")?.dataset.toggleAvail;

    if (editId) openProductModal(allProducts.find(p => String(p.id) === editId));
    if (delId) confirmDeleteProduct(delId);
    if (toggleId) await toggleAvailability(toggleId);
  });

  async function toggleAvailability(id) {
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) return;
    const { error } = await supabaseClient
      .from("products")
      .update({ avail: !product.avail })
      .eq("id", id);

    if (error) {
      showToast("No se pudo actualizar: " + error.message, true);
      return;
    }
    product.avail = !product.avail;
    paintStats();
    renderTable();
    showToast(product.avail ? "Marcado como disponible" : "Marcado como agotado");
  }

  async function confirmDeleteProduct(id) {
    const product = allProducts.find(p => String(p.id) === String(id));
    if (!product) return;
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabaseClient.from("products").delete().eq("id", id);
    if (error) {
      showToast("No se pudo eliminar: " + error.message, true);
      return;
    }
    allProducts = allProducts.filter(p => String(p.id) !== String(id));
    paintStats();
    renderTable();
    showToast("Producto eliminado");
  }

  /* ---------------------------------------------------------------
     PEDIDOS: cargar, listar, cambiar estado, ver detalle
     --------------------------------------------------------------- */
  let allOrders = [];
  let currentViewedOrder = null;

  async function loadOrders() {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("No se pudieron cargar los pedidos:", error.message);
      return;
    }
    allOrders = data || [];
    paintOrderStats();
    renderOrders();
    renderCustomers();
  }

  function paintOrderStats() {
    el.statOrdersTotal.textContent = allOrders.length;
    const newCount = allOrders.filter(o => o.status === "nuevo").length;
    el.statOrdersNew.textContent = newCount;
    el.statOrdersTotalSum.textContent = money(allOrders.reduce((s, o) => s + (Number(o.total) || 0), 0));
    el.ordersBadge.textContent = newCount;
    el.ordersBadge.hidden = newCount === 0;
  }

  function renderOrders() {
    const statusFilter = el.orderStatusFilter.value;
    const list = statusFilter ? allOrders.filter(o => o.status === statusFilter) : allOrders;

    if (!list.length) {
      el.ordersTableBody.innerHTML = "";
      el.ordersEmpty.hidden = false;
      return;
    }
    el.ordersEmpty.hidden = true;

    el.ordersTableBody.innerHTML = list.map(o => {
      const date = o.created_at ? new Date(o.created_at).toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" }) : "—";
      return `
        <tr data-order-id="${o.id}">
          <td>${date}</td>
          <td>
            <div class="row-name">${o.customer_name}</div>
            <div class="row-ref">${o.city}</div>
          </td>
          <td>${o.phone}</td>
          <td>${o.delivery_method}</td>
          <td>${o.payment_method}</td>
          <td>${money(o.total)}</td>
          <td>
            <select class="order-status-select ${o.status}" data-order-status="${o.id}">
              <option value="nuevo" ${o.status === "nuevo" ? "selected" : ""}>Nuevo</option>
              <option value="tomado" ${o.status === "tomado" ? "selected" : ""}>Pedido Tomado</option>
              <option value="entregado" ${o.status === "entregado" ? "selected" : ""}>Entregado</option>
              <option value="cancelado" ${o.status === "cancelado" ? "selected" : ""}>Cancelado</option>
            </select>
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <button data-view-order="${o.id}" title="Ver detalle">👁</button>
              <button data-delete-order="${o.id}" title="Eliminar">🗑</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  el.orderStatusFilter.addEventListener("change", renderOrders);
  el.refreshOrdersBtn.addEventListener("click", () => { loadOrders(); showToast("Pedidos actualizados"); });

  el.ordersTableBody.addEventListener("change", async (e) => {
    const id = e.target.closest("[data-order-status]")?.dataset.orderStatus;
    if (!id) return;
    const newStatus = e.target.value;
    const { error } = await supabaseClient.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) { showToast("No se pudo actualizar el estado: " + error.message, true); return; }
    const order = allOrders.find(o => String(o.id) === String(id));
    if (order) order.status = newStatus;
    e.target.className = "order-status-select " + newStatus;
    paintOrderStats();
  });

  el.ordersTableBody.addEventListener("click", async (e) => {
    const viewId = e.target.closest("[data-view-order]")?.dataset.viewOrder;
    const delId = e.target.closest("[data-delete-order]")?.dataset.deleteOrder;
    if (viewId) openOrderModal(allOrders.find(o => String(o.id) === String(viewId)));
    if (delId) {
      if (!window.confirm("¿Eliminar este pedido? Esta acción no se puede deshacer.")) return;
      const { error } = await supabaseClient.from("orders").delete().eq("id", delId);
      if (error) { showToast("No se pudo eliminar: " + error.message, true); return; }
      allOrders = allOrders.filter(o => String(o.id) !== String(delId));
      paintOrderStats();
      renderOrders();
      showToast("Pedido eliminado");
    }
  });

  function openOrderModal(order) {
    if (!order) return;
    currentViewedOrder = order;
    const date = order.created_at ? new Date(order.created_at).toLocaleString("es-VE", { dateStyle: "long", timeStyle: "short" }) : "—";
    const items = Array.isArray(order.items) ? order.items : [];
    el.orderModalBody.innerHTML = `
      <div class="order-detail-row"><span>Fecha</span><strong>${date}</strong></div>
      <div class="order-detail-row"><span>Cliente</span><strong>${order.customer_name}</strong></div>
      <div class="order-detail-row"><span>Teléfono</span><strong>${order.phone}</strong></div>
      <div class="order-detail-row"><span>Ciudad</span><strong>${order.city}</strong></div>
      <div class="order-detail-row"><span>Método de pago</span><strong>${order.payment_method}</strong></div>
      <div class="order-detail-row"><span>Entrega</span><strong>${order.delivery_method}</strong></div>
      ${order.address ? `<div class="order-detail-row"><span>Dirección</span><strong>${order.address}</strong></div>` : ""}
      ${order.note ? `<div class="order-detail-row"><span>Nota</span><strong>${order.note}</strong></div>` : ""}
      <div class="order-items-list">
        ${items.map(it => `<div class="order-item-line"><span>${it.qty}x ${it.name}</span><span>${money(it.price * it.qty)}</span></div>`).join("")}
      </div>
      <div class="order-total-line"><span>Total (${order.price_mode === "mayor" ? "Mayor" : "Detal"})</span><span>${money(order.total)}</span></div>
    `;
    el.orderModalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  el.orderModalClose.addEventListener("click", () => {
    el.orderModalOverlay.hidden = true;
    document.body.style.overflow = "";
  });
  el.orderModalOverlay.addEventListener("click", e => {
    if (e.target === el.orderModalOverlay) { el.orderModalOverlay.hidden = true; document.body.style.overflow = ""; }
  });

  /* ---------------------------------------------------------------
     Descargar recibo del pedido (imprimir → guardar como PDF)
     --------------------------------------------------------------- */
  const STATUS_LABELS = { nuevo: "Nuevo", tomado: "Pedido Tomado", entregado: "Entregado", cancelado: "Cancelado" };

  function buildReceipt(order) {
    const date = order.created_at
      ? new Date(order.created_at).toLocaleString("es-VE", { dateStyle: "long", timeStyle: "short" })
      : "—";
    const items = Array.isArray(order.items) ? order.items : [];

    document.getElementById("receiptOrderId").textContent = "#" + String(order.id).padStart(5, "0");
    document.getElementById("receiptDate").textContent = date;
    document.getElementById("receiptStatus").textContent = STATUS_LABELS[order.status] || order.status;
    document.getElementById("receiptName").textContent = order.customer_name || "—";
    document.getElementById("receiptPhone").textContent = order.phone || "—";
    document.getElementById("receiptCity").textContent = order.city || "—";
    document.getElementById("receiptPayment").textContent = order.payment_method || "—";
    document.getElementById("receiptDelivery").textContent = order.delivery_method || "—";
    document.getElementById("receiptAddress").textContent = order.address || "—";

    const noteRow = document.getElementById("receiptNoteRow");
    if (order.note) {
      noteRow.hidden = false;
      document.getElementById("receiptNote").textContent = order.note;
    } else {
      noteRow.hidden = true;
    }

    // Busca la miniatura de cada producto en el catálogo cargado
    const rows = items.map(it => {
      const product = allProducts.find(p => String(p.id) === String(it.id));
      const img = product ? resolveImagePath(product.image) : "";
      return `
        <tr>
          <td class="receipt-thumb-cell">${img ? `<img src="${img}" alt="">` : ""}</td>
          <td>${it.name}</td>
          <td>${it.qty}</td>
          <td>${money(it.price)}</td>
          <td>${money(it.price * it.qty)}</td>
        </tr>
      `;
    }).join("");
    document.getElementById("receiptItemsBody").innerHTML = rows;

    document.getElementById("receiptPriceMode").textContent = order.price_mode === "mayor" ? "Mayor" : "Detal";
    document.getElementById("receiptTotal").textContent = money(order.total);
  }

  el.downloadReceiptBtn.addEventListener("click", () => {
    if (!currentViewedOrder) return;
    buildReceipt(currentViewedOrder);
    document.body.classList.add("printing-receipt");
    window.print();
  });

  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-receipt");
  });

  /* ---------------------------------------------------------------
     CLIENTES: agrupa los pedidos por teléfono (cada cliente una sola
     vez, con su historial acumulado) — útil para armar audiencias de
     anuncios (Meta/Facebook Ads, Google Ads) con el botón de exportar.
     --------------------------------------------------------------- */
  function buildCustomersList() {
    const map = new Map(); // clave: teléfono normalizado
    allOrders.forEach(o => {
      const key = (o.phone || "").replace(/\D/g, "") || o.customer_name;
      if (!map.has(key)) {
        map.set(key, {
          name: o.customer_name, phone: o.phone, email: o.email || "",
          city: o.city, orderCount: 0, totalSpent: 0, lastOrderDate: o.created_at,
        });
      }
      const c = map.get(key);
      c.orderCount += 1;
      c.totalSpent += Number(o.total) || 0;
      if (!c.email && o.email) c.email = o.email;
      if (new Date(o.created_at) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = o.created_at;
        c.name = o.customer_name; // se queda con el nombre/ciudad más reciente
        c.city = o.city;
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  }

  function renderCustomers() {
    const customers = buildCustomersList();

    el.statCustomersTotal.textContent = customers.length;
    el.statCustomersOrders.textContent = allOrders.length;
    el.statCustomersSpent.textContent = money(customers.reduce((s, c) => s + c.totalSpent, 0));

    if (!customers.length) {
      el.customersTableBody.innerHTML = "";
      el.customersEmpty.hidden = false;
      return;
    }
    el.customersEmpty.hidden = true;

    el.customersTableBody.innerHTML = customers.map(c => {
      const lastDate = c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("es-VE", { dateStyle: "medium" }) : "—";
      return `
        <tr>
          <td>${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.email || "—"}</td>
          <td>${c.city}</td>
          <td>${c.orderCount}</td>
          <td>${money(c.totalSpent)}</td>
          <td>${lastDate}</td>
        </tr>
      `;
    }).join("");
  }

  el.exportCustomersBtn.addEventListener("click", () => {
    const customers = buildCustomersList();
    if (!customers.length) { showToast("No hay clientes para exportar todavía", true); return; }

    const headers = ["Nombre", "Telefono", "Correo", "Ciudad", "Pedidos", "Total_Comprado", "Ultimo_Pedido"];
    const csvRows = [headers.join(",")];
    customers.forEach(c => {
      const row = [
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${c.phone || ""}"`,
        `"${c.email || ""}"`,
        `"${(c.city || "").replace(/"/g, '""')}"`,
        c.orderCount,
        c.totalSpent.toFixed(2),
        c.lastOrderDate ? new Date(c.lastOrderDate).toISOString().slice(0, 10) : "",
      ];
      csvRows.push(row.join(","));
    });
    const csvContent = "\uFEFF" + csvRows.join("\r\n"); // BOM para que Excel abra bien los acentos

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-shopicol-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exportados ${customers.length} clientes`);
  });

  /* ---------------------------------------------------------------
     BANNERS: cargar, listar, crear, editar, eliminar
     --------------------------------------------------------------- */
  let allBanners = [];
  let pendingBannerImageFile = null;

  async function loadBanners() {
    const { data, error } = await supabaseClient
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("No se pudieron cargar los banners:", error.message);
      return;
    }
    allBanners = data || [];
    renderBannersAdmin();
  }

  function renderBannersAdmin() {
    if (!allBanners.length) {
      el.bannersGrid.innerHTML = "";
      el.bannersEmpty.hidden = false;
      return;
    }
    el.bannersEmpty.hidden = true;
    el.bannersGrid.innerHTML = allBanners.map(b => `
      <div class="banner-card" data-banner-id="${b.id}">
        <div class="banner-card-img" style="background-image:url('${(b.image || "").replace(/'/g, "\\'")}')">
          ${!b.active ? '<span class="inactive-tag">Inactivo</span>' : ""}
        </div>
        <div class="banner-card-body">
          <h4>${b.title}</h4>
          <p>${b.subtitle || "Sin subtítulo"}</p>
          <div class="banner-card-actions">
            <button data-edit-banner="${b.id}">Editar</button>
            <button data-delete-banner="${b.id}">Eliminar</button>
          </div>
        </div>
      </div>
    `).join("");
  }

  el.bannersGrid.addEventListener("click", async (e) => {
    const editId = e.target.closest("[data-edit-banner]")?.dataset.editBanner;
    const delId = e.target.closest("[data-delete-banner]")?.dataset.deleteBanner;
    if (editId) openBannerModal(allBanners.find(b => String(b.id) === String(editId)));
    if (delId) {
      if (!window.confirm("¿Eliminar este banner?")) return;
      const { error } = await supabaseClient.from("banners").delete().eq("id", delId);
      if (error) { showToast("No se pudo eliminar: " + error.message, true); return; }
      allBanners = allBanners.filter(b => String(b.id) !== String(delId));
      renderBannersAdmin();
      showToast("Banner eliminado");
    }
  });

  function openBannerModal(banner) {
    el.bannerFormError.hidden = true;
    pendingBannerImageFile = null;
    el.bannerFieldImageFile.value = "";
    el.bannerImageUploadStatus.textContent = "";

    if (banner) {
      el.bannerModalTitle.textContent = "Editar banner";
      el.bannerFieldId.value = banner.id;
      el.bannerFieldTitle.value = banner.title || "";
      el.bannerFieldSubtitle.value = banner.subtitle || "";
      el.bannerFieldImageUrl.value = banner.image || "";
      el.bannerFieldButtonText.value = banner.button_text || "";
      el.bannerFieldButtonLink.value = banner.button_link || "";
      el.bannerFieldOrder.value = banner.sort_order || 0;
      el.bannerFieldActive.checked = Boolean(banner.active);
      if (banner.image) {
        el.bannerImagePreview.src = banner.image;
        el.bannerImagePreview.hidden = false;
      } else {
        el.bannerImagePreview.hidden = true;
      }
      el.deleteBannerBtn.hidden = false;
      el.deleteBannerBtn.onclick = async () => {
        if (!window.confirm("¿Eliminar este banner?")) return;
        const { error } = await supabaseClient.from("banners").delete().eq("id", banner.id);
        if (error) { showToast("No se pudo eliminar: " + error.message, true); return; }
        allBanners = allBanners.filter(b => String(b.id) !== String(banner.id));
        renderBannersAdmin();
        closeBannerModal();
        showToast("Banner eliminado");
      };
    } else {
      el.bannerModalTitle.textContent = "Nuevo banner";
      el.bannerForm.reset();
      el.bannerFieldId.value = "";
      el.bannerFieldActive.checked = true;
      el.bannerImagePreview.hidden = true;
      el.deleteBannerBtn.hidden = true;
    }
    el.bannerModalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeBannerModal() {
    el.bannerModalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.newBannerBtn.addEventListener("click", () => openBannerModal(null));
  el.bannerModalClose.addEventListener("click", closeBannerModal);
  el.cancelBannerBtn.addEventListener("click", closeBannerModal);
  el.bannerModalOverlay.addEventListener("click", e => { if (e.target === el.bannerModalOverlay) closeBannerModal(); });

  el.bannerFieldImageFile.addEventListener("change", () => {
    const file = el.bannerFieldImageFile.files[0];
    if (!file) return;
    pendingBannerImageFile = file;
    el.bannerImagePreview.src = URL.createObjectURL(file);
    el.bannerImagePreview.hidden = false;
    el.bannerImageUploadStatus.textContent = "Se subirá al guardar: " + file.name;
  });
  el.bannerFieldImageUrl.addEventListener("input", () => {
    if (el.bannerFieldImageUrl.value.trim()) {
      pendingBannerImageFile = null;
      el.bannerFieldImageFile.value = "";
      el.bannerImagePreview.src = el.bannerFieldImageUrl.value.trim();
      el.bannerImagePreview.hidden = false;
    }
  });

  async function uploadBannerImageIfNeeded() {
    if (!pendingBannerImageFile) return el.bannerFieldImageUrl.value.trim();
    const ext = pendingBannerImageFile.name.split(".").pop();
    const path = `banner-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    el.bannerImageUploadStatus.textContent = "Subiendo imagen…";
    const { error: uploadError } = await supabaseClient.storage.from("product-images").upload(path, pendingBannerImageFile, { upsert: false });
    if (uploadError) throw new Error("No se pudo subir la imagen: " + uploadError.message);
    const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
    el.bannerImageUploadStatus.textContent = "Imagen subida ✓";
    return data.publicUrl;
  }

  el.bannerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    el.bannerFormError.hidden = true;
    el.saveBannerBtn.disabled = true;
    el.saveBannerBtn.textContent = "Guardando…";

    try {
      const imageUrl = await uploadBannerImageIfNeeded();
      const payload = {
        title: el.bannerFieldTitle.value.trim(),
        subtitle: el.bannerFieldSubtitle.value.trim(),
        image: imageUrl || "",
        button_text: el.bannerFieldButtonText.value.trim(),
        button_link: el.bannerFieldButtonLink.value.trim(),
        sort_order: parseInt(el.bannerFieldOrder.value, 10) || 0,
        active: el.bannerFieldActive.checked,
      };
      const id = el.bannerFieldId.value;
      let error;
      if (id) {
        ({ error } = await supabaseClient.from("banners").update(payload).eq("id", id));
      } else {
        ({ error } = await supabaseClient.from("banners").insert(payload));
      }
      if (error) throw new Error(error.message);

      showToast(id ? "Banner actualizado" : "Banner creado");
      closeBannerModal();
      await loadBanners();
    } catch (err) {
      el.bannerFormError.textContent = err.message;
      el.bannerFormError.hidden = false;
    } finally {
      el.saveBannerBtn.disabled = false;
      el.saveBannerBtn.textContent = "Guardar banner";
    }
  });

  /* ---------------------------------------------------------------
     Modal crear / editar producto
     --------------------------------------------------------------- */
  function openProductModal(product) {
    el.productFormError.hidden = true;
    pendingImageFile = null;
    el.fieldImageFile.value = "";
    el.imageUploadStatus.textContent = "";

    if (product) {
      el.productModalTitle.textContent = "Editar producto";
      el.fieldId.value = product.id;
      el.fieldName.value = product.name || "";
      el.fieldBrand.value = product.brand || "";
      el.fieldCategory.value = product.category || "";
      el.fieldRef.value = product.ref || "";
      el.fieldAvail.value = String(Boolean(product.avail));
      el.fieldDetal.value = product.detal ?? "";
      el.fieldMayor.value = product.mayor ?? "";
      el.fieldOffer.value = product.offer ?? "";
      el.fieldStock.value = product.stock ?? "";
      el.fieldNote.value = product.note || "";
      el.fieldFeatured.checked = Boolean(product.featured);
      el.fieldTones.value = product.tones || "";
      galleryRows = [];
      galleryRowSeq = 0;
      (Array.isArray(product.gallery_images) ? product.gallery_images : []).forEach(url => {
        galleryRows.push({ id: galleryRowSeq++, url, file: null });
      });
      renderGalleryList();
      el.fieldImageUrl.value = product.image || "";
      if (product.image) {
        el.imagePreview.src = resolveImagePath(product.image);
        el.imagePreview.hidden = false;
      } else {
        el.imagePreview.hidden = true;
      }
      el.deleteProductBtn.hidden = false;
      el.deleteProductBtn.onclick = () => {
        closeProductModal();
        confirmDeleteProduct(product.id);
      };
    } else {
      el.productModalTitle.textContent = "Nuevo producto";
      el.productForm.reset();
      el.fieldId.value = "";
      el.fieldAvail.value = "true";
      el.fieldStock.value = "";
      el.imagePreview.hidden = true;
      el.deleteProductBtn.hidden = true;
      galleryRows = [];
      galleryRowSeq = 0;
      renderGalleryList();
      el.fieldTones.value = "";
    }

    el.productModalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeProductModal() {
    el.productModalOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  el.newProductBtn.addEventListener("click", () => openProductModal(null));
  el.productModalClose.addEventListener("click", closeProductModal);
  el.cancelProductBtn.addEventListener("click", closeProductModal);
  el.productModalOverlay.addEventListener("click", (e) => {
    if (e.target === el.productModalOverlay) closeProductModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el.productModalOverlay.hidden) closeProductModal();
  });

  // Previsualización de imagen elegida desde el computador
  el.fieldImageFile.addEventListener("change", () => {
    const file = el.fieldImageFile.files[0];
    if (!file) return;
    pendingImageFile = file;
    el.imagePreview.src = URL.createObjectURL(file);
    el.imagePreview.hidden = false;
    el.imageUploadStatus.textContent = "Se subirá al guardar: " + file.name;
  });

  el.fieldImageUrl.addEventListener("input", () => {
    if (el.fieldImageUrl.value.trim()) {
      pendingImageFile = null;
      el.fieldImageFile.value = "";
      el.imagePreview.src = el.fieldImageUrl.value.trim();
      el.imagePreview.hidden = false;
    }
  });

  async function uploadImageIfNeeded() {
    if (!pendingImageFile) return el.fieldImageUrl.value.trim();

    const ext = pendingImageFile.name.split(".").pop();
    const path = `producto-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;

    el.imageUploadStatus.textContent = "Subiendo imagen…";
    const { error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(path, pendingImageFile, { upsert: false });

    if (uploadError) {
      throw new Error("No se pudo subir la imagen: " + uploadError.message);
    }

    const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
    el.imageUploadStatus.textContent = "Imagen subida ✓";
    return data.publicUrl;
  }

  el.productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    el.productFormError.hidden = true;
    el.saveProductBtn.disabled = true;
    el.saveProductBtn.textContent = "Guardando…";

    try {
      const imageUrl = await uploadImageIfNeeded();
      const galleryImages = await buildGalleryImagesArray();

      const stockValue = el.fieldStock.value.trim() === "" ? null : parseInt(el.fieldStock.value, 10);
      let effectiveAvail = el.fieldAvail.value === "true";
      if (stockValue !== null && stockValue <= 0) {
        effectiveAvail = false; // stock en 0 (o menos) => se marca Agotado automáticamente
      }

      const payload = {
        name: el.fieldName.value.trim(),
        brand: el.fieldBrand.value.trim(),
        category: el.fieldCategory.value.trim(),
        ref: el.fieldRef.value.trim(),
        avail: effectiveAvail,
        detal: parseFloat(el.fieldDetal.value) || 0,
        mayor: parseFloat(el.fieldMayor.value) || 0,
        offer: el.fieldOffer.value ? parseFloat(el.fieldOffer.value) : null,
        stock: stockValue,
        image: imageUrl || "",
        gallery_images: galleryImages,
        tones: el.fieldTones.value.trim(),
        note: el.fieldNote.value.trim(),
        featured: el.fieldFeatured.checked,
      };

      const id = el.fieldId.value;
      let error;
      if (id) {
        ({ error } = await supabaseClient.from("products").update(payload).eq("id", id));
      } else {
        ({ error } = await supabaseClient.from("products").insert(payload));
      }

      if (error) throw new Error(error.message);

      showToast(id ? "Producto actualizado" : "Producto creado");
      closeProductModal();
      await loadProducts();
    } catch (err) {
      el.productFormError.textContent = err.message;
      el.productFormError.hidden = false;
    } finally {
      el.saveProductBtn.disabled = false;
      el.saveProductBtn.textContent = "Guardar producto";
    }
  });

  /* ---------------------------------------------------------------
     AJUSTES: logo, colores, textos, contacto
     --------------------------------------------------------------- */
  const DEFAULT_SETTINGS_ADMIN = {
    store_name: "Shopicol", store_tagline: "Bacano",
    meta_description: "Catálogo Shopicol Bacano: maquillaje, capilares y cuidado personal colombiano al por mayor y detal.",
    eyebrow_text: "✦ Catálogo completo · edición web ✦",
    hero_title: "Lo más bacano para ti.", hero_accent_word: "bacano",
    hero_subtitle: "Maquillaje, capilares y cuidado personal colombiano, directo del catálogo Shopicol. Compra al detal sin mínimo, o accede a precio mayorista desde $50 en tu compra.",
    hero_note_text: "¿Cómo comprar? El precio Detal es por unidad, sin monto mínimo. El precio Mayor se activa al acumular $50 o más en tu pedido — no es por cantidad de piezas, sino por el monto total. ¡Gracias por preferirnos! 💗",
    footer_description: "Productos colombianos de buena calidad, a un buen precio. ¡Llegaste al lugar indicado!",
    footer_bottom_text: "Catálogo generado a partir del PDF original de Shopicol Bacano · Gracias por preferirnos ✦",
    contact_title: "✦ Contáctanos ✦",
    contact_subtitle: "¿Tienes dudas sobre un producto o tu pedido? Escríbenos por cualquiera de estos medios.",
    logo_url: "", primary_color: "#D6336C", accent_color: "#E8A33D",
    bg_color: "#FBF6EC", text_color: "#2B1B17", font_pair: "clasica", card_radius: 18,
    contact_email: "", instagram_url: "", tiktok_url: "", facebook_url: "",
  };
  let pendingLogoFile = null;

  async function loadSettings() {
    const { data, error } = await supabaseClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const settings = (!error && data) ? { ...DEFAULT_SETTINGS_ADMIN, ...data } : DEFAULT_SETTINGS_ADMIN;

    el.settingsStoreName.value = settings.store_name || "";
    el.settingsTagline.value = settings.store_tagline || "";
    el.settingsPrimaryColor.value = settings.primary_color || "#D6336C";
    el.settingsPrimaryColorHex.value = settings.primary_color || "#D6336C";
    el.settingsAccentColor.value = settings.accent_color || "#E8A33D";
    el.settingsAccentColorHex.value = settings.accent_color || "#E8A33D";
    el.settingsBgColor.value = settings.bg_color || "#FBF6EC";
    el.settingsBgColorHex.value = settings.bg_color || "#FBF6EC";
    el.settingsTextColor.value = settings.text_color || "#2B1B17";
    el.settingsTextColorHex.value = settings.text_color || "#2B1B17";
    el.settingsFontPair.value = settings.font_pair || "clasica";
    el.settingsCardRadius.value = String(settings.card_radius ?? 18);
    el.settingsHeroTitle.value = settings.hero_title || "";
    el.settingsHeroAccent.value = settings.hero_accent_word || "";
    el.settingsHeroSubtitle.value = settings.hero_subtitle || "";
    el.settingsEyebrow.value = settings.eyebrow_text || "";
    el.settingsHeroNote.value = settings.hero_note_text || "";
    el.settingsFooterDescription.value = settings.footer_description || "";
    el.settingsFooterBottom.value = settings.footer_bottom_text || "";
    el.settingsMetaDescription.value = settings.meta_description || "";
    el.settingsContactTitle.value = settings.contact_title || "";
    el.settingsContactSubtitle.value = settings.contact_subtitle || "";
    el.settingsEmail.value = settings.contact_email || "";
    el.settingsInstagram.value = settings.instagram_url || "";
    el.settingsTiktok.value = settings.tiktok_url || "";
    el.settingsFacebook.value = settings.facebook_url || "";
    el.settingsLogoUrl.value = settings.logo_url || "";
    if (settings.logo_url) {
      el.settingsLogoPreview.src = settings.logo_url;
      el.settingsLogoPreview.hidden = false;
    } else {
      el.settingsLogoPreview.src = "/logo.png";
      el.settingsLogoPreview.hidden = false;
    }
  }

  // Sincroniza el input de color (picker) con su versión de texto y viceversa
  function linkColorInputs(colorEl, hexEl) {
    colorEl.addEventListener("input", () => { hexEl.value = colorEl.value; });
    hexEl.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hexEl.value)) colorEl.value = hexEl.value;
    });
  }
  linkColorInputs(el.settingsPrimaryColor, el.settingsPrimaryColorHex);
  linkColorInputs(el.settingsAccentColor, el.settingsAccentColorHex);
  linkColorInputs(el.settingsBgColor, el.settingsBgColorHex);
  linkColorInputs(el.settingsTextColor, el.settingsTextColorHex);

  el.settingsLogoFile.addEventListener("change", () => {
    const file = el.settingsLogoFile.files[0];
    if (!file) return;
    pendingLogoFile = file;
    el.settingsLogoPreview.src = URL.createObjectURL(file);
    el.settingsLogoPreview.hidden = false;
    el.settingsLogoStatus.textContent = "Se subirá al guardar: " + file.name;
  });
  el.settingsLogoUrl.addEventListener("input", () => {
    if (el.settingsLogoUrl.value.trim()) {
      pendingLogoFile = null;
      el.settingsLogoFile.value = "";
      el.settingsLogoPreview.src = el.settingsLogoUrl.value.trim();
      el.settingsLogoPreview.hidden = false;
    }
  });

  async function uploadLogoIfNeeded() {
    if (!pendingLogoFile) return el.settingsLogoUrl.value.trim();
    const ext = pendingLogoFile.name.split(".").pop();
    const path = `logo-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    el.settingsLogoStatus.textContent = "Subiendo logo…";
    const { error } = await supabaseClient.storage.from("product-images").upload(path, pendingLogoFile, { upsert: false });
    if (error) throw new Error("No se pudo subir el logo: " + error.message);
    const { data } = supabaseClient.storage.from("product-images").getPublicUrl(path);
    el.settingsLogoStatus.textContent = "Logo subido ✓";
    return data.publicUrl;
  }

  el.saveSettingsBtn.addEventListener("click", async () => {
    el.settingsFormError.hidden = true;
    el.saveSettingsBtn.disabled = true;
    el.saveSettingsBtn.textContent = "Guardando…";

    try {
      const logoUrl = await uploadLogoIfNeeded();
      const payload = {
        id: 1,
        store_name: el.settingsStoreName.value.trim() || "Shopicol",
        store_tagline: el.settingsTagline.value.trim() || "Bacano",
        meta_description: el.settingsMetaDescription.value.trim(),
        eyebrow_text: el.settingsEyebrow.value.trim(),
        hero_title: el.settingsHeroTitle.value.trim(),
        hero_accent_word: el.settingsHeroAccent.value.trim(),
        hero_subtitle: el.settingsHeroSubtitle.value.trim(),
        hero_note_text: el.settingsHeroNote.value.trim(),
        footer_description: el.settingsFooterDescription.value.trim(),
        footer_bottom_text: el.settingsFooterBottom.value.trim(),
        contact_title: el.settingsContactTitle.value.trim(),
        contact_subtitle: el.settingsContactSubtitle.value.trim(),
        logo_url: logoUrl || "",
        primary_color: el.settingsPrimaryColorHex.value.trim() || "#D6336C",
        accent_color: el.settingsAccentColorHex.value.trim() || "#E8A33D",
        bg_color: el.settingsBgColorHex.value.trim() || "#FBF6EC",
        text_color: el.settingsTextColorHex.value.trim() || "#2B1B17",
        font_pair: el.settingsFontPair.value,
        card_radius: parseInt(el.settingsCardRadius.value, 10) || 18,
        contact_email: el.settingsEmail.value.trim(),
        instagram_url: el.settingsInstagram.value.trim(),
        tiktok_url: el.settingsTiktok.value.trim(),
        facebook_url: el.settingsFacebook.value.trim(),
      };

      const { error } = await supabaseClient.from("site_settings").upsert(payload);
      if (error) throw new Error(error.message);

      showToast("Ajustes guardados. Recarga tu sitio público para verlos aplicados.");
      pendingLogoFile = null;
    } catch (err) {
      el.settingsFormError.textContent = err.message;
      el.settingsFormError.hidden = false;
    } finally {
      el.saveSettingsBtn.disabled = false;
      el.saveSettingsBtn.textContent = "Guardar ajustes";
    }
  });

  /* ---------------------------------------------------------------
     Importar catálogo semilla (una sola vez)
     --------------------------------------------------------------- */
  el.importBtn.addEventListener("click", () => {
    el.importHint.hidden = false;
  });
  el.cancelImportBtn.addEventListener("click", () => {
    el.importHint.hidden = true;
  });
  el.confirmImportBtn.addEventListener("click", async () => {
    el.importHint.hidden = true;
    if (typeof SEED_PRODUCTS === "undefined" || !SEED_PRODUCTS.length) {
      showToast("No se encontró el catálogo semilla (products.js)", true);
      return;
    }

    showToast(`Importando ${SEED_PRODUCTS.length} productos… esto puede tardar un momento`);

    // Prepara las filas quitando campos que no existen en la tabla
    const rows = SEED_PRODUCTS.map(p => ({
      name: p.name,
      brand: p.brand,
      category: p.category,
      ref: p.ref || "",
      mayor: p.mayor || 0,
      detal: p.detal || 0,
      avail: Boolean(p.avail),
      offer: p.offer ?? null,
      image: p.image || "",
      note: p.note || "",
      featured: Boolean(p.featured),
    }));

    // Inserta en lotes de 100 para evitar límites de tamaño de payload
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabaseClient.from("products").insert(chunk);
      if (error) {
        showToast(`Error al importar (fila ~${i}): ${error.message}`, true);
        break;
      }
      inserted += chunk.length;
    }

    showToast(`Importación completa: ${inserted} productos agregados`);
    await loadProducts();
  });

  /* ---------------------------------------------------------------
     Carga masiva de productos desde un archivo Excel (.xlsx)
     --------------------------------------------------------------- */
  const VALID_CATEGORIES_HINT = ["Rostro", "Ojos", "Labios", "Cejas", "Brochas y Pinceles", "Capilar", "Cuidado Corporal", "Cuidado Facial", "Accesorios", "Otros"];
  let pendingBulkRows = [];

  function parseBoolField(value) {
    const v = String(value ?? "").trim().toLowerCase();
    return v === "si" || v === "sí" || v === "true" || v === "1" || v === "yes";
  }

  function parseBulkExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes("producto")) || workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
      reader.readAsArrayBuffer(file);
    });
  }

  // Normaliza las claves del objeto de una fila del Excel: quita asteriscos
  // de "obligatorio" (ej. "Nombre *" → "Nombre") y espacios extra, para que
  // no importe si el encabezado trae el asterisco o no.
  function normalizeRowKeys(row) {
    const normalized = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.replace(/\*/g, "").trim();
      normalized[cleanKey] = row[key];
    });
    return normalized;
  }

  function validateBulkRows(rawRows) {
    const valid = [];
    const errors = [];

    rawRows.forEach((rawRow, idx) => {
      const row = normalizeRowKeys(rawRow);
      const lineNum = idx + 2; // +2 porque la fila 1 es el encabezado
      const name = String(row["Nombre"] || "").trim();
      const brand = String(row["Marca"] || "").trim();
      const category = String(row["Categoria"] || row["Categoría"] || "").trim();
      const detal = parseFloat(row["Precio_Detal"]);
      const mayor = parseFloat(row["Precio_Mayor"]);

      const rowErrors = [];
      if (!name) rowErrors.push("falta Nombre");
      if (!brand) rowErrors.push("falta Marca");
      if (!category) rowErrors.push("falta Categoria");
      if (isNaN(detal)) rowErrors.push("Precio_Detal inválido");
      if (isNaN(mayor)) rowErrors.push("Precio_Mayor inválido");

      if (rowErrors.length) {
        errors.push(`Fila ${lineNum}: ${rowErrors.join(", ")}`);
        return;
      }

      const offerRaw = row["Precio_Oferta"];
      const stockRaw = row["Stock"];
      const tonesRaw = String(row["Tonos"] || "").trim();

      // Si Imagen_URL trae varias fotos separadas por coma, la primera es
      // la foto principal y el resto se guardan como galería adicional.
      const imageUrls = String(row["Imagen_URL"] || "").split(",").map(s => s.trim()).filter(Boolean);
      const mainImage = imageUrls[0] || "";
      const extraImages = imageUrls.slice(1);

      valid.push({
        name, brand, category,
        ref: String(row["Referencia"] || "").trim(),
        detal, mayor,
        offer: (offerRaw !== "" && offerRaw !== undefined && !isNaN(parseFloat(offerRaw))) ? parseFloat(offerRaw) : null,
        stock: (stockRaw !== "" && stockRaw !== undefined && !isNaN(parseInt(stockRaw, 10))) ? parseInt(stockRaw, 10) : null,
        avail: row["Disponible"] === "" ? true : parseBoolField(row["Disponible"]),
        featured: parseBoolField(row["Destacado"]),
        tones: tonesRaw,
        image: mainImage,
        note: String(row["Notas"] || "").trim(),
        gallery_images: extraImages,
      });
    });

    return { valid, errors };
  }

  el.bulkUploadBtn.addEventListener("click", () => el.bulkUploadFile.click());

  el.bulkUploadFile.addEventListener("change", async () => {
    const file = el.bulkUploadFile.files[0];
    el.bulkUploadFile.value = "";
    if (!file) return;

    if (typeof XLSX === "undefined") {
      showToast("No se pudo cargar el lector de Excel. Revisa tu conexión a internet.", true);
      return;
    }

    try {
      const rawRows = await parseBulkExcel(file);
      const { valid, errors } = validateBulkRows(rawRows);
      pendingBulkRows = valid;

      el.bulkSummary.innerHTML = `
        <div class="bulk-stat ok"><strong>${valid.length}</strong><span>listos para cargar</span></div>
        <div class="bulk-stat bad"><strong>${errors.length}</strong><span>con errores (se omiten)</span></div>
        <div class="bulk-stat"><strong>${rawRows.length}</strong><span>filas totales</span></div>
      `;
      if (errors.length) {
        el.bulkErrorsList.hidden = false;
        el.bulkErrorsList.innerHTML = errors.slice(0, 30).map(e => `<p>${e}</p>`).join("") +
          (errors.length > 30 ? `<p>…y ${errors.length - 30} más.</p>` : "");
      } else {
        el.bulkErrorsList.hidden = true;
        el.bulkErrorsList.innerHTML = "";
      }
      el.confirmBulkBtn.disabled = valid.length === 0;
      el.bulkFormError.hidden = true;
      el.bulkModalOverlay.hidden = false;
      document.body.style.overflow = "hidden";
    } catch (err) {
      showToast("No se pudo leer el archivo Excel: " + err.message, true);
    }
  });

  function closeBulkModal() {
    el.bulkModalOverlay.hidden = true;
    document.body.style.overflow = "";
    pendingBulkRows = [];
  }
  el.bulkModalClose.addEventListener("click", closeBulkModal);
  el.cancelBulkBtn.addEventListener("click", closeBulkModal);
  el.bulkModalOverlay.addEventListener("click", (e) => { if (e.target === el.bulkModalOverlay) closeBulkModal(); });

  el.confirmBulkBtn.addEventListener("click", async () => {
    if (!pendingBulkRows.length) return;
    el.confirmBulkBtn.disabled = true;
    el.confirmBulkBtn.textContent = "Cargando…";

    const chunkSize = 100;
    let inserted = 0;
    let lastError = null;
    for (let i = 0; i < pendingBulkRows.length; i += chunkSize) {
      const chunk = pendingBulkRows.slice(i, i + chunkSize);
      const { error } = await supabaseClient.from("products").insert(chunk);
      if (error) { lastError = error; break; }
      inserted += chunk.length;
    }

    el.confirmBulkBtn.disabled = false;
    el.confirmBulkBtn.textContent = "Cargar productos válidos";

    if (lastError) {
      el.bulkFormError.textContent = "Error al cargar: " + lastError.message;
      el.bulkFormError.hidden = false;
      return;
    }

    closeBulkModal();
    showToast(`${inserted} productos cargados correctamente`);
    await loadProducts();
  });

  /* ---------------------------------------------------------------
     Init
     --------------------------------------------------------------- */
  checkSession();
})();
