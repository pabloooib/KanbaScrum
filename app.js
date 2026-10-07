/* ==========================================================
   HelpDesk-PRO · Lógica de la aplicación
   Estudiante: José Pablo Ibañez Ibañez · ID 000149294
   UPANA · Ingeniería en Sistemas
   ========================================================== */
'use strict';

/* ---------- 1. Configuración de Firebase ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyCu8ZOK-Jc2pg7nqVHOyRqGhwM1MNjZkoE",
  authDomain: "neuro-e0ce1.firebaseapp.com",
  projectId: "neuro-e0ce1",
  storageBucket: "neuro-e0ce1.firebasestorage.app",
  messagingSenderId: "5242881013",
  appId: "1:5242881013:web:9db03b47314583634496bc",
  measurementId: "G-YYY7QSWVYV"
};

let db = null, ticketsCol = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  ticketsCol = db.collection('helpdesk_tickets');
  try { firebase.analytics(); } catch (e) { /* Analytics no está disponible abriendo el archivo localmente */ }
} catch (err) {
  console.warn('Firebase no pudo inicializarse:', err);
}

/* ---------- 2. Datos base ---------- */
const COLUMNS = [
  { id: 'backlog',  name: 'Pendientes (Backlog)',   color: '#8fa1c0' },
  { id: 'progress', name: 'En Proceso',             color: '#3b82f6' },
  { id: 'review',   name: 'En Revisión',            color: '#fbbf24' },
  { id: 'done',     name: 'Resueltos / Cerrados',   color: '#34d399' }
];

const SEED = [
  { id:'HD-001', order:1,  title:'Caída de red en el laboratorio 3', desc:'Los 25 equipos del laboratorio no obtienen dirección IP por DHCP desde las 8:00.', priority:'Crítica', tag:'Red', status:'progress', points:8, reporter:'Prof. Méndez' },
  { id:'HD-002', order:2,  title:'Error de inicio de sesión SSO', desc:'El portal institucional devuelve "token inválido" al autenticar con la cuenta universitaria.', priority:'Alta', tag:'Acceso/SSO', status:'progress', points:5, reporter:'Secretaría Académica' },
  { id:'HD-003', order:3,  title:'Impresora de Registro no imprime', desc:'La cola de impresión se bloquea y muestra el estado "Error - sin tóner".', priority:'Media', tag:'Impresoras', status:'backlog', points:2, reporter:'Registro y Control' },
  { id:'HD-004', order:4,  title:'Instalación de Visual Studio Code', desc:'Instalar y licenciar el entorno de desarrollo en 12 equipos de la sala de cómputo.', priority:'Baja', tag:'Software', status:'done', points:3, reporter:'Coord. Sistemas' },
  { id:'HD-005', order:5,  title:'Restablecer contraseña de correo institucional', desc:'El usuario olvidó su contraseña y no recibe el enlace de recuperación.', priority:'Media', tag:'Correo', status:'done', points:1, reporter:'Ana López' },
  { id:'HD-006', order:6,  title:'Wi-Fi intermitente en biblioteca', desc:'Se pierde la señal cada pocos minutos en el segundo nivel; posible falla del punto de acceso.', priority:'Alta', tag:'Red', status:'review', points:5, reporter:'Biblioteca' },
  { id:'HD-007', order:7,  title:'Actualizar antivirus en equipos administrativos', desc:'Desplegar la última versión y las definiciones de firmas en 30 equipos.', priority:'Alta', tag:'Seguridad', status:'backlog', points:5, reporter:'Dirección Administrativa' },
  { id:'HD-008', order:8,  title:'Monitor sin señal en recepción', desc:'El monitor se enciende pero no muestra imagen; revisar cable HDMI y tarjeta gráfica.', priority:'Baja', tag:'Hardware', status:'backlog', points:2, reporter:'Recepción' },
  { id:'HD-009', order:9,  title:'VPN no conecta desde el exterior', desc:'El cliente VPN muestra el error 809 al intentar conectarse desde redes domésticas.', priority:'Alta', tag:'Red', status:'progress', points:5, reporter:'Prof. Castillo' },
  { id:'HD-010', order:10, title:'Alta de usuarios nuevos en el directorio', desc:'Crear 40 cuentas de estudiantes de primer ingreso con permisos básicos.', priority:'Media', tag:'Acceso/SSO', status:'review', points:3, reporter:'Registro y Control' },
  { id:'HD-011', order:11, title:'Correo sospechoso reportado (phishing)', desc:'Varios usuarios recibieron un mensaje que suplanta al banco; bloquear remitente y comunicar.', priority:'Crítica', tag:'Seguridad', status:'review', points:3, reporter:'Seguridad TI' },
  { id:'HD-012', order:12, title:'Licencia de Office vencida', desc:'Word y Excel muestran modo de funcionalidad reducida en el equipo de Contabilidad.', priority:'Media', tag:'Software', status:'backlog', points:2, reporter:'Contabilidad' },
  { id:'HD-013', order:13, title:'Reemplazo de disco duro por SSD', desc:'El equipo de diseño presenta arranque lento; migrar el sistema a una unidad de estado sólido.', priority:'Media', tag:'Hardware', status:'backlog', points:5, reporter:'Diseño Gráfico' },
  { id:'HD-014', order:14, title:'Configurar impresora de red en Decanatura', desc:'Agregar controlador y asignar IP fija a la multifuncional recién instalada.', priority:'Baja', tag:'Impresoras', status:'done', points:2, reporter:'Decanatura' },
  { id:'HD-015', order:15, title:'Respaldo semanal de la base de datos', desc:'El trabajo programado de backup falló la noche del domingo; revisar permisos y espacio.', priority:'Alta', tag:'Software', status:'backlog', points:8, reporter:'Administrador BD' },
  { id:'HD-016', order:16, title:'Cuenta bloqueada tras intentos fallidos', desc:'Un docente quedó bloqueado antes de una evaluación en línea; desbloquear y revisar la política.', priority:'Media', tag:'Acceso/SSO', status:'done', points:1, reporter:'Prof. Rivas' }
];

