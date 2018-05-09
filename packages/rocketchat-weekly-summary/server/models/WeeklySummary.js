RocketChat.models.WeeklySummary = new class extends RocketChat.models._Base {
	constructor() {
		super('weekly-summary');

		this.tryEnsureIndex({ 'createdAt': 1 });
	}

	// FIND ONE
	findOneById(_id, options) {
		const query = { _id };
		return this.findOne(query, options);
	}

	findLast() {
		const options = {
			sort: {
				createdAt: -1
			},
			limit: 1
		};
		const records = this.find({}, options).fetch();
		return records && records[0];
	}
};
