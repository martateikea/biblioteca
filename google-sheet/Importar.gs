// Carga en el Sheet de demostración los mismos libros que datos-ejemplo.js, para las charlas.
// Se pega como archivo aparte en su Apps Script (+ > Secuencia de comandos > «Importar»).
// 1. Ejecuta importarEjemplo: añade los libros que aún no estén en la hoja (se puede repetir).
// 2. Ejecuta buscarPortadas: completa portada y autor desde Google Books.
// Para reiniciar la demo tras una charla: borra las filas de libros y vuelve a ejecutar importarEjemplo.

const LIBROS_EJEMPLO = [ // [ISBN, Título, Autor, Estado, Nota]
  ["9788484645641", "¿A qué sabe la luna?", "Michael Grejniec", "En casa", ""],
  ["9788417074104", "Adivina cuánto te quiero", "Sam McBratney / Anita Jeram", "En casa", ""],
  ["9788434856813", "El pollo Pepe", "Nick Denchfield / Ant Parker", "En casa", ""],
  ["9788496629684", "La pequeña oruga glotona", "Eric Carle", "En casa", ""],
  ["9788492750368", "Un libro", "Hervé Tullet", "En casa", ""],
  ["9788408128359", "Osito Tito. Aventura pirata", "Benji Davies", "En casa", ""],
  ["9788493375973", "Luna", "Antonio Rubio / Óscar Villán", "En casa", ""],
  ["9788492608348", "Pequeño Azul y Pequeño Amarillo", "Leo Lionni", "Reservado", ""],
  ["9788484645658", "El pequeño conejo blanco", "Xosé Ballesteros / Óscar Villán", "Reservado", ""],
  ["9788493987749", "El monstruo de colores", "Anna Llenas", "Lista de deseos", "Lo leen en la guarde"],
  ["9788448823283", "Elmer", "David McKee", "Lista de deseos", ""],
  ["9788479015619", "La vaca que puso un huevo", "Andy Cutbill / Russell Ayto", "Lista de deseos", ""]
];

function importarEjemplo() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const [cabecera, ...filas] = hoja.getDataRange().getValues();
  const col = (campo) => cabecera.indexOf(CAMPOS[campo]);
  if (col('titulo') < 0 || col('estado') < 0) throw new Error('No encuentro las columnas Título y Estado en la hoja Libros.');

  // Ya en la hoja: por ISBN o, si no tiene, por título.
  const isbns = new Set(filas.map((fila) => soloDigitos(fila[col('isbn')])).filter(Boolean));
  const titulos = new Set(filas.map((fila) => String(fila[col('titulo')]).trim().toLowerCase()).filter(Boolean));
  const nuevos = LIBROS_EJEMPLO.filter(([isbn, titulo]) => (isbn
    ? !isbns.has(isbn)
    : !titulos.has(titulo.trim().toLowerCase())));
  if (!nuevos.length) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Todos los libros de ejemplo ya estaban en la hoja.', 'Importar');
    return;
  }

  const ultima = filas.reduce((u, fila, i) => (fila[col('titulo')] || fila[col('isbn')] ? i : u), -1);
  const primeraFila = ultima + 3; // +1 siguiente, +1 cabecera, +1 porque el Sheet empieza en 1
  const hoy = new Date();
  const valores = nuevos.map(([isbn, titulo, autor, estado, nota]) => cabecera.map((nombre) => ({
    [CAMPOS.isbn]: isbn,
    [CAMPOS.titulo]: titulo,
    [CAMPOS.autor]: autor,
    [CAMPOS.estado]: estado,
    [CAMPOS.nota]: nota,
    [CAMPOS.fecha]: hoy,
  })[nombre] ?? ''));

  if (col('isbn') >= 0) hoja.getRange(primeraFila, col('isbn') + 1, valores.length, 1).setNumberFormat('@');
  hoja.getRange(primeraFila, 1, valores.length, cabecera.length).setValues(valores);
  SpreadsheetApp.getActiveSpreadsheet().toast(`Añadidos ${valores.length} libros de ejemplo.`, 'Importar');
}

function buscarPortadas() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const [cabecera, ...filas] = hoja.getDataRange().getValues();
  const col = (campo) => cabecera.indexOf(CAMPOS[campo]);
  let portadas = 0;
  let autores = 0;
  let sinDatos = 0;

  for (let i = 0; i < filas.length; i++) {
    const isbn = soloDigitos(filas[i][col('isbn')]);
    if (!isbn || filas[i][col('portada')]) continue;
    const respuesta = UrlFetchApp.fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, { muteHttpExceptions: true });
    if (respuesta.getResponseCode() === 429) {
      // Google limita las consultas sin clave: lo que falte se completa ejecutándolo otra vez más tarde.
      SpreadsheetApp.getActiveSpreadsheet().toast(`Google pide una pausa. Llevamos ${portadas} portadas: vuelve a ejecutarlo en un rato.`, 'Portadas', 10);
      return;
    }
    const info = JSON.parse(respuesta.getContentText()).items?.[0]?.volumeInfo;
    const portada = (info?.imageLinks?.thumbnail ?? '').replace('http:', 'https:');
    if (portada) {
      hoja.getRange(i + 2, col('portada') + 1).setValue(portada);
      portadas++;
    } else {
      sinDatos++;
    }
    if (info?.authors?.length && !filas[i][col('autor')]) {
      hoja.getRange(i + 2, col('autor') + 1).setValue(info.authors.join(' / '));
      autores++;
    }
    Utilities.sleep(300);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Portadas: ${portadas}. Autores completados: ${autores}. Sin portada en Google: ${sinDatos} (la web probará con Open Library).`,
    'Portadas', 10);
}
