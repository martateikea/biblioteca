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
    ? `<img class="portada" src="${escapar(libro.portada)}" alt="" loading="lazy">`
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

function pintar() {
  const consulta = $('consulta').value.trim();
  const encontrados = consulta ? libros.filter((l) => coincide(l, consulta)).sort(ordenar) : [];
  const visibles = consulta ? encontrados : (cotilleando ? [...libros].sort(ordenar) : []);

  $('veredicto').hidden = !consulta;
  $('veredicto').innerHTML = consulta ? veredicto(encontrados) : '';
  $('cotillea').hidden = Boolean(consulta) || !libros.length;
  $('cotillea').setAttribute('aria-expanded', cotilleando);
  $('cotillea').textContent = cotilleando ? 'Ocultar' : `Cotillea ${CONFIG.peque ? `la biblioteca de ${CONFIG.peque}` : 'su biblioteca'}`;
  $('resultados').innerHTML = visibles.map(tarjeta).join('');
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

$('consulta').addEventListener('input', pintar);
$('buscador').addEventListener('submit', (e) => {
  e.preventDefault();
  $('consulta').blur(); // cierra el teclado del móvil
});
$('cotillea').addEventListener('click', () => {
  cotilleando = !cotilleando;
  pintar();
});
$('camara').addEventListener('click', () => {
  alert('El escáner llega en la fase 3. De momento, escribe el título o el ISBN.');
});

cargar();
