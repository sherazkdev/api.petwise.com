const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const out = path.join(__dirname, "..", "docs", "Petwise-API.pdf");
const doc = new PDFDocument({
  size: "A4",
  margin: 54,
  info: { Title: "Petwise Scan API", Author: "Petwise" },
});

doc.pipe(fs.createWriteStream(out));

const ink = "#171717";
const mute = "#525252";
const line = "#e5e5e5";
const left = 54;
const width = 487;

function h1(text) {
  doc.font("Helvetica-Bold").fontSize(22).fillColor(ink).text(text);
  doc.moveDown(0.35);
}

function h2(text) {
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(ink).text(text);
  doc.moveDown(0.25);
}

function p(text) {
  doc.font("Helvetica").fontSize(10).fillColor(mute).text(text, { width, lineGap: 2 });
  doc.moveDown(0.35);
}

function mono(text) {
  doc.font("Courier").fontSize(9).fillColor(ink).text(text, { width });
  doc.moveDown(0.25);
}

function table(rows) {
  const col1 = 118;
  const col2 = width - col1;
  rows.forEach((row, i) => {
    const y = doc.y;
    if (y > 760) doc.addPage();
    const h1h = doc.heightOfString(row[0], { width: col1 - 8, font: "Helvetica-Bold", fontSize: 9 });
    const h2h = doc.heightOfString(row[1], { width: col2, font: "Helvetica", fontSize: 9 });
    const h = Math.max(h1h, h2h) + 10;
    if (i % 2 === 0) {
      doc.save().rect(left, doc.y - 2, width, h).fill("#fafafa").restore();
    }
    const top = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(ink).text(row[0], left + 4, top, { width: col1 - 8 });
    doc.font("Helvetica").fontSize(9).fillColor(mute).text(row[1], left + col1, top, { width: col2 });
    doc.y = top + h;
  });
  doc.moveDown(0.4);
}

h1("Petwise Scan API");
p("Scan service for pet-food photos and pet photos. Not a full pet-app backend (no login, pet CRUD, or reminders).");

doc.font("Helvetica").fontSize(10).fillColor(ink);
doc.text("Base URL  ", { continued: true });
doc.fillColor("#2563eb").text("https://petwise.apptechcode.com");
doc.fillColor(ink).text("Swagger   ", { continued: true });
doc.fillColor("#2563eb").text("https://petwise.apptechcode.com/docs");
doc.fillColor(mute);
doc.moveDown(0.6);
doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor(line).stroke();

h2("Auth");
p("Send this header on every scan request.");
table([["x-api-key", "API key for the app. Missing or wrong → 401."]]);

h2("Request format");
table([
  ["Method", "POST for scans"],
  ["Body", "multipart/form-data"],
  ["Image field", "image"],
  ["Types", "jpg, png, webp"],
  ["Max size", "10 MB"],
]);

h2("POST /api/v1/scan/food");
p("Food, bag, can, or kibble. Rated for this pet (species + allergies), not as generic food.");
table([
  ["image", "Required. Food / packet photo."],
  ["outputLanguage", "Optional. Default English. Example: Urdu."],
  ["petName", "Optional. Name from the pet profile, e.g. Milo."],
  ["species", "Optional. dog | cat | other | unknown."],
  ["allergies", "Optional. What the pet cannot eat. One string: chicken, beef. Omit if none."],
]);
p("species and allergies exist because the photo shows the label, not the pet. Chicken on the bag + allergies=chicken → warning / caution.");

h2("POST /api/v1/scan/pet");
p("Pet photo. Visible wellness only — not a diagnosis.");
table([
  ["image", "Required. Pet photo."],
  ["outputLanguage", "Optional. Default English."],
  ["petName / species / allergies", "Optional. Used if the photo is actually food."],
]);

h2("Success (200)");
mono('{ "data": { "type": "food"|"pet", "analysis": {} }, "success": true }');
p("If the user hits the food URL with a pet photo (or the reverse), type still matches the photo.");

h2("Food analysis fields");
table([
  ["productName", "Name or description of the food."],
  ["recipe", "Flavour / recipe line if visible."],
  ["brand", "Brand, or Unknown."],
  ["safety", "safe | caution | unsafe | toxic for this pet."],
  ["choiceLabel", "Good Choice | Use Caution | Not Recommended | Unsafe."],
  ["overview", "One-line summary for this pet."],
  ["nutrients", "Protein, fat, fiber, moisture (label, percent, status)."],
  ["ingredientPoints", "Notes from the label / photo."],
  ["feedingTips", "How to feed this pet."],
  ["warnings", "Allergy, species mismatch, missing label."],
]);

h2("Pet analysis fields");
table([
  ["species", "dog | cat | other | unknown."],
  ["breedGuess", "Best-guess breed."],
  ["confidence", "0 to 1."],
  ["overallStatus", "healthy | monitor | concern | urgent."],
  ["conditionLabel", "Good | Fair | Needs Attention | Urgent."],
  ["summary", "Short visible-wellness text."],
  ["observations", "What is visible in the photo."],
  ["careTip", "Friendly care note."],
  ["careGuide", "null when healthy; extra guidance otherwise."],
]);

h2("Status codes");
table([
  ["200", "Scan complete."],
  ["400", "Bad request, or photo is not pet / pet food."],
  ["401", "Missing or invalid x-api-key."],
  ["502", "Scan failed."],
]);

h2("Allergies format");
p("Plain string, not a JSON array. Examples: chicken    chicken, beef    dairy, wheat");
p("If there are no allergies, omit the field. Do not send none or no.");

doc.end();
console.log("Wrote", out);
