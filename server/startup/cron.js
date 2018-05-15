/* global SyncedCron */
import moment from 'moment';
const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history'
});

function generateStatistics() {
	const statistics = RocketChat.statistics.save();

	statistics.host = Meteor.absoluteUrl();

	if (RocketChat.settings.get('Statistics_reporting')) {
		try {
			HTTP.post('https://collector.rocket.chat/', {
				data: statistics
			});
		} catch (error) {
			/*error*/
			logger.warn('Failed to send usage report');
		}
	}
}

function cleanupOEmbedCache() {
	return Meteor.call('OEmbedCacheCleanup');
}

function generateWeeklySummary() {
	const weeklySummary = RocketChat.weeklySummary.save();
	const from = RocketChat.settings.get('From_Email');
	const siteName = RocketChat.settings.get('Site_Name') || 'Goalify Chat' ;
	const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
	const subject = `${ siteName }'s Weekly Summary`;
	const percentPublicChannel = Math.round(weeklySummary.totalChannelMessagesInWeek / weeklySummary.totalMessagesInWeek * 100);
	const percentPrivateChannel = Math.round(weeklySummary.totalPrivateGroupMessagesInWeek / weeklySummary.totalMessagesInWeek * 100);
	const percentDirectMessages = Math.round(weeklySummary.totalDirectMessagesInWeek / weeklySummary.totalMessagesInWeek * 100);
	const percentLivechatMessages = Math.round(weeklySummary.totalLivechatMessagesInWeek / weeklySummary.totalMessagesInWeek * 100);
	const html = `<h2>${ moment(weeklySummary.startDate).format('dddd, MMMM Do') } - ${ moment(weeklySummary.endDate).format('dddd, MMMM Do') }</h2><p>Hope you had a good weekend! Here's a summary of what happened in your workspace last week:<br><br>Your members sent a total of <strong>${ weeklySummary.totalMessagesInWeek } ${ weeklySummary.totalMessagesInWeek === 1 ? 'message' : 'messages' }</strong> last week. Of those, <strong>${ percentPublicChannel }% were in public channels</strong>, <strong>${ percentPrivateChannel }% were in private channels</strong>, <strong>${ percentDirectMessages }% were direct messages</strong> and <strong>${ percentLivechatMessages }% were livechat messages</strong>. Your members also uploaded <strong>${ weeklySummary.totalFiles } ${ weeklySummary.totalFiles === 1 ? 'file' : 'files' }</strong>.<br><br>Your workspace has <strong>${ weeklySummary.admins.length } ${ weeklySummary.admins.length === 1 ? 'admin' : 'admins' }</strong>: ${ weeklySummary.admins.map(admin => admin.name).join(',') }. In total there are <strong>${ weeklySummary.totalUsers } people</strong> in your workspace.</p>`;
	const adminEmails = weeklySummary.admins.map(admin => {
		let email = undefined;
		if (admin.emails && admin.emails[0] && admin.emails[0].address) {
			email = admin.emails[0].address;
		}
		return email;
	});
	const emailTo = ['support@goalify.chat'].concat(adminEmails.filter(email => !!email));
	if (from) {
		emailTo.forEach((toEmail) => {
			Email.send({
				to: toEmail,
				from,
				subject,
				html: header + html + footer
			});
		});
	} else {
		console.log('no From_Email');
	}
}

Meteor.startup(function() {
	return Meteor.defer(function() {
		generateStatistics();
		// generateWeeklySummary();

		SyncedCron.add({
			name: 'Generate and save statistics',
			schedule(parser) {
				return parser.cron(`${ new Date().getMinutes() } * * * *`);
			},
			job: generateStatistics
		});

		SyncedCron.add({
			name: 'Cleanup OEmbed cache',
			schedule(parser) {
				const now = new Date();
				return parser.cron(`${ now.getMinutes() } ${ now.getHours() } * * *`);
			},
			job: cleanupOEmbedCache
		});

		SyncedCron.add({
			name: 'Generate and save weekly summary',
			schedule(parser) {
				return parser.cron('0 8 * * MON');
			},
			job: generateWeeklySummary
		});

		return SyncedCron.start();
	});
});
