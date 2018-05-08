Package.describe({
	name: 'goalifychat:weekly-summary',
	version: '0.0.1',
	summary: 'Weekly summary generator',
	git: ''
});

Package.onUse(function(api) {
	api.use([
		'mongo',
		'ecmascript',
		'rocketchat:lib'
	]);

	// WeeklySummary
	api.addFiles('lib/rocketchat.js', [ 'client', 'server' ]);
	api.addFiles([
		'server/models/WeeklySummary.js',
		'server/functions/get.js',
		'server/functions/save.js',
		'server/methods/getWeeklySummary.js'
	], 'server');
});
