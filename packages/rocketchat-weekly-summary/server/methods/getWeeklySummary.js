Meteor.methods({
	getWeeklySummary(refresh) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getWeeklySummary' });
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getWeeklySummary' });
		}

		if (refresh) {
			return RocketChat.statistics.save();
		} else {
			return RocketChat.models.WeeklySummary.findLast();
		}
	}
});
