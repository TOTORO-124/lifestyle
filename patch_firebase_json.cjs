const fs = require('fs');
let data = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
if (!data.hosting.site) {
  data.hosting.site = "lifestyle-9abea";
  fs.writeFileSync('firebase.json', JSON.stringify(data, null, 2));
  console.log('patched firebase.json');
}
