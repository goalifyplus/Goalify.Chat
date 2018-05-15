Template.goalifyPlus.helpers({
	subDomain() {
		const domain = window.location.host;
		let subdomain;
		if (domain.indexOf('goalify.chat') > -1) {
			subdomain = domain.split('.')[0];
		}
		return subdomain || 'nau';
	}
});
