import {HUB_LAYOUTS} from './hub-layouts.js?v=16';
export const WORLD = { width: 1920, height: 1280 };
export const SPELLS = {
  tide: { name: 'Getijdenwaaier', short: 'GETIJ', color: '#73e2e5', dark: '#126c8b', key: '1', damage: 13, cost: 4, interval: .22, speed: 780, radius: 11, status: 'wet', description: 'Drie waterbogen waaieren uit en maken doelen NAT. Wissel naar storm voor kettingbliksem.' },
  storm: { name: 'Boogbliksem', short: 'STORM', color: '#ceb2ff', dark: '#7958ca', key: '2', damage: 20, cost: 8, interval: .4, speed: 1000, radius: 9, status: 'shock', description: 'Natte doelen geven +70% schade en leiden bliksem door naar twee vijanden.' },
  ember: { name: 'Zonnebom', short: 'ZON', color: '#ffbc66', dark: '#b74c27', key: '3', damage: 30, cost: 12, interval: .7, speed: 620, radius: 15, status: 'burn', description: 'Een gebogen vuurbom ontploft op de grond en laat brandschade achter. NAT + ZON veroorzaakt een stoomgolf.' },
  prism:{name:'Prismaboog',short:'PRISMA',color:'#ffe49a',dark:'#c18340',damage:44,cost:28,interval:2.8,speed:960,radius:12,unlockLevel:7,shopOnly:true,description:'Richt een vliegende prismalans. Na een treffer springt hij naar maximaal twee andere doelen; iedere sprong doet 25% minder schade. Exclusief bij de Focusmaker vanaf Veldmakers, 650 schroot.'},
  frost: {name:'IJslans',short:'IJS',color:'#a9edff',dark:'#468ca7',damage:28,cost:11,interval:.55,speed:1080,radius:10,unlockLevel:2,status:'slow',description:'Een scherpe lans doorboort de hele rij. Vertraagt; natte doelen bevriezen kort.'},
  gale: {name:'Windboemerang',short:'WIND',color:'#b7f1bd',dark:'#428c75',damage:19,cost:9,interval:.65,speed:590,radius:24,unlockLevel:3,status:'push',description:'Een draaiende windschijf raakt op de heen- én terugweg en duwt vijanden weg.'},
  gravity: {name:'Zwaartekern',short:'KERN',color:'#e3a7ff',dark:'#8652a0',damage:42,cost:20,interval:1.3,speed:240,radius:22,unlockLevel:4,status:'pull',description:'Een trage kern trekt vijanden samen en implodeert. Volg op met een zonnebom.'}
  ,glacier:{name:'IJsbarrière',short:'VRIES',color:'#a9edff',dark:'#42829b',damage:18,cost:26,interval:4.5,radius:185,unlockLevel:3,element:'frost',area:true,duration:3,description:'Een smalle, dwars op je richting geplaatste ijsbarrière. Alleen vijanden in de strook worden vertraagd; natte doelen bevriezen.'},
  cyclone:{name:'Cycloon',short:'CYCL.',color:'#b7f1bd',dark:'#428c75',damage:16,cost:30,interval:5.5,radius:125,unlockLevel:4,element:'gale',area:true,duration:3.5,description:'Een smalle rondtrekkende tornado. Trekt vijanden naar zijn kern en sleept de groep mee in je gekozen richting.'},
  tempest:{name:'Stormfront',short:'FRONT',color:'#ceb2ff',dark:'#7958ca',damage:24,cost:34,interval:6,radius:205,unlockLevel:5,element:'storm',area:true,duration:3,description:'Een onweerswolk kiest per salvo maximaal drie verschillende doelen. Gerichte blikseminslagen ketenen via natte vijanden.'},
  orbital:{name:'Zonneval',short:'VAL',color:'#ffbc66',dark:'#b74c27',damage:70,cost:38,interval:7,radius:220,unlockLevel:6,element:'ember',area:true,duration:2.5,description:'Drie afzonderlijk aangekondigde zonne-inslagen, na 0,6 / 1,35 / 2,1 seconden. Elke krater verbrandt vijanden en ruimt sporen op.'}
};
export const ZONES = [
  { id:'flood', name:'De Verdronken Ring', subtitle:'Rotterdam · de laatste droge perrons', file:'flood-arena.webp', accent:'#73d7d8', ambient:[21,60,70], core:'Atmosferische lens', story:'De ringweg is een rivier geworden. Herstel de twee meetstations en berg de lens die de stormlaag kan lezen.', rule:'Water vertraagt en maakt iedereen nat. Geleid storm door vijandgroepen.', hazard:'water', enemies:['crawler','drone','raider','sniper','turret'], biomeText:'Een stad op de waterlijn', log:'De lens leest wolken, aerosolen en vocht. Het klimaat sturen begint met begrijpen wat er al beweegt.' },
  { id:'heat', name:'De Rode Kilometer', subtitle:'Brabant · onder de hittekoepel', file:'heat-arena.webp', accent:'#efaf6d', ambient:[106,53,24], core:'Oceaanverdeler', story:'De energieroute staat in brand. Kalibreer de koelpunten; de oceaanverdeler wacht achter het oude transportnet.', rule:'Hittescheuren bouwen hitte op. Koel jezelf met de getijdenstraal of de bron bij het station.', hazard:'heat', enemies:['raider','sniper','sentinel','crawler','turret'], biomeText:'Waar schaduw levens redt', log:'De verdeler koppelt oceaanstroming aan lokale koeling. Een ingreep zonder terugkoppeling verplaatst het probleem.' },
  { id:'grove', name:'Het Zoutwoud', subtitle:'Veluwe · het levende kennispark', file:'grove-arena.webp', accent:'#a6dc8d', ambient:[34,74,43], core:'Biosfeersleutel', story:'Wortels en glasvezel delen één netwerk. Herstel de bioarchieven om de sleutel uit dit levende laboratorium te halen.', rule:'Sporenvelden vergiftigen. Verbrand de bloei met zonnevlam, of ontwijk de groei.', hazard:'spore', enemies:['beast','sporecaster','stormling','crawler','sniper'], biomeText:'Niet alles wat terugkeert is veilig', log:'De biosfeersleutel bewaart duizenden mogelijke reacties. Herstel werkt alleen als het systeem mag antwoorden.' },
  { id:'aurelia', name:'De Aurelia-spits', subtitle:'Noordzee · boven de stormlaag', file:'aurelia-arena.webp', accent:'#f2d58b', ambient:[35,50,61], core:'De Gouden Kern', story:'Drie kalibraties zijn gekoppeld. De Gouden Wachter toetst wie de correctie mag beginnen — en wie haar weer kan stoppen.', rule:'Gouden velden wisselen van polariteit. Lees de waarschuwingsringen van de Wachter.', hazard:'polarity', enemies:['siege','stormling','sentinel','sporecaster','turret'], biomeText:'De horizon is nog van ons', log:'Een oplossing die niemand kan stoppen is geen oplossing. Aurelia koppelt elke ingreep aan lokale meting en een regionaal veto.' }
];
export const ENEMIES = {
  drone:{name:'Inspectiedrone',sprite:0,hp:82,damage:9,speed:118,radius:22,size:76,range:380,xp:10,color:'#e69368'},
  raider:{name:'Zonnerover',sprite:1,hp:130,damage:14,speed:138,radius:25,size:88,range:125,xp:15,color:'#f5a879'},
  beast:{name:'Wortelwachter',sprite:2,hp:160,damage:13,speed:110,radius:28,size:104,range:340,xp:18,color:'#b5d989'},
  turret:{name:'Booggeschut',sprite:3,hp:145,damage:12,speed:22,radius:26,size:88,range:550,xp:16,color:'#dac290'},
  boss:{name:'De Gouden Wachter',sprite:4,hp:1800,damage:22,speed:69,radius:43,size:182,range:600,xp:80,color:'#f5d58c'}
  ,crawler:{name:'Schrootschraper',sprite:'crawler',atlas:'expedition',hp:65,damage:8,speed:175,radius:20,size:62,range:90,xp:9,color:'#cd865d',attack:'bite',role:'melee'},
  sniper:{name:'Asjager',sprite:'sniper',atlas:'expedition',hp:105,damage:18,speed:103,radius:23,size:101,range:620,xp:17,color:'#e5c5a0',attack:'snipe',role:'ranged'},
  sentinel:{name:'Hitteschild',sprite:'sentinel',atlas:'expedition',hp:230,damage:18,speed:81,radius:29,size:115,range:165,xp:24,color:'#d9b572',attack:'slam',role:'tank'},
  sporecaster:{name:'Sporendrager',sprite:'sporecaster',atlas:'expedition',hp:140,damage:11,speed:88,radius:24,size:103,range:460,xp:21,color:'#adc883',attack:'spores',role:'ranged'},
  stormling:{name:'Stormkwal',sprite:'stormling',atlas:'expedition',hp:155,damage:13,speed:133,radius:22,size:88,range:350,xp:22,color:'#c6a8ec',attack:'chainburst',role:'orbit'},
  siege:{name:'Hydraulische Breker',sprite:'siege',atlas:'expedition',hp:310,damage:23,speed:64,radius:30,size:127,range:490,xp:32,color:'#e8c77d',attack:'siege',role:'tank'}
};
export const EQUIPMENT = [
  {id:'tide-staff',slot:'weapon',name:'Staf van de Waterlijn',rarity:'rare',icon:'tide',text:'+18% getijdenschade. Natte doelen blijven 2 seconden langer nat.',stats:{tide:.18,wetTime:2}},
  {id:'storm-staff',slot:'weapon',name:'Atmosferische Scepter',rarity:'rare',icon:'storm',text:'+18% stormschade. Geleid één extra doel.',stats:{storm:.18,chain:1}},
  {id:'sun-staff',slot:'weapon',name:'Zonnekern',rarity:'rare',icon:'ember',text:'+20% zonneschade en +25% brandduur.',stats:{ember:.2,burnTime:.25}},
  {id:'prism',slot:'weapon',name:'Prismatische Focus',rarity:'epic',icon:'prism',text:'+12% alle spreukschade en +8% kritieke kans.',stats:{power:.12,crit:.08}},
  {id:'tide-coat',slot:'suit',name:'Getijdenmantel',rarity:'rare',icon:'shield',text:'+20 maximaal leven. Water vertraagt je niet meer.',stats:{hp:20,waterproof:1}},
  {id:'cinder-coat',slot:'suit',name:'Koelnetmantel',rarity:'rare',icon:'shield',text:'+15 maximaal leven. Hitte bouwt 50% langzamer op.',stats:{hp:15,heatGuard:.5}},
  {id:'bloom-coat',slot:'suit',name:'Levende Veldjas',rarity:'epic',icon:'leaf',text:'+25 maximaal leven. Iedere kill herstelt 3 leven.',stats:{hp:25,leech:3}},
  {id:'brass-coat',slot:'suit',name:'Aurelia-weefsel',rarity:'epic',icon:'shield',text:'+30 maximaal leven en 12% schadevermindering.',stats:{hp:30,armor:.12}},
  {id:'reservoir',slot:'relic',name:'Condenshart',rarity:'rare',icon:'tide',text:'+30 maximaal mana en +3 manaherstel per seconde.',stats:{mana:30,regen:3}},
  {id:'vector',slot:'relic',name:'Vectorlus',rarity:'rare',icon:'dash',text:'Ontwijken laadt 25% sneller. +10% loopsnelheid.',stats:{dash:.25,speed:.1}},
  {id:'feedback',slot:'relic',name:'Terugkoppelingslens',rarity:'epic',icon:'prism',text:'Elementcombinaties laden je ultieme vaardigheid 30% sneller.',stats:{comboCharge:.3}},
  {id:'seed',slot:'relic',name:'Biosfeerzaad',rarity:'epic',icon:'leaf',text:'Herstel 1 leven per seconde als je 5 seconden geen schade ontvangt.',stats:{recovery:1}}
];
export const START_EQUIPMENT = {
  weapon:{id:'field-staff',slot:'weapon',name:'Veldstaf',rarity:'common',icon:'storm',text:'Een vertrouwde focus voor je expeditievaardigheden.',stats:{}},
  suit:{id:'field-coat',slot:'suit',name:'Reddersjas',rarity:'common',icon:'shield',text:'Gebouwd voor een lange expeditie.',stats:{}},
  relic:{id:'field-lens',slot:'relic',name:'Meetlens',rarity:'common',icon:'prism',text:'Leest de intenties van het klimaatnet.',stats:{}},
  boots:{id:'field-boots',slot:'boots',name:'Versleten veldlaarzen',rarity:'common',text:'Een betrouwbaar begin.',stats:{}},
  gloves:{id:'field-gloves',slot:'gloves',name:'Werkhandschoenen',rarity:'common',text:'Beschermen je handen tijdens de expeditie.',stats:{}},
  belt:{id:'field-belt',slot:'belt',name:'Veldgordel',rarity:'common',text:'Ruimte voor voorraad en gereedschap.',stats:{}}
};
export const UPGRADES = [
  {id:'move',name:'Routegevoel',icon:'leaf',text:'+12% loopsnelheid. Je ziet de nieuwe snelheid in je veldpak.',stats:{speed:.12}},
  {id:'power',name:'Scherpe afstelling',icon:'storm',text:'+12% alle spreukschade.',stats:{power:.12}},
  {id:'vitality',name:'Veldconditie',icon:'shield',text:'+18 maximaal leven en herstel 25.',stats:{hp:18},heal:25},
  {id:'flow',name:'Diepe reserves',icon:'tide',text:'+20 mana en +2 manaherstel.',stats:{mana:20,regen:2}},
  {id:'dash',name:'Lichte vectoren',icon:'dash',text:'Ontwijken laadt 15% sneller.',stats:{dash:.15}},
  {id:'crit',name:'Kritieke focus',icon:'prism',text:'+8% kritieke kans.',stats:{crit:.08}},
  {id:'ultimate',name:'Overloop',icon:'ultimate',text:'Combinaties laden de kernpuls 25% sneller.',stats:{comboCharge:.25}},

];
export const DISCIPLINES = [
  {id:'tide',name:'Getijdenloper',text:'Meer mana · controle & combinaties',stats:{mana:20,regen:2},relic:'Een rustige hand in stormwater.'},
  {id:'storm',name:'Stormgeleider',text:'Meer schade · precisie & kettingreacties',stats:{power:.08,crit:.05},relic:'Elke stroom zoekt een weg.'},
  {id:'ember',name:'Zonnewever',text:'Meer leven · explosies & terreinbeheer',stats:{hp:20,ember:.12},relic:'Vuur is ook een vorm van herstel.'}
];
export const RARITIES = {common:{name:'COMMON',color:'#677171',rank:0,factor:.55,value:.7},uncommon:{name:'UNCOMMON',color:'#39734c',rank:1,factor:.8,value:1.1},rare:{name:'RARE',color:'#276f94',rank:2,factor:1,value:1.8},epic:{name:'EPIC',color:'#754a8b',rank:3,factor:1.25,value:2.8},legendary:{name:'LEGENDARY',color:'#9b6020',rank:4,factor:1.6,value:4.3},field:{name:'COMMON',color:'#677171',rank:0,factor:.55,value:.7}};
export const SLOT_NAMES={weapon:'Focus',suit:'Mantel',relic:'Relikwie',boots:'Laarzen',gloves:'Handschoenen',belt:'Gordel'};
export const POSITIONS = {start:{x:490,y:815},relayA:{x:538,y:384},relayB:{x:1382,y:794},exit:{x:1536,y:346},boss:{x:1080,y:550},archive:{x:840,y:905}};