const BACKLOG = [
  ['HU-01','Como usuario, quiero registrar un ticket de soporte describiendo mi problema para recibir ayuda.','Must',5,'Sprint 1'],
  ['HU-02','Como técnico, quiero ver todos los tickets en un tablero Kanban para conocer su estado.','Must',8,'Sprint 1'],
  ['HU-03','Como técnico, quiero cambiar el estado de un ticket (arrastrar o con botones) para reflejar el avance.','Must',5,'Sprint 1'],
  ['HU-04','Como técnico, quiero clasificar tickets por prioridad y etiqueta para atender primero lo crítico.','Must',3,'Sprint 1'],
  ['HU-05','Como administrador, quiero que los datos se guarden en la nube para no perder información.','Must',8,'Sprint 1'],
  ['HU-06','Como técnico, quiero buscar y filtrar tickets para encontrarlos rápidamente.','Should',3,'Sprint 1'],
  ['HU-07','Como usuario, quiero iniciar sesión con mi cuenta institucional para ver mis propios tickets.','Should',8,'Sprint 2'],
  ['HU-08','Como administrador, quiero un reporte de tickets por prioridad y tiempo de resolución.','Should',5,'Sprint 2'],
  ['HU-09','Como usuario, quiero recibir notificaciones por correo cuando mi ticket cambie de estado.','Could',5,'Sprint 2'],
  ['HU-10','Como técnico, quiero adjuntar capturas de pantalla a un ticket para diagnosticar mejor.','Could',5,'Sprint 3'],
  ['HU-11','Como administrador, quiero definir acuerdos de nivel de servicio (SLA) por prioridad.','Could',8,'Sprint 3']
];

const DOD = [
  'El ticket cuenta con título, descripción, prioridad, etiqueta y responsable definidos.',
  'La solución fue aplicada y verificada en el equipo o sistema del usuario.',
  'Se realizaron pruebas funcionales y no hay defectos críticos abiertos.',
  'Se documentó la causa raíz y los pasos de solución en el ticket.',
  'El usuario confirmó que la incidencia quedó resuelta.',
  'El cambio quedó registrado en la base de datos y visible en el tablero.',
  'La interfaz es responsiva y funciona en móvil, tableta y escritorio.',
  'El Product Owner aceptó el incremento en la Sprint Review.'
];

