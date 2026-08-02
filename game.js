/* ============================================================
   LEYENDA — Modo Carrera Valorant
   Motor del juego. Sin dependencias externas.
   ============================================================ */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     DATOS
  --------------------------------------------------------- */

  const ROLES = [
    { id: "duelist",    name: "Duelista",    tag: "El que entra primero",
      desc: "El primero en entrar, el primero en morir. Reflejos altos, cabeza castigada.",
      bonus: { aim: 10, mental: -6 } },
    { id: "initiator",  name: "Iniciador",   tag: "El ojo del equipo",
      desc: "Revelás la info antes de que nadie se mueva. Buen radar, poca paciencia para el bardo del team.",
      bonus: { gameSense: 5, aim: 3, chemistry: -2 } },
    { id: "controller", name: "Controlador", tag: "El que traza el mapa",
      desc: "Pensás el mapa como un ajedrez. Genio táctico, cero don de gente en redes.",
      bonus: { gameSense: 8, popularity: -4 } },
    { id: "sentinel",   name: "Centinela",   tag: "El último muro",
      desc: "Cabeza fría, nervios de acero. No sos el que más frappea, pero el equipo no cae con vos atrás.",
      bonus: { mental: 8, aim: -6 } },
    { id: "igl",        name: "IGL / Flex",  tag: "El cerebro detrás de todo",
      desc: "Tu mira nunca fue la mejor, pero el equipo juega con tu cabeza puesta.",
      bonus: { gameSense: 10, aim: -8, chemistry: 4 } },
  ];

  const ARCHETYPES = [
    { id: "normal", name: "Normal", tag: "Uno más del montón",
      desc: "Arrancás como cualquier pibe o piba que labura para llegar. Stats parejas, sin atajos ni ventajas raras." ,
      bonus: {} },
    { id: "prodigy", name: "Prodigio", tag: "Talento crudo",
      desc: "Naciste con un don que la mayoría no tiene: mira y lectura de juego muy por encima del resto desde el día uno. El precio es la presión constante — todos esperan que seas la próxima gran cosa, y eso pesa.",
      bonus: { aim: 12, gameSense: 8, mental: -15 } },
  ];

  // Agentes disponibles como "main" según el rol elegido en la creación.
  const AGENTS = {
    duelist:    ["Jett", "Raze", "Reyna", "Phoenix", "Neon", "Yoru", "Iso", "Waylay"],
    initiator:  ["Sova", "Skye", "Breach", "KAY/O", "Fade", "Gekko", "Tejo"],
    controller: ["Omen", "Brimstone", "Viper", "Astra", "Harbor", "Clove", "Miks"],
    sentinel:   ["Killjoy", "Cypher", "Sage", "Chamber", "Deadlock", "Vyse", "Veto"],
    igl:        ["Omen", "Sova", "Killjoy", "Brimstone", "Astra", "Miks"],
  };

  const GENDERS = [
    { id: "masc",      label: "Masculino",           circuit: "open", pronoun: "amigos",
      flavor: "Entrás directo al circuito abierto: el calendario grande de VCT, el más saturado de competencia." },
    { id: "fem",       label: "Femenino",            circuit: "gc",   pronoun: "amigas",
      flavor: "Entrás al circuito Game Changers: menos plata en juego que en el abierto, pero una comunidad que se planta fuerte." },
    { id: "nb",        label: "No binarie",          circuit: "gc",   pronoun: "amigues",
      flavor: "Entrás al circuito Game Changers. Vas a tener que explicar tu identidad en cada nota de prensa, te guste o no." },
    { id: "transfem",  label: "Mujer trans",         circuit: "gc",   pronoun: "amigas",
      flavor: "Entrás al circuito Game Changers. Cada torneo grande, alguien en el chat te va a discutir si tenés derecho a estar ahí — jugás igual." },
    { id: "transmasc", label: "Hombre trans",        circuit: "open", pronoun: "amigos",
      flavor: "Entrás al circuito abierto, el calendario grande de VCT. Vas a tener que bancarte que algunos todavía no entiendan por qué estás ahí — jugás igual." },
    { id: "other",     label: "Prefiero no decirlo", circuit: "gc",   pronoun: "amigues",
      flavor: "Entrás al circuito Game Changers. No le debés explicaciones a nadie sobre quién sos." },
  ];

  // Circuito abierto (mixto en la práctica, es el que sigue el calendario VCT "grande")
  const STAGES_OPEN = [
    { name: "Ranked con los pibes",              badge: "IRON",      threshold: 38,  purse: 0 },
    { name: "Buscando equipo en Discord",         badge: "GOLD",      threshold: 52,  purse: 0 },
    { name: "Circuito amateur / Open Qualifiers", badge: "DIAMOND",   threshold: 66,  purse: 500 },
    { name: "Challengers regionales",             badge: "IMMORTAL",  threshold: 80,  purse: 5000 },
    { name: "VCT Internacional",                  badge: "RADIANT",   threshold: 92,  purse: 50000 },
    { name: "Clasificado a Champions",            badge: "CHAMPIONS", threshold: 999, purse: 500000 },
  ];

  // Circuito Game Changers (exclusivo para mujeres y géneros marginados, como en la escena real)
  const STAGES_GC = [
    { name: "Ranked con las pibas",                           badge: "IRON",      threshold: 38,  purse: 0 },
    { name: "Armando equipo para Game Changers",               badge: "GOLD",      threshold: 52,  purse: 0 },
    { name: "Game Changers Series (liga regional)",            badge: "DIAMOND",   threshold: 66,  purse: 300 },
    { name: "Game Changers Championship — clasificatorio",     badge: "IMMORTAL",  threshold: 80,  purse: 2000 },
    { name: "Game Changers Championship",                      badge: "RADIANT",   threshold: 92,  purse: 15000 },
    { name: "Clasificada a Game Changers Championship Global",  badge: "CHAMPIONS", threshold: 999, purse: 100000 },
  ];

  function stagesFor(circuit) { return circuit === "gc" ? STAGES_GC : STAGES_OPEN; }

  // Equipos reales de la escena (circuito abierto: VCT International Leagues 2026 /
  // circuito Game Changers: rosters de Game Changers Championship 2025 y ligas regionales).
  const TEAMS_OPEN = [
    "Sentinels", "100 Thieves", "Cloud9", "NRG", "Evil Geniuses", "LOUD", "MIBR", "FURIA",
    "Leviatán", "KRÜ Esports", "G2 Esports",
    "Fnatic", "Team Liquid", "Team Vitality", "Karmine Corp", "Team Heretics", "GIANTX",
    "NAVI", "FUT Esports", "BBL Esports", "KOI", "Gentle Mates",
    "DRX", "Gen.G Esports", "Paper Rex", "Global Esports", "Nongshim RedForce", "T1",
    "EDward Gaming", "Bilibili Gaming", "JD Gaming", "FunPlus Phoenix", "Titan Esports Club",
  ];
  const TEAMS_GC = [
    "Shopify Rebellion Gold", "Team Liquid Brazil", "MIBR GC", "KRÜ Blaze",
    "G2 Gozen", "Karmine Corp GC", "GIANTX GC", "Xipto Esports GC", "Ninetails", "Nova Esports GC",
  ];

  function teamsFor(circuit) { return circuit === "gc" ? TEAMS_GC : TEAMS_OPEN; }
  function pickTeamName(circuit) {
    const pool = teamsFor(circuit);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function pickDistinctTeams(circuit, n) {
    const pool = teamsFor(circuit).slice();
    const out = [];
    while (out.length < n && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  /* ---------------------------------------------------------
     ESCUDOS DE EQUIPO (generados, no son logos oficiales)
     No podemos descargar/reproducir los logos reales de las
     orgas (son marca registrada), así que cada equipo tiene un
     escudo propio generado a partir de su nombre: mismas
     iniciales e igual paleta siempre que aparece.
  --------------------------------------------------------- */

  const LOGO_PALETTES = [
    ["#ff4655", "#0f1923"], ["#00d4ff", "#0a1a2f"], ["#7c3aed", "#160a2e"],
    ["#f5c518", "#1a1400"], ["#22c55e", "#052e12"], ["#fb923c", "#2b1200"],
    ["#ec4899", "#2b0018"], ["#38bdf8", "#001b2b"], ["#a3e635", "#122b00"],
    ["#f43f5e", "#2b0010"], ["#818cf8", "#0a0a2b"], ["#2dd4bf", "#00201c"],
  ];

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function teamPalette(name) { return LOGO_PALETTES[hashStr(name) % LOGO_PALETTES.length]; }
  function teamInitials(name) {
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
    return words.slice(0, 3).map(w => (w.match(/[A-Za-z0-9]/) || [""])[0].toUpperCase()).join("");
  }
  function teamLogoSVG(name, size) {
    size = size || 34;
    const [c1, c2] = teamPalette(name);
    const initials = teamInitials(name);
    const fontSize = initials.length >= 3 ? 13 : 16;
    return `<svg class="team-logo" width="${size}" height="${size}" viewBox="0 0 48 56" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 2 L44 10 V28 C44 42 34 50 24 54 C14 50 4 42 4 28 V10 Z" fill="${c1}" stroke="${c2}" stroke-width="2"/>
      <path d="M24 6 L40 12.5 V27 C40 38.5 32 45.5 24 49 C16 45.5 8 38.5 8 27 V12.5 Z" fill="${c2}" opacity="0.55"/>
      <text x="24" y="31" text-anchor="middle" font-family="'Chakra Petch',sans-serif" font-weight="700" font-size="${fontSize}" fill="#fff">${initials}</text>
    </svg>`;
  }
  function teamLogoBadge(name, size) {
    return `<span class="team-logo-wrap">${teamLogoSVG(name, size)}</span>`;
  }

  // Niveles de oferta salarial de fichajes: 3 posiciones (la más grande / la
  // sólida / la under-dog), cada una con su propio trade-off de stats.
  const TEAM_OFFER_TIERS = {
    academy: [
      { salary: 40, money: 80, fx: { aim: 3, mental: -2 }, desc: "la academia más grande de la región, exigencia alta" },
      { salary: 55, money: 60, fx: { gameSense: 3, chemistry: 2 }, desc: "roster de desarrollo prometedor, ambiente parejo" },
      { salary: 30, money: 40, fx: { chemistry: 5, mental: 2 }, desc: "equipo chico pero con buena onda" },
    ],
    main: [
      { salary: 220, money: 400, fx: { popularity: 8, mental: -5 }, desc: "organización top, mucha presión y exposición" },
      { salary: 160, money: 250, fx: { gameSense: 4, chemistry: 2 }, desc: "roster sólido, ambición sin tanto circo mediático" },
      { salary: 110, money: 150, fx: { chemistry: 6, mental: 3 }, desc: "organización chica pero unida, te van a cuidar" },
    ],
  };

  function buildTeamOfferChoices(ev) {
    const picked = pickDistinctTeams(state.circuit, 3);
    const tiers = TEAM_OFFER_TIERS[ev.offerType];
    const choices = picked.map((team, i) => {
      const t = tiers[i];
      return {
        label: `Firmás con ${team}`,
        note: t.desc,
        team, salary: t.salary,
        fx: Object.assign({ money: t.money }, t.fx),
      };
    });
    choices.push({
      label: "Rechazás las tres ofertas, por ahora",
      note: "Seguís independiente.",
      fx: { mental: 3 },
    });
    return choices;
  }

  const EVENTS = [
    // --- Etapa 0-1: arrancando ---
    { id:"e1", tag:"VIDA PERSONAL", min:0, max:1, text:"Tus viejos te dicen que el Valorant te va a arruinar la vista y las notas. Insistís en jugar dos horas más antes de cenar.",
      choices:[
        {label:"Les hacés caso y apagás la PC", hint:"+🧠 mental, -📉 practica", fx:{mental:5,chemistry:-1,gameSense:1}},
        {label:"Decís 'ya voy' y seguís jugando", hint:"+🎯 aim, -🧠 mental", fx:{aim:4,mental:-3,chemistry:1}},
        {label:"Negociás media hora más y después apagás", hint:"punto medio", fx:{aim:2,mental:1,chemistry:1}},
      ]},
    { id:"e2", tag:"RANKED", min:0, max:1, text:"Un random del ranked te empieza a putear por el chat de voz porque 'no rotaste a tiempo'.",
      choices:[
        {label:"Le silenciás el mic y seguís tu juego", hint:"+😌 calma", fx:{mental:3,chemistry:-1}},
        {label:"Le contestás con la misma", hint:"+📢 popularidad, -🧠 mental", fx:{mental:-4,popularity:2}},
        {label:"Le explicás con calma por qué no rotaste", hint:"+🤝 química, +🧭 game sense", fx:{chemistry:3,gameSense:1}},
      ]},
    { id:"e3", tag:"PRÁCTICA", min:0, max:1, text:"Encontrás un canal que enseña line-ups y uso de utility. ¿Le metés horas al rango de tiro?",
      choices:[
        {label:"Practicás line-ups todos los días", hint:"+🎯 aim, +🧭 game sense, -🧠 mental", fx:{aim:3,gameSense:5,mental:-2}},
        {label:"Preferís jugar partidas normales", hint:"+🤝 química", fx:{chemistry:3,aim:1}},
        {label:"Mezclás un poco de cada cosa", hint:"un poco de todo", fx:{aim:2,gameSense:2,chemistry:1,mental:-1}},
      ]},
    { id:"e4", tag:"EQUIPO", min:0, max:1, text:"Tus amigos arman un equipo para el torneo de la escuela y te ofrecen el puesto de IGL.",
      choices:[
        {label:"Aceptás y armás las estrategias", hint:"+🧭 game sense, +🤝 química", fx:{gameSense:4,chemistry:3}},
        {label:"Preferís solo fraguear", hint:"+🎯 aim", fx:{aim:3,gameSense:-1}},
        {label:"Proponés turnarse el rol de IGL entre todos", hint:"+🧭 game sense, +🤝 química, suave", fx:{gameSense:2,chemistry:2}},
      ]},
    { id:"e5", tag:"META", min:0, max:1, text:"Sale un parche grande que cambia el meta de agentes. Tu main, {MAIN}, queda nerfeado.",
      choices:[
        {label:"Te adaptás y probás agentes nuevos", hint:"+🧭 game sense, -🎯 aim", fx:{gameSense:4,aim:-2}, changeMain:true},
        {label:"Seguís con tu main igual, por códigos", hint:"-🤝 química, +🧠 mental", fx:{chemistry:-2,mental:3}},
        {label:"Probás el agente nuevo solo en customs", hint:"cauteloso", fx:{gameSense:2,aim:-1,mental:1}},
      ]},
    { id:"e6", tag:"RANKED", min:0, max:1, text:"Perdés cinco rankeds seguidas y sentís que 'el juego está roto'.",
      choices:[
        {label:"Te tomás el día para resetear la cabeza", hint:"+🧠 mental, -⭐ rating", fx:{mental:6,rating:-2}},
        {label:"Metés una más para salir del bajón", hint:"nunca sale del bajón", fx:{mental:-5,aim:1}},
        {label:"Cambiás a deathmatch un rato para despejarte", hint:"+🎯 aim, +🧠 mental", fx:{aim:2,mental:1}},
      ]},

    // --- Etapa 1-2: primeros pasos serios ---
    { id:"e7", tag:"TRYOUT", min:1, max:2, text:"Un equipo semi-serio te invita a probar en un tryout por Discord.",
      choices:[
        {label:"Vas con humildad, escuchás al IGL", hint:"+🤝 química, +🧭 game sense", fx:{chemistry:5,gameSense:2}},
        {label:"Vas a mostrar mira nomás", hint:"+🎯 aim, -🤝 química", fx:{aim:4,chemistry:-3}},
        {label:"Combinás las dos cosas: mostrás y escuchás", hint:"balanceado", fx:{aim:2,chemistry:2,gameSense:1}},
      ]},
    { id:"e8", tag:"SETUP", min:1, max:2, text:"Conseguís juntar unos mangos para tu primer setup en serio: mouse, mousepad y monitor 144hz.",
      choices:[
        {label:"Invertís todos tus ahorros en el setup", hint:"-💰$80, +🎯 aim", fx:{money:-80,aim:6}},
        {label:"Seguís con lo que tenés", hint:"+🤝 química", fx:{chemistry:2}},
        {label:"Comprás solo el mouse, gastás la mitad", hint:"-💰$40, +🎯 aim", fx:{money:-40,aim:3}},
      ]},
    { id:"e9", tag:"PARTIDO", min:1, max:2, text:"Tu equipo pierde un partido clave por un error tuyo en la última ronda.",
      choices:[
        {label:"Asumís el error frente a todos", hint:"+🤝 química, -🧠 mental", fx:{chemistry:4,popularity:-2,mental:-2}},
        {label:"Le echás la culpa a la conexión", hint:"-🤝 química", fx:{chemistry:-5,mental:1}},
        {label:"Lo hablás en privado con el IGL", hint:"+🤝 química, sin exponerte", fx:{chemistry:2,mental:1}},
      ]},
    { id:"e10", tag:"PLATA", min:1, max:2, text:"Te ofrecen moderar un Discord de la comunidad a cambio de unos mangos.",
      choices:[
        {label:"Aceptás, un mango es un mango", hint:"+💰$60, +📢 popularidad, -🧠 mental", fx:{money:60,popularity:3,mental:-2}},
        {label:"⏳ No tenés tiempo, priorizás practicar", hint:"+🎯 aim", fx:{aim:3}},
        {label:"Aceptás pero solo los fines de semana", hint:"+💰$30, +📢 popularidad", fx:{money:30,popularity:1,aim:1}},
      ]},
    { id:"e11", tag:"STREAM", min:1, max:2, text:"Un stream chico te invita de aparición especial para jugar unas rankeds.",
      choices:[
        {label:"Aceptás, que te vean jugar", hint:"+📢 popularidad, -🧠 mental", fx:{popularity:8,mental:-2}},
        {label:"Rechazás, la exposición te da paja", hint:"+🧠 mental", fx:{mental:2}},
        {label:"Aceptás pero pedís que no muestren tu cara", hint:"+📢 popularidad, sin exponerte tanto", fx:{popularity:4}},
      ]},
   { id:"e12", tag:"EQUIPO", min:1, max:2, text:"Se arma drama en el Discord del equipo por quién decide el pick de mapas.",
  choices:[
    {label:"Mediás la discusión con calma", hint:"+🤝 química, +🧭 game sense", fx:{chemistry:5,gameSense:2}},
    {label:"Te quedás al margen", hint:"-🤝 química, +🧭 game sense", fx:{chemistry:-2,gameSense:1}},
    {label:"Proponés votar el pick entre todos", hint:"+🤝 química", fx:{chemistry:3,gameSense:0}},
     ]},

    // --- Etapa 2-3: circuito amateur / challengers ---
    { id:"e13", tag:"BOOTCAMP", min:2, max:3, text:"Te seleccionan para un bootcamp de una semana antes de un Open Qualifier.",
      choices:[
        {label:"Vas a full, dejás todo lo demás en pausa", hint:"+🎯 aim, +🧭 game sense, -🧠 mental", fx:{aim:5,gameSense:4,mental:-5}},
        {label:"Vas a medio tiempo, no podés soltar todo", hint:"+🤝 química", fx:{chemistry:2,gameSense:2}},
        {label:"Vas full pero te tomás un día de descanso", hint:"término medio", fx:{aim:3,gameSense:3,mental:-2}},
      ]},
    { id:"e14", tag:"SPONSOR", min:2, max:4, text:"Un sponsor chico te ofrece plata por usar su periférico en stream.",
      choices:[
        {label:"Firmás el contrato", hint:"+💰$150, +📢 popularidad", fx:{money:150,popularity:4}},
        {label:"Rechazás, no confiás en la marca", hint:"+🧠 mental", fx:{mental:2}},
        {label:"Firmás pero pedís cláusula de salida", hint:"+💰$100, +📢 popularidad, +🧠 mental", fx:{money:100,popularity:2,mental:1}},
      ]},
    { id:"e15", tag:"SALUD", min:2, max:4, text:"Sentís un tirón en la muñeca después de sesiones de ocho horas de práctica.",
      choices:[
        {label:"Vas al médico y bajás el ritmo", hint:"+🧠 mental, -🎯 aim", fx:{mental:5,aim:-3}},
        {label:"Te aguantás, no hay tiempo para lesiones", hint:"+🎯 aim, -🧠 mental", fx:{aim:2,mental:-6}},
        {label:"Bajás el ritmo un par de días, sin médico", hint:"término medio", fx:{mental:2,aim:-1}},
      ]},
    { id:"e16", tag:"EQUIPO", min:2, max:4, text:"Tu equipo debate si cambiar de IGL antes del torneo grande.",
      choices:[
        {label:"Apoyás al IGL actual", hint:"+🤝 química", fx:{chemistry:4}},
        {label:"Proponés asumir vos la voz cantante", hint:"+🧭 game sense, -🤝 química", fx:{gameSense:4,chemistry:-3}},
        {label:"Proponés traer un IGL externo", hint:"+🧭 game sense, -🤝 química leve", fx:{gameSense:2,chemistry:-1}},
      ]},
    { id:"e17", tag:"LAN", min:2, max:4, text:"Te invitan a un evento LAN, pero coincide con un examen importante.",
      choices:[
        {label:"Vas al LAN, el examen puede esperar", hint:"+📢 popularidad, +💰$, -🧠 mental", fx:{popularity:5,mental:-3,money:50}},
        {label:"Rendís el examen primero", hint:"+🧭 game sense, +🧠 mental", fx:{gameSense:2,mental:3}},
        {label:"Rendís libre después y vas al LAN igual", hint:"punto medio", fx:{popularity:3,gameSense:1,mental:-1}},
      ]},

    // --- Etapa 3-4: challengers / radiant (fichaje con logo de un solo equipo) ---
    { id:"e18", tag:"CONTRATO", min:3, max:4, text:"{TEAM} te ofrece firmar un contrato semi-profesional.",
      choices:[
        {label:"Firmás, es tu chance", hint:"+💰$300, +🤝 química, -🧠 mental, sueldo $70/paga", fx:{money:300,chemistry:3,mental:-3}, salary:70},
        {label:"Pedís mejores condiciones antes de firmar", hint:"+💰$150, +🧭 game sense, sueldo $90/paga", fx:{money:150,gameSense:2}, salary:90},
        {label:"Pedís tiempo para pensarlo con tu familia", hint:"no firmás todavía", fx:{mental:2,gameSense:1}},
      ], showLogo:true},
    { id:"e19", tag:"PRENSA", min:3, max:5, text:"La prensa de la escena empieza a hablar de vos como 'la próxima promesa'.",
      choices:[
        {label:"Disfrutás la atención en redes", hint:"+📢 popularidad, -🧠 mental", fx:{popularity:8,mental:-2}},
        {label:"Preferís bajo perfil y enfocarte en el juego", hint:"+🧭 game sense, +🧠 mental", fx:{gameSense:3,mental:2}},
        {label:"Das una entrevista corta y volvés a lo tuyo", hint:"término medio", fx:{popularity:4,gameSense:1}},
      ]},
    { id:"e20", tag:"PARTIDO", min:3, max:5, text:"Perdés la final regional en la última ronda por un call tuyo.",
      choices:[
        {label:"Revisás el VOD sin filtro, con el coach", hint:"+🧭 game sense, -🧠 mental", fx:{gameSense:6,mental:-4}},
        {label:"Preferís no verlo, ya fue", hint:"+🧠 mental, -🧭 game sense", fx:{mental:3,gameSense:-2}},
        {label:"Lo revisás vos solo, con más calma", hint:"término medio", fx:{gameSense:3,mental:-1}},
      ]},
    { id:"e21", tag:"REDES", min:3, max:5, text:"Un rival de la escena te tira mala onda en redes antes del próximo cruce.",
      choices:[
        {label:"No contestás, que hable el juego", hint:"+🧠 mental, +📢 popularidad", fx:{mental:3,popularity:2}},
        {label:"Le contestás fuerte en redes", hint:"+📢 popularidad, -🧠 mental, -🤝 química", fx:{popularity:6,mental:-4,chemistry:-2}},
        {label:"Le contestás con humor, sin agresividad", hint:"+📢 popularidad", fx:{popularity:4}},
      ]},
    { id:"e22", tag:"FAMILIA", min:3, max:5, text:"Estás lejos de tu familia por los viajes constantes de la escena competitiva.",
      choices:[
        {label:"Programás videollamadas fijas", hint:"+🧠 mental, -🤝 química", fx:{mental:5,chemistry:-1}},
        {label:"Priorizás el training camp", hint:"+🧭 game sense, -🧠 mental", fx:{gameSense:3,mental:-5}},
        {label:"Programás una visita corta entre torneos", hint:"-💰$30, +🧠 mental", fx:{mental:3,money:-30}},
      ]},

    // --- Etapa 4-5: radiant / champions ---
    { id:"e23", tag:"NERVIOS", min:4, max:5, text:"Faltan días para el Champions y no podés dormir de los nervios.",
      choices:[
        {label:"Hablás con el psicólogo del equipo", hint:"+🧠 mental, -🎯 aim", fx:{mental:8,aim:-1}},
        {label:"Metés horas extra de práctica", hint:"+🎯 aim, -🧠 mental", fx:{aim:4,mental:-6}},
        {label:"Hacés una rutina de relajación antes de dormir", hint:"término medio", fx:{mental:4,aim:1}},
      ]},
    { id:"e24", tag:"EQUIPO", min:4, max:5, text:"Un compañero está pasando su peor semana mental antes del torneo grande.",
      choices:[
        {label:"Le bajás carga y lo escuchás", hint:"+🤝 química, -🧠 mental", fx:{chemistry:6,mental:-2}},
        {label:"Le decís que se aguante, el equipo depende de él", hint:"-🤝 química, +🧭 game sense", fx:{chemistry:-4,gameSense:2}},
        {label:"Sugerís que hable con el psicólogo del equipo", hint:"término medio", fx:{chemistry:3,mental:1}},
      ]},
    { id:"e25", tag:"SPONSOR", min:4, max:5, text:"Te ofrecen ser la cara de una marca grande de gaming justo antes de Champions.",
      choices:[
        {label:"Aceptás, la plata es la plata", hint:"+💰$400, +📢 popularidad, -🧠 mental", fx:{money:400,popularity:8,mental:-3}},
        {label:"⏸️ Postergás la firma, foco total en el torneo", hint:"+🧭 game sense", fx:{gameSense:3}},
        {label:"Aceptás pero delegás apariciones a después", hint:"término medio", fx:{money:200,popularity:4,gameSense:1}},
      ]},

    // --- Tilt / rage, cualquier etapa ---
    { id:"e26", tag:"TILT", min:0, max:5, text:"Perdés una ronda clave por un desync y se te empieza a ir la cabeza.",
      choices:[
        {label:"Respirás hondo y seguís", hint:"+🧠 mental", fx:{mental:2}},
        {label:"Le pegás un golpe al escritorio", hint:"-🎯 aim, -🧠 mental", fx:{mental:-4,aim:-2}, rage:true},
        {label:"Te levantás a caminar un par de minutos", hint:"+🧠 mental", fx:{mental:3}},
      ]},

    // --- Personal, etapas medias ---
    { id:"e27", tag:"VIDA PERSONAL", min:1, max:4, text:"Tu pareja te pide más tiempo juntos, sentís que el juego te está consumiendo.",
      choices:[
        {label:"Bajás un cambio y reorganizás tus horarios", hint:"+🧠 mental, -🎯 aim", fx:{mental:5,chemistry:-1,aim:-1}},
        {label:"Priorizás la carrera, ya habrá tiempo después", hint:"+🎯 aim, -🧠 mental", fx:{aim:2,mental:-4}},
        {label:"Buscás horarios fijos para verse, sin bajar el ritmo", hint:"término medio", fx:{mental:2,chemistry:1}},
      ]},
    { id:"e28", tag:"DECISIÓN", min:1, max:4, text:"Te ofrecen dejar la facu o el laburo para dedicarte 100% al Valorant.",
      choices:[
        {label:"Dejás todo, all-in a la carrera", hint:"+🎯 aim, +🧭 game sense, -🧠 mental", fx:{aim:4,gameSense:3,mental:-3}},
        {label:"Mantenés un plan B por las dudas", hint:"+🧠 mental, -🎯 aim", fx:{mental:4,aim:-1}},
        {label:"Reducís la carga a la mitad", hint:"término medio", fx:{aim:2,gameSense:1,mental:1}},
      ]},

    // --- Fichajes a equipos reales: 3 ofertas distintas + logo por cada una ---
    { id:"e29", tag:"FICHAJE", min:2, max:3, dynamic:"teamOffer", offerType:"academy",
      text:"Varias academias te contactan para un tryout en su roster de desarrollo. Elegís con cuál probar suerte." },
    { id:"e30", tag:"FICHAJE", min:4, max:5, dynamic:"teamOffer", offerType:"main",
      text:"Tres organizaciones te ofrecen un lugar en su roster titular justo antes de la temporada grande." },

    // --- Entrevista de prensa: varias preguntas seguidas ---
    { id:"e31", tag:"ENTREVISTA", min:1, max:5, dynamic:"interview",
      text:"Te sientan frente a cámara para una nota de la escena. Van a ser varias preguntas seguidas." },
  ];

  // Banco de preguntas para la sección de entrevista. En cada entrevista se
  // eligen 5 o 6 al azar, sin repetir, y se muestran una por una.
  const INTERVIEW_QUESTIONS = [
    { q:"¿Cómo describirías tu nivel de juego ahora mismo?",
      choices:[
        {label:"Con total confianza: 'soy de los mejores'", hint:"+📢 popularidad, -🧠 mental", fx:{popularity:5,mental:-2}},
        {label:"Con humildad: 'me falta mucho todavía'", hint:"+🧠 mental", fx:{mental:3}},
        {label:"Con datos: hablás de tu rating y tus números", hint:"+🧭 game sense, +📢 popularidad leve", fx:{gameSense:2,popularity:2}},
      ]},
    { q:"¿Qué le dirías a la gente que te critica en redes?",
      choices:[
        {label:"Los ignorás por completo", hint:"+🧠 mental", fx:{mental:4}},
        {label:"Les contestás con una frase picante", hint:"+📢 popularidad, -🤝 química", fx:{popularity:5,chemistry:-2}},
        {label:"Agradecés la crítica constructiva", hint:"+🤝 química", fx:{chemistry:3}},
      ]},
    { q:"¿Cómo es la relación con tus compañeros de equipo?",
      choices:[
        {label:"'Somos una familia', decís sin dudar", hint:"+🤝 química, +📢 popularidad", fx:{chemistry:4,popularity:2}},
        {label:"Sos honesto/a: 'a veces chocamos, pero funciona'", hint:"+🧭 game sense", fx:{gameSense:2,chemistry:1}},
        {label:"Evitás el tema y cambiás de rumbo", hint:"sin efecto real", fx:{popularity:1}},
      ]},
    { q:"¿Cómo llevás la presión de los torneos grandes?",
      choices:[
        {label:"Admitís que a veces no dormís de los nervios", hint:"+📢 popularidad, -🧠 mental leve", fx:{popularity:4,mental:-1}},
        {label:"Decís que ya te acostumbraste", hint:"+🧠 mental", fx:{mental:3}},
        {label:"Contás tu rutina con el psicólogo del equipo", hint:"+🧠 mental, +📢 popularidad", fx:{mental:4,popularity:2}},
      ]},
    { q:"¿Qué sacrificaste para llegar hasta acá?",
      choices:[
        {label:"Hablás abiertamente de tu salud mental", hint:"+📢 popularidad, -🧠 mental leve", fx:{popularity:6,mental:-2}},
        {label:"Preferís no entrar en detalles personales", hint:"+🧠 mental", fx:{mental:2}},
        {label:"Hablás del tiempo perdido con tu familia", hint:"+📢 popularidad", fx:{popularity:3,mental:-1}},
      ]},
    { q:"¿Cuál es tu objetivo para lo que queda de temporada?",
      choices:[
        {label:"'Vamos por todo, nada menos'", hint:"+📢 popularidad, -🧠 mental leve", fx:{popularity:5,mental:-1}},
        {label:"'Un paso a la vez, sin apurar nada'", hint:"+🧠 mental", fx:{mental:3}},
        {label:"'Mejorar como jugador/a, el resultado viene solo'", hint:"+🧭 game sense", fx:{gameSense:3}},
      ]},
    { q:"¿Qué opinás de tu próximo rival?",
      choices:[
        {label:"Los picanteás un poco para generar hype", hint:"+📢 popularidad, -🤝 química", fx:{popularity:5,chemistry:-2}},
        {label:"Les tenés respeto y lo decís", hint:"+🤝 química", fx:{chemistry:3}},
        {label:"No decís nada, 'que hable el server'", hint:"+🧠 mental", fx:{mental:2}},
      ]},
    { q:"¿Cómo es un día normal de entrenamiento para vos?",
      choices:[
        {label:"Contás una rutina brutal de muchas horas", hint:"+🧭 game sense, -🧠 mental leve", fx:{gameSense:3,mental:-1}},
        {label:"Hablás de un balance entre práctica y descanso", hint:"+🧠 mental", fx:{mental:3}},
        {label:"Bromeás y no das mucho detalle", hint:"+📢 popularidad leve", fx:{popularity:2}},
      ]},
  ];

  // La inflación de la tienda tiene DOS componentes:
  // 1) GLOBAL por compras: cada compra (de cualquier ítem) sube el precio de
  //    TODOS los ítems, no solo el que se compró (state.shopPurchasesTotal).
  // 2) Por PLATA: además, cada ítem suma un recargo proporcional a la plata
  //    que tenés acumulada en tu mejor momento (state.peakMoney), para que los
  //    precios no se queden "baratos" cuando ya estás manejando premios
  //    grandes. moneyFactor es el % de esa plata que se suma al costo base.
  const SHOP_INFLATION = 1.16;

  const SHOP_ITEMS = [
    { id:"psych", name:"🧑‍⚕️ Sesión con psicólogo deportivo", cost:150, max:3, fx:{mental:15}, moneyFactor:0.07 },
    { id:"coach", name:"📋 Coach personalizado", cost:180, max:3, fx:{gameSense:10}, moneyFactor:0.08 },
    // "Setup gamer premium" es algo de etapas tempranas (armar tu primer setup
    // en serio). Una vez que ya sos pro con equipo/sponsors (stage 3+:
    // Challengers en adelante) ya no tiene sentido que te lo ofrezcan en la
    // tienda, así que se oculta a partir de ahí con maxStage.
    { id:"gear",  name:"🖱️ Setup gamer premium", cost:120, max:3, fx:{aim:8}, maxStage:2, moneyFactor:0.06 },
    { id:"editor",name:"🎬 Editor de highlights", cost:100, max:3, fx:{popularity:10}, moneyFactor:0.06 },
    { id:"team",  name:"🤝 Team building con el equipo", cost:140, max:3, fx:{chemistry:12}, moneyFactor:0.07 },
    { id:"vacay", name:"🏖️ Vacaciones forzadas", cost:90, max:3, fx:{mental:8,aim:-3}, note:"te oxidás un poco", moneyFactor:0.05 },
  ];

  const ACHIEVEMENTS = [
    { id:"champion",     name:"Leyenda de Champions",
      desc:"Ganaste el Champions y tu nombre queda tallado en la historia del Valorant. Los pibes del Iron de tu barrio tienen tu jersey.",
      check: s => s.maxStage >= 5 && !s.burnedOut },
    { id:"burnout_star",  name:"La estrella que se apagó",
      desc:"Rating de crack, cabeza destruida. Ganaste casi todo menos la paz mental.",
      check: s => s.stats.rating >= 80 && s.stats.mental <= 20 },
    { id:"discarded",     name:"El descartable",
      desc:"Nadie quiere jugar con vos en el Discord. Terminaste solo, farmeando ranked a las 4am.",
      check: s => s.stats.chemistry <= 15 && s.stats.popularity <= 15 },
    { id:"early_burnout", name:"Se acabó antes de empezar",
      desc:"El burnout te ganó de mano. Colgaste el mouse antes de salir de Silver/Gold.",
      check: s => s.burnedOut && s.maxStage <= 1 },
    { id:"streamer",      name:"De pro-player a personalidad de Twitch",
      desc:"No llegaste a firmar con un Tier 1, pero tu carisma te hizo más plata que a la mitad del roster de un Champions.",
      check: s => s.stats.popularity >= 80 && s.maxStage < 4 },
    { id:"coach_brain",   name:"El cerebro detrás del equipo",
      desc:"Tu mira nunca fue la mejor, pero tu lectura de juego sí. Terminaste de coach de la próxima generación.",
      check: s => s.stats.gameSense >= 80 && s.stats.aim <= 40 },
    { id:"captain",       name:"El Capitán",
      desc:"Nunca fuiste el mejor con la mira, pero armaste vos las jugadas que llevaron al equipo hasta acá. Los pibes nuevos te dicen 'profe'.",
      check: s => s.role === "igl" && s.maxStage >= 3 },
    { id:"veteran",       name:"El Veterano",
      desc:"Ya no reaccionás como antes, pero la cabeza te sobra. Ganaste con experiencia lo que perdiste en reflejos.",
      check: s => s.age >= 33 && s.stats.aim <= 40 && s.stats.gameSense >= 60 },
    { id:"qualified",     name:"Clasificado a Champions",
      desc:"Lo lograste: tu nombre está en la lista de invitados de un Champions. Pase lo que pase después, esto ya nadie te lo saca.",
      check: s => s.maxStage >= 5 },
    { id:"bottom_rank",   name:"Una carrera más, en el fondo del ranking",
      desc:"No llegaste a lo grande, pero seguís teniendo el mejor rating del clan de tus amigos.",
      check: s => s.maxStage <= 1 && !s.burnedOut },
    { id:"bichampion",    name:"Bicampeón de Champions",
      desc:"Ganaste dos o más títulos grandes en la misma carrera.",
      check: s => s.tournamentWins >= 2 && s.maxStage >= 5 },
    { id:"idol",          name:"Tu ídolo, TenZ",
      desc:"Rompiste 2 teclados de la bronca en la misma carrera.",
      check: s => s.rageBreaks >= 2 },
  ];

  const STORAGE_KEY = "leyenda_valorant_unlocked_v1";

  /* ---------------------------------------------------------
     ESTADO
  --------------------------------------------------------- */

  let state = null;

  function freshState(nickname, roleId, genderId, archetypeId, mainAgent) {
    const role = ROLES.find(r => r.id === roleId);
    const gender = GENDERS.find(g => g.id === genderId);
    const archetype = ARCHETYPES.find(a => a.id === archetypeId) || ARCHETYPES[0];
    const stats = { aim:50, gameSense:50, chemistry:50, popularity:50, mental:50, rating:50 };
    for (const k in role.bonus) stats[k] = clamp(stats[k] + role.bonus[k]);
    for (const k in archetype.bonus) stats[k] = clamp(stats[k] + archetype.bonus[k]);
    return {
      nickname, role: roleId, gender: genderId, circuit: gender.circuit,
      archetype: archetypeId, main: mainAgent,
      turn: 0, age: 16,
      stats,
      money: 20,
      stage: 0, maxStage: 0,
      tournamentWins: 0,
      rageBreaks: 0,
      usedEventIds: new Set(),
      shopPurchases: {},
      shopPurchasesTotal: 0,
      burnedOut: false,
      ended: false,
      team: null,
      salary: 0,
      kills: 0,
      clutches: 0,
      hospitalizations: 0,
      peakMoney: 20,
    };
  }

  function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(v))); }

  /* ---------------------------------------------------------
     PERSISTENCIA DE LOGROS
  --------------------------------------------------------- */

  function loadUnlocked() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) { return new Set(); }
  }
  function saveUnlocked(set) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); } catch (e) {}
  }

  /* ---------------------------------------------------------
     UI: helpers generales
  --------------------------------------------------------- */

  const $ = sel => document.querySelector(sel);
  const $all = sel => document.querySelectorAll(sel);

  function showScreen(id) {
    $all(".screen").forEach(s => s.classList.remove("active"));
    $(`#${id}`).classList.add("active");
  }

  function renderAchvGrid(container) {
    const unlocked = loadUnlocked();
    container.innerHTML = "";
    ACHIEVEMENTS.forEach(a => {
      const div = document.createElement("div");
      div.className = "achv-item" + (unlocked.has(a.id) ? " unlocked" : "");
      div.innerHTML = `<b>${a.name}</b>${unlocked.has(a.id) ? a.desc : "???"}`;
      container.appendChild(div);
    });
    return unlocked.size;
  }

  function refreshAchvCounters() {
    const n1 = renderAchvGrid($("#achv-grid-intro"));
    $("#achv-count").textContent = n1;
  }

  /* ---------------------------------------------------------
     PANTALLA DE CREACIÓN
  --------------------------------------------------------- */

  let selectedRole = null;
  let selectedGender = null;
  let selectedArchetype = null;
  let selectedMain = null;

  function renderRoleGrid() {
    const grid = $("#role-grid");
    grid.innerHTML = "";
    ROLES.forEach(r => {
      const div = document.createElement("div");
      div.className = "role-card";
      div.dataset.role = r.id;
      div.innerHTML = `<span class="r-tag">${r.tag}</span><span class="r-name">${r.name}</span>`;
      div.addEventListener("click", () => {
        selectedRole = r.id;
        $all("#role-grid .role-card").forEach(c => c.classList.remove("selected"));
        div.classList.add("selected");
        $("#role-desc").textContent = r.desc;
        renderMainGrid(r.id);
        validateForm();
      });
      grid.appendChild(div);
    });
  }

  function renderArchetypeGrid() {
    const grid = $("#archetype-grid");
    grid.innerHTML = "";
    ARCHETYPES.forEach(a => {
      const div = document.createElement("div");
      div.className = "role-card";
      div.dataset.archetype = a.id;
      div.innerHTML = `<span class="r-tag">${a.tag}</span><span class="r-name">${a.name}</span>`;
      div.addEventListener("click", () => {
        selectedArchetype = a.id;
        $all("#archetype-grid .role-card").forEach(c => c.classList.remove("selected"));
        div.classList.add("selected");
        $("#archetype-desc").textContent = a.desc;
        validateForm();
      });
      grid.appendChild(div);
    });
  }

  function renderMainGrid(roleId) {
    const grid = $("#main-grid");
    grid.innerHTML = "";
    selectedMain = null;
    if (!roleId) {
      $("#main-desc").textContent = "Elegí un rol primero para ver tus opciones de main.";
      validateForm();
      return;
    }
    const agents = AGENTS[roleId] || [];
    agents.forEach(name => {
      const div = document.createElement("div");
      div.className = "role-card";
      div.dataset.main = name;
      div.innerHTML = `<span class="r-name">${name}</span>`;
      div.addEventListener("click", () => {
        selectedMain = name;
        $all("#main-grid .role-card").forEach(c => c.classList.remove("selected"));
        div.classList.add("selected");
        $("#main-desc").textContent = `Tu main: ${name}.`;
        validateForm();
      });
      grid.appendChild(div);
    });
    $("#main-desc").textContent = "Elegí tu main entre las opciones de tu rol.";
  }

  function renderGenderGrid() {
    const grid = $("#gender-grid");
    grid.innerHTML = "";
    GENDERS.forEach(g => {
      const div = document.createElement("div");
      div.className = "role-card";
      div.dataset.gender = g.id;
      const circuitName = g.circuit === "gc" ? "Circuito Game Changers" : "Circuito Abierto (VCT)";
      div.innerHTML = `<span class="r-tag">${circuitName}</span><span class="r-name">${g.label}</span>`;
      div.addEventListener("click", () => {
        selectedGender = g.id;
        $all("#gender-grid .role-card").forEach(c => c.classList.remove("selected"));
        div.classList.add("selected");
        $("#gender-desc").textContent = g.flavor;
        validateForm();
      });
      grid.appendChild(div);
    });
  }

  function validateForm() {
    const nickOk = $("#nickname").value.trim().length > 0;
    $("#btn-play").disabled = !(nickOk && selectedRole && selectedGender && selectedArchetype && selectedMain);
  }

  function initIntro() {
    renderRoleGrid();
    renderGenderGrid();
    renderArchetypeGrid();
    renderMainGrid(null);
    refreshAchvCounters();
    $("#nickname").addEventListener("input", validateForm);
    $("#create-form").addEventListener("submit", e => {
      e.preventDefault();
      const nickname = $("#nickname").value.trim() || "Player";
      state = freshState(nickname, selectedRole, selectedGender, selectedArchetype, selectedMain);
      const gender = GENDERS.find(g => g.id === selectedGender);
      showScreen("screen-game");
      renderHUD();
      $("#log-list").innerHTML = "";
      addLog(`🔫 A los 16, con el corazón en la boca, entrás a tu primera ranked con tus ${gender.pronoun}. Main: ${selectedMain}. Nadie sabe todavía en qué te vas a convertir.`);
      nextTurn();
    });
  }

  /* ---------------------------------------------------------
     MOTOR DE JUEGO
  --------------------------------------------------------- */

  function addLog(text) {
    const li = document.createElement("li");
    li.innerHTML = text;
    const list = $("#log-list");
    list.insertBefore(li, list.firstChild);
  }

  function renderHUD() {
    $("#hud-name").textContent = state.nickname;
    state.peakMoney = Math.max(state.peakMoney || 0, state.money);
    const role = ROLES.find(r => r.id === state.role);
    $("#hud-role").textContent = `${role.name.toUpperCase()}${state.main ? " · " + state.main : ""}`;
    const stages = stagesFor(state.circuit);
    $("#rank-badge").textContent = stages[state.stage].badge;
    $("#rank-stage-label").textContent = stages[state.stage].name;
    $("#hud-age").textContent = state.age;
    $("#hud-turn").textContent = state.turn;
    $("#hud-money").textContent = state.money;
    const killsEl = $("#hud-kills");
    if (killsEl) killsEl.textContent = state.kills || 0;
    const clutchesEl = $("#hud-clutches");
    if (clutchesEl) clutchesEl.textContent = state.clutches || 0;
    $("#btn-retire").style.display = state.age >= 30 ? "inline-block" : "none";
    renderTeamHud();
    renderStats();
  }

  function renderTeamHud() {
    const el = $("#hud-team");
    if (!el) return;
    if (state.team) {
      el.innerHTML = `${teamLogoBadge(state.team, 26)}<span class="hud-team-name">${state.team}</span><span class="hud-team-salary">$${state.salary}/paga</span>`;
      el.classList.add("signed");
    } else {
      el.innerHTML = `<span class="hud-team-name free-agent">Free agent</span>`;
      el.classList.remove("signed");
    }
  }

  const STAT_META = [
    ["aim","AIM"], ["gameSense","GAME SENSE"], ["chemistry","QUÍMICA"],
    ["popularity","POPULARIDAD"], ["mental","SALUD MENTAL"], ["rating","RATING"],
  ];

  const STAT_LABELS = {
    aim: "AIM", gameSense: "GAME SENSE", chemistry: "QUÍMICA",
    popularity: "POPULARIDAD", mental: "SALUD MENTAL", rating: "RATING",
  };

  // Genera el texto de consecuencias siempre con el mismo formato: signo, monto
  // exacto y el nombre de stat tal cual aparece en las barras del HUD.
  function fxToHint(fx, extra) {
    const parts = [];
    if (fx) {
      for (const k in fx) {
        if (k === "resultText") continue;
        if (k === "money") {
          if (fx.money) parts.push(`${fx.money > 0 ? "+" : ""}${fx.money} PLATA`);
          continue;
        }
        if (k in STAT_LABELS && fx[k]) {
          parts.push(`${fx[k] > 0 ? "+" : ""}${fx[k]} ${STAT_LABELS[k]}`);
        }
      }
    }
    let out = parts.join(" · ");
    if (extra) out = out ? `${out} · ${extra}` : extra;
    return out || "Sin efecto directo en stats.";
  }

  function renderStats() {
    const bar = $("#stats-bar");
    bar.innerHTML = "";
    STAT_META.forEach(([key,label]) => {
      const val = state.stats[key];
      const div = document.createElement("div");
      div.className = "stat";
      div.dataset.stat = key;
      div.innerHTML = `<div class="stat-label"><span>${label}</span><span>${val}</span></div>
        <div class="stat-track"><div class="stat-fill" style="width:${val}%"></div></div>`;
      bar.appendChild(div);
    });
  }

  function applyEffects(fx) {
    if (!fx) return;
    for (const k in fx) {
      if (k === "money") { state.money = Math.max(0, state.money + fx.money); continue; }
      if (k in state.stats) state.stats[k] = clamp(state.stats[k] + fx[k]);
    }
  }

  function pickNormalEvent() {
    const pool = EVENTS.filter(e => state.stage >= e.min && state.stage <= e.max && !state.usedEventIds.has(e.id));
    let candidates = pool;
    if (candidates.length === 0) {
      // reset pool for this stage range so events can repeat
      EVENTS.filter(e => state.stage >= e.min && state.stage <= e.max).forEach(e => state.usedEventIds.delete(e.id));
      candidates = EVENTS.filter(e => state.stage >= e.min && state.stage <= e.max);
    }
    const ev = candidates[Math.floor(Math.random() * candidates.length)];
    state.usedEventIds.add(ev.id);
    return ev;
  }

  function renderEvent(ev) {
    const eventCard = $("#event-card");
    let choices, logoHeaderTeam = null;

    if (ev.dynamic === "interview") {
      return renderInterview(ev);
    }

    if (ev.dynamic === "teamOffer") {
      $("#event-tag").textContent = ev.tag;
      $("#event-text").textContent = ev.text;
      choices = buildTeamOfferChoices(ev);
    } else {
      const teamName = pickTeamName(state.circuit);
      const usesTeam = ev.text.includes("{TEAM}");
      let text = usesTeam ? ev.text.replaceAll("{TEAM}", teamName) : ev.text;
      if (text.includes("{MAIN}")) text = text.replaceAll("{MAIN}", state.main || "tu main");
      $("#event-tag").textContent = ev.tag;
      $("#event-text").textContent = text;
      if (ev.showLogo && usesTeam) logoHeaderTeam = teamName;
      choices = ev.choices.map(c => {
        const label = c.label.includes("{TEAM}") ? c.label.replaceAll("{TEAM}", teamName) : c.label;
        const out = { ...c, label };
        if (c.salary != null && usesTeam) out.team = teamName;
        return out;
      });
    }

    // logo grande arriba del texto para eventos de un solo equipo (ej: contrato)
    let existingHeader = eventCard.querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    if (logoHeaderTeam) {
      const header = document.createElement("div");
      header.className = "event-team-header";
      header.innerHTML = `${teamLogoBadge(logoHeaderTeam, 44)}<span>${logoHeaderTeam}</span>`;
      eventCard.insertBefore(header, $("#event-text"));
    }

    const choicesDiv = $("#event-choices");
    choicesDiv.innerHTML = "";
    choices.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "choice-btn" + (c.team ? " has-logo" : "");
      const logoHtml = c.team ? teamLogoBadge(c.team, 30) : "";
      const extraBits = [];
      if (c.note) extraBits.push(c.note);
      if (c.salary != null) extraBits.push(`sueldo $${c.salary}/paga`);
      const hintText = fxToHint(c.fx, extraBits.join(" · "));
      btn.innerHTML = `${logoHtml}<span class="c-label-wrap"><span class="c-label">${c.label}</span><span class="c-hint">${hintText}</span></span>`;
      btn.addEventListener("click", () => {
        applyEffects(c.fx);
        if (c.rage) {
          state.rageBreaks++;
          if (Math.random() < 0.4) {
            const cost = 20 + Math.floor(Math.random() * 40);
            state.money = Math.max(0, state.money - cost);
            addLog(`💥 Te mandaste una piña al monitor y se rajó. Te salió $${cost} arreglarlo o comprar otro.`);
          }
        }
        if (c.changeMain) {
          const pool = (AGENTS[state.role] || []).filter(a => a !== state.main);
          if (pool.length) {
            const oldMain = state.main;
            state.main = pool[Math.floor(Math.random() * pool.length)];
            addLog(`🔁 Cambiaste de main: dejás a <b>${oldMain}</b> y pasás a <b>${state.main}</b>.`);
          }
        }
        if (c.team && c.salary != null) {
          state.team = c.team;
          state.salary = c.salary;
          addLog(`✍️ Firmaste con <b>${c.team}</b> — sueldo $${c.salary} por paga.`);
        } else {
          addLog(`<b>${ev.tag}:</b> ${c.label}`);
        }
        renderHUD();
        nextTurn();
      });
      choicesDiv.appendChild(btn);
    });
  }

  // Sección de entrevista: 5 o 6 preguntas seguidas, elegidas al azar del
  // banco INTERVIEW_QUESTIONS, cada una con sus propias opciones y efectos.
  function renderInterview(ev) {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();

    const pool = INTERVIEW_QUESTIONS.slice();
    const count = Math.min(pool.length, 5 + (Math.random() < 0.5 ? 1 : 0)); // 5 o 6
    const selected = [];
    while (selected.length < count && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(i, 1)[0]);
    }

    let idx = 0;

    function showQuestion() {
      if (idx >= selected.length) {
        addLog(`🎤 <b>ENTREVISTA:</b> Terminaste la nota de prensa.`);
        renderHUD();
        return nextTurn();
      }
      const q = selected[idx];
      $("#event-tag").textContent = `${ev.tag} · PREGUNTA ${idx + 1}/${selected.length}`;
      $("#event-text").textContent = (idx === 0 ? ev.text + " " : "") + q.q;
      const choicesDiv = $("#event-choices");
      choicesDiv.innerHTML = "";
      q.choices.forEach(c => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        const hintText = fxToHint(c.fx);
        btn.innerHTML = `<span class="c-label-wrap"><span class="c-label">${c.label}</span><span class="c-hint">${hintText}</span></span>`;
        btn.addEventListener("click", () => {
          applyEffects(c.fx);
          addLog(`🎤 <i>"${q.q}"</i> → ${c.label}`);
          renderHUD();
          idx++;
          showQuestion();
        });
        choicesDiv.appendChild(btn);
      });
    }

    showQuestion();
  }

  function renderSingleContinue(tag, text, onContinue, btnLabel) {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    $("#event-tag").textContent = tag;
    $("#event-text").textContent = text;
    const choicesDiv = $("#event-choices");
    choicesDiv.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = btnLabel || "Continuar";
    btn.addEventListener("click", onContinue);
    choicesDiv.appendChild(btn);
  }

  function nextTurn() {
    if (state.ended) return;
    state.turn++;
    state.age = 16 + Math.floor(state.turn / 2);

    if (state.team && state.salary > 0 && state.turn % 2 === 0) {
      state.money += state.salary;
      addLog(`💵 Cobrás tu sueldo de <b>${state.team}</b>: +$${state.salary}.`);
    }

    renderHUD();

    // salud mental en 0: te internan. No es un final automático — si te
    // recuperás bien podés seguir jugando. Si te pasa una tercera vez, ahí sí
    // se acabó: el cuerpo y la cabeza ya no dan para más.
    if (state.stats.mental <= 0) {
      state.hospitalizations = (state.hospitalizations || 0) + 1;
      if (state.hospitalizations >= 3) {
        state.burnedOut = true;
        return endGame("burnout");
      }
      return triggerHospitalization();
    }

    // a partir de los 35 el cuerpo ya no acompaña como antes, pero si
    // llegaste con la cabeza sana podés seguir compitiendo — el retiro ya no
    // es automático, solo si además venís mal de salud mental.
    if (state.age >= 35) {
      if (state.stats.mental < 40) {
        return endGame("age_limit");
      }
      state.stats.aim = clamp(state.stats.aim - 2);
      addLog(`⌛ A los ${state.age} los reflejos ya no son los mismos, pero la cabeza te sostiene y seguís compitiendo.`);
    }

    // torneo cada 5 turnos
    if (state.turn % 5 === 0) return triggerTournament();

    // minijuego de reflejos cada 4 turnos (si no coincide con torneo)
    if (state.turn % 4 === 0) return triggerReflex();

    // evento normal
    const ev = pickNormalEvent();
    renderEvent(ev);
  }

  function triggerTournament() {
    const stages = stagesFor(state.circuit);
    const stg = stages[state.stage];
    const s = state.stats;
    const score = s.rating * 0.4 + s.aim * 0.3 + s.gameSense * 0.2 + s.chemistry * 0.1 + (Math.random() * 30 - 15);
    let text, success;
    // Kills del torneo: una cifra de sabor derivada del aim/rating, más alta
    // si ganás. No hay simulación de rondas, es una estimación de "cómo te
    // fue en el server" para alimentar el contador de kills del final.
    const baseKills = Math.round(6 + s.aim / 8 + Math.random() * 8);
    if (state.stage >= 5) {
      // defensa de título en la cima del circuito
      success = score >= 90;
      if (success) {
        state.tournamentWins++;
        state.stats.rating = clamp(state.stats.rating + 5);
        const prize = Math.round(stg.purse * 0.15);
        state.money += prize;
        const kills = baseKills + 6;
        state.kills = (state.kills || 0) + kills;
        text = `${stg.name.toUpperCase()}: defendiste el título. Tu equipo vuelve a levantar el trofeo, tu nombre suena en toda la escena y te llevás $${prize} de la bolsa de premios. Cerrás el torneo con ${kills} kills.`;
      } else {
        state.stats.mental = clamp(state.stats.mental - 5);
        const prize = Math.round(stg.purse * 0.03) + 100;
        state.money += prize;
        state.kills = (state.kills || 0) + baseKills;
        text = `${stg.name.toUpperCase()}: quedaste eliminada/o en fase de grupos esta vez. Duele, pero ya estás entre los mejores del circuito. Te llevás $${prize} y sumás ${baseKills} kills.`;
      }
    } else {
      success = score >= stg.threshold;
      if (success) {
        state.stage = Math.min(5, state.stage + 1);
        state.maxStage = Math.max(state.maxStage, state.stage);
        state.tournamentWins++;
        state.stats.rating = clamp(state.stats.rating + 8);
        const newStg = stages[state.stage];
        const prize = Math.round(newStg.purse * 0.08) + 150 * state.stage;
        state.money += prize;
        const kills = baseKills + 4;
        state.kills = (state.kills || 0) + kills;
        text = `TORNEO: tu equipo avanza de nivel. Ahora estás en: ${stages[state.stage].name} — te llevás $${prize} de premio y sumás ${kills} kills.`;
      } else {
        state.stats.rating = clamp(state.stats.rating - 6);
        state.stats.mental = clamp(state.stats.mental - 6);
        state.money += 30;
        state.kills = (state.kills || 0) + baseKills;
        text = `TORNEO: quedaste afuera esta vez. Toca seguir grindeando en ${stg.name}. Sumás ${baseKills} kills igual.`;
      }
    }
    addLog(`<b>TORNEO:</b> ${text}`);
    renderHUD();
    renderSingleContinue("TORNEO", text, () => nextTurn());
  }

  function triggerHospitalization() {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    const n = state.hospitalizations;
    const texts = [
      `La presión te pasa factura y terminás internada/o un tiempo en un centro psiquiátrico para descansar la cabeza. El equipo anuncia tu baja temporal, corre el rumor de "problemas personales" en redes, y por un rato el Valorant queda en pausa para vos.`,
      `Es la segunda vez que tu cabeza te manda a un psiquiátrico. La escena empieza a hablar más de tu salud que de tu juego. Si esto pasa una vez más, no vas a poder sostener la carrera.`,
    ];
    const text = texts[Math.min(n - 1, texts.length - 1)];
    const recovered = 30 + Math.floor(Math.random() * 16); // 30-45
    state.stats.mental = recovered;
    state.stats.rating = clamp(state.stats.rating - 8);
    state.stats.popularity = clamp(state.stats.popularity - 5);
    // La recuperación no es instantánea: pasan 3 años (6 turnos) internada/o
    // y lejos de la competencia antes de volver a la escena.
    const ageBefore = state.age;
    state.turn += 6;
    state.age = 16 + Math.floor(state.turn / 2);
    const agedText = ` Pasás 3 años internada/o recuperándote — volvés a los ${state.age} (tenías ${ageBefore}).`;
    let teamNote = "";
    if (state.team && Math.random() < 0.35) {
      teamNote = ` <b>${state.team}</b> te baja del roster mientras te recuperás.`;
      state.team = null;
      state.salary = 0;
    }
    addLog(`🏥 <b>INTERNACIÓN (${n}/3):</b> ${text}${agedText}${teamNote}`);
    renderHUD();
    renderSingleContinue(
      "SALUD MENTAL",
      `${text}${agedText}${teamNote} Volvés a la escena con la salud mental en ${recovered}. Si te vuelve a pasar dos veces más, ahí sí se termina la carrera.`,
      () => nextTurn(),
      "Volver a la escena"
    );
  }

  function triggerReflex() {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    // El clutch varía entre 1 y 3 rounds — cuantos más enemigos te queden por
    // eliminar en el 1vX, más objetivos seguidos vas a tener que acertar.
    const rounds = 1 + Math.floor(Math.random() * 3); // 1, 2 o 3
    const roundsText = rounds === 1
      ? "Se te viene un 1v1. Cuando confirmes va a aparecer un círculo rojo — hacé click apenas lo veas."
      : `Se te viene un 1v${rounds}. Cuando confirmes vas a tener que eliminar a los ${rounds} rivales que quedan, uno por uno: van a aparecer ${rounds} círculos rojos seguidos (con 1 segundo entre cada uno) — hacé click en cada uno apenas lo veas.`;
    renderSingleContinue(
      "MOMENTO CLUTCH",
      roundsText,
      () => {
        openReflexModal(rounds, fx => {
          applyEffects(fx);
          renderHUD();
          renderSingleContinue("MOMENTO CLUTCH", fx.resultText, () => nextTurn());
        });
      },
      "Confirmar y jugar el clutch"
    );
  }

  /* ---------------------------------------------------------
     MINIJUEGO DE REFLEJOS
  --------------------------------------------------------- */

  // rounds: cuántos objetivos hay que acertar seguidos (1 a 3, uno por cada
  // rival que queda en el 1vX). Aparecen de a uno, con 1 segundo de pausa
  // entre el final de un round y el arranque del siguiente, y el texto de
  // instrucciones muestra cuántos quedan.
  function openReflexModal(rounds, onDone) {
    const modal = $("#reflex-modal");
    const field = $("#reflex-field");
    const target = $("#reflex-target");
    const result = $("#reflex-result");
    const instructions = $("#reflex-instructions");
    result.textContent = "";
    target.style.display = "none";
    modal.classList.add("active");

    const outcomes = []; // reactionMs por round, o null si falló

    function playRound(roundNum) {
      instructions.textContent = rounds > 1
        ? `Rival ${roundNum}/${rounds} — hacé click en el objetivo apenas aparezca.`
        : "Hacé click en el objetivo apenas aparezca.";

      const delay = 400 + Math.random() * 700;
      setTimeout(() => {
        const maxX = field.clientWidth - 46;
        const maxY = field.clientHeight - 46;
        target.style.left = Math.random() * maxX + "px";
        target.style.top = Math.random() * maxY + "px";
        target.style.display = "block";
        const appeared = performance.now();
        let timeoutMiss;

        const onClick = () => {
          const reactionMs = performance.now() - appeared;
          clearTimeout(timeoutMiss);
          target.style.display = "none";
          target.removeEventListener("click", onClick);
          outcomes.push(reactionMs);
          advance(roundNum);
        };
        target.addEventListener("click", onClick);

        timeoutMiss = setTimeout(() => {
          target.removeEventListener("click", onClick);
          target.style.display = "none";
          outcomes.push(null);
          advance(roundNum);
        }, 900);
      }, delay);
    }

    function advance(roundNum) {
      if (roundNum < rounds) {
        instructions.textContent = `Quedan ${rounds - roundNum} rival${rounds - roundNum === 1 ? "" : "es"}... preparate.`;
        setTimeout(() => playRound(roundNum + 1), 1000); // 1 segundo entre cada objetivo
      } else {
        finish();
      }
    }

    playRound(1);

    function finish() {
      const totalFx = {};
      const msgs = [];
      let hits = 0, kills = 0;
      outcomes.forEach((reactionMs, i) => {
        const label = rounds > 1 ? `Rival ${i + 1}: ` : "";
        let fx, msg, k;
        if (reactionMs === null) {
          fx = { aim: -5, mental: -2 }; msg = `${label}reaccionaste tarde, se te escapa.`; k = 0;
        } else if (reactionMs < 300) {
          fx = { aim: 8, rating: 4 }; msg = `${label}reflejos de otro nivel (${Math.round(reactionMs)}ms).`; k = 3; hits++;
        } else if (reactionMs < 550) {
          fx = { aim: 4, rating: 2 }; msg = `${label}buena reacción (${Math.round(reactionMs)}ms).`; k = 2; hits++;
        } else {
          fx = { aim: 1 }; msg = `${label}llegaste justo (${Math.round(reactionMs)}ms).`; k = 1; hits++;
        }
        kills += k;
        msgs.push(msg);
        for (const key in fx) totalFx[key] = (totalFx[key] || 0) + fx[key];
      });
      // Se promedia el efecto sobre stats para que un clutch de 3 no escale
      // el triple que uno de 1, pero sí pese más.
      const scale = Math.max(1, rounds * 0.7);
      for (const key in totalFx) totalFx[key] = Math.round(totalFx[key] / scale);

      state.clutches = (state.clutches || 0) + hits;
      state.kills = (state.kills || 0) + kills;

      const clutchWon = hits === rounds;
      const headline = rounds > 1
        ? (clutchWon ? `¡CLUTCH GANADO! Eliminaste a los ${rounds} rivales.` : `Clutch fallido: solo ${hits}/${rounds}.`)
        : (clutchWon ? "¡Ronda ganada!" : "Ronda perdida.");
      totalFx.resultText = `${headline} ${msgs.join(" ")} (+${kills} kills)`;
      result.textContent = totalFx.resultText;
      setTimeout(() => {
        modal.classList.remove("active");
        onDone(totalFx);
      }, 1100);
    }
  }

  /* ---------------------------------------------------------
     TIENDA
  --------------------------------------------------------- */

  function renderShop() {
    $("#shop-money").textContent = state.money;
    const grid = $("#shop-grid");
    grid.innerHTML = "";
    // Inflación global: sube con CADA compra de CUALQUIER ítem, no solo con
    // las compras del ítem puntual. Así toda la tienda se va poniendo más
    // cara a medida que gastás plata en ella.
    const inflation = Math.pow(SHOP_INFLATION, state.shopPurchasesTotal || 0);
    // Recargo por plata: se toma el mayor monto que tuviste en el bolsillo
    // (state.peakMoney), no la plata que tenés en este instante, para que no
    // se pueda "hacer trampa" gastando todo antes de entrar a la tienda.
    const wealth = Math.max(state.peakMoney || 0, state.money);
    const visibleItems = SHOP_ITEMS.filter(item => item.maxStage == null || state.stage <= item.maxStage);
    if (!visibleItems.length) {
      grid.innerHTML = `<p style="color:var(--muted);font-size:13px;">No hay nada nuevo para vos en la tienda por ahora.</p>`;
      return;
    }
    visibleItems.forEach(item => {
      const bought = state.shopPurchases[item.id] || 0;
      const moneySurcharge = Math.round(wealth * (item.moneyFactor || 0));
      const currentCost = Math.round(item.cost * inflation) + moneySurcharge;
      const div = document.createElement("div");
      div.className = "shop-item";
      const disabled = bought >= item.max || state.money < currentCost;
      const hint = fxToHint(item.fx, item.note);
      div.innerHTML = `<div><div class="s-name">${item.name}</div><div class="s-desc">${hint} · $${currentCost} · ${bought}/${item.max} usados</div></div>
        <button class="shop-buy" ${disabled ? "disabled" : ""}>Comprar</button>`;
      div.querySelector("button").addEventListener("click", () => {
        if (state.money < currentCost || bought >= item.max) return;
        state.money -= currentCost;
        state.shopPurchases[item.id] = bought + 1;
        state.shopPurchasesTotal = (state.shopPurchasesTotal || 0) + 1;
        applyEffects(item.fx);
        addLog(`<b>TIENDA:</b> compraste "${item.name}" por $${currentCost}. Los precios de la tienda suben un poco.`);
        renderHUD();
        renderShop();
      });
      grid.appendChild(div);
    });
  }

  /* ---------------------------------------------------------
     FIN DE CARRERA
  --------------------------------------------------------- */

  function endGame(reason) {
    state.ended = true;
    const unlocked = loadUnlocked();
    const newly = [];
    ACHIEVEMENTS.forEach(a => {
      if (a.check(state)) {
        if (!unlocked.has(a.id)) newly.push(a);
        unlocked.add(a.id);
      }
    });
    saveUnlocked(unlocked);

    const titles = {
      burnout: "COLAPSO TOTAL",
      crisis: "LA PRESIÓN GANÓ",
      age_limit: "EL CUERPO YA NO DA",
      retired_voluntary: "COLGASTE EL MOUSE",
    };
    const summaries = {
      burnout: `A los ${state.age}, después de tres internaciones, tu cabeza dice basta y ya no hay forma de sostener la carrera. Esta vez la recuperación no tiene vuelta al server: el equipo te reemplaza, los sponsors se bajan, y tu nombre desaparece de las transmisiones. Te vas de la escena entero, aunque no entendas todavía del todo qué fue lo que se rompió.`,
      age_limit: state.stats.mental < 40
        ? `A los ${state.age}, con la cabeza tan castigada como el cuerpo, ya no te da para seguir compitiendo al nivel que exige la escena. Es momento de dejarle la mira a la próxima generación.`
        : "Los reflejos ya no acompañan como antes. Es momento de dejarle la mira a la próxima generación.",
      retired_voluntary: `A los ${state.age} decidís que ya diste lo que tenías que dar. Cerrás tu carrera por tu cuenta.`,
    };

    const stages = stagesFor(state.circuit);
    $("#end-title").textContent = titles[reason] || "CARRERA TERMINADA";
    $("#end-summary").textContent =
      `${summaries[reason]} Llegaste hasta: ${stages[state.maxStage].name} (${stages[state.maxStage].badge}).`;

    const statsDiv = $("#end-stats");
    statsDiv.innerHTML = "";
    const pairs = [
      ["Edad", state.age], ["Rating", state.stats.rating], ["Aim", state.stats.aim],
      ["Game sense", state.stats.gameSense], ["Química", state.stats.chemistry],
      ["Popularidad", state.stats.popularity], ["Salud mental", state.stats.mental],
      ["Plata", "$" + state.money], ["Títulos", state.tournamentWins],
      ["Kills", state.kills || 0], ["Clutches", state.clutches || 0],
      ["Internaciones", state.hospitalizations || 0],
      ["Equipo", state.team || "Free agent"],
    ];
    pairs.forEach(([l, v]) => {
      const d = document.createElement("div");
      d.className = "end-stat";
      d.innerHTML = `<div class="v">${v}</div><div class="l">${l}</div>`;
      statsDiv.appendChild(d);
    });

    const unlockedDiv = $("#unlocked-achv");
    unlockedDiv.innerHTML = "";
    if (newly.length) {
      const h = document.createElement("h2");
      h.textContent = "Nuevo(s) logro(s) desbloqueado(s)";
      h.style.fontSize = "18px";
      h.style.textTransform = "uppercase";
      h.style.marginBottom = "12px";
      unlockedDiv.appendChild(h);
      newly.forEach(a => {
        const d = document.createElement("div");
        d.className = "unlocked-card";
        d.innerHTML = `<b>${a.name}</b><p>${a.desc}</p>`;
        unlockedDiv.appendChild(d);
      });
    }

    const n2 = renderAchvGrid($("#achv-grid-end"));
    $("#achv-count-2").textContent = n2;

    showScreen("screen-end");
  }

  /* ---------------------------------------------------------
     EVENTOS DE UI GENERALES
  --------------------------------------------------------- */

  function initGameScreenEvents() {
    $("#btn-shop").addEventListener("click", () => {
      renderShop();
      $("#shop-modal").classList.add("active");
    });
    $("#shop-close").addEventListener("click", () => $("#shop-modal").classList.remove("active"));
    $("#shop-modal").addEventListener("click", e => { if (e.target.id === "shop-modal") $("#shop-modal").classList.remove("active"); });

    $("#btn-retire").addEventListener("click", () => {
      if (state.age >= 30) endGame("retired_voluntary");
    });

    $("#btn-restart").addEventListener("click", () => {
      selectedRole = null;
      selectedGender = null;
      selectedArchetype = null;
      selectedMain = null;
      $("#nickname").value = "";
      $all(".role-card").forEach(c => c.classList.remove("selected"));
      $("#role-desc").textContent = "Elegí un rol para ver su descripción.";
      $("#gender-desc").textContent = "Elegí una identidad para ver a qué circuito competitivo entrás: no hay equipos mixtos en la escena.";
      $("#archetype-desc").textContent = "Elegí cómo arrancás tu carrera.";
      renderMainGrid(null);
      $("#btn-play").disabled = true;
      refreshAchvCounters();
      showScreen("screen-intro");
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    initIntro();
    initGameScreenEvents();
  });

})();