// Each route has a traced union of walkable floors; portals are actual exits, not teleports on the atlas.
export const HUB_IDS=['ring','kilometer','saltwood','aurelia'];
export const AREAS = [
  {
    "id": "canal",
    "portalPocket": [
      0.6016666666666667,
      0.4925
    ],
    "name": "De Getijdenkade",
    "file": "canal-route.webp",
    "zone": 0,
    "kind": "route",
    "nav": [
      [
        [
          0.18,
          0.62
        ],
        [
          0.75,
          0.2
        ],
        [
          0.82,
          0.2
        ],
        [
          0.82,
          0.25
        ],
        [
          0.24,
          0.67
        ],
        [
          0.18,
          0.67
        ]
      ],
      [
        [
          0.55,
          0.4
        ],
        [
          0.6,
          0.4
        ],
        [
          0.68,
          0.53
        ],
        [
          0.62,
          0.56
        ],
        [
          0.59,
          0.51
        ]
      ],
      [
        [
          0.61,
          0.54
        ],
        [
          0.66,
          0.52
        ],
        [
          0.73,
          0.57
        ],
        [
          0.7,
          0.62
        ],
        [
          0.64,
          0.62
        ],
        [
          0.61,
          0.59
        ]
      ]
    ],
    "spawn": [
      0.22,
      0.62
    ],
    "exit": [
      0.78,
      0.23
    ],
    "pocket": [
      0.66,
      0.58
    ],
    "links": [
      "ring",
      "rooftops",
      "highway"
    ],
    "map": [
      12,
      72
    ],
    "story": "Begin bij de veilige handelspost en volg de droge brug naar de Verdronken Ring. Met de eerste kern openen de Zonnetuinen en het Transportnet.",
    "unlockCore": 0,
    "portalPoints": [
      [
        0.78,
        0.23
      ],
      [
        0.69,
        0.59
      ],
      [
        0.195,
        0.64
      ]
    ]
  },
  {
    "id": "ring",
    "name": "De Verdronken Ring",
    "file": "flood-arena.webp",
    "zone": 0,
    "kind": "hub",
    "links": [
      "canal"
    ],
    "map": [
      29,
      58
    ],
    "unlockCore": 0
  },
  {
    "id": "rooftops",
    "name": "De Zonnetuinen",
    "file": "rooftop-route.webp",
    "zone": 0,
    "kind": "route",
    "nav": [
      [
        [
          0.12,
          0.6
        ],
        [
          0.79,
          0.15
        ],
        [
          0.86,
          0.18
        ],
        [
          0.85,
          0.23
        ],
        [
          0.21,
          0.65
        ],
        [
          0.12,
          0.66
        ]
      ],
      [
        [
          0.54,
          0.43
        ],
        [
          0.6,
          0.4
        ],
        [
          0.72,
          0.53
        ],
        [
          0.71,
          0.59
        ],
        [
          0.62,
          0.64
        ],
        [
          0.56,
          0.57
        ]
      ],
      [
        [
          0.42,
          0.46
        ],
        [
          0.47,
          0.43
        ],
        [
          0.32,
          0.27
        ],
        [
          0.28,
          0.3
        ]
      ]
    ],
    "spawn": [
      0.22,
      0.6
    ],
    "exit": [
      0.78,
      0.23
    ],
    "pocket": [
      0.61,
      0.58
    ],
    "links": [
      "canal"
    ],
    "map": [
      21,
      32
    ],
    "story": "Een verlaten daktuin bewaart uitrusting. De bewaker in de zijtuin beschermt de voorraad.",
    "unlockCore": 1,
    "portalPoints": [
      [
        0.18,
        0.615
      ]
    ]
  },
  {
    "id": "highway",
    "name": "Het Verlaten Transportnet",
    "file": "highway-route.webp",
    "zone": 1,
    "kind": "route",
    "nav": [
      [
        [
          0.12,
          0.65
        ],
        [
          0.76,
          0.2
        ],
        [
          0.86,
          0.2
        ],
        [
          0.83,
          0.32
        ],
        [
          0.21,
          0.74
        ],
        [
          0.12,
          0.73
        ]
      ],
      [
        [
          0.48,
          0.5
        ],
        [
          0.57,
          0.44
        ],
        [
          0.69,
          0.53
        ],
        [
          0.67,
          0.62
        ],
        [
          0.55,
          0.64
        ],
        [
          0.5,
          0.58
        ]
      ]
    ],
    "spawn": [
      0.22,
      0.62
    ],
    "exit": [
      0.78,
      0.3
    ],
    "pocket": [
      0.57,
      0.59
    ],
    "links": [
      "canal",
      "kilometer",
      "forest"
    ],
    "map": [
      43,
      64
    ],
    "story": "De route naar Brabant ligt open. Zoek verkoeling en volg het asfalt naar de Rode Kilometer.",
    "unlockCore": 1,
    "portalPoints": [
      [
        0.17,
        0.66
      ],
      [
        0.78,
        0.3
      ],
      [
        0.635,
        0.565
      ]
    ]
  },
  {
    "id": "kilometer",
    "name": "De Rode Kilometer",
    "file": "heat-arena.webp",
    "zone": 1,
    "kind": "hub",
    "links": [
      "highway"
    ],
    "map": [
      51,
      43
    ],
    "unlockCore": 1
  },
  {
    "id": "forest",
    "portalPocket": [
      0.4916666666666667,
      0.5125
    ],
    "name": "De Groene Corridor",
    "file": "forest-route.webp",
    "zone": 2,
    "kind": "route",
    "nav": [
      [
        [
          0.19,
          0.59
        ],
        [
          0.68,
          0.28
        ],
        [
          0.78,
          0.2
        ],
        [
          0.81,
          0.21
        ],
        [
          0.77,
          0.27
        ],
        [
          0.69,
          0.34
        ],
        [
          0.25,
          0.66
        ],
        [
          0.19,
          0.64
        ]
      ],
      [
        [
          0.46,
          0.48
        ],
        [
          0.56,
          0.46
        ],
        [
          0.64,
          0.53
        ],
        [
          0.68,
          0.59
        ],
        [
          0.63,
          0.64
        ],
        [
          0.52,
          0.63
        ],
        [
          0.46,
          0.57
        ]
      ],
      [
        [
          0.37,
          0.48
        ],
        [
          0.42,
          0.45
        ],
        [
          0.28,
          0.32
        ],
        [
          0.24,
          0.34
        ]
      ]
    ],
    "spawn": [
      0.22,
      0.62
    ],
    "exit": [
      0.74,
      0.25
    ],
    "pocket": [
      0.55,
      0.6
    ],
    "links": [
      "highway",
      "saltwood",
      "vault",
      "skybridge"
    ],
    "map": [
      63,
      57
    ],
    "story": "De bioverbinding splitst: het Zoutwoud bewaart een kern; de Zaadkluis een zeldzaam prototype.",
    "unlockCore": 2,
    "portalPoints": [
      [
        0.215,
        0.618
      ],
      [
        0.74,
        0.25
      ],
      [
        0.28,
        0.34
      ],
      [
        0.625,
        0.6
      ]
    ]
  },
  {
    "id": "saltwood",
    "name": "Het Zoutwoud",
    "file": "grove-arena.webp",
    "zone": 2,
    "kind": "hub",
    "links": [
      "forest"
    ],
    "map": [
      77,
      43
    ],
    "unlockCore": 2
  },
  {
    "id": "vault",
    "name": "De Zaadkluis",
    "file": "seed-vault.webp",
    "zone": 2,
    "kind": "route",
    "nav": [
      [
        [
          0.14,
          0.61
        ],
        [
          0.76,
          0.17
        ],
        [
          0.83,
          0.19
        ],
        [
          0.83,
          0.24
        ],
        [
          0.22,
          0.67
        ],
        [
          0.14,
          0.65
        ]
      ],
      [
        [
          0.5,
          0.46
        ],
        [
          0.55,
          0.43
        ],
        [
          0.6,
          0.56
        ],
        [
          0.57,
          0.6
        ]
      ],
      [
        [
          0.54,
          0.59
        ],
        [
          0.63,
          0.53
        ],
        [
          0.74,
          0.62
        ],
        [
          0.73,
          0.7
        ],
        [
          0.62,
          0.76
        ],
        [
          0.53,
          0.68
        ]
      ]
    ],
    "spawn": [
      0.22,
      0.62
    ],
    "exit": [
      0.78,
      0.19
    ],
    "pocket": [
      0.55,
      0.65
    ],
    "links": [
      "forest"
    ],
    "map": [
      66,
      22
    ],
    "story": "Onder het kennispark leeft de laatste zaadbank. Overwin haar bewaker en open de prototypekist.",
    "unlockCore": 2,
    "portalPoints": [
      [
        0.18,
        0.64
      ]
    ]
  },
  {
    "id": "skybridge",
    "name": "De Noordzeebrug",
    "file": "skybridge-route.webp",
    "zone": 3,
    "kind": "route",
    "nav": [
      [
        [
          0.16,
          0.57
        ],
        [
          0.77,
          0.14
        ],
        [
          0.85,
          0.15
        ],
        [
          0.84,
          0.21
        ],
        [
          0.25,
          0.64
        ],
        [
          0.16,
          0.64
        ]
      ],
      [
        [
          0.44,
          0.46
        ],
        [
          0.5,
          0.42
        ],
        [
          0.6,
          0.56
        ],
        [
          0.56,
          0.62
        ],
        [
          0.52,
          0.6
        ]
      ],
      [
        [
          0.52,
          0.58
        ],
        [
          0.6,
          0.57
        ],
        [
          0.69,
          0.65
        ],
        [
          0.69,
          0.72
        ],
        [
          0.6,
          0.76
        ],
        [
          0.53,
          0.7
        ]
      ],
      [
        [
          0.63,
          0.34
        ],
        [
          0.67,
          0.32
        ],
        [
          0.82,
          0.46
        ],
        [
          0.87,
          0.48
        ],
        [
          0.89,
          0.52
        ],
        [
          0.84,
          0.55
        ],
        [
          0.78,
          0.5
        ]
      ]
    ],
    "spawn": [
      0.24,
      0.57
    ],
    "exit": [
      0.78,
      0.2
    ],
    "pocket": [
      0.55,
      0.65
    ],
    "links": [
      "forest",
      "aurelia"
    ],
    "map": [
      85,
      63
    ],
    "story": "Aurelia vraagt drie kalibratiekernen. Verbind ze voordat je de toegang tot de spits opent.",
    "unlockCore": 3,
    "portalPoints": [
      [
        0.2,
        0.59
      ],
      [
        0.78,
        0.2
      ]
    ]
  },
  {
    "id": "aurelia",
    "name": "De Aurelia-spits",
    "file": "aurelia-arena.webp",
    "zone": 3,
    "kind": "hub",
    "links": [
      "skybridge"
    ],
    "map": [
      93,
      34
    ],
    "unlockCore": 3
  }
];


