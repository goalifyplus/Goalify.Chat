/**
 * This script only need to run once to reduce to only settings that were changed from packageValue
 * Note: Need to update the ${subdomain} token again, for e.g. at FileUpload_S3_Bucket
 *
 */

const settings = require('./goalify-all-configs.json');
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
