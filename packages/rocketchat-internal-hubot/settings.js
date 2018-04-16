RocketChat.settings.addGroup('InternalHubot', function() {
	this.add('InternalHubot_Enabled', false, { type: 'boolean', i18nLabel: 'Enabled' });
	this.add('InternalHubot_Username', 'goly', {
		type: 'string',
		i18nLabel: 'Username',
		i18nDescription: 'InternalHubot_Username_Description',
		public: true
	});
	this.add('InternalHubot_ScriptsToLoad', '', { type: 'string' });
	this.add('InternalHubot_PathToLoadCustomScripts', '', { type: 'string' });
	this.add('InternalHubot_EnableForChannels', true, { type: 'boolean' });
	this.add('InternalHubot_EnableForDirectMessages', false, { type: 'boolean' });
	this.add('InternalHubot_EnableForPrivateGroups', false, { type: 'boolean' });
	this.add('InternalHubot_Location', 'Ho Chi Minh', { type: 'string' });
	this.add('InternalHubot_GoalifyAPIGateWay', 'https://api.dev.goalify.plus', { type: 'string' });
	this.add('InternalHubot_GoalifyAPIToken', '', { type: 'string' });
	// this.add('InternalHubot_reload', 'reloadInternalHubot', {
	// 	type: 'action',
	// 	actionText: 'reload'
	// });
});
