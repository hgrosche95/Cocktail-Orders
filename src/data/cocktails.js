const cocktails = [
  // Sauer & Erfrischend
  {
    id: 1,
    name: 'Cable Car',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Triple Sec', 'Zitronensaft', 'Zuckersirup', 'Zimt'],
    description: 'Leicht, Zitrusnoten, nicht zu süß, mit einem würzigen Aroma.',
    movie: 'Silicon Valley',
  },
  {
    id: 2,
    name: 'Champagne Cocktail',
    category: 'Sauer & Erfrischend',
    ingredients: ['Sekt/Champagner', 'Zucker', 'Bitter'],
    description:
      'Der Drink macht Champagner, oder in unserem Falle Sekt, gefährlich einfach zu trinken. Im Laufe der Zeit wird der Drink immer süßer.',
    movie: 'An Affair to Remember',
  },
  {
    id: 3,
    name: 'Daiquiri',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Limettensaft', 'Zuckersirup'],
    description: 'Der klassischste Cocktail überhaupt.',
    movie: 'Unser Mann in Havanna',
  },
  {
    id: 4,
    name: 'French 75',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Sekt'],
    description:
      'Ein eleganter Drink, spritzig frisch mit leichten Aromen des Gins im Abgang.',
    movie: 'Casablanca',
  },
  {
    id: 5,
    name: 'Margarita',
    category: 'Sauer & Erfrischend',
    ingredients: ['Tequila', 'Triple Sec', 'Agavensirup', 'Limettensaft'],
    movie: 'Crazy, Stupid, Love.',
  },
  {
    id: 6,
    name: 'Mojito',
    category: 'Sauer & Erfrischend',
    ingredients: ['Rum', 'Zucker', 'Limette', 'Minze', 'Soda'],
    description:
      'Ein erfrischender Drink, bei dem es zu einfach ist, viel davon zu trinken.',
    movie: 'Die Another Day',
  },
  {
    id: 7,
    name: 'Silver Fizz',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Eiweiß', 'Zuckersirup'],
    description:
      'Ein Gin Fizz, aber mit Eiweiß. Dadurch ist der Drink seidiger im Geschmack und Mundgefühl.',
    movie: 'The Great Gatsby',
  },
  {
    id: 8,
    name: 'Tom Collins',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Zitronensaft', 'Zuckersirup', 'Soda'],
    movie: 'Meine Braut, ihr Vater und ich',
  },
  {
    id: 9,
    name: 'White Lady',
    category: 'Sauer & Erfrischend',
    ingredients: ['Gin', 'Triple Sec', 'Zitronensaft', 'Zuckersirup', 'Eiweiß'],
    movie: 'Das Böse unter der Sonne',
  },
  {
    id: 10,
    name: 'Whisky Sour',
    category: 'Sauer & Erfrischend',
    ingredients: ['Bourbon', 'Zitronensaft', 'Zuckersirup', 'Eiweiß', 'Bitter'],
    movie: 'Lost in Translation',
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
  },
  {
    id: 12,
    name: 'Boulevardier',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Campari', 'Wermut'],
    description:
      'Ein Drink mit elegantem bitterem und leicht süßlichem Geschmack. Die Zutaten sind alle präsent im Geschmack des Cocktails.',
    movie: 'Billions',
  },
  {
    id: 13,
    name: 'El Presidente',
    category: 'Kräftig & Herb',
    ingredients: ['Rum', 'Wermut', 'Orangenlikör', 'Bitter'],
    description:
      'Seidig, leicht süß, lieblich vom Wermut, frisch und vielschichtig vom Geschmack, leicht würzig.',
    movie: 'The Lost City',
  },
  {
    id: 14,
    name: 'Manhattan',
    category: 'Kräftig & Herb',
    ingredients: ['Rye Whiskey', 'Wermut', 'Bitter'],
    description:
      'Süßlich-herb, gut ausbalanciert und komplex, ein Klassiker aus gutem Grund.',
    movie: "Manche mögen's heiß",
  },
  {
    id: 15,
    name: 'Mint Julep',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Minze', 'Zuckersirup'],
    movie: 'Goldfinger',
  },
  {
    id: 16,
    name: 'Negroni',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Campari', 'Wermut'],
    description:
      'Anfangs süßlich, im Abgang bitter. Der Klassiker der bitteren Cocktails.',
    movie: 'Uncharted',
  },
  {
    id: 17,
    name: 'Negroni Sbagliato',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Campari', 'Wermut', 'Sekt'],
    description:
      'Im Vergleich zum klassischen Negroni etwas herber, erfrischender und süffiger, je nach Sekt auch etwas süßer.',
    movie: 'Succession',
  },
  {
    id: 18,
    name: 'Old Fashioned',
    category: 'Kräftig & Herb',
    ingredients: ['Bourbon', 'Bitter', 'Zucker'],
    movie: 'Mad Men',
  },
  {
    id: 19,
    name: 'Sazerac',
    category: 'Kräftig & Herb',
    ingredients: ['Rye Whiskey', 'Zuckersirup', 'Absinth', 'Bitter'],
    movie: 'Live and Let Die',
  },
  {
    id: 20,
    name: 'Vodka Martini',
    category: 'Kräftig & Herb',
    ingredients: ['Gin', 'Vodka', 'Lillet Blanc'],
    description: 'Ein sehr starker Drink.',
    movie: 'James Bond',
  },

  // Süß & Fruchtig
  {
    id: 21,
    name: 'Cuba Libre',
    category: 'Süß & Fruchtig',
    ingredients: ['Rum', 'Cola', 'Limettensaft'],
    movie: 'Die Another Day',
  },
  {
    id: 22,
    name: 'Japanese Slipper',
    category: 'Süß & Fruchtig',
    ingredients: ['Midori', 'Cointreau', 'Zitronensaft'],
    description:
      'Ein süßlicher Cocktail, leicht herb, der Melonenlikör ist hier nicht allzu präsent.',
    movie: 'Crazy Rich Asians',
  },
  {
    id: 23,
    name: 'Orange Whip',
    category: 'Süß & Fruchtig',
    ingredients: ['Orangensaft', 'Sahne', 'Rum', 'Vodka'],
    description: 'Ein Drink, der schmeckt wie eine Süßigkeit mit Alkohol.',
    movie: 'Blues Brothers',
  },

  // Cremig & Kaffee
  {
    id: 24,
    name: 'Espresso Martini',
    category: 'Cremig & Kaffee',
    ingredients: ['Vodka', 'Kaffeelikör', 'Espresso'],
    movie: 'Layer Cake',
  },
  {
    id: 25,
    name: 'Milch',
    category: 'Cremig & Kaffee',
    ingredients: ['Likör 43', 'Milch'],
    movie: 'Inglourious Basterds',
  },
  {
    id: 26,
    name: 'White Russian',
    category: 'Cremig & Kaffee',
    ingredients: ['Vodka', 'Kaffeelikör', 'Sahne'],
    movie: 'The Big Lebowski',
  },

  // Puristisch
  {
    id: 27,
    name: 'Wasser',
    category: 'Puristisch',
    ingredients: ['Wasser'],
    description: 'Einfach ein Glas Wasser. Gerne auch mit Sprudelwasser.',
    movie: 'Jurassic Park',
  },
]

export default cocktails
