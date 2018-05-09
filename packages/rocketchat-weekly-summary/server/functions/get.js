import _ from 'underscore';

RocketChat.weeklySummary.get = function _getWeeklySummary() {
	const weeklySummary = {};
	const now = new Date();
	const weekday = now.getDay();
	const nowDate = now.getDate();
	const lastDayLastWeek = new Date(now.setDate(nowDate - weekday));
	lastDayLastWeek.setHours(23, 59, 59);
	const firstDayLastWeek = new Date(now.setDate(nowDate - weekday - 6));
	firstDayLastWeek.setHours(0, 0, 1);

	weeklySummary.startDate = firstDayLastWeek;
	weeklySummary.endDate = lastDayLastWeek;

	const weeklyQuery = {
		$and: [
			{ ts: { $gte: firstDayLastWeek } },
			{ ts: { $lte: lastDayLastWeek } }
		]
	};

	// Total User
	weeklySummary.totalUsers = Meteor.users.find().count();
	weeklySummary.admins = Meteor.users.find({ roles: { $in: ['admin'] } }).fetch();
	weeklySummary.activeUsers = Meteor.users.find({ active: true }).count();
	weeklySummary.nonActiveUsers = weeklySummary.totalUsers - weeklySummary.activeUsers;

	// Total Room
	weeklySummary.totalRooms = RocketChat.models.Rooms.find().count();
	weeklySummary.totalChannels = RocketChat.models.Rooms.findByType('c').count();
	weeklySummary.totalPrivateGroups = RocketChat.models.Rooms.findByType('p').count();
	weeklySummary.totalDirect = RocketChat.models.Rooms.findByType('d').count();
	weeklySummary.totlalLivechat = RocketChat.models.Rooms.findByType('l').count();

	// Total Message
	weeklySummary.totalChannelMessages = _.reduce(RocketChat.models.Rooms.findByType('c', { fields: { 'msgs': 1 }}).fetch(), function _countChannelMessages(num, room) { return num + room.msgs; }, 0);
	weeklySummary.totalPrivateGroupMessages = _.reduce(RocketChat.models.Rooms.findByType('p', { fields: { 'msgs': 1 }}).fetch(), function _countPrivateGroupMessages(num, room) { return num + room.msgs; }, 0);
	weeklySummary.totalDirectMessages = _.reduce(RocketChat.models.Rooms.findByType('d', { fields: { 'msgs': 1 }}).fetch(), function _countDirectMessages(num, room) { return num + room.msgs; }, 0);
	weeklySummary.totalLivechatMessages = _.reduce(RocketChat.models.Rooms.findByType('l', { fields: { 'msgs': 1 }}).fetch(), function _countLivechatMessages(num, room) { return num + room.msgs; }, 0);

	// Message Weekly
	let messagesInWeek = RocketChat.models.Messages.find(weeklyQuery);
	weeklySummary.totalMessagesInWeek = messagesInWeek.count();
	messagesInWeek = messagesInWeek.map(message => {
		return Object.assign({}, message, {
			room: RocketChat.models.Rooms.findOne({ _id: message.rid })
		});
	});
	weeklySummary.totalChannelMessagesInWeek = messagesInWeek.filter(message => message.room.t === 'c').length;
	weeklySummary.totalPrivateGroupMessagesInWeek = messagesInWeek.filter(message => message.room.t === 'p').length;
	weeklySummary.totalDirectMessagesInWeek = messagesInWeek.filter(message => message.room.t === 'd').length;
	weeklySummary.totalLivechatMessagesInWeek = messagesInWeek.filter(message => message.room.t === 'l').length;
	weeklySummary.totalFiles = messagesInWeek.filter(message => !!message.file).length;

	return weeklySummary;
};
