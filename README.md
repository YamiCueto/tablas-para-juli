# tablas-para-juli 🎓

> Nació del amor de un papá que quería ayudar a su hija Julieta a aprender las tablas de multiplicar.

Visualización interactiva del 2 al 9 con conexiones cruzadas entre resultados y narración por voz en español.

## ¿Qué hace?

- Muestra las **tablas de multiplicar del 2 al 9** lado a lado con un color único por tabla.
- Al pasar el cursor sobre una fila, **resalta automáticamente** todas las filas de otras tablas que comparten el mismo resultado (ej: 2×3=6 ↔ 3×2=6).
- Dibuja **líneas de Bézier curvas** con efecto neón en canvas conectando los resultados cruzados.
- **Narra la operación en voz alta** en español usando la Web Speech API (sin librerías externas).

## Tecnologías

- HTML5 semántico
- CSS3 (variables, transiciones, gradientes)
- JavaScript vanilla (Canvas API + Web Speech API)

## Uso

Abre `index.html` en cualquier navegador moderno. No requiere instalación ni servidor.

> Para activar el audio, haz clic en la página antes de pasar el cursor (requisito de los navegadores modernos).

## Demo

Disponible en [GitHub Pages](https://yamicueto.github.io/tablas-para-juli/)

---

Hecho con ❤️ para Julieta.