// Combat story chapters: each has two groups and its own painted court.
const expeditionFloor=[[.22,.24],[.68,.18],[.84,.25],[.88,.47],[.87,.55],[.76,.69],[.61,.72],[.52,.76],[.30,.72],[.20,.65],[.15,.50]];
AREAS.push(
 {id:'delta',name:'De Rietdelta',file:'reed-delta.webp',zone:0,kind:'hub',side:true,nav:[expeditionFloor],links:['canal'],map:[13,36],unlockCore:0,story:'Herstel een drooggelegd onderhoudseiland. Versla beide groepen en de schrootbewaker.'},
 {id:'mirrors',name:'De Spiegelvelden',file:'mirror-fields.webp',zone:1,kind:'hub',side:true,nav:[expeditionFloor],links:['highway'],map:[46,15],unlockCore:1,story:'Een verlaten zonnepark herbergt de Breker. Win de twee gevechtsgroepen voor een expeditievondst.'},
 {id:'glass',name:'Het Kasfront',file:'glass-front.webp',zone:2,kind:'hub',side:true,nav:[expeditionFloor],links:['forest'],map:[77,17],unlockCore:2,story:'Bevrijd de biokoepel van sporendragers en hun elite. De veilige terugweg opent na beide groepen.'},
 {id:'harbor',name:'De Stormhaven',file:'storm-harbor.webp',zone:3,kind:'hub',side:true,nav:[expeditionFloor],links:['skybridge'],map:[70,83],unlockCore:3,story:'Het laatste onderhoudsplatform wordt bewaakt door stormmachines. Doorsta twee groepen en berg de beloning.'}
);
for(const [camp,id,point]of [['canal','delta',[1222/1920,460/1280]],['highway','mirrors',[1222/1920,508/1280]],['forest','glass',[1174/1920,476/1280]],['skybridge','harbor',[1062/1920,828/1280]]]){const area=AREAS.find(a=>a.id===camp);area.links.push(id);area.portalPoints.push(point);}

