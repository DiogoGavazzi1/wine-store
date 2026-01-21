/* =========================================================
   CART SYSTEM (LocalStorage)
   File: assets/js/cart.js

   Como funciona:
   - cart fica guardado no LocalStorage
   - qualquer página pode chamar addToCart(product)
   - cart.html renderiza automaticamente os items
========================================================= */

const CART_KEY = "wineStoreCart";

/* ---------------------------
   Helpers LocalStorage
----------------------------*/
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ---------------------------
   Money format
----------------------------*/
function formatEUR(value) {
  return value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

/* ---------------------------
   Cart Counter (Navbar)
----------------------------*/
function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // suporta ambos ids/classes que podes usar
  const counter1 = document.getElementById("cart-count");
  const counter2 = document.querySelector(".cart-badge");

  if (counter1) counter1.textContent = totalQty;
  if (counter2) counter2.textContent = totalQty;
}

/* ---------------------------
   Add To Cart
----------------------------*/
function addToCart(product) {
  // Normalização (evita bugs)
  const normalized = {
    id: Number(product.id),
    name: product.name || "Produto",
    price: Number(product.price) || 0,
    image: product.image || "assets/img/img1.png",
    meta: product.meta || "—",
    tag: product.tag || "Dia-a-dia",
  };

  const cart = getCart();
  const existing = cart.find((item) => Number(item.id) === normalized.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...normalized,
      qty: 1,
    });
  }

  saveCart(cart);
  updateCartCount();

  // Feedback UX premium
  showToast(normalized);
}

/* ---------------------------
   Remove item
----------------------------*/
function removeFromCart(id) {
  const cart = getCart().filter((item) => Number(item.id) !== Number(id));
  saveCart(cart);
  renderCart();
  updateCartCount();
}

/* ---------------------------
   Update Quantity
----------------------------*/
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => Number(i.id) === Number(id));
  if (!item) return;

  item.qty += delta;

  // se qty ficar 0 ou menos -> remove
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart(cart);
  renderCart();
  updateCartCount();
}

/* ---------------------------
   Render Cart (cart.html)
   Só funciona se existir:
   - <div id="cart-items"></div>
   - elementos total/subtotal
----------------------------*/
function renderCart() {
  const container = document.getElementById("cart-items");
  if (!container) return; // se não estiver em cart.html ignora

  const cart = getCart();

  // carrinho vazio
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <h3>O seu carrinho está vazio</h3>
        <p>Explore o catálogo e descubra a nossa seleção.</p>
        <a href="catalog.html" class="btn btn-gold-cta mt-2">Ver Catálogo</a>
      </div>
    `;
    updateTotals(0);
    return;
  }

  // renderiza items
  container.innerHTML = cart
    .map((item) => {
      const subtotal = item.price * item.qty;

      // class da tag (premium/reservas/diaadia)
      let tagClass = "tag-diaadia";
      if ((item.tag || "").toLowerCase().includes("premium")) tagClass = "tag-premium";
      if ((item.tag || "").toLowerCase().includes("reserva")) tagClass = "tag-reservas";

      return `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.image}" alt="${item.name}">
          </div>

          <div class="cart-item-info">
            <div class="d-flex justify-content-between gap-3">
              <div>
                <h3 class="cart-item-title">${item.name}</h3>
                <p class="cart-item-meta">${item.meta}</p>
                <span class="tag ${tagClass}">${item.tag}</span>
              </div>

              <div class="text-end">
                <p class="cart-item-price">${formatEUR(item.price)}</p>
                <button class="btn-remove" onclick="removeFromCart(${Number(item.id)})">
                  Remover
                </button>
              </div>
            </div>

            <div class="cart-qty-row">
              <div class="qty-control">
                <button class="qty-btn" onclick="changeQty(${Number(item.id)}, -1)">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${Number(item.id)}, 1)">+</button>
              </div>

              <p class="cart-item-subtotal">
                Subtotal: <span>${formatEUR(subtotal)}</span>
              </p>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // calcular total
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  updateTotals(total);
}

/* ---------------------------
   Update Totals (Resumo)
----------------------------*/
function updateTotals(total) {
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");

  if (subtotalEl) subtotalEl.textContent = formatEUR(total);
  if (totalEl) totalEl.textContent = formatEUR(total);
}

/* =========================================================
   Toast Premium (UX upgrade)
========================================================= */
function showToast(product) {
  // remove toast anterior
  const existing = document.getElementById("toast-premium");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toast-premium";

  toast.innerHTML = `
    <div class="toast-premium-inner">
      <div class="toast-icon">✔</div>
      <div class="toast-content">
        <div class="toast-title">Adicionado ao carrinho</div>
        <div class="toast-sub">${product.name} · ${formatEUR(product.price)}</div>
        <a class="toast-link" href="cart.html">Ver carrinho →</a>
      </div>
      <button class="toast-close" aria-label="Fechar">✕</button>
    </div>
  `;

  document.body.appendChild(toast);

  // fechar manualmente
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  });

  // animação de entrada
  setTimeout(() => toast.classList.add("show"), 10);

  // auto fechar
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

/* ---------------------------
   INIT
----------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
});
