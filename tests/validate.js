const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context);
const guide = context.window.TRAVEL;
const ids = new Set(guide.places.map(p => p.id));
const errors = [];
if (ids.size !== guide.places.length) errors.push('IDs de lugares duplicados');
for (const d of guide.days) {
  for (const item of [...d.entries, ...(d.alternative || [])]) {
    if (item.placeId && !ids.has(item.placeId)) errors.push(`Referência inválida: ${d.id} - ${item.placeId}`);
    for (const alt of item.alternatives || []) if (!ids.has(alt)) errors.push(`Plano B inválido: ${d.id} - ${alt}`);
  }
}
const categories = new Set(guide.categories.map(c => c.id));
const regions = new Set(guide.mapRegions.map(r => r.id));
for (const place of guide.places) {
  if (!categories.has(place.category)) errors.push(`Categoria desconhecida em ${place.id}`);
  if (!regions.has(place.region)) errors.push(`Região desconhecida em ${place.id}`);
  if (!place.address || !place.story) errors.push(`Informação essencial ausente em ${place.id}`);
  const [lat, lon] = place.coords || [];
  if (!(lat < -20.9 && lat > -21.3 && lon < -44.0 && lon > -44.4)) errors.push(`Coordenadas ausentes ou fora da região em ${place.id}`);
}
for (const f of ['index.html','styles.css','app.js','data.js','manifest.webmanifest','sw.js','assets/crest.svg','assets/casario.svg']) {
  if (!fs.existsSync(path.join(root, f))) errors.push(`Arquivo ausente: ${f}`);
}
const html = fs.readFileSync(path.join(root, 'index.html'),'utf8');
for (const id of ['dayTabs','timeline','placesGrid','savedDrawer','mapCanvas','foodList','shareModal']) {
  if (!html.includes(`id="${id}"`)) errors.push(`Elemento HTML ausente: ${id}`);
}
if (!guide.home || !Array.isArray(guide.home.coords)) errors.push('Pin da base ausente em data.js');
if (!html.includes('Bonde dos Criativos') && !html.includes('BONDE DOS CRIATIVOS')) errors.push('Nome do grupo não aparece no site');
if (html.includes('Tiradentes a Dois') || html.includes('a dois')) errors.push('Marca antiga ainda visível no HTML');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Validação OK: ${guide.places.length} lugares, ${guide.days.length} dias, ${guide.food.length} comidas, ${guide.mapRegions.length} regiões. Sem dependências externas para iniciar.`);
