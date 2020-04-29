const fs = require('fs');

fs.readdir('grids/', function (err, files) {
    fs.writeFileSync('docs/grids-files.json', JSON.stringify(files));
});