// Painted stairs and terraces need a connected floor, including the player's radius.
const quay=AREAS.find(a=>a.id==='canal');
// Trace in painted world pixels: stairs must include their full visible width,
// not just a connected strip that a pathfinder happens to squeeze through.
const quayFloor=points=>points.map(([x,y])=>[x/WORLD.width,y/WORLD.height]);
quay.nav[1]=quayFloor([[1010,540],[1115,510],[1195,645],[1220,675],[1160,715],[1080,665],[1030,620]]);
quay.nav[2]=quayFloor([[1080,635],[1200,650],[1280,640],[1425,725],[1420,795],[1300,850],[1210,865],[1080,775],[1025,685],[1035,650]]);
quay.nav.push(
 quayFloor([[1438,342],[1568,296],[1605,338],[1640,422],[1630,475],[1585,506],[1510,460],[1465,407]]),
 quayFloor([[1510,448],[1595,437],[1740,487],[1775,551],[1710,597],[1600,579],[1525,519]]),
 // The painted arrival square is a side plaza, rather than scenery to walk around.
 [[.095,.696],[.168,.633],[.237,.635],[.271,.700],[.217,.766],[.146,.790],[.078,.766],[.056,.741]],
 // The right stairhead continues beyond the old rectangular road cutoff.
 quayFloor([[1475,300],[1580,240],[1670,225],[1680,255],[1585,342],[1520,380]])
);
for(const [id,layout]of Object.entries(HUB_LAYOUTS))AREAS.find(a=>a.id===id).nav.push(...layout.floors.map(quayFloor));
AREAS.push(
 {id:'brine',name:'De Zoutcentrale',file:'salt-works.webp',zone:1,kind:'hub',side:true,nav:[expeditionFloor],links:['highway'],map:[56,23],unlockCore:1,enemies:['minecrab','sniper','brinebreaker','sentinel'],guardian:'brinebreaker'},
 {id:'clouds',name:'Het Wolkenarchief',file:'cloud-archive.webp',zone:3,kind:'hub',side:true,nav:[expeditionFloor],links:['skybridge'],map:[87,15],unlockCore:3,enemies:['resonant','stormling','minecrab','brinebreaker'],guardian:'resonant'}
);
Object.assign(ENEMIES,{
 minecrab:{name:'Magneetkrab',sprite:'minecrab',atlas:'v52',hp:140,damage:16,speed:94,radius:25,size:87,range:440,xp:20,color:'#dfa969',attack:'mines',role:'ranged'},
 resonant:{name:'Resonant',sprite:'resonant',atlas:'v52',hp:165,damage:15,speed:128,radius:24,size:112,range:580,xp:26,color:'#93dbe2',attack:'echo',role:'orbit'},
 brinebreaker:{name:'Pekelbreker',sprite:'brinebreaker',atlas:'v52',hp:275,damage:19,speed:77,radius:30,size:127,range:310,xp:30,color:'#e2d4b0',attack:'brinejet',role:'tank'}
});
// Introduce the new families gradually and preserve regional character.
AREAS.find(a=>a.id==='delta').enemies=['crawler','drone','minecrab'];
AREAS.find(a=>a.id==='mirrors').enemies=['sniper','sentinel','minecrab'];
AREAS.find(a=>a.id==='glass').enemies=['sporecaster','beast','resonant'];
AREAS.find(a=>a.id==='harbor').enemies=['siege','stormling','brinebreaker','resonant'];