/* ---------- 3. Estado y utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let tickets = [];
let mode = 'connecting';          // 'connecting' | 'cloud' | 'local'
let dragId = null;
let unsubscribe = null;
let dodState = lsGet('hdp_dod', DOD.map(() => false));

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function setConn(state, text) {
  mode = state;
  const el = $('#conn');
  el.className = 'conn ' + (state === 'cloud' ? 'cloud' : state === 'local' ? 'local' : '');
  $('#conn-text').textContent = text;
}

/* ---------- 4. Capa de datos (Firestore con respaldo local) ---------- */
function connect() {
  if (!ticketsCol) return fallbackLocal('Firebase no disponible');
  let settled = false;
  const timer = setTimeout(() => { if (!settled) fallbackLocal('Sin respuesta de Firestore'); }, 8000);
  let seeding = false;

  unsubscribe = ticketsCol.orderBy('order').onSnapshot(snap => {
    settled = true; clearTimeout(timer);
    if (snap.empty && !seeding) { seeding = true; seedCloud(); return; }
    tickets = snap.docs.map(d => d.data());
    setConn('cloud', 'Firebase · en línea');
    render();
  }, err => {
    clearTimeout(timer);
    console.warn('Error de Firestore:', err);
    fallbackLocal(err && err.code === 'permission-denied' ? 'Permisos de Firestore denegados' : 'Error de conexión');
  });
}

function seedCloud() {
  const batch = db.batch();
  SEED.forEach(t => batch.set(ticketsCol.doc(t.id), t));
  batch.commit().catch(e => { console.warn(e); fallbackLocal('No se pudo inicializar la colección'); });
}

function fallbackLocal(reason) {
  if (unsubscribe) { try { unsubscribe(); } catch (e) {} unsubscribe = null; }
  tickets = lsGet('hdp_tickets', null) || JSON.parse(JSON.stringify(SEED));
  setConn('local', 'Modo local · ' + reason);
  toast('Usando almacenamiento local: ' + reason);
  render();
}

function persistLocal() { if (mode === 'local') lsSet('hdp_tickets', tickets); }

function cloudFail(e) { console.warn(e); toast('No se pudo guardar en Firebase'); }

function updateStatus(id, status) {
  const t = tickets.find(x => x.id === id);
  if (!t || t.status === status) return;
  const colName = COLUMNS.find(c => c.id === status).name;
  if (mode === 'cloud') {
    ticketsCol.doc(id).update({ status }).catch(cloudFail);
  } else {
    t.status = status; persistLocal(); render();
  }
  toast(`${id} → ${colName}`);
}

function createTicket(data) {
  const nums = tickets.map(t => parseInt(String(t.id).split('-')[1], 10)).filter(n => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const ticket = {
    id: 'HD-' + String(n).padStart(3, '0'),
    order: (tickets.reduce((m, t) => Math.max(m, t.order || 0), 0)) + 1,
    status: 'backlog', ...data
  };
  if (mode === 'cloud') ticketsCol.doc(ticket.id).set(ticket).catch(cloudFail);
  else { tickets.push(ticket); persistLocal(); render(); }
  toast(`Ticket ${ticket.id} creado en Pendientes`);
}

function deleteTicket(id) {
  if (!confirm('¿Eliminar el ticket ' + id + '?')) return;
  if (mode === 'cloud') ticketsCol.doc(id).delete().catch(cloudFail);
  else { tickets = tickets.filter(t => t.id !== id); persistLocal(); render(); }
  toast('Ticket eliminado');
}

function resetBoard() {
  if (!confirm('Se restaurarán los 16 tickets iniciales y se eliminarán los demás. ¿Continuar?')) return;
  if (mode === 'cloud') {
    const batch = db.batch();
    tickets.forEach(t => batch.delete(ticketsCol.doc(t.id)));
    SEED.forEach(t => batch.set(ticketsCol.doc(t.id), t));
    batch.commit().then(() => toast('Tablero restablecido')).catch(cloudFail);
  } else {
    tickets = JSON.parse(JSON.stringify(SEED)); persistLocal(); render(); toast('Tablero restablecido');
  }
}

/* ---------- 5. Render del tablero ---------- */
function render() {
  const q = $('#search').value.trim().toLowerCase();
  const fp = $('#filter-prio').value;
  const board = $('#board');
  board.innerHTML = '';

  COLUMNS.forEach((c, ci) => {
    const all = tickets.filter(t => t.status === c.id);
    const shown = all.filter(t =>
      (!fp || t.priority === fp) &&
      (!q || [t.id, t.title, t.desc, t.tag, t.reporter].join(' ').toLowerCase().includes(q)));

    const col = document.createElement('div');
    col.className = 'col'; col.dataset.col = c.id;
    col.innerHTML = `<div class="col-head"><div class="col-title"><span class="dot" style="background:${c.color}"></span>${c.name}</div><span class="count">${all.length}</span></div><div class="cards"></div>`;
    const wrap = $('.cards', col);
    if (!shown.length) wrap.innerHTML = '<div class="empty">Sin tickets</div>';
    shown.forEach(t => wrap.appendChild(ticketEl(t, ci)));

    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('over'); });
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (dragId) updateStatus(dragId, c.id); });
    board.appendChild(col);
  });
  updateMetrics();
}

