// Textos de la estética «bebé»: tiernos, pero siempre claros sobre qué hacer.
const TEXTOS = {
  cifra: (n, peque) => `${n} ${n === 1 ? 'cuento' : 'cuentos'}${peque ? ` de ${peque}` : ''}`,
  resumen: 'Antes de regalar, echa un vistazo a su estantería.',
  cotillea: (peque) => `Asómate a la estantería${peque ? ` de ${peque}` : ''}`,
  ocultar: 'Cerrar la estantería',
  estados: { 'En casa': 'En casita', 'Reservado': 'Regalo en camino', 'Lista de deseos': 'Lista de deseos ♡' },

  noLoTiene: ['¡Todavía no lo tiene!', 'Podría ser su próximo cuento favorito.'],
  varios: (n) => [`Hemos encontrado ${n} cuentos.`, 'Mira cómo está cada uno antes de decidir.'],
  noEsNinguno: '¿No es ninguno de estos? Apúntalo',
  enCasa: ['¡Este ya vive en casa!', 'Ya está en su estantería. Busca otro cuento.'],
  reservado: ['¡Uy! Alguien se te ha adelantado.', 'Ya hay quien se lo va a regalar. Busca otro cuento.'],
  deseo: ['¡Le haría muchísima ilusión!', 'Está en su lista de deseos. ¡Gran elección!'],
  desconocido: ['Mmm… no conocemos este cuento.', 'Búscalo por el título para asegurarte. Si no está, apúntalo.'],

  botonRegalo: 'Se lo voy a regalar',
  botonEnCasa: 'Ya vive en casa',
  botonReservar: 'Se lo regalo yo ♡',
  formAlta: ['¡Apúntalo!', 'Así nadie más se lo regalará.'],
  formReserva: (titulo) => ['¡Qué ilusión!', `«${titulo}» saldrá de su lista de deseos para que nadie más lo compre.`],
  apuntadoReservado: ['¡Hecho!', 'Ya es tu regalo. Nadie más lo comprará.'],
  apuntadoEnCasa: ['¡Bienvenido a casa!', 'Un cuento más en su estantería.'],

  error: ['¡Ups!', 'Los cuentos se han quedado dormidos.', 'Recarga la página y lo intentamos otra vez.'],
};