Object.assign(ENEMIES,{
 eel:{name:'Boogjager',sprite:'resonant',atlas:'v52',hp:115,damage:12,speed:165,radius:22,size:83,range:340,xp:18,color:'#71e7dc',role:'orbit'},
 salamander:{name:'Asgraver',sprite:'crawler',atlas:'expedition',hp:170,damage:16,speed:115,radius:23,size:88,range:440,xp:22,color:'#ef9460',role:'ranged'},
 shieldguard:{name:'Schildrover',sprite:'sentinel',atlas:'expedition',hp:195,damage:18,speed:105,radius:27,size:105,range:155,xp:24,color:'#a2d993',role:'tank'},
 stormnest:{name:'Stormnest',sprite:'stormling',atlas:'expedition',hp:210,damage:12,speed:60,radius:28,size:112,range:520,xp:28,color:'#caaff1',role:'ranged'},
 dredger:{name:'De Getijdenmaaier',sprite:'minecrab',atlas:'v52',boss:true,hp:760,damage:20,speed:77,radius:40,size:173,range:530,xp:65,color:'#9de6d5',role:'tank'},
 solarKnight:{name:'De Spiegelvorst',sprite:'brinebreaker',atlas:'v52',boss:true,hp:860,damage:21,speed:82,radius:39,size:183,range:620,xp:75,color:'#ffd185',role:'tank'},
 seedheart:{name:'Het Kiemhart',sprite:2,boss:true,hp:1000,damage:20,speed:63,radius:42,size:195,range:540,xp:85,color:'#b9e992',role:'tank'}
});
ENEMIES.boss.boss=true;
ZONES[0].enemies=['crawler','drone','eel','raider','shieldguard','sniper'];
ZONES[1].enemies=['salamander','sniper','sentinel','minecrab','shieldguard','turret'];
ZONES[2].enemies=['beast','sporecaster','stormnest','eel','shieldguard','resonant'];
ZONES[3].enemies=['siege','stormnest','resonant','salamander','brinebreaker','eel'];
for(const [id,types]of Object.entries({delta:['crawler','drone','eel','shieldguard'],mirrors:['sniper','salamander','minecrab','shieldguard'],brine:['minecrab','brinebreaker','salamander'],glass:['sporecaster','beast','stormnest','eel'],harbor:['siege','stormnest','eel','resonant'],clouds:['resonant','stormnest','brinebreaker','shieldguard']}))AREAS.find(a=>a.id===id).enemies=types;
AREAS.push(
 {id:'salvage',name:'De Schrootgetijden',file:'salvage-yard.webp',zone:0,kind:'hub',side:true,optional:true,nav:[expeditionFloor],links:['canal'],map:[8,70],unlockCore:1,enemies:['crawler','eel','toxinbeetle'],guardian:'toxinbeetle',story:'Optionele berging: twee gevechtsgroepen, een schrootbeloning en een willekeurige vondst. Opnieuw betreden start een nieuwe berging.'},
 {id:'depot',name:'Het Vergeten Depot',file:'forgotten-depot.webp',zone:1,kind:'hub',side:true,optional:true,nav:[expeditionFloor],links:['highway'],map:[55,78],unlockCore:1,enemies:['shieldguard','sniper','chemist','salamander'],guardian:'chemist',story:'Optionele zoektocht: versla twee groepen voor schroot en een vondst. Vijanden schalen mee met je level; je kunt opnieuw terugkomen.'}
);
export const AREA_BY_ID=Object.fromEntries(AREAS.map(a=>[a.id,a]));

