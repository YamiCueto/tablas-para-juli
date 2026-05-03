# Tablas para Juli 🎓

> Nació del amor de un papá que quería ayudar a su hija Julieta a aprender las tablas de multiplicar.

[![Demo en vivo](https://img.shields.io/badge/Demo-GitHub%20Pages-b721ff?style=for-the-badge&logo=github)](https://yamicueto.github.io/tablas-para-juli/)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-ffd200?style=for-the-badge&logo=javascript&logoColor=black)
![Sin dependencias](https://img.shields.io/badge/dependencias-0-26de81?style=for-the-badge)

Visualización interactiva de las tablas del 2 al 9 con conexiones cruzadas (propiedad conmutativa), quiz adaptativo, narración por voz y **reconocimiento de voz en español** — sin instalar nada.

---

## Características

| Módulo | Descripción |
|---|---|
| 🎨 **Tablas visuales** | Tablas del 2 al 9 con color único por tabla, animación al entrar |
| 🔗 **Conexión conmutativa** | Líneas de Bézier en Canvas que unen pares (ej: 3×7 ↔ 7×3) |
| 🔊 **Voz automática** | Narra cada operación en español con `SpeechSynthesis` |
| 🧠 **Quiz interactivo** | 10 rondas aleatorias con feedback, estrellas por tabla y progreso persistente |
| 🎤 **Control por voz** | Botón flotante: di "cuánto es 7 por 8" y responde en voz alta |
| 📱 **Mobile first** | Scroll-snap, dots de navegación y soporte táctil completo |

---

## Arquitectura de la app

```mermaid
graph TD
    A[index.html] --> B[Splash Screen]
    B -->|click ¡Empezar!| C[App Principal]

    C --> D[Header]
    C --> E[Tablas de multiplicar]
    C --> F[Quiz Overlay]
    C --> G[Botón de Voz 🎤]

    D --> D1[Botón Mute 🔊/🔇]
    D --> D2[Botón Quiz 🧠]

    E --> E1[buildTables\ncrea 8 tablas × 10 filas]
    E1 --> E2[onEnter\nhover / touch en fila]
    E2 --> E3[Resalta fila activa\nis-source]
    E2 --> E4[Busca pareja conmutativa\ntabla A×B ↔ tabla B×A]
    E4 --> E5[drawLines\nCanvas Bézier neón]
    E2 --> E6[speak\nSpeechSynthesis es-ES]

    F --> F1[generateOptions\n4 alternativas cercanas]
    F1 --> F2[answerQuiz\nvalida respuesta]
    F2 --> F3[localStorage\ncorrect / total por tabla]
    F3 --> F4[renderTableStars\n☆☆☆ según porcentaje]

    G --> G1[SpeechRecognition\nes-ES]
    G1 --> G2[parseMultiplication\nregex palabras/dígitos]
    G2 --> G3[speak resultado\nSpeechSynthesis]
```

---

## Flujo del reconocimiento de voz

```mermaid
sequenceDiagram
    actor Juli
    participant Btn as Botón 🎤
    participant SR as SpeechRecognition
    participant Parser as parseMultiplication()
    participant TTS as SpeechSynthesis

    Juli->>Btn: Toca el botón
    Btn->>SR: recognition.start() [lang: es-ES]
    SR-->>Btn: onstart → animación pulso rojo

    Juli->>SR: "cuánto es siete por ocho"
    SR-->>Parser: transcript + hasta 5 alternativas
    Parser->>Parser: normaliza acentos\nbusca regex (X por Y)
    Parser-->>TTS: a=7, b=8, result=56
    TTS-->>Juli: "7 por 8 es igual a 56"
    Btn-->>Btn: muestra badge "7 × 8 = 56"
    SR-->>Btn: onend → detiene animación
```

---

## Sistema de estrellas del Quiz

```mermaid
flowchart LR
    N{n ≥ 3\nrespuestas?}
    N -- No --> S0[sin estrellas · ]
    N -- Sí --> P{porcentaje\ncorrectas}
    P -- ≥ 90% --> S3[★★★]
    P -- ≥ 60% --> S2[★★☆]
    P -- ≥ 30% --> S1[★☆☆]
    P -- < 30% --> S0b[☆☆☆]
```

Los resultados se guardan en `localStorage` por tabla (clave `quiz_t2` … `quiz_t9`) y persisten entre sesiones.

---

## Tecnologías

- **HTML5** semántico
- **CSS3** — variables, scroll-snap, Canvas, animaciones, `backdrop-filter`
- **JavaScript vanilla** — Canvas API · Web Speech API (Synthesis + Recognition)
- Sin frameworks · Sin dependencias · Compatible con GitHub Pages

---

## Estructura del proyecto

```
tablas-para-juli/
├── index.html      # Estructura y metadatos Open Graph / Twitter Card
├── styles.css      # Estilos mobile-first + responsive (600px / 1024px)
└── app.js          # Lógica completa: tablas, canvas, quiz, voz
```

---

## Cómo ejecutar

Abre `index.html` directamente en cualquier navegador moderno. No requiere servidor ni instalación.

> **Nota sobre el micrófono:** el reconocimiento de voz requiere HTTPS o `localhost`. En GitHub Pages funciona de fábrica.

---

## Demo

🌐 [yamicueto.github.io/tablas-para-juli](https://yamicueto.github.io/tablas-para-juli/)

---

Hecho con ❤️ para Julieta.
