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

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  try { firebase.analytics(); } catch (e) { /* Analytics no funciona abriendo el archivo localmente */ }
} catch (err) {
  console.warn('Firebase no pudo inicializarse:', err);
}

/* ---------- 2. Datos de ejemplo ---------- */
const COLUMNS = [
  { id: 'backlog',  name: 'Pendientes (Backlog)', color: '#7a7f92' },
  { id: 'progress', name: 'En Proceso',           color: '#3f7bd6' },
  { id: 'review',   name: 'En Revisión',          color: '#d9a21e' },
  { id: 'done',     name: 'Resueltos / Cerrados', color: '#468f66' }
];

const SEED_TICKETS = [
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

const SEED_STORIES = [
  ['Como usuario, quiero registrar un ticket de soporte describiendo mi problema para recibir ayuda.','Must',5,'Sprint 1'],
  ['Como técnico, quiero ver todos los tickets en un tablero Kanban para conocer su estado.','Must',8,'Sprint 1'],
  ['Como técnico, quiero cambiar el estado de un ticket (arrastrar o con botones) para reflejar el avance.','Must',5,'Sprint 1'],
  ['Como técnico, quiero clasificar tickets por prioridad y etiqueta para atender primero lo crítico.','Must',3,'Sprint 1'],
  ['Como administrador, quiero que los datos se guarden en la nube para no perder información.','Must',8,'Sprint 1'],
  ['Como técnico, quiero buscar y filtrar tickets para encontrarlos rápidamente.','Should',3,'Sprint 1'],
  ['Como usuario, quiero iniciar sesión con mi cuenta institucional para ver mis propios tickets.','Should',8,'Sprint 2'],
  ['Como administrador, quiero un reporte de tickets por prioridad y tiempo de resolución.','Should',5,'Sprint 2'],
  ['Como usuario, quiero recibir notificaciones por correo cuando mi ticket cambie de estado.','Could',5,'Sprint 2'],
  ['Como técnico, quiero adjuntar capturas de pantalla a un ticket para diagnosticar mejor.','Could',5,'Sprint 3'],
  ['Como administrador, quiero definir acuerdos de nivel de servicio (SLA) por prioridad.','Could',8,'Sprint 3']
].map((r, i) => ({ id: 'HU-' + String(i + 1).padStart(2, '0'), order: i + 1, story: r[0], prio: r[1], points: r[2], sprint: r[3] }));

const SEED_DOD = [
  'El ticket cuenta con título, descripción, prioridad, etiqueta y responsable definidos.',
  'La solución fue aplicada y verificada en el equipo o sistema del usuario.',
  'Se realizaron pruebas funcionales y no hay defectos críticos abiertos.',
  'Se documentó la causa raíz y los pasos de solución en el ticket.',
  'El usuario confirmó que la incidencia quedó resuelta.',
  'El cambio quedó registrado en la base de datos y visible en el tablero.',
  'La interfaz es responsiva y funciona en móvil, tableta y escritorio.',
  'El Product Owner aceptó el incremento en la Sprint Review.'
].map((t, i) => ({ id: 'DOD-' + String(i + 1).padStart(2, '0'), order: i + 1, text: t, done: false }));

/* ---------- 3. Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const slug = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const clone = o => JSON.parse(JSON.stringify(o));
const lsGet = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const ICON = {
  prev:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  next:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 14h10l1-14"/><path d="M10 11v5M14 11v5"/></svg>'
};

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* Cuadro de confirmación propio (en lugar del confirm() del navegador) */
function confirmBox(title, text, okLabel = 'Eliminar') {
  const d = $('#dlg-confirm');
  $('#cf-title').textContent = title; $('#cf-text').textContent = text;
  $('button[value="ok"]', d).textContent = okLabel;
  d.returnValue = '';
  return new Promise(res => {
    d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true });
    d.showModal();
  });
}

