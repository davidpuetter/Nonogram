const fs = require('fs');
const dirPathPrefix = process.argv[2] || 'grids/';

fs.readdir('grids/', function (err, filenames) {
    fs.writeFileSync('docs/grids-files.json', JSON.stringify(filenames.map(function(filename) { return dirPathPrefix + filename; })));
});
