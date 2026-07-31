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
        hint: `${t.desc} · +💰$${t.money} · sueldo $${t.salary}/paga`,
        team, salary: t.salary,
        fx: Object.assign({ money: t.money }, t.fx),
      };
    });
    choices.push({
      label: "Rechazás las tres ofertas, por ahora",
      hint: "Seguís independiente. +🧠 mental",
      fx: { mental: 3 },
    });
    return choices;
  }

  const EVENTS = [
    // --- Etapa 0-1: arrancando ---
    { id:"e1", tag:"VIDA PERSONAL", min:0, max:1, text:"Tus viejos te dicen que el Valorant te va a arruinar la vista y las notas. Insistís en jugar dos horas más antes de cenar.",
      choices:[
        {label:"Les hacés caso y apagás la PC", hint:"+🕊️ paz en casa, -📉 practica", fx:{mental:5,chemistry:-1,gameSense:1}},
        {label:"Decís 'ya voy' y seguís jugando", hint:"+🎯 aim, -🧠 mental", fx:{aim:4,mental:-3,chemistry:1}},
        {label:"Negociás media hora más y después apagás", hint:"punto medio", fx:{aim:2,mental:1,chemistry:1}},
      ]},
    { id:"e2", tag:"RANKED", min:0, max:1, text:"Un random del ranked te empieza a puentear por el chat de voz porque 'no rotaste a tiempo'.",
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
    { id:"e5", tag:"META", min:0, max:1, text:"Sale un parche grande que cambia el meta de agentes. Tu main queda nerfeado.",
      choices:[
        {label:"Te adaptás y probás agentes nuevos", hint:"+🧭 game sense, -🎯 aim", fx:{gameSense:4,aim:-2}},
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
        {label:"Te quedás al margen", hint:"-🤝 química", fx:{chemistry:-1}},
        {label:"Proponés votar el pick entre todos", hint:"+🤝 química, +🧭 game sense", fx:{chemistry:3,gameSense:1}},
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
  ];

  const SHOP_ITEMS = [
    { id:"psych", name:"🧑‍⚕️ Sesión con psicólogo deportivo", desc:"+15 🧠 salud mental", cost:80, max:3, fx:{mental:15} },
    { id:"coach", name:"📋 Coach personalizado", desc:"+10 🧭 game sense", cost:100, max:3, fx:{gameSense:10} },
    { id:"gear",  name:"🖱️ Setup gamer premium", desc:"+8 🎯 aim", cost:60, max:3, fx:{aim:8} },
    { id:"editor",name:"🎬 Editor de highlights", desc:"+10 📢 popularidad", cost:50, max:3, fx:{popularity:10} },
    { id:"team",  name:"🤝 Team building con el equipo", desc:"+12 🤝 química", cost:70, max:3, fx:{chemistry:12} },
    { id:"vacay", name:"🏖️ Vacaciones forzadas", desc:"+8 🧠 mental, -3 🎯 aim (te oxidás)", cost:40, max:3, fx:{mental:8,aim:-3} },
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

  function freshState(nickname, roleId, genderId) {
    const role = ROLES.find(r => r.id === roleId);
    const gender = GENDERS.find(g => g.id === genderId);
    const stats = { aim:50, gameSense:50, chemistry:50, popularity:50, mental:50, rating:50 };
    for (const k in role.bonus) stats[k] = clamp(stats[k] + role.bonus[k]);
    return {
      nickname, role: roleId, gender: genderId, circuit: gender.circuit,
      turn: 0, age: 16,
      stats,
      money: 20,
      stage: 0, maxStage: 0,
      tournamentWins: 0,
      rageBreaks: 0,
      usedEventIds: new Set(),
      shopPurchases: {},
      burnedOut: false,
      ended: false,
      team: null,
      salary: 0,
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
        validateForm();
      });
      grid.appendChild(div);
    });
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
    $("#btn-play").disabled = !(nickOk && selectedRole && selectedGender);
  }

  function initIntro() {
    renderRoleGrid();
    renderGenderGrid();
    refreshAchvCounters();
    $("#nickname").addEventListener("input", validateForm);
    $("#create-form").addEventListener("submit", e => {
      e.preventDefault();
      const nickname = $("#nickname").value.trim() || "Player";
      state = freshState(nickname, selectedRole, selectedGender);
      const gender = GENDERS.find(g => g.id === selectedGender);
      showScreen("screen-game");
      renderHUD();
      $("#log-list").innerHTML = "";
      addLog(`🔫 A los 16, con el corazón en la boca, entrás a tu primera ranked con tus ${gender.pronoun}. Nadie sabe todavía en qué te vas a convertir.`);
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
    const role = ROLES.find(r => r.id === state.role);
    $("#hud-role").textContent = role.name.toUpperCase();
    const stages = stagesFor(state.circuit);
    $("#rank-badge").textContent = stages[state.stage].badge;
    $("#rank-stage-label").textContent = stages[state.stage].name;
    $("#hud-age").textContent = state.age;
    $("#hud-turn").textContent = state.turn;
    $("#hud-money").textContent = state.money;
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

    if (ev.dynamic === "teamOffer") {
      $("#event-tag").textContent = ev.tag;
      $("#event-text").textContent = ev.text;
      choices = buildTeamOfferChoices(ev);
    } else {
      const teamName = pickTeamName(state.circuit);
      const usesTeam = ev.text.includes("{TEAM}");
      const text = usesTeam ? ev.text.replaceAll("{TEAM}", teamName) : ev.text;
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
      btn.innerHTML = `${logoHtml}<span class="c-label-wrap"><span class="c-label">${c.label}</span><span class="c-hint">${c.hint || ""}</span></span>`;
      btn.addEventListener("click", () => {
        applyEffects(c.fx);
        if (c.rage) state.rageBreaks++;
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

  function renderSingleContinue(tag, text, onContinue) {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    $("#event-tag").textContent = tag;
    $("#event-text").textContent = text;
    const choicesDiv = $("#event-choices");
    choicesDiv.innerHTML = "";
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = "Continuar";
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

    // condiciones de retiro forzado
    if (state.stats.mental <= 0) {
      state.burnedOut = true;
      // 1 en 10: la presión te pasa una factura mucho más grande que un simple retiro
      if (Math.random() < 0.1) {
        return endGame("crisis");
      }
      return endGame("burnout");
    }
    if (state.age >= 35) {
      return endGame("age_limit");
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
    if (state.stage >= 5) {
      // defensa de título en la cima del circuito
      success = score >= 90;
      if (success) {
        state.tournamentWins++;
        state.stats.rating = clamp(state.stats.rating + 5);
        const prize = Math.round(stg.purse * 0.15);
        state.money += prize;
        text = `${stg.name.toUpperCase()}: defendiste el título. Tu equipo vuelve a levantar el trofeo, tu nombre suena en toda la escena y te llevás $${prize} de la bolsa de premios.`;
      } else {
        state.stats.mental = clamp(state.stats.mental - 5);
        const prize = Math.round(stg.purse * 0.03) + 100;
        state.money += prize;
        text = `${stg.name.toUpperCase()}: quedaste eliminada/o en fase de grupos esta vez. Duele, pero ya estás entre los mejores del circuito. Te llevás $${prize}.`;
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
        text = `TORNEO: tu equipo avanza de nivel. Ahora estás en: ${stages[state.stage].name} — te llevás $${prize} de premio.`;
      } else {
        state.stats.rating = clamp(state.stats.rating - 6);
        state.stats.mental = clamp(state.stats.mental - 6);
        state.money += 30;
        text = `TORNEO: quedaste afuera esta vez. Toca seguir grindeando en ${stg.name}.`;
      }
    }
    addLog(`<b>TORNEO:</b> ${text}`);
    renderHUD();
    renderSingleContinue("TORNEO", text, () => nextTurn());
  }

  function triggerReflex() {
    const existingHeader = $("#event-card").querySelector(".event-team-header");
    if (existingHeader) existingHeader.remove();
    $("#event-tag").textContent = "MOMENTO CLUTCH";
    $("#event-text").textContent = "Se te viene un 1vX. Prestá atención al modal de reflejos.";
    $("#event-choices").innerHTML = "";
    openReflexModal(fx => {
      applyEffects(fx);
      renderHUD();
      renderSingleContinue("MOMENTO CLUTCH", fx.resultText, () => nextTurn());
    });
  }

  /* ---------------------------------------------------------
     MINIJUEGO DE REFLEJOS
  --------------------------------------------------------- */

  function openReflexModal(onDone) {
    const modal = $("#reflex-modal");
    const field = $("#reflex-field");
    const target = $("#reflex-target");
    const result = $("#reflex-result");
    result.textContent = "";
    target.style.display = "none";
    modal.classList.add("active");

    const delay = 400 + Math.random() * 900;
    let appeared = 0;
    let timeoutMiss;

    setTimeout(() => {
      const maxX = field.clientWidth - 46;
      const maxY = field.clientHeight - 46;
      target.style.left = Math.random() * maxX + "px";
      target.style.top = Math.random() * maxY + "px";
      target.style.display = "block";
      appeared = performance.now();

      const onClick = () => {
        const reactionMs = performance.now() - appeared;
        clearTimeout(timeoutMiss);
        target.style.display = "none";
        target.removeEventListener("click", onClick);
        finish(reactionMs);
      };
      target.addEventListener("click", onClick);

      timeoutMiss = setTimeout(() => {
        target.removeEventListener("click", onClick);
        target.style.display = "none";
        finish(null);
      }, 900);
    }, delay);

    function finish(reactionMs) {
      let fx, msg;
      if (reactionMs === null) {
        fx = { aim: -5, mental: -2 };
        msg = "Reaccionaste tarde. El clutch se te escapa.";
      } else if (reactionMs < 300) {
        fx = { aim: 8, rating: 4 };
        msg = `Reflejos de otro nivel (${Math.round(reactionMs)}ms). Clutch conseguido.`;
      } else if (reactionMs < 550) {
        fx = { aim: 4, rating: 2 };
        msg = `Buena reacción (${Math.round(reactionMs)}ms). Ganás la ronda.`;
      } else {
        fx = { aim: 1 };
        msg = `Llegaste justo (${Math.round(reactionMs)}ms). Ronda pareja.`;
      }
      fx.resultText = msg;
      result.textContent = msg;
      setTimeout(() => {
        modal.classList.remove("active");
        onDone(fx);
      }, 900);
    }
  }

  /* ---------------------------------------------------------
     TIENDA
  --------------------------------------------------------- */

  function renderShop() {
    $("#shop-money").textContent = state.money;
    const grid = $("#shop-grid");
    grid.innerHTML = "";
    SHOP_ITEMS.forEach(item => {
      const bought = state.shopPurchases[item.id] || 0;
      const div = document.createElement("div");
      div.className = "shop-item";
      const disabled = bought >= item.max || state.money < item.cost;
      div.innerHTML = `<div><div class="s-name">${item.name}</div><div class="s-desc">${item.desc} · $${item.cost} · ${bought}/${item.max} usados</div></div>
        <button class="shop-buy" ${disabled ? "disabled" : ""}>Comprar</button>`;
      div.querySelector("button").addEventListener("click", () => {
        if (state.money < item.cost || bought >= item.max) return;
        state.money -= item.cost;
        state.shopPurchases[item.id] = bought + 1;
        applyEffects(item.fx);
        addLog(`<b>TIENDA:</b> compraste "${item.name}".`);
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
      burnout: `A los ${state.age} tu cabeza dice basta, y no hay rating ni título que la haga cambiar de opinión. Un día simplemente no te levantás para practicar. El equipo te reemplaza en dos semanas, los sponsors se bajan en un mes, y tu nombre desaparece de las transmisiones. Te vas de la escena entero, aunque no entendas todavía del todo qué fue lo que se rompió.`,
      crisis: `A los ${state.age} el cuerpo y la cabeza dicen basta al mismo tiempo. Terminás internada/o, lejos de las pantallas, de los servers y de la presión. La escena sigue girando sin vos: se anuncia tu baja del roster, corre el rumor de "problemas personales", y por un buen tiempo tu nombre solo aparece en tuits de gente que se pregunta qué fue de tu carrera. Tu recuperación no tiene un marcador de progreso ni un timer — pasa en otro tiempo, uno que ningún torneo mide.`,
      age_limit: "Los reflejos ya no acompañan como antes. Es momento de dejarle la mira a la próxima generación.",
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
      $("#nickname").value = "";
      $all(".role-card").forEach(c => c.classList.remove("selected"));
      $("#role-desc").textContent = "Elegí un rol para ver su descripción.";
      $("#gender-desc").textContent = "Elegí una identidad para ver a qué circuito competitivo entrás: no hay equipos mixtos en la escena.";
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
