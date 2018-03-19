const settings = require('./goalify-default-configs.json');
const fs = require('fs');

const customSettings = [];

settings.forEach(conf => {
	if (conf.value !== conf.packageValue) {
		customSettings.push(conf);
	}
});

/*prettier-ignore*/
console.log(`Custom settings has ${ customSettings.length } items.`);

fs.writeFile('goalify-custom-configs.json', JSON.stringify(customSettings, null, 2));