Object.assign(ENEMIES,{toxinbeetle:{name:'Spuitkever',sprite:'toxinbeetle',hp:145,damage:10,speed:92,radius:25,size:95,range:390,xp:22,color:'#badb69',role:'ranged'},chemist:{name:'Gifmeester',sprite:'chemist',hp:175,damage:13,speed:110,radius:25,size:116,range:380,xp:27,color:'#c0dc72',role:'ranged'}});
AREAS.find(a=>a.id==='glass').enemies.push('toxinbeetle');
ZONES[2].enemies.push('chemist');
ZONES[3].enemies.push('toxinbeetle');

// The Zonnetuinen stairway continues onto the north terrace and its side cache.
const roof=AREAS.find(a=>a.id==='rooftops');
roof.nav.push(...[
 [[280,190],[405,145],[575,280],[740,390],[795,460],[740,490],[565,360],[435,290],[320,255]],
 [[950,500],[1140,490],[1180,560],[1150,610],[1080,630],[1010,570]],
 [[1050,665],[1160,670],[1340,745],[1500,825],[1500,880],[1400,925],[1260,885],[1160,840],[1060,805],[1020,730]],
 [[285,820],[375,790],[420,880],[545,1045],[710,1215],[670,1260],[580,1170],[465,1055],[350,940]]
].map(poly=>poly.map(([x,y])=>[x/WORLD.width,y/WORLD.height])));

// Endgame arenas are separate from the sixteen-chapter expedition.
for(const [id,name,file]of [['trial-tide','Dijkbreker','trial-tide.webp'],['trial-glass','Glasstorm','trial-glass.webp'],['trial-null','Nulfront','trial-null.webp']])AREAS.push({id,name,file,zone:3,kind:'challenge',endgame:true,nav:[expeditionFloor],spawn:[.2,.65],exit:[POSITIONS.exit.x/WORLD.width,POSITIONS.exit.y/WORLD.height],links:['skybridge'],map:[90,90],unlockCore:4,story:'Herhaalbare tijdproef na Aurelia · vier golven · drie moeilijkheidsgraden.'});
Object.assign(AREA_BY_ID,Object.fromEntries(AREAS.map(a=>[a.id,a])));