/* ---------- 4. Capa de datos: Firestore con respaldo local ---------- */
function createStore(col, seed) {
  const flagKey = 'hdp_seeded_' + col, localKey = 'hdp_local_' + col;
  const s = { col, items: [], mode: 'connecting', unsub: null };
  const ref = () => db.collection(col);
  const sorted = a => a.slice().sort((x, y) => (x.order || 0) - (y.order || 0));
  const saveLocal = () => lsSet(localKey, s.items);
  const fail = e => { console.warn(e); toast('No se pudo guardar en Firebase'); };

  s.local = reason => {
    if (s.unsub) { try { s.unsub(); } catch (e) {} s.unsub = null; }
    const first = s.mode !== 'local';
    s.items = lsGet(localKey, null) || clone(seed);
    s.mode = 'local';
    if (first) toast('Usando almacenamiento local: ' + reason);
    onDataChange();
  };

  s.connect = () => {
    if (!db) return s.local('Firebase no disponible');
    let settled = false;
    const timer = setTimeout(() => { if (!settled) s.local('sin respuesta de Firestore'); }, 9000);
    s.unsub = ref().orderBy('order').onSnapshot(snap => {
      if (snap.empty && snap.metadata.fromCache) return;     // esperar la respuesta real del servidor
      settled = true; clearTimeout(timer);
      if (snap.empty && !lsGet(flagKey, false)) {             // primera vez: cargar datos de ejemplo
        lsSet(flagKey, true);
        const b = db.batch(); seed.forEach(i => b.set(ref().doc(i.id), i));
        b.commit().catch(e => { console.warn(e); s.local('no se pudo inicializar la colección'); });
        return;
      }
      s.items = sorted(snap.docs.map(d => d.data()));
      s.mode = 'cloud';
      onDataChange();
    }, err => {
      clearTimeout(timer); console.warn('Error de Firestore:', err);
      s.local(err && err.code === 'permission-denied' ? 'permisos de Firestore denegados' : 'error de conexión');
    });
  };

  s.nextOrder = () => s.items.reduce((m, i) => Math.max(m, i.order || 0), 0) + 1;
  s.nextId = (prefix, pad) => {
    const n = s.items.map(i => parseInt(String(i.id).split('-')[1], 10)).filter(x => !isNaN(x));
    return prefix + '-' + String((n.length ? Math.max(...n) : 0) + 1).padStart(pad, '0');
  };
  s.add = item => {
    if (s.mode === 'cloud') ref().doc(item.id).set(item).catch(fail);
    else { s.items.push(item); saveLocal(); onDataChange(); }
  };
  s.remove = id => {
    if (s.mode === 'cloud') ref().doc(id).delete().catch(fail);
    else { s.items = s.items.filter(i => i.id !== id); saveLocal(); onDataChange(); }
  };
  s.patch = (id, fields) => {
    if (s.mode === 'cloud') ref().doc(id).update(fields).catch(fail);
    else { const it = s.items.find(i => i.id === id); if (it) Object.assign(it, fields); saveLocal(); onDataChange(); }
  };
  s.reset = () => {
    if (s.mode === 'cloud') {
      const b = db.batch();
      s.items.forEach(i => b.delete(ref().doc(i.id)));
      seed.forEach(i => b.set(ref().doc(i.id), i));
      lsSet(flagKey, true);
      return b.commit().catch(fail);
    }
    s.items = clone(seed); saveLocal(); onDataChange();
    return Promise.resolve();
  };
  return s;
}

const tickets = createStore('helpdesk_tickets', SEED_TICKETS);
const stories = createStore('helpdesk_backlog', SEED_STORIES);
const dod     = createStore('helpdesk_dod',     SEED_DOD);
const stores  = [tickets, stories, dod];

function updateConn() {
  const modes = stores.map(s => s.mode), el = $('#conn'), txt = $('#conn-text');
  if (modes.every(m => m === 'cloud'))      { el.className = 'conn cloud'; txt.textContent = 'Firebase · en línea'; }
  else if (modes.some(m => m === 'local'))  { el.className = 'conn local'; txt.textContent = 'Modo local'; }
  else                                      { el.className = 'conn';       txt.textContent = 'Conectando…'; }
}

function onDataChange() {
  updateConn(); renderBoard(); renderBacklog(); renderDod(); updateMetrics();
}

/* ---------- 5. Kanban ---------- */
let dragId = null;

function renderBoard() {
  const q = $('#search').value.trim().toLowerCase();
  const fp = $('#filter-prio').value;
  const board = $('#board'); board.innerHTML = '';

  COLUMNS.forEach((c, ci) => {
    const all = tickets.items.filter(t => t.status === c.id);
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
    col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); if (dragId) moveTicket(dragId, c.id); });
    board.appendChild(col);
  });
}

