# Petwise Scan API

**Base URL:** https://petwise.apptechcode.com  
**Swagger:** https://petwise.apptechcode.com/docs  
**Version:** 0.1.0

This API analyses a photo of **pet food** or a **pet**. It is a scan service only. It does not include login, pet profiles, or reminders.

---

## Auth

Every scan request needs this header:

| Header | Value |
|--------|--------|
| `x-api-key` | API key provided for the app |

Missing or wrong key → **401**.

---

## Request format

| Item | Rule |
|------|------|
| Method | `POST` for scans |
| Body | `multipart/form-data` |
| Image field name | `image` |
| Types | jpg, png, webp |
| Max size | 10 MB |

---

## Endpoints

### 1. Scan food

`POST /api/v1/scan/food`

Use this when the user photographs food, a bag, a can, or kibble. The model rates that food **for this pet**.

| Param | Required | What to send |
|-------|----------|----------------|
| `image` | Yes | Food / packet photo |
| `outputLanguage` | No | Default `English`. Example: `Urdu` |
| `petName` | No | Name from the pet profile, e.g. `Milo` |
| `species` | No | `dog` / `cat` / `other` / `unknown` |
| `allergies` | No | Ingredients the pet cannot eat. One string, comma-separated. Example: `chicken, beef`. If none, omit the field. |

**Why `species` and `allergies`:** the photo shows the label. The app already knows the pet. Dog food for a cat, or chicken on the label when the pet is allergic to chicken, must change `safety` and `warnings`.

---

### 2. Scan pet

`POST /api/v1/scan/pet`

Use this when the user photographs the animal. Result is **visible wellness only**, not a diagnosis.

| Param | Required | What to send |
|-------|----------|----------------|
| `image` | Yes | Pet photo |
| `outputLanguage` | No | Default `English` |
| `petName` | No | Optional. Used if the photo is actually food |
| `species` | No | `dog` / `cat` / `other` / `unknown` |
| `allergies` | No | Optional. Same format as food scan |

---

### 3. Docs

| URL | Use |
|-----|-----|
| `GET /docs` | Swagger UI (try requests) |
| `GET /api/openapi` | OpenAPI JSON |

---

## Success body (200)

```json
{
  "data": {
    "type": "food",
    "analysis": { }
  },
  "message": "Scan complete.",
  "statusCode": 200,
  "success": true
}
```

`data.type` is `food` or `pet`. If the user hits the food endpoint with a pet photo (or the reverse), the API still returns the matching `type`.

---

## Food analysis fields

| Field | Meaning |
|-------|---------|
| `productName` | Name or description of the food |
| `recipe` | Flavour / recipe line if visible |
| `brand` | Brand, or `Unknown` |
| `safety` | `safe` / `caution` / `unsafe` / `toxic` for **this** pet |
| `choiceLabel` | `Good Choice` / `Use Caution` / `Not Recommended` / `Unsafe` |
| `overview` | One-line summary for this pet |
| `nutrients` | Protein, fat, fiber, moisture (`label`, `percent`, `status`) |
| `ingredientPoints` | Notes from the label / photo |
| `feedingTips` | How to feed this pet |
| `warnings` | Allergy, species mismatch, missing label, etc. |

---

## Pet analysis fields

| Field | Meaning |
|-------|---------|
| `species` | `dog` / `cat` / `other` / `unknown` |
| `breedGuess` | Best-guess breed |
| `confidence` | 0 to 1 |
| `overallStatus` | `healthy` / `monitor` / `concern` / `urgent` |
| `conditionLabel` | `Good` / `Fair` / `Needs Attention` / `Urgent` |
| `summary` | Short visible-wellness text |
| `observations` | What is visible in the photo |
| `careTip` | Friendly care note |
| `careGuide` | `null` when healthy; extra guidance otherwise |

This is **not** a veterinary diagnosis.

---

## Status codes

| Code | Meaning |
|------|---------|
| 200 | Scan complete |
| 400 | Validation failed, or photo is not a pet / pet food |
| 401 | Missing or invalid `x-api-key` |
| 405 | Wrong HTTP method |
| 502 | Scan failed |

---

## Allergies field

Send a **plain string**, not a JSON array.

- `chicken`
- `chicken, beef`
- `dairy, wheat`

If the pet has no allergies, **do not send** `allergies`. Do not send `none` or `no`.

---

## Out of scope

This API does **not** provide: signup, login, pet list, saving allergies on the server, reminders, or payments. The app stores the pet profile and sends `petName`, `species`, and `allergies` on each food scan.