function ticketEl(t, ci) {
  const el = document.createElement('article');
  const pk = String(t.priority).toLowerCase();
  el.className = 'ticket p-' + pk;
  el.draggable = true; el.dataset.id = t.id;
  el.innerHTML = `
    <div class="t-top"><span class="t-id">${esc(t.id)}</span><span class="prio ${pk}">${esc(t.priority)}</span></div>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.desc)}</p>
    <div class="t-tags"><span class="tag ${esc(t.tag)}">${esc(t.tag)}</span></div>
    <div class="t-foot">
      <div class="t-meta"><span class="pts">${esc(t.points)} pts</span><span class="who" title="${esc(t.reporter)}">${esc(t.reporter || '—')}</span></div>
      <div class="actions">
        <button class="ib" data-a="back" type="button" title="Retroceder" aria-label="Retroceder" ${ci === 0 ? 'disabled' : ''}>◀</button>
        <button class="ib" data-a="next" type="button" title="Avanzar" aria-label="Avanzar" ${ci === COLUMNS.length - 1 ? 'disabled' : ''}>▶</button>
        <button class="ib del" data-a="del" type="button" title="Eliminar" aria-label="Eliminar">✕</button>
      </div>
    </div>`;
  el.addEventListener('dragstart', e => {
    dragId = t.id; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', t.id); } catch (_) {}
  });
  el.addEventListener('dragend', () => {
    dragId = null; el.classList.remove('dragging');
    document.querySelectorAll('.col').forEach(c => c.classList.remove('over'));
  });
  $('[data-a="next"]', el).onclick = () => updateStatus(t.id, COLUMNS[ci + 1].id);
  $('[data-a="back"]', el).onclick = () => updateStatus(t.id, COLUMNS[ci - 1].id);
  $('[data-a="del"]', el).onclick = () => deleteTicket(t.id);
  return el;
}

/* ---------- 6. Métricas, KPIs y burndown ---------- */
function animateNumber(el, to) {
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) return;
  const start = performance.now(), dur = 600;
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function updateMetrics() {
  const total = tickets.length;
  const done = tickets.filter(t => t.status === 'done').length;
  const open = total - done;
  const crit = tickets.filter(t => t.priority === 'Crítica' && t.status !== 'done').length;
  const pct = total ? Math.round(done / total * 100) : 0;
  animateNumber($('#k-total'), total); animateNumber($('#k-open'), open);
  animateNumber($('#k-crit'), crit);   animateNumber($('#k-pct'), pct);

  const totPts = tickets.reduce((a, t) => a + (Number(t.points) || 0), 0);
  const donePts = tickets.filter(t => t.status === 'done').reduce((a, t) => a + (Number(t.points) || 0), 0);
  $('#sp-pts').textContent = `${totPts} puntos (${donePts} completados)`;
  drawBurndown(totPts, totPts - donePts);
}

function workdayIndex() {
  const start = new Date(2026, 9, 5), now = new Date(); now.setHours(0, 0, 0, 0);
  let d = 0; const cur = new Date(start);
  while (cur < now && d < 10) { if (cur.getDay() !== 0 && cur.getDay() !== 6) d++; cur.setDate(cur.getDate() + 1); }
  return Math.min(d, 10);
}