function ticketEl(t, ci) {
  const el = document.createElement('article');
  el.className = 'ticket'; el.draggable = true; el.dataset.id = t.id;
  el.innerHTML = `
    <div class="t-top"><span class="t-id">${esc(t.id)}</span><span class="prio ${slug(t.priority)}">${esc(t.priority)}</span></div>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.desc)}</p>
    <div class="t-tags"><span class="tag ${slug(t.tag)}">${esc(t.tag)}</span></div>
    <div class="t-foot">
      <div class="t-meta"><span class="pts">${esc(t.points)} pts</span><span class="who" title="${esc(t.reporter)}">${esc(t.reporter || '—')}</span></div>
      <div class="actions">
        <button class="ib" data-a="back" type="button" title="Mover a la columna anterior" aria-label="Mover a la columna anterior" ${ci === 0 ? 'disabled' : ''}>${ICON.prev}</button>
        <button class="ib" data-a="next" type="button" title="Mover a la columna siguiente" aria-label="Mover a la columna siguiente" ${ci === COLUMNS.length - 1 ? 'disabled' : ''}>${ICON.next}</button>
        <button class="ib del" data-a="del" type="button" title="Eliminar ticket" aria-label="Eliminar ticket">${ICON.trash}</button>
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
  $('[data-a="next"]', el).onclick = () => moveTicket(t.id, COLUMNS[ci + 1].id);
  $('[data-a="back"]', el).onclick = () => moveTicket(t.id, COLUMNS[ci - 1].id);
  $('[data-a="del"]', el).onclick = async () => {
    if (await confirmBox('Eliminar ticket', `Se eliminará ${t.id} · ${t.title}. Esta acción no se puede deshacer.`)) {
      tickets.remove(t.id); toast('Ticket eliminado');
    }
  };
  return el;
}

function moveTicket(id, status) {
  const t = tickets.items.find(x => x.id === id);
  if (!t || t.status === status) return;
  tickets.patch(id, { status });
  toast(`${id} → ${COLUMNS.find(c => c.id === status).name}`);
}

/* Nuevo ticket */
const dlgTicket = $('#dlg-ticket');
$('#btn-new').addEventListener('click', () => { $('#form-ticket').reset(); dlgTicket.showModal(); $('#t-title').focus(); });
$('#form-ticket').addEventListener('submit', () => {
  const ticket = {
    id: tickets.nextId('HD', 3), order: tickets.nextOrder(), status: 'backlog',
    title: $('#t-title').value.trim(),
    desc: $('#t-desc').value.trim() || 'Sin descripción.',
    priority: $('#t-prio').value, points: parseInt($('#t-pts').value, 10),
    tag: $('#t-tag').value, reporter: $('#t-user').value.trim() || 'Usuario'
  };
  tickets.add(ticket);
  toast(`Ticket ${ticket.id} creado en Pendientes`);
});
$('#search').addEventListener('input', renderBoard);
$('#filter-prio').addEventListener('change', renderBoard);

/* ---------- 6. Métricas y burndown ---------- */
function updateMetrics() {
  const list = tickets.items, total = list.length;
  const done = list.filter(t => t.status === 'done').length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('#sum').textContent = `${total} tickets · ${done} resueltos (${pct}%)`;

  const totPts = list.reduce((a, t) => a + (Number(t.points) || 0), 0);
  const donePts = list.filter(t => t.status === 'done').reduce((a, t) => a + (Number(t.points) || 0), 0);
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
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#e4dccd"/><text x="${L - 8}" y="${yy + 4}" font-size="11" fill="#7a7f92" text-anchor="end">${Math.round(v)}</text>`;
  }
  for (let i = 0; i <= 10; i++) g += `<text x="${x(i)}" y="${H - 12}" font-size="11" fill="#7a7f92" text-anchor="middle">${i === 0 ? 'Inicio' : 'D' + i}</text>`;
  g += `<line x1="${x(0)}" y1="${y(total)}" x2="${x(10)}" y2="${y(0)}" stroke="#a79f8e" stroke-width="2" stroke-dasharray="6 5"/>`;
  g += `<line x1="${x(0)}" y1="${y(total)}" x2="${x(day)}" y2="${y(remaining)}" stroke="#5a4bc7" stroke-width="3" stroke-linecap="round"/>`;
  g += `<circle cx="${x(0)}" cy="${y(total)}" r="4" fill="#5a4bc7"/><circle cx="${x(day)}" cy="${y(remaining)}" r="6" fill="#fffdf9" stroke="#5a4bc7" stroke-width="3"/>`;
  g += `<text x="${Math.min(x(day) + 10, W - 80)}" y="${y(remaining) - 12}" font-size="12" font-weight="700" fill="#4638ab">${remaining} pts</text>`;
  $('#burndown').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico burndown del Sprint">${g}</svg>`;
}

/* ---------- 7. Scrum: pestañas ---------- */
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
  document.querySelectorAll('.tabpanel').forEach(p => p.classList.toggle('active', p.id === 'p-' + btn.dataset.tab));
}));

