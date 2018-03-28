const goalifyConfig = Assets.getText('goalify/goalify-custom-configs.json');

const S3BUCKETID = 'FileUpload_S3_Bucket';
const subDomain = 'nau';

Meteor.startup(function() {
	Meteor.defer(function() {
		JSON.parse(goalifyConfig).forEach(config => {
			const newConfig = Object.assign({}, config);
			delete newConfig._updatedAt;
			delete newConfig.createdAt;
			newConfig.readonly = true;
			if (newConfig._id === S3BUCKETID) {
				const newValue = newConfig.value.replace('${subdomain}', subDomain);
				newConfig.value = newValue;
				const newMeteorSettingsValue = newConfig.meteorSettingsValue.replace('${subdomain}', subDomain);
				newConfig.meteorSettingsValue = newMeteorSettingsValue;
			}
			RocketChat.models.Settings.upsert({ _id: newConfig._id }, newConfig, err => {
				if (err) {
					console.log(err);
				} else {
					console.log('update', newConfig._id);
				}
			});
		});
	});
});