function drawBurndown(total, remaining) {
  const W = 640, H = 240, L = 44, R = 18, T = 16, B = 34, iw = W - L - R, ih = H - T - B;
  const x = i => L + iw * i / 10, y = v => T + ih * (1 - (total ? v / total : 0));
  const day = workdayIndex();
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const v = total * i / 4, yy = y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#223152"/><text x="${L - 8}" y="${yy + 4}" font-size="11" fill="#8fa1c0" text-anchor="end">${Math.round(v)}</text>`;
  }
  for (let i = 0; i <= 10; i++) g += `<text x="${x(i)}" y="${H - 12}" font-size="11" fill="#8fa1c0" text-anchor="middle">${i === 0 ? 'Inicio' : 'D' + i}</text>`;
  g += `<line x1="${x(0)}" y1="${y(total)}" x2="${x(10)}" y2="${y(0)}" stroke="#64769a" stroke-width="2" stroke-dasharray="6 5"/>`;
  g += `<line x1="${x(0)}" y1="${y(total)}" x2="${x(day)}" y2="${y(remaining)}" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>`;
  g += `<circle cx="${x(0)}" cy="${y(total)}" r="4" fill="#22d3ee"/><circle cx="${x(day)}" cy="${y(remaining)}" r="6" fill="#0a1020" stroke="#22d3ee" stroke-width="3"/>`;
  g += `<text x="${Math.min(x(day) + 10, W - 80)}" y="${y(remaining) - 12}" font-size="12" font-weight="700" fill="#22d3ee">${remaining} pts</text>`;
  $('#burndown').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico burndown del Sprint">${g}</svg>`;
}

/* ---------- 7. Scrum: pestañas, backlog y DoD ---------- */
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
  document.querySelectorAll('.tabpanel').forEach(p => p.classList.toggle('active', p.id === 'p-' + btn.dataset.tab));
}));

$('#backlog-body').innerHTML = BACKLOG.map(r => {
  const cls = r[2] === 'Must' ? 'b-must' : r[2] === 'Should' ? 'b-should' : 'b-could';
  return `<tr><td><b class="mono">${r[0]}</b></td><td>${esc(r[1])}</td><td><span class="badge ${cls}">${r[2]}</span></td><td>${r[3]}</td><td>${r[4]}</td></tr>`;
}).join('');

function renderDod() {
  const box = $('#dod-list'); box.innerHTML = '';
  DOD.forEach((txt, i) => {
    const l = document.createElement('label');
    l.className = 'check' + (dodState[i] ? ' done' : '');
    l.innerHTML = `<input type="checkbox" ${dodState[i] ? 'checked' : ''}><span>${esc(txt)}</span>`;
    $('input', l).addEventListener('change', e => { dodState[i] = e.target.checked; lsSet('hdp_dod', dodState); renderDod(); });
    box.appendChild(l);
  });
  const n = dodState.filter(Boolean).length;
  $('#dod-bar').style.width = (n / DOD.length * 100) + '%';
  $('#dod-txt').textContent = `${n} de ${DOD.length} criterios verificados`;
}

/* ---------- 8. Modal de nuevo ticket ---------- */
const dlg = $('#dlg');
function openDlg() { $('#form').reset(); dlg.showModal(); $('#f-title').focus(); }
$('#btn-new').addEventListener('click', openDlg);
$('#btn-new-hero').addEventListener('click', () => { location.hash = '#kanban'; openDlg(); });
$('#dlg-cancel').addEventListener('click', () => dlg.close());
$('#form').addEventListener('submit', () => {
  createTicket({
    title: $('#f-title').value.trim(),
    desc: $('#f-desc').value.trim() || 'Sin descripción.',
    priority: $('#f-prio').value,
    points: parseInt($('#f-pts').value, 10),
    tag: $('#f-tag').value,
    reporter: $('#f-user').value.trim() || 'Usuario'
  });
});
$('#btn-reset').addEventListener('click', resetBoard);
$('#search').addEventListener('input', render);
$('#filter-prio').addEventListener('change', render);

/* ---------- 9. Bienvenida interactiva ---------- */
(function welcome() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const full = g + ', José Pablo';
  const el = $('#greet'); el.textContent = '';
  let i = 0;
  const type = () => { el.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(type, 45); };
  type();
  const hero = $('#inicio'), glow = $('#glow');
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    glow.style.left = (e.clientX - r.left) + 'px';
    glow.style.top = (e.clientY - r.top) + 'px';
  });
})();

/* ---------- 10. Exportar a PDF ---------- */
function fmtDate() { return new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }); }
$('#print-date').textContent = fmtDate();
window.addEventListener('beforeprint', () => { $('#print-date').textContent = fmtDate(); });
$('#btn-pdf').addEventListener('click', () => {
  toast('En el diálogo de impresión elige "Guardar como PDF"');
  setTimeout(() => window.print(), 400);
});

/* ---------- 11. Inicio ---------- */
setConn('connecting', 'Conectando…');
renderDod();
connect();
