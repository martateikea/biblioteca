// Prototipo biblioteca — puente entre el Google Sheet y la web.
// Se pega en Extensiones > Apps Script del Sheet.

const HOJA = 'Libros';

// Columna del Sheet -> nombre que usa la web.
// La web busca las columnas por su cabecera, así que se pueden reordenar sin romper nada.
const CAMPOS = {
  isbn: 'ISBN',
  titulo: 'Título',
  autor: 'Autor',
  portada: 'Portada',
  estado: 'Estado',
  nota: 'Nota',
  edad: 'Edad',
  favorito: 'Favorito',
  reservadoPor: 'Reservado por',
  fecha: 'Fecha alta',
};

// Columnas que nunca salen del Sheet (solo las ven los padres).
const PRIVADOS = ['reservadoPor'];

const ESTADOS = ['En casa', 'Reservado', 'Lista de deseos'];
// Estados que la familia puede poner desde la web. La lista de deseos es cosa de los padres.
const ESTADOS_FAMILIA = ['En casa', 'Reservado'];
const EDADES = ['0-1', '1-2', '2-3', '3-5', '5+'];

// Ejecutar UNA vez: crea la hoja, las cabeceras y los desplegables.
function configurar() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.getSheets()[0];
    hoja.setName(HOJA);
  }

  const cabeceras = Object.values(CAMPOS);
  hoja.getRange(1, 1, 1, cabeceras.length)
    .setValues([cabeceras])
    .setFontWeight('bold')
    .setBackground('#f1f1f1');
  hoja.setFrozenRows(1);

  const filas = hoja.getMaxRows() - 1;
  const columna = (campo) => hoja.getRange(2, cabeceras.indexOf(CAMPOS[campo]) + 1, filas, 1);
  const lista = (valores) => SpreadsheetApp.newDataValidation()
    .requireValueInList(valores, true)
    .setAllowInvalid(false)
    .build();

  columna('estado').setDataValidation(lista(ESTADOS));
  columna('edad').setDataValidation(lista(EDADES));
  columna('favorito').insertCheckboxes();
  columna('isbn').setNumberFormat('@'); // texto, para no perder ceros ni guiones
  columna('fecha').setNumberFormat('dd/mm/yyyy');

  hoja.getRange(1, 1, 1, cabeceras.length)
    .protect()
    .setDescription('Cabeceras: la web depende de estos nombres')
    .setWarningOnly(true);

  hoja.autoResizeColumns(1, cabeceras.length);
}

// --- Lectura: la web llama aquí para obtener los libros ---

function doGet() {
  const { filas, indice } = leerHoja();
  const libros = filas
    .filter((fila) => fila[indice.titulo] || fila[indice.isbn])
    .map((fila) => {
      const libro = {};
      Object.keys(CAMPOS).forEach((campo) => {
        if (indice[campo] >= 0) libro[campo] = fila[indice[campo]];
      });
      return publico(libro);
    });
  return responder({ libros });
}

// --- Escritura: dar de alta un libro o reservar uno de la lista de deseos ---

function doPost(e) {
  const bloqueo = LockService.getScriptLock(); // evita que dos personas reserven lo mismo a la vez
  bloqueo.waitLock(10000);
  try {
    const datos = JSON.parse(e.postData.contents);
    const libro = datos.accion === 'reservar' ? reservar(datos) : alta(datos);
    return responder({ ok: true, libro });
  } catch (error) {
    return responder({ ok: false, error: error.message });
  } finally {
    bloqueo.releaseLock();
  }
}

function alta(datos) {
  const { hoja, cabecera, filas, indice } = leerHoja();
  const titulo = texto(datos.titulo, 200);
  if (!titulo) throw new Error('Falta el título.');
  if (!ESTADOS_FAMILIA.includes(datos.estado)) throw new Error('Estado no válido.');

  const isbn = soloDigitos(datos.isbn).slice(0, 13);
  if (isbn && filas.some((fila) => soloDigitos(fila[indice.isbn]) === isbn)) {
    throw new Error('Ese libro ya está en la biblioteca.');
  }

  const libro = {
    isbn,
    titulo,
    autor: texto(datos.autor, 200),
    portada: /^https:\/\//.test(datos.portada) ? texto(datos.portada, 500) : '',
    estado: datos.estado,
    nota: '',
    edad: '',
    favorito: false,
    reservadoPor: datos.estado === 'Reservado' ? texto(datos.nombre, 60) : '',
    fecha: new Date(),
  };
  const campoDe = {};
  Object.entries(CAMPOS).forEach(([campo, nombre]) => { campoDe[nombre] = campo; });
  hoja.appendRow(cabecera.map((nombre) => libro[campoDe[nombre]] ?? ''));
  return publico(libro);
}

function reservar(datos) {
  const { hoja, filas, indice } = leerHoja();
  const isbn = soloDigitos(datos.isbn);
  const titulo = String(datos.titulo ?? '').trim().toLowerCase();
  const i = filas.findIndex((fila) => (isbn
    ? soloDigitos(fila[indice.isbn]) === isbn
    : String(fila[indice.titulo]).trim().toLowerCase() === titulo));

  if (i < 0) throw new Error('No encontramos ese libro.');
  if (filas[i][indice.estado] !== 'Lista de deseos') {
    throw new Error('Alguien se te ha adelantado: ya no está en la lista de deseos.');
  }
  const filaHoja = i + 2; // +1 por la cabecera, +1 porque el Sheet empieza en 1
  hoja.getRange(filaHoja, indice.estado + 1).setValue('Reservado');
  if (indice.reservadoPor >= 0) {
    hoja.getRange(filaHoja, indice.reservadoPor + 1).setValue(texto(datos.nombre, 60));
  }
  return { estado: 'Reservado' };
}

// --- Utilidades ---

function leerHoja() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const [cabecera, ...filas] = hoja.getDataRange().getValues();
  const indice = {};
  Object.entries(CAMPOS).forEach(([campo, nombre]) => {
    indice[campo] = cabecera.indexOf(nombre);
  });
  return { hoja, cabecera, filas, indice };
}

// Quita los campos privados y convierte las fechas a texto.
function publico(libro) {
  const resultado = {};
  Object.entries(libro).forEach(([campo, valor]) => {
    if (PRIVADOS.includes(campo)) return;
    resultado[campo] = valor instanceof Date ? valor.toISOString() : valor;
  });
  return resultado;
}

// Recorta el texto y evita que algo como "=..." se interprete como fórmula en el Sheet.
function texto(valor, maximo) {
  const limpio = String(valor ?? '').trim().slice(0, maximo);
  return /^[=+\-@]/.test(limpio) ? `'${limpio}` : limpio;
}

function soloDigitos(valor) {
  return String(valor ?? '').replace(/[^0-9Xx]/g, '');
}

function responder(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}
