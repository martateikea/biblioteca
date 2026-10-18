# Prototipo biblioteca

Plantilla maestra y escaparate para charlas. Está conectada a un Sheet de demostración
(carpeta `00. Biblioteca_plantilla`): lo que se apunta desde la web aparece en ese Sheet.
Para reiniciar la demo, borra las filas de libros y ejecuta `importarEjemplo` (`google-sheet/Importar.gs`).
Si `urlDatos` de `config.js` se deja vacía, funciona en modo ejemplo con `datos-ejemplo.js` y no guarda nada.

- Estética minimalista: https://martateikea.github.io/biblioteca/
- Estética bebé: https://martateikea.github.io/biblioteca/bebe/

## Estructura

- `app.js` y `estilos.css`: el funcionamiento y la disposición, comunes a las dos estéticas.
- `index.html`, `tema.css`, `textos.js`: estética minimalista.
- `bebe/index.html`, `bebe/tema.css`, `bebe/textos.js`: estética bebé.
- `config.js`: nombre, peque y URL del Sheet (vacía = modo ejemplo).
- `datos-ejemplo.js`: la biblioteca de ejemplo (solo se usa sin Sheet).
- `google-sheet/Importar.gs`: carga esos mismos libros en el Sheet de demostración.
- `google-sheet/Codigo.gs`: el script que va pegado en el Apps Script de cada Sheet.

## Bibliotecas creadas a partir de esta plantilla

Cada una es un proyecto independiente, con su repositorio, su web y su Sheet:

- Celia: https://martateikea.github.io/biblioteca-celia/ (bebé, rosa)
- Emilia: https://martateikea.github.io/biblioteca-emilia/ (bebé, lila con lazo)

Las mejoras de la plantilla no llegan solas a las bibliotecas ya creadas: hay que llevarlas a cada una.

## Crear una biblioteca nueva

1. GitHub: crea un repositorio **vacío** (sin plantilla ni README), por ejemplo `biblioteca-jorge`.
2. Google: en la cuenta de proyectos, haz una copia del Sheet de otra biblioteca, borra sus libros
   (deja las cabeceras) y publícalo en *Implementar → Nueva implementación → Aplicación web*
   (Ejecutar como: Yo · Acceso: Cualquier usuario). Copia la URL que acaba en `/exec`.
3. Copia en el repositorio la estética elegida a la raíz, con `config.js` apuntando a esa URL.
4. GitHub: *Settings → Pages → Branch: main, / (root) → Save*.

## Actualizar el script de una biblioteca ya creada

*Implementar → Gestionar implementaciones → lápiz → Versión: Nueva versión → Implementar.*
Nunca "Nueva implementación": cambiaría la URL y la web dejaría de funcionar.
