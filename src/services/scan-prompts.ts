export type FoodPetContext = {
  petName?: string;
  species?: "dog" | "cat" | "other" | "unknown";
  allergies?: string;
};

const SCOPE_RULES = `
SCOPE — you ONLY handle two image types:
1) animal — a real animal / pet is the main subject (dog, cat, bird, rabbit, etc.).
2) animal_food — pet/animal food: bag, can, kibble, treats, wet food, label, or food being checked for a pet.
NOT supported (imageKind "other"): humans only, cars, phones, rooms, furniture, documents, plants-only, landscapes, random objects, packaging that is not pet food.

Always include:
  "imageKind": "animal" | "animal_food" | "other"
  "supported": true | false
`;

function languageRule(outputLanguage: string) {
  const isEnglish = outputLanguage.trim().toLowerCase() === "english";
  if (isEnglish) {
    return `
OUTPUT LANGUAGE:
- Output language is English.
- Keep JSON keys in English exactly as specified.
- Keep these coded values in English exactly (do not translate):
  imageKind, supported, safety ("safe|caution|unsafe|toxic"),
  overallStatus ("healthy|monitor|concern|urgent"),
  species ("dog|cat|other|unknown"),
  choiceLabel ("Good Choice|Use Caution|Not Recommended|Unsafe"),
  conditionLabel ("Good|Fair|Needs Attention|Urgent"),
  nutrient status ("Good|Fair|Poor|Caution").
`;
  }

  return `
CRITICAL OUTPUT LANGUAGE REQUIREMENT — STRICT COMPLIANCE REQUIRED:
- The user's selected language is: ${outputLanguage}.
- YOU MUST WRITE THE ENTIRE RESPONSE IN ${outputLanguage}.
- ABSOLUTELY NO ENGLISH WORDS ARE ALLOWED in any user-visible string values! Every single word displayed to the user MUST be fully translated into ${outputLanguage}.
- Keep ONLY internal JSON keys and these coded values in English (do not change JSON keys or these specific values):
  imageKind, supported, safety ("safe|caution|unsafe|toxic"),
  overallStatus ("healthy|monitor|concern|urgent"),
  species ("dog|cat|other|unknown"),
  choiceLabel ("Good Choice|Use Caution|Not Recommended|Unsafe"),
  conditionLabel ("Good|Fair|Needs Attention|Urgent"),
  nutrient status ("Good|Fair|Poor|Caution").
- ALL OTHER STRING VALUES MUST BE 100% IN ${outputLanguage} WITHOUT EXCEPTION:
  1) productName: Translate and describe the food in ${outputLanguage}.
  2) recipe: Translate flavor / recipe line completely into ${outputLanguage}.
  3) overview: Write 100% in ${outputLanguage}.
  4) nutrients label: MUST translate "Protein", "Fat", "Fiber", "Moisture" into ${outputLanguage}.
  5) ingredientPoints, feedingTips, warnings: 100% in ${outputLanguage}.
  6) breedGuess, summary, observations, careTip, and all careGuide text: 100% in ${outputLanguage}.
- Do NOT copy raw English words from packaging into the JSON values.
`;
}

function petBlock(pet?: FoodPetContext) {
  if (!pet?.species && !pet?.petName && !pet?.allergies) {
    return "TARGET PET: species unknown — assume a typical dog and say so in overview.\n";
  }

  const parts = [
    pet.petName ? `name ${pet.petName}` : null,
    pet.species ? `species ${pet.species}` : "species unknown",
    pet.allergies ? `allergies ${pet.allergies}` : null,
  ].filter(Boolean);

  return `TARGET PET: ${parts.join(", ")}.\n`;
}

export function scanPrompt(
  wantFood: boolean,
  pet: FoodPetContext | undefined,
  outputLanguage: string
) {
  return `
You analyze ONE photo in a SINGLE reply. Do not return a stub that needs a second call.

Preferred endpoint is ${wantFood ? "food scan" : "pet scan"}, but you MUST fully analyze what the photo actually shows.

${languageRule(outputLanguage)}
${SCOPE_RULES}

If imageKind is "other": return ONLY {"imageKind":"other","supported":false}

If the photo is an animal, return the FULL pet JSON below (never only imageKind).
If the photo is animal/pet food, return the FULL food JSON below (never only imageKind).

${petBlock(pet)}
FOOD RULES (when imageKind is animal_food):
- Judge safety, choiceLabel, overview, nutrients, ingredientPoints, feedingTips, and warnings ONLY for this pet's species.
- Dog food for a cat → safety "unsafe" or "caution", choiceLabel "Not Recommended".
- Cat food for a dog → usually "caution" or "Not Recommended" unless clearly suitable.
- Human food / chocolate / grapes / xylitol / onions etc. → toxic/unsafe as appropriate.
- Mention the pet's name/species in overview in ${outputLanguage}.
- If allergies are listed, flag matching ingredients in warnings and lower the rating.
- Always include the 4 core nutrients. warnings MUST have 1–3 items.

PET RULES (when imageKind is animal):
- Visible wellness only — never a diagnosis.
- observations MUST have 3–5 short visible findings.
- careGuide MUST be null when healthy/Good. Required object when monitor|concern|urgent.

Food JSON shape:
{
  "imageKind": "animal_food",
  "supported": true,
  "productName": "product name in ${outputLanguage}",
  "recipe": "flavor or recipe in ${outputLanguage}",
  "brand": "brand name",
  "safety": "safe|caution|unsafe|toxic",
  "choiceLabel": "Good Choice|Use Caution|Not Recommended|Unsafe",
  "overview": "one short sentence for THIS pet in ${outputLanguage}",
  "nutrients": [
    {"label": "Protein", "percent": "25%", "status": "Good"},
    {"label": "Fat", "percent": "12%", "status": "Good"},
    {"label": "Fiber", "percent": "4%", "status": "Good"},
    {"label": "Moisture", "percent": "10%", "status": "Good"}
  ],
  "ingredientPoints": ["point in ${outputLanguage}"],
  "feedingTips": ["tip in ${outputLanguage}"],
  "warnings": ["warning in ${outputLanguage}"]
}

Pet JSON shape:
{
  "imageKind": "animal",
  "supported": true,
  "species": "dog|cat|other|unknown",
  "breedGuess": "breed in ${outputLanguage}",
  "confidence": 0.0,
  "overallStatus": "healthy|monitor|concern|urgent",
  "conditionLabel": "Good|Fair|Needs Attention|Urgent",
  "summary": "1 short sentence in ${outputLanguage}",
  "observations": ["finding in ${outputLanguage}"],
  "careTip": "care tip in ${outputLanguage}",
  "careGuide": null
}

When overallStatus is NOT "healthy", careGuide is:
{
  "issueTitle": "short issue name in ${outputLanguage}",
  "issueDescription": "2 short sentences in ${outputLanguage}",
  "signsTitle": "signs title in ${outputLanguage}",
  "signs": ["sign in ${outputLanguage}"],
  "caution": "1 caution sentence in ${outputLanguage}",
  "important": "1 seek-help sentence in ${outputLanguage}"
}

No markdown, no code fences.
`;
}
