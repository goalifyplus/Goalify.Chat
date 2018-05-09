// Put your Gola webhook here, make sure its connected to the correct channel
var WEBHOOK_POST_URL = 'https://nau.goalify.chat/hooks/INTEGRATION_TOKEN';

// register form submit trigger for this function
function onSubmit(entry) {
	// Get items submitted
	var items = entry.response.getItemResponses();

	// responses
	var responses = [];

	for (i in items) {
		//Logger.log("getItem().getTitle()=%s, getResponse()=%s", items[i].getItem().getTitle(), items[i].getResponse());
		responses.push({
			title: items[i].getItem().getTitle(),
			response: items[i].getResponse(),
		});
	}

	callWebhook(responses);
}

// actually call the web hook
function callWebhook(responses) {
	// sample responses (actual reponses array does not contain Email):
	// responses = [
	//   { title: 'Email address', response: 'thanh@naustud.io' },
	//   { title: 'Company Name', response: 'Nau Studio' },
	//   { title: 'Company Website', response: 'https://naustud.io' },
	//   { title: 'Desired Subdomain', response: 'nau' },
	//   { title: 'Admin User Full Name', response: 'Thanh Tran' },
	//   { title: 'Admin Username', response: 'thanh' },
	//   { title: 'Number of intended users', response: '20' },
	// ];

	var payload = {
		text: 'Yay! A new registration',
		attachments: [
			{
				color: '#5863e0',
				title: 'Go to Registration spreadsheet',
				title_link:
					'https://docs.google.com/spreadsheets/d/1s19hbazHudS34JYW-sNqFof-fm_bkQPWUKp26lFCCuQ/edit#gid=2049456746',
				text: 'Here are the new registration details:',
				fields: responses.map(function(field) {
					return {
						title: field.title,
						value: field.response || 'N/A',
						short: true,
					};
				}),
			},
		],
	};

	// Build request
	var options = {
		method: 'post',
		payload: {
			payload: JSON.stringify(payload),
		},
	};

	// Send to Gola
	UrlFetchApp.fetch(WEBHOOK_POST_URL, options);
}
