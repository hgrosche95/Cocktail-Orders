export interface RecipeIngredient {
  name: string
  amountCl?: number
  note?: string
}

export interface Recipe {
  ingredients: RecipeIngredient[]
  ice: string
  servedWithIceCubes: boolean
}

export interface Cocktail {
  id: number
  name: string
  category: string
  ingredients: string[]
  description?: string
  movie: string
  recipe: Recipe
}

const cocktails: Cocktail[] = [
  // Sauer & Erfrischend
  {
    id: 1,
    name: 'Cable Car',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Triple Sec', 'Zitronensaft', 'Zuckersirup', 'Zimt'],
    description: 'Leicht, Zitrusnoten, nicht zu süß, mit einem würzigen Aroma.',
    movie: 'Silicon Valley',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 4.5 },
        { name: 'Triple Sec', amountCl: 1.5 },
        { name: 'Zitronensaft', amountCl: 2 },
        { name: 'Zuckersirup', amountCl: 1.5 },
        { name: 'Zimt', note: 'zum Bestäuben des Glasrandes' },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 2,
    name: 'Champagne Cocktail',
    category: 'Sauer & Erfrischend',
    ingredients: ['Sekt/Champagner', 'Zucker', 'Bitter'],
    description:
      'Der Drink macht Champagner, oder in unserem Falle Sekt, gefährlich einfach zu trinken. Im Laufe der Zeit wird der Drink immer süßer.',
    movie: 'An Affair to Remember',
    recipe: {
      ingredients: [
        { name: 'Zucker', note: '1 Zuckerwürfel, mit Bitter beträufeln' },
        { name: 'Bitter', note: '2 Dashes' },
        { name: 'Sekt/Champagner', amountCl: 12 },
      ],
      ice: 'Kein Eis, direkt im Glas zubereiten',
      servedWithIceCubes: false,
    },
  },
  {
    id: 3,
    name: 'Daiquiri',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Limettensaft', 'Zuckersirup'],
    description: 'Der klassischste Cocktail überhaupt.',
    movie: 'Unser Mann in Havanna',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 6 },
        { name: 'Limettensaft', amountCl: 2.5 },
        { name: 'Zuckersirup', amountCl: 1.5 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 4,
    name: 'French 75',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Sekt'],
    description:
      'Ein eleganter Drink, spritzig frisch mit leichten Aromen des Gins im Abgang.',
    movie: 'Casablanca',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 3 },
        { name: 'Zitronensaft', amountCl: 1.5 },
        { name: 'Zuckersirup', amountCl: 1 },
        { name: 'Sekt', amountCl: 6, note: 'zum Auffüllen' },
      ],
      ice: 'Gin, Zitronensaft und Zuckersirup im Shaker mit Eiswürfeln schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 5,
    name: 'Margarita',
    category: 'Sauer & Erfrischend',
    ingredients: ['Tequila', 'Triple Sec', 'Agavensirup', 'Limettensaft'],
    movie: 'Crazy, Stupid, Love.',
    recipe: {
      ingredients: [
        { name: 'Tequila', amountCl: 5 },
        { name: 'Triple Sec', amountCl: 2 },
        { name: 'Agavensirup', amountCl: 1 },
        { name: 'Limettensaft', amountCl: 2 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: true,
    },
  },
  {
    id: 6,
    name: 'Mojito',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Zucker', 'Limette', 'Minze', 'Soda'],
    description:
      'Ein erfrischender Drink, bei dem es zu einfach ist, viel davon zu trinken.',
    movie: 'Die Another Day',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 5 },
        { name: 'Zucker', amountCl: 2, note: 'als Zuckersirup' },
        { name: 'Limette', amountCl: 2, note: 'Saft einer halben Limette' },
        { name: 'Minze', note: '8 Blätter, leicht anstoßen' },
        { name: 'Soda', amountCl: 6, note: 'zum Auffüllen' },
      ],
      ice: 'Glas komplett mit Crushed Ice füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 7,
    name: 'Silver Fizz',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup'],
    description:
      'Ein Gin Fizz mit seidigem Mundgefühl.',
    movie: 'The Great Gatsby',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 4.5 },
        { name: 'Zitronensaft', amountCl: 2 },
        { name: 'Zuckersirup', amountCl: 1.5 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 8,
    name: 'Tom Collins',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Soda'],
    movie: 'Meine Braut, ihr Vater und ich',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 4.5 },
        { name: 'Zitronensaft', amountCl: 2 },
        { name: 'Zuckersirup', amountCl: 1.5 },
        { name: 'Soda', amountCl: 6, note: 'zum Auffüllen' },
      ],
      ice: 'Gin, Zitronensaft und Zuckersirup mit Eiswürfeln schütteln, im Glas mit Eiswürfeln auffüllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 9,
    name: 'White Lady',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Triple Sec', 'Zitronensaft', 'Zuckersirup'],
    movie: 'Das Böse unter der Sonne',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 4 },
        { name: 'Triple Sec', amountCl: 2 },
        { name: 'Zitronensaft', amountCl: 2 },
        { name: 'Zuckersirup', amountCl: 1 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 10,
    name: 'Whisky Sour',
    category: 'Sauer & Erfrischend',
    ingredients: ['Bourbon', 'Zitronensaft', 'Zuckersirup', 'Bitter'],
    movie: 'Lost in Translation',
    recipe: {
      ingredients: [
        { name: 'Bourbon', amountCl: 5 },
        { name: 'Zitronensaft', amountCl: 2.5 },
        { name: 'Zuckersirup', amountCl: 1.5 },
        { name: 'Bitter', note: '2 Dashes' },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: true,
    },
  },
  {
    id: 28,
    name: 'Gin Basil Smash',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Basilikum'],
    description:
      'Frisch, kräutrig und spritzig-süß zugleich – der moderne Klassiker aus der Craft-Cocktail-Szene.',
    movie: 'Julie & Julia',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 6 },
        { name: 'Zitronensaft', amountCl: 3 },
        { name: 'Zuckersirup', amountCl: 2 },
        { name: 'Basilikum', note: 'eine Hand voll Basilikum mit Stängeln, mit dem Gin im Shaker zerstampfen' },
      ],
      ice: 'Basilikum und Gin zerstoßen, Shaker zu zwei Dritteln mit Eiswürfeln füllen, sehr kräftig schütteln, über ein Teesieb abseihen.',
      servedWithIceCubes: true,
    },
  },

  {
    id: 32,
    name: 'Bramble',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Brombeerlikör'],
    description:
      'Spritzig-süß mit einer fruchtigen Brombeernote, die sich langsam durch den Drink zieht.',
    movie: 'TODO',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 5 },
        { name: 'Zitronensaft', amountCl: 2.5 },
        { name: 'Zuckersirup', amountCl: 1.5 },
        { name: 'Brombeerlikör', amountCl: 1.5, note: 'zum Schluss über das Crushed Ice träufeln' },
      ],
      ice: 'Glas mit Crushed Ice füllen, Gin, Zitronensaft und Zuckersirup einrühren',
      servedWithIceCubes: true,
    },
  },

  // Kräftig & Herb
  {
    id: 11,
    name: 'Americano',
    category: 'Kräftig & Herb',
    ingredients: ['Campari', 'Wermut', 'Sodawasser'],
    description:
      'Erfrischend, bitter und ein wenig süß. Leicht zu trinken durch die Verdünnung mit prickelndem Sprudelwasser.',
    movie: 'Liebesgrüße aus Moskau',
    recipe: {
      ingredients: [
        { name: 'Campari', amountCl: 3 },
        { name: 'Wermut', amountCl: 3 },
        { name: 'Sodawasser', amountCl: 6, note: 'zum Auffüllen' },
      ],
      ice: 'Glas mit Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 12,
    name: 'Boulevardier',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Campari', 'Wermut'],
    description:
      'Ein Drink mit elegantem bitterem und leicht süßlichem Geschmack. Die Zutaten sind alle präsent im Geschmack des Cocktails.',
    movie: 'Billions',
    recipe: {
      ingredients: [
        { name: 'Bourbon', amountCl: 3 },
        { name: 'Campari', amountCl: 3 },
        { name: 'Wermut', amountCl: 3 },
      ],
      ice: 'Rührglas mit Eiswürfeln füllen, verrühren',
      servedWithIceCubes: true,
    },
  },
  {
    id: 13,
    name: 'El Presidente',
    category: 'Kräftig & Herb',
    ingredients: ['Rum', 'Wermut', 'Orangenlikör', 'Bitter'],
    description:
      'Seidig, leicht süß, lieblich vom Wermut, frisch und vielschichtig vom Geschmack, leicht würzig.',
    movie: 'The Lost City',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 4.5 },
        { name: 'Wermut', amountCl: 2 },
        { name: 'Orangenlikör', amountCl: 1 },
        { name: 'Bitter', note: '2 Dashes' },
      ],
      ice: 'Rührglas mit Eiswürfeln füllen, verrühren',
      servedWithIceCubes: false,
    },
  },
  {
    id: 14,
    name: 'Manhattan',
    category: 'Kräftig & Herb',
    ingredients: ['Rye Whiskey', 'Wermut', 'Bitter'],
    description:
      'Süßlich-herb, gut ausbalanciert und komplex, ein Klassiker aus gutem Grund.',
    movie: "Manche mögen's heiß",
    recipe: {
      ingredients: [
        { name: 'Rye Whiskey', amountCl: 5 },
        { name: 'Wermut', amountCl: 2 },
        { name: 'Bitter', note: '2 Dashes' },
      ],
      ice: 'Rührglas mit Eiswürfeln füllen, verrühren',
      servedWithIceCubes: false,
    },
  },
  {
    id: 15,
    name: 'Mint Julep',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Minze', 'Zuckersirup'],
    movie: 'Goldfinger',
    recipe: {
      ingredients: [
        { name: 'Bourbon', amountCl: 6 },
        { name: 'Minze', note: '8 Blätter, leicht anstoßen' },
        { name: 'Zuckersirup', amountCl: 1.5 },
      ],
      ice: 'Becher komplett mit Crushed Ice füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 16,
    name: 'Negroni',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Campari', 'Wermut'],
    description:
      'Anfangs süßlich, im Abgang bitter. Der Klassiker der bitteren Cocktails.',
    movie: 'Uncharted',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 3 },
        { name: 'Campari', amountCl: 3 },
        { name: 'Wermut', amountCl: 3 },
      ],
      ice: 'Glas mit Eiswürfeln füllen, verrühren',
      servedWithIceCubes: true,
    },
  },
  {
    id: 17,
    name: 'Negroni Sbagliato',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Campari', 'Wermut', 'Sekt'],
    description:
      'Im Vergleich zum klassischen Negroni etwas herber, erfrischender und süffiger, je nach Sekt auch etwas süßer.',
    movie: 'Succession',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 2 },
        { name: 'Campari', amountCl: 3 },
        { name: 'Wermut', amountCl: 3 },
        { name: 'Sekt', amountCl: 4, note: 'zum Auffüllen' },
      ],
      ice: 'Campari, Wermut und Gin im Rührglas mit Eiswürfeln verrühren, im Glas mit Eiswürfeln auffüllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 18,
    name: 'Old Fashioned',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Bitter', 'Zucker'],
    movie: 'Mad Men',
    recipe: {
      ingredients: [
        { name: 'Bourbon', amountCl: 6 },
        { name: 'Bitter', note: '3 Dashes' },
        { name: 'Zucker', note: '1 Zuckerwürfel, mit Bitter und wenig Soda einweichen' },
      ],
      ice: '1 großer Eiswürfel direkt im Glas',
      servedWithIceCubes: true,
    },
  },
  {
    id: 19,
    name: 'Sazerac',
    category: 'Kräftig & Herb',
    ingredients: ['Rye Whiskey', 'Zuckersirup', 'Absinth', 'Bitter'],
    movie: 'Live and Let Die',
    recipe: {
      ingredients: [
        { name: 'Rye Whiskey', amountCl: 6 },
        { name: 'Zuckersirup', amountCl: 1 },
        { name: 'Absinth', note: '1 Spritzer zum Ausschwenken des Glases' },
        { name: 'Bitter', note: '3 Dashes' },
      ],
      ice: 'Rührglas mit Eiswürfeln füllen, verrühren',
      servedWithIceCubes: false,
    },
  },
  {
    id: 20,
    name: 'Vodka Martini',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Vodka', 'Lillet Blanc'],
    description: 'Ein sehr starker Drink.',
    movie: 'James Bond',
    recipe: {
      ingredients: [
        { name: 'Gin', amountCl: 6 },
        { name: 'Vodka', amountCl: 2 },
        { name: 'Lillet Blanc', amountCl: 1 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },

  // Aperitivos
  {
    id: 29,
    name: 'Déjà Vu Tonic',
    category: 'Aperitivos',
    ingredients: ['Déjà Vu', 'Tonic Water'],
    description: 'Klar, frisch und unkompliziert – ein Gin Tonic mit Wiedererkennungswert.',
    movie: 'Déjà Vu',
    recipe: {
      ingredients: [
        { name: 'Déjà Vu', amountCl: 5 },
        { name: 'Tonic Water', amountCl: 10 },
      ],
      ice: 'Glas mit Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 30,
    name: 'Aperol Spritz',
    category: 'Aperitivos',
    ingredients: ['Aperol', 'Sekt', 'Sodawasser'],
    description: 'Bittersüß, spritzig-erfrischend und der Inbegriff des italienischen Sommers.',
    movie: 'Call Me by Your Name',
    recipe: {
      ingredients: [
        { name: 'Aperol', amountCl: 9 },
        { name: 'Sekt', amountCl: 6 },
        { name: 'Sodawasser', amountCl: 3, note: 'ein Schuss' },
      ],
      ice: 'Glas mit reichlich Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 31,
    name: 'Limoncello Spritz',
    category: 'Aperitivos',
    ingredients: ['Limoncello', 'Sekt', 'Sodawasser'],
    description: 'Süßlich-zitronig und erfrischend – pure italienische Sommer-Leichtigkeit.',
    movie: 'The Talented Mr. Ripley',
    recipe: {
      ingredients: [
        { name: 'Limoncello', amountCl: 4 },
        { name: 'Sekt', amountCl: 9 },
        { name: 'Sodawasser', amountCl: 3, note: 'ein Schuss' },
      ],
      ice: 'Glas mit reichlich Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },

  // Süß & Fruchtig
  {
    id: 21,
    name: 'Cuba Libre',
    category: 'Süß & Fruchtig',
    ingredients: ['Rum', 'Cola', 'Limettensaft'],
    movie: 'Die Another Day',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 5 },
        { name: 'Limettensaft', amountCl: 1 },
        { name: 'Cola', amountCl: 10, note: 'zum Auffüllen' },
      ],
      ice: 'Glas mit Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 22,
    name: 'Japanese Slipper',
    category: 'Süß & Fruchtig',
    ingredients: ['Midori', 'Cointreau', 'Zitronensaft'],
    description:
      'Ein süßlicher Cocktail, leicht herb, der Melonenlikör ist hier nicht allzu präsent.',
    movie: 'Crazy Rich Asians',
    recipe: {
      ingredients: [
        { name: 'Midori', amountCl: 3 },
        { name: 'Cointreau', amountCl: 3 },
        { name: 'Zitronensaft', amountCl: 3 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },
  {
    id: 23,
    name: 'Orange Whip',
    category: 'Süß & Fruchtig',
    ingredients: ['Orangensaft', 'Sahne', 'Rum', 'Vodka'],
    description: 'Ein Drink, der schmeckt wie eine Süßigkeit mit Alkohol.',
    movie: 'Blues Brothers',
    recipe: {
      ingredients: [
        { name: 'Rum', amountCl: 3 },
        { name: 'Vodka', amountCl: 3 },
        { name: 'Orangensaft', amountCl: 4 },
        { name: 'Sahne', amountCl: 2 },
      ],
      ice: 'Shaker zu zwei Dritteln mit Eiswürfeln füllen, kräftig schütteln',
      servedWithIceCubes: false,
    },
  },

  // Cremig & Kaffee
  {
    id: 24,
    name: 'Espresso Martini',
    category: 'Cremig & Kaffee',
    ingredients: ['Vodka', 'Kaffeelikör', 'Espresso'],
    movie: 'Layer Cake',
    recipe: {
      ingredients: [
        { name: 'Vodka', amountCl: 5 },
        { name: 'Kaffeelikör', amountCl: 2 },
        { name: 'Espresso', amountCl: 3, note: 'frisch gebrüht, abgekühlt' },
      ],
      ice: 'Shaker mit reichlich Eiswürfeln füllen, sehr kräftig schütteln (für Schaum)',
      servedWithIceCubes: false,
    },
  },
  {
    id: 25,
    name: 'Milch',
    category: 'Cremig & Kaffee',
    ingredients: ['Likör 43', 'Milch'],
    movie: 'Inglourious Basterds',
    recipe: {
      ingredients: [
        { name: 'Likör 43', amountCl: 4 },
        { name: 'Milch', amountCl: 8 },
      ],
      ice: 'Glas mit Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },
  {
    id: 26,
    name: 'White Russian',
    category: 'Cremig & Kaffee',
    ingredients: ['Vodka', 'Kaffeelikör', 'Sahne'],
    movie: 'The Big Lebowski',
    recipe: {
      ingredients: [
        { name: 'Vodka', amountCl: 5 },
        { name: 'Kaffeelikör', amountCl: 2 },
        { name: 'Sahne', amountCl: 3, note: 'vorsichtig über den Rücken eines Löffels aufgießen' },
      ],
      ice: 'Glas mit Eiswürfeln füllen',
      servedWithIceCubes: true,
    },
  },

  // Puristisch
  {
    id: 27,
    name: 'Wasser',
    category: 'Puristisch',
    ingredients: ['Wasser'],
    description: 'Einfach ein Glas Wasser. Gerne auch mit Sprudelwasser.',
    movie: 'Jurassic Park',
    recipe: {
      ingredients: [{ name: 'Wasser', amountCl: 20 }],
      ice: 'Optional Eiswürfel ins Glas',
      servedWithIceCubes: false,
    },
  },
]

export default cocktails
