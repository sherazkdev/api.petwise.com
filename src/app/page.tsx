import Link from "next/link";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/scan/food",
    use: "Pet food / packet photo. Returns food analysis for the given pet.",
  },
  {
    method: "POST",
    path: "/api/v1/scan/pet",
    use: "Pet photo. Returns visible wellness notes. Not a diagnosis.",
  },
  {
    method: "GET",
    path: "/api/v1/scan/jobs/{jobId}",
    use: "Poll a queued scan when POST returns 202.",
  },
  {
    method: "GET",
    path: "/docs",
    use: "Swagger UI. Try requests with x-api-key.",
  },
  {
    method: "GET",
    path: "/api/openapi",
    use: "OpenAPI JSON used by Swagger.",
  },
];

const foodFields = [
  ["type", "Always food when this analysis is returned."],
  ["imageKind", "animal_food means the photo is pet food."],
  ["supported", "true if the photo can be analyzed."],
  ["productName", "Name or description of the food in the photo."],
  ["recipe", "Flavor / recipe line if visible."],
  ["brand", "Brand if readable, otherwise Unknown."],
  ["safety", "safe | caution | unsafe | toxic for this pet."],
  ["choiceLabel", "Good Choice | Use Caution | Not Recommended | Unsafe."],
  ["overview", "One-line summary for this pet."],
  ["nutrients", "Protein, fat, fiber, moisture with percent and status."],
  ["ingredientPoints", "Visible ingredient notes."],
  ["feedingTips", "How to feed this pet."],
  ["warnings", "Allergies, species mismatch, or missing label."],
];

const petFields = [
  ["type", "Always pet when this analysis is returned."],
  ["imageKind", "animal means the photo is a pet."],
  ["species", "dog | cat | other | unknown."],
  ["breedGuess", "Best-guess breed from the photo."],
  ["confidence", "0 to 1 confidence for species/breed guess."],
  ["overallStatus", "healthy | monitor | concern | urgent."],
  ["conditionLabel", "Good | Fair | Needs Attention | Urgent."],
  ["summary", "Short visible-wellness summary."],
  ["observations", "What is visible in the photo."],
  ["careTip", "Friendly care suggestion."],
  ["careGuide", "null when healthy. Extra guidance when not healthy."],
];

const codes = [
  ["200", "Scan finished. Body has data.type and data.analysis."],
  ["202", "Queued. Poll GET /api/v1/scan/jobs/{jobId}."],
  ["400", "Bad image, validation, or photo is not pet/food."],
  ["401", "Missing or invalid x-api-key header."],
  ["405", "Only POST on scan routes (except job GET)."],
  ["429", "Rate limit. Wait and retry."],
  ["502", "Scan model failed."],
  ["503", "Queue full. Retry shortly."],
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <p className="text-sm font-medium tracking-wide text-neutral-500">
        Petwise API
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Scan pet photos and pet food
      </h1>
      <p className="mt-3 max-w-xl text-neutral-600">
        Send multipart form-data with header{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm ring-1 ring-neutral-200">
          x-api-key
        </code>
        . Image: jpg, png, or webp, max 10MB.
      </p>
      <Link
        href="/docs"
        className="mt-6 inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        Open Swagger
      </Link>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Endpoints</h2>
        <ul className="mt-4 space-y-3">
          {endpoints.map((item) => (
            <li
              key={item.path}
              className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200"
            >
              <p className="font-mono text-sm">
                <span className="font-semibold">{item.method}</span> {item.path}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{item.use}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Scan food params</h2>
        <p className="mt-2 text-sm text-neutral-600">
          image (required), outputLanguage, petName, species (dog|cat|other|unknown),
          allergies.
        </p>
        <h2 className="mt-8 text-lg font-semibold">Scan pet params</h2>
        <p className="mt-2 text-sm text-neutral-600">
          image (required), outputLanguage. Optional petName, species, allergies if
          the photo is actually food.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Food result fields</h2>
        <dl className="mt-4 space-y-3">
          {foodFields.map(([name, meaning]) => (
            <div key={name} className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
              <dt className="font-mono text-sm font-semibold">{name}</dt>
              <dd className="mt-1 text-sm text-neutral-600">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Pet result fields</h2>
        <dl className="mt-4 space-y-3">
          {petFields.map(([name, meaning]) => (
            <div key={name} className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
              <dt className="font-mono text-sm font-semibold">{name}</dt>
              <dd className="mt-1 text-sm text-neutral-600">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 mb-8">
        <h2 className="text-lg font-semibold">HTTP status</h2>
        <dl className="mt-4 space-y-3">
          {codes.map(([code, meaning]) => (
            <div key={code} className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
              <dt className="font-mono text-sm font-semibold">{code}</dt>
              <dd className="mt-1 text-sm text-neutral-600">{meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