/* ---------- 8. Product Backlog (agregar / eliminar) ---------- */
function renderBacklog() {
  const body = $('#backlog-body');
  if (!stories.items.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="6">El backlog está vacío. Agrega una historia con el botón "Nueva historia".</td></tr>';
    return;
  }
  body.innerHTML = stories.items.map(r => {
    const cls = r.prio === 'Must' ? 'b-must' : r.prio === 'Should' ? 'b-should' : 'b-could';
    return `<tr>
      <td class="id">${esc(r.id)}</td><td>${esc(r.story)}</td>
      <td><span class="badge ${cls}">${esc(r.prio)}</span></td><td>${esc(r.points)}</td><td>${esc(r.sprint)}</td>
      <td class="no-print"><button class="ib del" type="button" data-id="${esc(r.id)}" title="Eliminar historia" aria-label="Eliminar historia ${esc(r.id)}">${ICON.trash}</button></td>
    </tr>`;
  }).join('');
  body.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', async () => {
    const id = b.dataset.id;
    if (await confirmBox('Eliminar historia', `Se eliminará la historia ${id} del Product Backlog.`)) { stories.remove(id); toast('Historia eliminada'); }
  }));
}

const dlgStory = $('#dlg-story');
$('#btn-new-story').addEventListener('click', () => { $('#form-story').reset(); dlgStory.showModal(); $('#s-text').focus(); });
$('#form-story').addEventListener('submit', () => {
  const st = {
    id: stories.nextId('HU', 2), order: stories.nextOrder(),
    story: $('#s-text').value.trim(), prio: $('#s-prio').value,
    points: parseInt($('#s-pts').value, 10), sprint: $('#s-sprint').value
  };
  stories.add(st); toast(`Historia ${st.id} agregada`);
});

/* ---------- 9. Definición de Hecho (agregar / eliminar / marcar) ---------- */
function renderDod() {
  const box = $('#dod-list'); box.innerHTML = '';
  if (!dod.items.length) box.innerHTML = '<div class="empty">Aún no hay criterios. Agrega el primero abajo.</div>';
  dod.items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'check' + (it.done ? ' done' : '');
    row.innerHTML = `<label class="chk"><input type="checkbox" ${it.done ? 'checked' : ''}><span>${esc(it.text)}</span></label>
      <button class="ib del no-print" type="button" title="Eliminar criterio" aria-label="Eliminar criterio">${ICON.trash}</button>`;
    $('input', row).addEventListener('change', e => dod.patch(it.id, { done: e.target.checked }));
    $('.del', row).addEventListener('click', async () => {
      if (await confirmBox('Eliminar criterio', 'Se quitará este criterio de la Definición de Hecho.')) { dod.remove(it.id); toast('Criterio eliminado'); }
    });
    box.appendChild(row);
  });
  const n = dod.items.filter(i => i.done).length, tot = dod.items.length;
  $('#dod-bar').style.width = (tot ? n / tot * 100 : 0) + '%';
  $('#dod-txt').textContent = tot ? `${n} de ${tot} criterios verificados` : '';
}
$('#dod-form').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#dod-new').value.trim(); if (!text) return;
  dod.add({ id: dod.nextId('DOD', 2), order: dod.nextOrder(), text, done: false });
  $('#dod-new').value = ''; toast('Criterio agregado');
});

/* ---------- 10. Diálogos: botón Cancelar ---------- */
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

/* ---------- 11. Restablecer datos de ejemplo ---------- */
$('#btn-reset').addEventListener('click', async () => {
  if (!(await confirmBox('Restablecer datos', 'Se restaurarán los tickets, historias y criterios de ejemplo, y se perderán los cambios que hiciste.', 'Restablecer'))) return;
  await Promise.all(stores.map(s => s.reset()));
  toast('Datos restablecidos');
});

/* ---------- 12. Acceso y bienvenida ---------- */
const getAuth = () => { try { return sessionStorage.getItem('hdp_auth') === '1'; } catch (e) { return false; } };
const setAuth = v => { try { v ? sessionStorage.setItem('hdp_auth', '1') : sessionStorage.removeItem('hdp_auth'); } catch (e) {} };
function setView(v) { document.body.dataset.view = v; window.scrollTo(0, 0); }

(function greeting() {
  const h = new Date().getHours();
  $('#greet').textContent = (h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches') + ', José Pablo';
})();
$('#btn-login').addEventListener('click', () => { setAuth(true); setView('app'); });
$('#btn-logout').addEventListener('click', () => { setAuth(false); setView('login'); });

/* ---------- 13. Exportar a PDF ---------- */
const fmtDate = () => new Date().toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
window.addEventListener('beforeprint', () => { $('#print-date').textContent = fmtDate(); });
$('#btn-pdf').addEventListener('click', () => {
  $('#print-date').textContent = fmtDate();
  toast('En el diálogo de impresión elige "Guardar como PDF"');
  setTimeout(() => window.print(), 400);
});

/* ---------- 14. Inicio ---------- */
setView(getAuth() ? 'app' : 'login');
updateConn();
stores.forEach(s => s.connect());
