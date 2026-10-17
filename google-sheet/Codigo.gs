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

// La web llama aquí para leer los libros.
function doGet() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const [cabecera, ...filas] = hoja.getDataRange().getValues();
  const indice = {};
  Object.entries(CAMPOS).forEach(([campo, nombre]) => {
    indice[campo] = cabecera.indexOf(nombre);
  });

  const libros = filas
    .filter((fila) => fila[indice.titulo] || fila[indice.isbn])
    .map((fila) => {
      const libro = {};
      Object.keys(CAMPOS).forEach((campo) => {
        if (PRIVADOS.includes(campo) || indice[campo] < 0) return;
        const valor = fila[indice[campo]];
        libro[campo] = valor instanceof Date ? valor.toISOString() : valor;
      });
      return libro;
    });

  return ContentService
    .createTextOutput(JSON.stringify({ libros }))
    .setMimeType(ContentService.MimeType.JSON);
}
