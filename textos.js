// Textos de la web. Cada estética puede tener su propio textos.js.
// Los pares [titular, explicación]: el titular lleva el tono; la explicación dice qué hacer, sin ambigüedad.
const TEXTOS = {
  tituloPre: 'La biblioteca de',
  cifra: (total, deseos) => `${total} ${total === 1 ? 'libro' : 'libros'}`
    + (deseos ? ` · ${deseos} en su lista de deseos` : '') + '.',
  resumen: () => 'Antes de regalar, busca.',
  cotillea: (peque) => `Cotillea ${peque ? `la biblioteca de ${peque}` : 'su biblioteca'}`,
  ocultar: 'Ocultar',
  estados: { 'En casa': 'En casa', 'Reservado': 'Reservado', 'Lista de deseos': 'Lista de deseos' },
  secciones: { 'En casa': 'En casa', 'Reservado': 'Reservados', 'Lista de deseos': 'Lista de deseos', otros: 'Otros' },
  filtrar: 'Filtrar la biblioteca',
  todos: 'Todos',
  volver: '← Ver toda la biblioteca',
  vacia: ['La biblioteca está vacía.', 'Busca un libro arriba y apúntalo.'],

  noLoTiene: ['Aún no lo tiene.', 'Podría ser el siguiente.'],
  varios: (n) => [`${n} coincidencias.`, 'Cada una con su estado. Míralas antes de decidir.'],
  noEsNinguno: '¿No es ninguno de estos? Apúntalo',
  enCasa: ['Ya es suyo.', 'Este ya lo lee. Busca otro.'],
  reservado: ['Alguien se te ha adelantado.', 'Ya está reservado. Busca otro.'],
  deseo: ['Lo está deseando.', 'Está en su lista de deseos. Gran elección.'],
  desconocido: ['No sabemos qué libro es.', 'Busca por el título para asegurarte. Si no está, apúntalo.'],

  botonRegalo: 'Se lo voy a regalar',
  botonEnCasa: 'Ya está en casa',
  botonReservar: 'Se lo regalo yo',
  botonEditar: 'Editar',
  formAlta: ['Apúntalo.', 'Así nadie más lo comprará.'],
  formReserva: (titulo) => ['Se lo regalas tú.', `«${titulo}» dejará de salir como deseo para que nadie más lo compre.`],
  apuntadoReservado: ['Apuntado.', 'Ya sale como reservado. Nadie más lo comprará.'],
  apuntadoEnCasa: ['Apuntado.', 'Uno más en su biblioteca.'],
  formEditar: ['Editar.', 'Corrige los datos o cambia el estado.'],
  editado: ['Actualizado.', 'Gracias por mantenerla al día.'],

  accesoComprobando: 'Comprobando…',
  accesoError: 'Esa no es. Pregúntala en casa.',
  accesoCambiada: 'La contraseña ha cambiado. Escribe la nueva.',
  accesoSinConexion: 'No hay conexión. Inténtalo de nuevo.',

  error: ['Vaya.', 'Algo no ha cargado.', 'Recarga la página y lo intentamos de nuevo.'],
};
