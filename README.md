# LEYENDA — Modo Carrera Valorant

Juego de rol textual, inspirado en la mecánica de [leyendacs.com.ar](https://www.leyendacs.com.ar)
pero ambientado en Valorant. 100% HTML/CSS/JS puro — sin frameworks, sin build, sin instalar nada.

## Cómo abrirlo

**Opción rápida:** doble click en `index.html` y se abre en tu navegador.

**Opción recomendada en VSCode** (para que el `localStorage` de logros funcione mejor y evitar
restricciones del navegador con `file://`):
1. Abrí la carpeta `leyenda-valorant` en VSCode (`File > Open Folder`).
2. Instalá la extensión **Live Server** (Ritwick Dey) desde el marketplace.
3. Click derecho sobre `index.html` → **"Open with Live Server"**.
4. Se abre en `http://127.0.0.1:5500` y se recarga solo cada vez que guardás un cambio.

Alternativa sin extensión, desde la terminal integrada de VSCode:
```bash
python3 -m http.server 5500
# o
npx serve .
```
y entrás a `http://localhost:5500`.

## Estructura

```
leyenda-valorant/
├── index.html   # estructura de las 3 pantallas (intro, juego, final) + modales
├── style.css    # estética HUD táctico (paleta oscura, acentos rojo/cian)
└── game.js      # toda la lógica: datos, motor de turnos, tienda, logros, minijuego
```

Todo el juego vive en `game.js`, ordenado en bloques bien separados por comentarios:

- **`ROLES`** — 5 roles (Duelista, Iniciador, Controlador, Centinela, IGL/Flex), cada uno con
  bonus/penalidades iniciales de stats.
- **`GENDERS`** — las opciones de género de la creación de personaje. Cada una define un
  `circuit` (`"open"` o `"gc"`) que determina en qué árbol de torneos jugás.
- **`STAGES_OPEN`** / **`STAGES_GC`** — las 6 etapas de cada circuito (Iron → Champions), con el
  umbral de rating necesario para ascender en cada una. `STAGES_OPEN` es el circuito abierto
  (calendario VCT grande); `STAGES_GC` es Game Changers (mujeres y géneros marginados), como en la
  escena real, donde no hay equipos mixtos entre ambos circuitos.
- **`EVENTS`** — el pool de eventos de texto con 2 opciones cada uno. Cada evento tiene un rango
  `min`/`max` de etapa en el que puede aparecer.
- **`SHOP_ITEMS`** — ítems comprables con la plata que vas ganando.
- **`ACHIEVEMENTS`** — los 12 logros, cada uno con una función `check(state)` que evalúa el estado
  final de la carrera.

## Cómo modificar / agregar contenido

**Agregar un evento nuevo:** copiá un objeto de `EVENTS` y cambiale el `id` (único), el `tag`,
el rango de etapas `min`/`max`, el texto y las dos opciones con sus efectos (`fx`) sobre las stats
(`aim`, `gameSense`, `chemistry`, `popularity`, `mental`, `rating`, `money`).

**Agregar un rol:** agregá un objeto a `ROLES` con `id`, `name`, `tag`, `desc` y `bonus` (deltas
sobre las stats base de 50).

**Agregar un género/circuito:** un objeto en `GENDERS` con `id`, `label`, `circuit` (`"open"` o
`"gc"`, o uno nuevo si además creás un tercer árbol de `STAGES`) y `pronoun` (usado en el mensaje
inicial de la carrera).

**Cambiar la dificultad de ascenso:** ajustá los `threshold` en `STAGES` o los pesos de la fórmula
dentro de `triggerTournament()`.

**Agregar un logro:** un objeto en `ACHIEVEMENTS` con `id`, `name`, `desc` y una función `check`
que recibe el `state` final (mismas keys que ves en `freshState()`).

## Mecánica del juego

- Arrancás a los 16 años. Cada 2 turnos envejecés 1 año.
- Cada turno normal te muestra un evento con 2 decisiones que afectan tus stats.
- Cada 5 turnos hay un **torneo**: tu `rating`, `aim`, `gameSense` y `chemistry` se combinan con
  algo de azar contra el umbral de tu etapa actual para decidir si ascendés.
- Cada 4 turnos hay un **minijuego de reflejos** (clickear un blanco que aparece en una posición
  random): tu tiempo de reacción afecta tu `aim`.
- Podés gastar la plata que ganás en la **tienda** en cualquier momento.
- A partir de los 30 años podés **retirarte** cuando quieras. Si tu salud mental llega a 0, te
  retirás por burnout. Si llegás a los 35, te retirás por edad.
- Al terminar la carrera se evalúan los 12 logros contra tu estado final. Los logros se guardan en
  `localStorage` del navegador, así que se acumulan entre distintas partidas (podés borrarlos
  limpiando el localStorage del sitio).

## Ideas para seguir extendiendo

- Agregar más eventos por etapa para que se repitan menos.
- Sumar un sistema de "agente principal" (como un main de Valorant) que dé bonus/malus según el
  patch del momento.
- Guardar la partida en curso en `localStorage` para poder continuarla después de cerrar el
  navegador (hoy solo se persisten los logros).
- Sumar sonido/música con la Web Audio API.
