RocketChat.weeklySummary.save = function() {
	const weeklySummary = RocketChat.weeklySummary.get();
	weeklySummary.createdAt = new Date;
	RocketChat.models.WeeklySummary.insert(weeklySummary);
	return weeklySummary;
};
