const helmet = require('helmet');
const session = require('client-sessions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser')
const logger = require('./logger');
const config = require('./config.js');

const app = express();

app.use(helmet());

const corsOptions = {
	origin: 'http://localhost:4200',
	credentials: true
}

if (config.engineeringMode) {
	app.use(cors(corsOptions));
}

app.use(function(req, res, next) 
{
	if (req.path.substr(0, 4) == "/api") {
		res.contentType('application/json');
		res.headers
	}
	if (req.method == "POST" && req.headers["content-type"].substr(0, 16) != "application/json") {
		logger.info("Returning 415, content-type:", req.headers["content-type"]);
		res.status(415).send({ code: 415 });
	} else {
		next();
	}
});

app.use(bodyParser.json());

app.use(function(err, req, res, next)
{
	if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
		console.err("Returning 400");
		res.status(400).send({ code: 400 });
	} else {
		next();
	}
});

app.use(session(
{
	cookieName: 'session',
	secret: config.session.secret,
	duration: 60 * 60 * 1000, // 60 minutes initial duration
	activeDuration: 60 * 60 * 1000, // prolong by 60 minutes
	httpOnly: true, // do not expose to browser's javascript
	secure: config.session.secure, // instruct browser to only send cookie over https
	ephemeral: true // instruct browser to drop cookie when browser is closed
}));

app.use(function(req, res, next) 
{
	if (req.session) {
		if (req.session.authenticated && req.session.user) {
			req.user = req.session.user;
			logger.verbose("session", req.user, req.url);
		}
		// finishing processing the middleware and run the route
		next();
	} else {
		next();
	}
});

function extractUser (clientCert)
{
	if (!clientCert) {
		if (config.engineeringMode) {
			clientCert = "/CN=Administrator";
		} else {
			clientCert = "";
		}
	}
	var sl = clientCert.match(/CN=([a-zA-ZäöüßÄÖÜ ]*)/);
	if (sl && sl.length > 1) {
		return sl[1];
	}
	return "";
}

function requireLogin (req, res, next) 
{
	if (!req.user) {
		var clientCert = req.get("X-Client-Cert-S");
		logger.info("requireLogin", clientCert, req.url);
		var user = extractUser(clientCert);
		if (user) {
			//logger.info("requireLogin name:", user);
			res.status(401).send({ code: 401, user: user });
		} else {
			logger.error("requireLogin: cannot extract user from " + clientCert);
			res.status(401).send({ code: 401 });
		}
	} else {
		next();
	}
}

app.get('/api/logout', function(req, res) 
{
	req.session.reset();
	res.status(200).send({ code: 200 });
});

app.get('/api/login', requireLogin, function(req, res) 
{
	res.status(200).send({ code: 200, user: req.user, ciphertest: "U2FsdGVkX183peBCkOPw4CaUAEY2Zf3xpNj/5dr8ft4=" });
});

app.get('/api/alive', function(req, res) 
{
	res.status(200).send({ code: 200 });
});

require("./api")(app, requireLogin, extractUser);

app.use(express.static('../client'));

logger.info("Listening on", config.hostname, config.port);
app.listen(config.port, config.hostname);
