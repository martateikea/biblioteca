// Lógica de la web: cargar libros, buscar y pintar resultados.

const ORDEN_ESTADOS = ['En casa', 'Reservado', 'Lista de deseos'];
const PALABRAS_VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'a']);

let libros = [];

const $ = (id) => document.getElementById(id);

// "¿A qué sabe la Luna?" -> ["que", "sabe", "luna"]
function palabras(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((p) => p && !PALABRAS_VACIAS.has(p));
}

const soloDigitos = (texto) => String(texto ?? '').replace(/[^0-9xX]/g, '');

function coincide(libro, consulta) {
  const isbn = soloDigitos(consulta);
  if (isbn.length >= 4 && isbn.length === consulta.replace(/[\s-]/g, '').length) {
    return soloDigitos(libro.isbn).includes(isbn);
  }
  const buscadas = palabras(consulta);
  const delLibro = palabras(`${libro.titulo} ${libro.autor}`);
  return buscadas.every((b) => delLibro.some((p) => p.startsWith(b)));
}

function ordenar(a, b) {
  const porEstado = ORDEN_ESTADOS.indexOf(a.estado) - ORDEN_ESTADOS.indexOf(b.estado);
  return porEstado || String(a.titulo).localeCompare(String(b.titulo), 'es');
}

const escapar = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const claseEstado = (estado) => palabras(estado).join('-') || 'sin-estado';

