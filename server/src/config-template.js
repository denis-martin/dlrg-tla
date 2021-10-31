
module.exports = {
	engineeringMode: false, // if true, allow CORS on localhost:4200 (angular/webpack)
	port: 3100, // listen port
	hostname: 'localhost', // listen interface (localhost or 0.0.0.0, ...)
	logger: {
		commandLine: true,
	},
	connection: {
		host     : 'localhost',
		user     : 'dlrg_admin',
		password : 'xxx',
		database : 'dlrg_tla_test',
		timezone : 'utc'
	},
	session: {
		secret : 'ne8~g|kGBm2~JGjgV9%S',
		secure : true
	},
	test: {
		user: '',
		passphrase: ''
	},
	calendars: {
		dlrgettlingen: {
			method: "GET",
			host: "calendar.google.com",
			port: 443,
			path: "",
		},
		ferienbw: { // https://sites.google.com/site/schulferienkalender/
			method: "GET",
			host: "calendar.google.com",
			port: 443,
			path: "/calendar/ical/2vokk15mt5sua7ji7f9esdjl3g%40group.calendar.google.com/public/basic.ics",
		},
		feiertage: {
			method: "GET",
			host: "calendar.google.com",
			port: 443,
			path: "/calendar/ical/german__de%40holiday.calendar.google.com/public/basic.ics",
		},
	}
}
