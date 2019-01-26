const fs = require('fs');
const json2ts = require('json-schema-to-typescript');

const schemaDir = "src/app/shared/services/data/schemas";

fs.readdir(schemaDir, (err, files) => {
	if (err) {
		console.error("Error reading directory", err);
	} else {
		files.forEach(file => {
			if (file.endsWith('.json')) {
				var filets = file.replace('.json', '.d.ts');
				console.info(file + " => " + filets);
				json2ts.compileFromFile(schemaDir + '/' + file)
					.then(ts => fs.writeFileSync(schemaDir + '/' + filets, ts))
					.catch(err => {
						print("Error compiling file " + file, err);
					});
			}
		});
	}
});
