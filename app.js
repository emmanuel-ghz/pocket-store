/* PocketStore - Lógica de la aplicación */

const API_URL = 'https://jsonplaceholder.typicode.com/users';

const catalogEl = document.getElementById('catalog');
const messageEl = document.getElementById('message');
const searchEl = document.getElementById('search');
const sourceEl = document.getElementById('source-info');
const statusEl = document.getElementById('net-status');

let items = [];

/* ---------- Registro del Service Worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => console.log('[PocketStore] SW registrado, scope:', reg.scope))
      .catch((err) => console.error('[PocketStore] Error al registrar el SW:', err));
  });
}

/* ---------- Estado de conexión ---------- */
function updateNetworkStatus() {
  const online = navigator.onLine;
  statusEl.textContent = online ? 'En línea' : 'Sin conexión';
  statusEl.className = `badge ${online ? 'badge--online' : 'badge--offline'}`;
}
window.addEventListener('online', () => { updateNetworkStatus(); loadCatalog(); });
window.addEventListener('offline', updateNetworkStatus);

/* ---------- Contenido dinámico ---------- */
async function loadCatalog() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const fromCache = response.headers.get('X-From-Cache') === 'true';
    items = await response.json();

    hideMessage();
    sourceEl.textContent = fromCache
      ? 'Mostrando datos guardados en caché (modo offline).'
      : 'Datos actualizados desde la red.';
    render(items);
  } catch (error) {
    console.error('[PocketStore] No se pudo cargar el catálogo:', error);
    catalogEl.innerHTML = '';
    sourceEl.textContent = '';
    showMessage('Sin conexión y sin datos guardados. Conéctate al menos una vez para usar la app offline.');
  }
}

function render(list) {
  if (list.length === 0) {
    catalogEl.innerHTML = '';
    showMessage('No se encontraron resultados.');
    return;
  }
  hideMessage();
  catalogEl.innerHTML = list.map(cardTemplate).join('');
}

function cardTemplate(user) {
  const initials = user.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
  return `
    <article class="card">
      <div class="card__avatar" aria-hidden="true">${escapeHTML(initials)}</div>
      <h2 class="card__name">${escapeHTML(user.name)}</h2>
      <p class="card__line">@${escapeHTML(user.username)}</p>
      <p class="card__line">${escapeHTML(user.email)}</p>
      <p class="card__line">${escapeHTML(user.address.city)}</p>
      <p class="card__company">${escapeHTML(user.company.name)}</p>
    </article>`;
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showMessage(text) { messageEl.textContent = text; messageEl.hidden = false; }
function hideMessage() { messageEl.hidden = true; }

/* ---------- Búsqueda ---------- */
searchEl.addEventListener('input', () => {
  const term = searchEl.value.trim().toLowerCase();
  const filtered = items.filter((u) =>
    [u.name, u.username, u.email, u.company.name, u.address.city]
      .some((field) => field.toLowerCase().includes(term))
  );
  render(filtered);
});

/* ---------- Inicio ---------- */
updateNetworkStatus();
loadCatalog();