function tarjeta(libro) {
  const portada = /^https?:\/\//.test(libro.portada)
    ? `<img class="portada" src="${escapar(libro.portada)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
    : `<div class="portada">${escapar(String(libro.titulo).charAt(0).toUpperCase())}</div>`;
  return `
    <li class="libro">
      ${portada}
      <div class="datos">
        <h2>${escapar(libro.titulo)}</h2>
        ${libro.autor ? `<p>${escapar(libro.autor)}</p>` : ''}
        ${libro.nota ? `<p>${escapar(libro.nota)}</p>` : ''}
        ${libro.estado ? `<span class="estado ${claseEstado(libro.estado)}">${escapar(libro.estado)}</span>` : ''}
      </div>
    </li>`;
}

// La respuesta directa a "¿lo tiene?", encima de la lista.
// Tono: titular corto y con intención; la segunda línea dice qué hacer, sin ambigüedad.
function veredicto(encontrados) {
  if (!encontrados.length) {
    return 'Aún no lo tiene.<small>Podría ser el siguiente.</small>';
  }
  if (encontrados.length > 1) {
    return `${encontrados.length} coincidencias.<small>Cada una con su estado. Míralas antes de decidir.</small>`;
  }
  const { estado } = encontrados[0];
  if (estado === 'En casa') return 'Ya es suyo.<small>Este ya lo lee. Busca otro.</small>';
  if (estado === 'Reservado') return 'Alguien se te ha adelantado.<small>Ya está reservado. Busca otro.</small>';
  return 'Lo está deseando.<small>Está en su lista de deseos. Gran elección.</small>';
}

let cotilleando = false;

// `forzados`: resultados ya calculados (p. ej. tras escanear); si no, se busca lo escrito.
function pintar(forzados) {
  const consulta = $('consulta').value.trim();
  const encontrados = (forzados ?? (consulta ? libros.filter((l) => coincide(l, consulta)) : [])).sort(ordenar);
  const visibles = consulta ? encontrados : (cotilleando ? [...libros].sort(ordenar) : []);

  $('veredicto').hidden = !consulta;
  $('veredicto').innerHTML = consulta ? veredicto(encontrados) : '';
  $('cotillea').hidden = Boolean(consulta) || !libros.length;
  $('cotillea').setAttribute('aria-expanded', cotilleando);
  $('cotillea').textContent = cotilleando ? 'Ocultar' : `Cotillea ${CONFIG.peque ? `la biblioteca de ${CONFIG.peque}` : 'su biblioteca'}`;
  $('resultados').innerHTML = visibles.map(tarjeta).join('');
}

// --- ISBN: buscar por código y, si no está, por el título que dice Google Books ---

const esIsbn = (texto) => /^97[89]\d{10}$/.test(texto);

async function fichaPorIsbn(isbn) {
  try {
    const respuesta = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const info = (await respuesta.json()).items?.[0]?.volumeInfo;
    if (!info) return null;
    return {
      titulo: info.title,
      autor: (info.authors ?? []).join(', '),
      portada: (info.imageLinks?.thumbnail ?? '').replace('http:', 'https:'),
    };
  } catch (error) {
    return null;
  }
}

// "Pollo Pepe" y "El pollo Pepe" son el mismo libro: las palabras del más corto están en el otro.
function mismoTitulo(a, b) {
  const pa = palabras(a);
  const pb = palabras(b);
  if (!pa.length || !pb.length) return false;
  const [corto, largo] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  return corto.every((p) => largo.includes(p));
}

function mostrarEscaneado(ficha, isbn) {
  $('escaneado').hidden = false;
  $('escaneado').innerHTML = ficha
    ? `${ficha.portada ? `<img class="portada" src="${escapar(ficha.portada)}" alt="" onerror="this.remove()">` : ''}
       <div>Has escaneado<strong>${escapar(ficha.titulo)}</strong>${escapar(ficha.autor)}</div>`
    : `<div>Has escaneado<strong>ISBN ${escapar(isbn)}</strong>No hemos encontrado su título.</div>`;
}

async function buscarIsbn(isbn) {
  $('consulta').value = isbn;
  const porIsbn = libros.filter((l) => soloDigitos(l.isbn) === isbn);
  if (porIsbn.length) {
    $('escaneado').hidden = true;
    pintar(porIsbn);
    return;
  }
  $('veredicto').hidden = false;
  $('veredicto').innerHTML = 'Buscando…';
  const ficha = await fichaPorIsbn(isbn);
  if ($('consulta').value !== isbn) return; // ha escrito otra cosa mientras tanto
  mostrarEscaneado(ficha, isbn);
  pintar(ficha ? libros.filter((l) => mismoTitulo(l.titulo, ficha.titulo)) : []);
  if (!ficha) {
    // Sin título no podemos asegurar que no lo tenga: puede estar en el Sheet sin ISBN.
    $('veredicto').innerHTML = 'No sabemos qué libro es.<small>Busca por el título para asegurarte.</small>';
  }
}

// --- Escáner con la cámara (la librería se descarga solo al usarlo) ---

const LIBRERIA_ESCANER = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
let lector = null;
let leido = false;

function cargarScript(src) {
  return new Promise((resolver, fallar) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolver;
    script.onerror = fallar;
    document.head.append(script);
  });
}

async function abrirEscaner() {
  $('escaner').hidden = false;
  $('escaner-aviso').textContent = 'Abriendo la cámara…';
  leido = false;
  try {
    if (!window.Html5Qrcode) await cargarScript(LIBRERIA_ESCANER);
    lector = new Html5Qrcode('lector', {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
    await lector.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 120 } }, alLeer, () => {});
    $('escaner-aviso').textContent = '';
  } catch (error) {
    $('escaner-aviso').textContent = 'No hemos podido abrir la cámara. Revisa el permiso del navegador o escribe el ISBN.';
  }
}

async function cerrarEscaner() {
  if (lector?.isScanning) await lector.stop();
  lector = null;
  $('lector').innerHTML = '';
  $('escaner').hidden = true;
}

async function alLeer(codigo) {
  if (leido || !esIsbn(codigo)) return; // ignora lecturas repetidas y códigos que no son de libro
  leido = true;
  await cerrarEscaner();
  buscarIsbn(codigo);
}

async function cargar() {
  document.title = CONFIG.nombre;
  try {
    if (CONFIG.urlDatos) {
      const respuesta = await fetch(CONFIG.urlDatos);
      libros = (await respuesta.json()).libros;
    } else {
      libros = DATOS_EJEMPLO;
    }
    const enCasa = libros.filter((l) => l.estado === 'En casa').length;
    const de = CONFIG.peque ? ` de ${CONFIG.peque}` : '';
    $('cifra').textContent = `${enCasa} ${enCasa === 1 ? 'libro' : 'libros'}${de}.`;
    $('resumen').textContent = `Antes de regalar, busca.${CONFIG.urlDatos ? '' : ' (Datos de ejemplo)'}`;
  } catch (error) {
    $('cifra').textContent = 'Vaya.';
    $('lema').textContent = 'Algo no ha cargado.';
    $('resumen').textContent = 'Recarga la página y lo intentamos de nuevo.';
  }
  pintar();
}

$('consulta').addEventListener('input', () => {
  $('escaneado').hidden = true;
  const isbn = soloDigitos($('consulta').value);
  if (esIsbn(isbn)) buscarIsbn(isbn);
  else pintar();
});
$('buscador').addEventListener('submit', (e) => {
  e.preventDefault();
  $('consulta').blur(); // cierra el teclado del móvil
});
$('cotillea').addEventListener('click', () => {
  cotilleando = !cotilleando;
  pintar();
});
$('camara').addEventListener('click', abrirEscaner);
$('escaner-cerrar').addEventListener('click', cerrarEscaner);

cargar();
