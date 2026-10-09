export type Filter =
  | "All"
  | "Vegan"
  | "Alcohol Free"
  | "Egg Free"
  | "Gluten Free"
  | "Nut Free"
  | "Soy Free";

export type Flavour = {
  name: string;
  description: string;
  price: string;
  image: string;
  section: "Gelato" | "Vegan Gelato & Sorbet";
  tags: Filter[];
  contains: string;
  note?: string;
};

export const gelatoImages = {
  blueOcean: "/manus-storage/blueocean_b6bee2fe.png",
  brownButter: "/manus-storage/brownbutter_7a9c5cd5.png",
  chocchip: "/manus-storage/chochoneychip_15580ddb.png",
  darkChocolate: "/manus-storage/darkchoc_694e07fc.png",
  lemon: "/manus-storage/lemon_bba6085c.png",
  passionfruit: "/manus-storage/passionfruit_4a937367.png",
  pistachio: "/manus-storage/pischoc_967df685.png",
  strawberry: "/manus-storage/strawberry_e094a53a.png",
  legacyChocchip: "/manus-storage/gelato-chocchip-honeycomb_d56828f8.png",
  legacyBerries: "/manus-storage/gelato-vegan-berry_1be6626a.png",
  legacyTropical: "/manus-storage/gelato-mango-passionfruit_7510414e.png",
  legacyDarkChocolate: "/manus-storage/gelato-dark-chocolate-coconut_db14ca1d.png",
  legacyStrawberry: "/manus-storage/gelato-strawberry-matcha_66e30d23.png",
} as const;

export const filters: Array<{ label: Filter; helper?: string }> = [
  { label: "All" },
  { label: "Vegan" },
  { label: "Alcohol Free", helper: "*" },
  { label: "Egg Free" },
  { label: "Gluten Free" },
  { label: "Nut Free" },
  { label: "Soy Free" },
];

export const flavours: Flavour[] = [
  {
    name: "Brown Butter",
    description: "Toasted brown butter gelato with a warm, nutty finish.",
    price: "from $7.40 AUD",
    image: gelatoImages.brownButter,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free"],
    contains: "Contains dairy",
    note: "Signature",
  },
  {
    name: "Peanut Butter",
    description: "Silky roasted peanut butter with a delicate salted finish.",
    price: "from $7.40 AUD",
    image: gelatoImages.legacyDarkChocolate,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free"],
    contains: "Contains dairy · peanuts",
  },
  {
    name: "Burnt Caramel",
    description: "Deep caramelised sugar with a gently smoky sweetness.",
    price: "from $7.40 AUD",
    image: gelatoImages.legacyChocchip,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free", "Gluten Free"],
    contains: "Contains dairy",
  },
  {
    name: "Strawberry Matcha",
    description: "Ceremonial matcha layered with bright strawberry cream.",
    price: "from $7.40 AUD",
    image: gelatoImages.legacyStrawberry,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free", "Gluten Free"],
    contains: "Contains dairy",
  },
  {
    name: "Strawberry Lovers",
    description: "Ripe strawberries folded through a soft, creamy gelato.",
    price: "from $7.40 AUD",
    image: gelatoImages.strawberry,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free", "Gluten Free"],
    contains: "Contains dairy",
  },
  {
    name: "Chocchip Honey Comb",
    description: "Dark chocolate chips with crisp honeycomb and cream.",
    price: "from $7.40 AUD",
    image: gelatoImages.chocchip,
    section: "Gelato",
    tags: ["Alcohol Free"],
    contains: "Contains dairy · gluten",
  },
  {
    name: "Mint Chocolate",
    description: "Cool mint gelato scattered with dark chocolate cookie pieces.",
    price: "from $7.40 AUD",
    image: gelatoImages.blueOcean,
    section: "Gelato",
    tags: ["Alcohol Free", "Egg Free"],
    contains: "Contains dairy · gluten",
  },
  {
    name: "Lemon",
    description: "Vibrant lemon sorbet with a crisp, refreshing tang.",
    price: "from $7.40 AUD",
    image: gelatoImages.lemon,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Nut Free", "Soy Free"],
    contains: "100% plant-based",
  },
  {
    name: "Lemon Acai",
    description: "Zesty lemon infused with aromatic acai berry.",
    price: "from $7.40 AUD",
    image: gelatoImages.legacyBerries,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Nut Free", "Soy Free"],
    contains: "100% plant-based",
  },
  {
    name: "Mango",
    description: "Pure mango sorbet, intensely tropical and smooth.",
    price: "from $7.40 AUD",
    image: gelatoImages.legacyTropical,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Nut Free", "Soy Free"],
    contains: "100% plant-based",
  },
  {
    name: "Passionfruit",
    description: "Tangy tropical passionfruit with aromatic brightness.",
    price: "from $7.40 AUD",
    image: gelatoImages.passionfruit,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Nut Free", "Soy Free"],
    contains: "100% plant-based",
  },
  {
    name: "Dark Chocolate",
    description: "Intense dairy-free dark chocolate sorbet.",
    price: "from $7.40 AUD",
    image: gelatoImages.darkChocolate,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Soy Free"],
    contains: "100% plant-based · chocolate cross-contact",
  },
  {
    name: "Coconut Pistachio",
    description: "Rich coconut milk blended with roasted pistachio paste.",
    price: "from $7.40 AUD",
    image: gelatoImages.pistachio,
    section: "Vegan Gelato & Sorbet",
    tags: ["Vegan", "Alcohol Free", "Egg Free", "Gluten Free", "Soy Free"],
    contains: "100% plant-based · contains pistachio",
  },
];

export function filterFlavours(activeFilter: Filter): Flavour[] {
  return activeFilter === "All"
    ? flavours
    : flavours.filter((flavour) => flavour.tags.includes(activeFilter));
}
