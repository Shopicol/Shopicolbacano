/* =====================================================================
   CLIENTE COMPARTIDO DE SUPABASE
   =====================================================================
   Este archivo detecta si config.js ya tiene claves reales pegadas.
   - Si NO (todavía dice "PEGA_AQUI..."): SUPABASE_READY = false, y tanto
     el sitio como el panel usan el catálogo local de products.js.
   - Si SÍ: crea el cliente de Supabase que se usa para leer/escribir
     el catálogo en la nube.

   Requiere que en el HTML, ANTES de este script, se cargue:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ===================================================================== */

const SUPABASE_READY = Boolean(
  typeof SUPABASE_CONFIG !== "undefined" &&
  SUPABASE_CONFIG.url &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.url.includes("PEGA_AQUI") &&
  !SUPABASE_CONFIG.anonKey.includes("PEGA_AQUI") &&
  typeof window.supabase !== "undefined"
);

const supabaseClient = SUPABASE_READY
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

/**
 * Trae el catálogo completo.
 * - Con Supabase configurado: lee la tabla "products" en vivo.
 * - Sin configurar: usa el catálogo local (SEED_PRODUCTS de products.js),
 *   que es exactamente el catálogo que ya extrajimos del PDF original.
 */
async function fetchCatalog() {
  if (SUPABASE_READY) {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data && data.length) {
      return data;
    }
    // Si la tabla existe pero está vacía, o hubo un error de red,
    // caemos de vuelta al catálogo local para no dejar la página en blanco.
    console.warn("No se pudo leer Supabase (o la tabla está vacía). Usando catálogo local.", error);
  }
  return typeof SEED_PRODUCTS !== "undefined" ? SEED_PRODUCTS : [];
}

/* =====================================================================
   AJUSTES DEL SITIO (logo, colores, textos, contacto)
   Valores por defecto — se usan si Supabase no está configurado, o si
   la tabla "site_settings" todavía no tiene datos. Así el sitio nunca
   se rompe: apenas configures cosas desde el panel, se reemplazan.
   ===================================================================== */
const DEFAULT_SETTINGS = {
  store_name: "Shopicol",
  store_tagline: "Bacano",
  meta_description: "Catálogo Shopicol Bacano: maquillaje, capilares y cuidado personal colombiano al por mayor y detal.",
  eyebrow_text: "✦ Catálogo completo · edición web ✦",
  hero_title: "Lo más bacano para ti.",
  hero_accent_word: "bacano",
  hero_subtitle: "Maquillaje, capilares y cuidado personal colombiano, directo del catálogo Shopicol. Compra al detal sin mínimo, o accede a precio mayorista desde $50 en tu compra.",
  hero_note_text: "¿Cómo comprar? El precio Detal es por unidad, sin monto mínimo. El precio Mayor se activa al acumular $50 o más en tu pedido — no es por cantidad de piezas, sino por el monto total. ¡Gracias por preferirnos! 💗",
  footer_description: "Productos colombianos de buena calidad, a un buen precio. ¡Llegaste al lugar indicado!",
  footer_bottom_text: "Catálogo generado a partir del PDF original de Shopicol Bacano · Gracias por preferirnos ✦",
  contact_title: "✦ Contáctanos ✦",
  contact_subtitle: "¿Tienes dudas sobre un producto o tu pedido? Escríbenos por cualquiera de estos medios.",
  logo_url: "",
  primary_color: "#D6336C",
  accent_color: "#E8A33D",
  contact_email: "",
  instagram_url: "",
  tiktok_url: "",
  facebook_url: "",
};

async function fetchSettings() {
  if (SUPABASE_READY) {
    const { data, error } = await supabaseClient
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      return { ...DEFAULT_SETTINGS, ...data };
    }
    console.warn("No se pudo leer los ajustes del sitio. Usando valores por defecto.", error);
  }
  return { ...DEFAULT_SETTINGS };
}
