const mysql = require('mysql');
const http = require('https');
const logger = require('./logger');

const errors = require('./errors.js');
const config = require('./config.js');

const tableAcl = {
	participants: {
		write: [ "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	registrations: {
		write: [ "pId", "ctId", "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	qualifications: {
		write: [ "pId", "qtId", "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	coursetypes: {
		write: [  ],
		methods: ["GET"] //, "POST", "PUT", "DELETE"]
	},

	coursetypechecklists: {
		write: [ "ctId", "item", "order" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	qualificationtypes: {
		write: [  ],
		methods: ["GET"] //, "POST", "PUT", "DELETE"]
	},

	seasons: {
		write: [ "name", "begin", "begin2", "end", "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	courses: {
		write: [ "sId", "ctId", "name", "begin", "end", "capacity", "charge", "chargeNonMember", "seasonPass", "lane" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	},

	courseparticipants: {
		write: [ "sId", "cId", "pId", "instructor", "charge", "chargePayedAt", "familyDiscount", "status", "passSent", "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"],
		query: [ "sId" ]
	},

	presence: {
		write: [ "pId", "date", "presence", "data_enc" ],
		methods: ["GET", "POST", "PUT", "DELETE"]
	}
}

let dbc = null; // database connection

function requireDbc(req, res, next) 
{
	if (!(dbc && (dbc.state == "connected" || dbc.state == "authenticated"))) {
		logger.info("Connecting to DB " + config.connection.database);
		dbc = mysql.createConnection(config.connection);
		if (!dbc) {
			res.status(500).send({ code: 500, error: errors.dbc });
		} else {
			dbc.connect(function(err) {
				if (err) {
					logger.error('Error connecting to db: ' + err.stack);
					res.status(500).send({ code: 500, error: errors.dbc });
				} else {
					logger.info("Success! ThreadId " + dbc.threadId);
					next();
				}
			});
		}
	} else {
		next();
	}
}

function checkTableAcl(req, res, next)
{
	if (!(req.params && req.params.tablename && (Object.keys(tableAcl).indexOf(req.params.tablename) > -1))) {
		res.status(403).send({ code: 403, error: errors.dbTableAcl });
		
	} else {
		if (tableAcl[req.params.tablename].methods.indexOf(req.method) == -1) {
			res.status(405).send({ code: 405, error: errors.dbTableAclMethod });

		} else if (req.method == "POST" || req.method == "PUT") {
			let fieldErrors = false;
			// ignore some fields
			delete req.body.id;
			delete req.body.changedAt;
			delete req.body.changedBy;
			Object.keys(req.body).forEach(k => 
				fieldErrors = fieldErrors || (tableAcl[req.params.tablename].write.indexOf(k) == -1));
			// todo: check types against db schema
			if (fieldErrors) {
				res.status(400).send({ code: 400, error: errors.dbTableAclWriteField });
			} else {
				next();
			}

		} else {
			next();
		}
	}
}

module.exports = function(app, requireLogin, extractUser)
{

app.post('/api/login', requireDbc, function(req, res) 
{
	//logger.info(req);
	const clientCert = req.get("X-Client-Cert-S");
	logger.info("post login cert:", clientCert);
	const user = extractUser(clientCert);
	logger.info("post login name:", user);

	// eslint-disable-next-line no-unused-vars
	dbc.query('SELECT * FROM dlrg_tla_users WHERE name="' + user + '" AND passhash=SHA2("' + req.body.passphrase + '", 256);', function(err, rows, fields) {
		if (err) {
			logger.info(err);
			res.status(500).send({ code: 500, error: errors.dbGet });
		} else {
			if (rows.length == 1) {
				logger.info("login success:", user);
				req.session.user = user;
				req.session.authenticated = true;
				res.status(200).send({ code: 200, ciphertest: "U2FsdGVkX183peBCkOPw4CaUAEY2Zf3xpNj/5dr8ft4=" });
			} else {
				logger.info("login failure:", user);
				if (user) {
					res.status(401).send({ code: 401, user: user });
				} else {
					res.status(401).send({ code: 401 });
				}
			}
		}
	});
});

app.get('/api/db/:tablename', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	let filter = "";
	if (tableAcl[req.params.tablename].query) {
		const query = [];
		for (let p of tableAcl[req.params.tablename].query) {
			if (p in req.query) {
				query.push(p + " = " + mysql.escape(req.query[p]));
			}
		}
		if (query.length > 0) {
			filter = " WHERE " + query.join(', ');
		}
	}
	// eslint-disable-next-line no-unused-vars
	dbc.query('SELECT * FROM dlrg_tla_' + req.params.tablename + filter + ';', function(err, rows, fields) {
		if (err) {
			logger.info(errors.dbGet, err);
			res.status(500).send({ code: 500, error: errors.dbGet });

		} else {
			res.status(200).send(rows);

		}
	});
});

app.get('/api/db/:tablename/:id', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	if (!(req.params && req.params.id && parseInt(req.params.id) == req.params.id)) {
		res.status(400).send({ code: 400, error: errors.dbGetReq });

	} else {
		// eslint-disable-next-line no-unused-vars
		dbc.query('SELECT * FROM dlrg_tla_' + req.params.tablename + ' WHERE id=' + req.params.id + ';', function(err, rows, fields) {
			if (err) {
				logger.info(errors.dbGet, err);
				res.status(500).send({ code: 500, error: errors.dbGet });

			} else {
				if (rows.length == 0) {
					res.status(404).send({ code: 404 });

				} else {
					if (rows.length > 1) {
						logger.error("'id' is not unique");
					}
					res.status(200).send(rows[0]);

				}
			}
		});
	}
});

app.post('/api/db/:tablename', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	if (!(req.body && typeof req.body == "object")) {
		res.status(400).send({ code: 400, error: errors.dbPostReq });

	} else {
		const now = new Date();
		req.body.changedAt = now.toISOString().slice(0, 19).replace('T', ' ');
		req.body.changedBy = req.user;
		dbc.query("INSERT INTO dlrg_tla_" + req.params.tablename + " SET ?;", req.body,
			function(err, info) {
				if (err) {
					logger.info(errors.dbPost, err);
					res.status(500).send({ code: 500, error: errors.dbPost });

				} else {
					res.status(200).send({ 
						id: info.insertId, 
						changedBy: req.body.changedBy, 
						changedAt: req.body.changedAt 
					});
				}
			}
		);
	}
});

app.delete('/api/db/:tablename/:id', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	if (!(req.params && req.params.id && parseInt(req.params.id) == req.params.id)) {
		res.status(400).send({ code: 400, error: errors.dbDeleteReq });

	} else {
		dbc.query("DELETE FROM dlrg_tla_" + req.params.tablename + " WHERE id=" + req.params.id + ";",
			function(err, info) {
				if (err) {
					logger.info(errors.dbDelete, err);
					res.status(500).send({ code: 500, error: errors.dbDelete });
				} else {
					if (info.affectedRows == 0) {
						res.status(404).send({ code: 404 });
					} else {
						res.status(200).send({ count: info.affectedRows });
					}
				}
			}
		);
	}
});

app.put('/api/db/:tablename/:id', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	if (!(req.params && req.params.id && parseInt(req.params.id) == req.params.id) ||
		!(req.body && typeof req.body == "object"))
	{
		res.status(400).send({ code: 400, error: errors.dbPutReq });

	} else {
		const now = new Date();
		req.body.changedAt = now.toISOString().slice(0, 19).replace('T', ' ');
		req.body.changedBy = req.user;
		dbc.query("UPDATE dlrg_tla_" + req.params.tablename + " SET ? WHERE id=" + req.params.id + ";", req.body,
			function(err, info) {
				if (err) {
					logger.info(errors.dbputparticipant, err);
					res.status(500).send({ code: 500, error: errors.dbPut });
				} else {
					logger.info(info);
					if (info.affectedRows == 0) {
						res.status(404).send({ code: 404 });
					} else {
						res.status(200).send({ 
							count: info.affectedRows, 
							changed: info.changedRows,
							changedBy: req.body.changedBy, 
							changedAt: req.body.changedAt  
						});
					}
				}
			}
		);
	}
});

// admin/import only
app.post('/api/db/:tablename/:id', requireLogin, checkTableAcl, requireDbc, function(req, res)
{
	if (!(req.params && req.params.id && parseInt(req.params.id) == req.params.id) ||
		!(req.body && typeof req.body == "object")) 
	{
		res.status(400).send({ code: 400, error: errors.dbPostReq });

	} else {
		const now = new Date();
		req.body.id = req.params.id;
		req.body.changedAt = now.toISOString().slice(0, 19).replace('T', ' ');
		req.body.changedBy = req.user;
		dbc.query("INSERT INTO dlrg_tla_" + req.params.tablename + " SET ?;", req.body,
			function(err, info) {
				if (err) {
					logger.info(errors.dbPost, err);
					res.status(500).send({ code: 500, error: errors.dbPost });

				} else {
					res.status(200).send({ 
						id: info.insertId, 
						changedBy: req.body.changedBy, 
						changedAt: req.body.changedAt 
					});
				}
			}
		);
	}
});

app.get('/api/calendars/:cal', requireLogin, function(req, res)
{
	const mycalendars = config.calendars;
	
	if (!mycalendars[req.params.cal]) {
		res.status(404).send({ code: 404, error: errors.notFound });
		return;
	}
	const request = http.request(mycalendars[req.params.cal],
		function(response) {
			let data = "";
			res.status(response.statusCode);
			res.contentType(response.headers['content-type']);
			response.on('data', function(chunk) {
				data = data + chunk;
			});
			response.on('end', function() {
				res.send(data);
			});
		}
	);
	request.on('error', function(e) {
		console.log("error", e);
		res.status(502).send({ code: 502, error: errors.badGateway });
	});
	request.end();
});

app.post('/api/presence', requireLogin, requireDbc, function(req, res)
{
	if (!(req.body && typeof req.body == "object")) {
		res.status(400).send({ code: 400, error: errors.dbPostReq });
		console.log(typeof req.body);

	} else {
		const now = new Date();
		const changedAt = now.toISOString().slice(0, 19).replace('T', ' ');
		const changedBy = req.user;
		const r = req.body;
		if (r.date && r.date.includes('T')) {
			r.date = r.date.split('T')[0];
		}
		let data_enc = "NULL";
		let data_enc_update = "";
		if (r.data_enc) {
			data_enc = mysql.escape(r.data_enc);
			data_enc_update = "data_enc=" + data_enc + ", ";
		}

		const queryStr =
			"INSERT INTO dlrg_tla_presence (date, pId, presence, data_enc, changedAt, changedBy) VALUES (" + 
				"\"" + r.date + "\", " + 
				r.pId + ", " +
				r.presence + ", " +
				data_enc + ", " +
				"\"" + changedAt + "\", " +
				"\"" + changedBy + "\") " + 
			"ON DUPLICATE KEY UPDATE " + 
				"presence=" + r.presence + ", " + 
				data_enc_update + 
				"changedAt=\"" + changedAt + "\", " + 
				"changedBy=\"" + changedBy + "\";\n";
		dbc.query(queryStr,
			// eslint-disable-next-line no-unused-vars
			(err, info) => {
				if (err) {
					logger.info(errors.dbPost, err);
					res.status(500).send({ code: 500, error: errors.dbPost });

				} else {
					res.status(200).send({
						changedBy: changedBy, 
						changedAt: changedAt 
					});
				}
			}
		);
	}
});

// // deprecated
// app.post('/api/presence/upload', requireLogin, requireDbc, function(req, res)
// {
// 	if (!(req.body && typeof req.body == "object")) {
// 		res.status(400).send({ code: 400, error: errors.dbPostReq });
// 		console.log(typeof req.body);

// 	} else {
// 		const now = new Date();
// 		const changedAt = now.toISOString().slice(0, 19).replace('T', ' ');
// 		const changedBy = req.user;
// 		let successCount = 0;
// 		let errorCount = 0;

// 		req.body.forEach(r => {
// 			if (r.date && r.date.includes('T')) {
// 				r.date = r.date.split('T')[0];
// 			}
// 			console.log(JSON.stringify(r));

// 			const queryStr =
// 				"INSERT INTO dlrg_tla_presence (date, pId, presence, changedAt, changedBy) VALUES (" + 
// 					"\"" + r.date + "\", " + 
// 					r.pId + ", " +
// 					r.presence + ", " +
// 					"\"" + changedAt + "\", " +
// 					"\"" + changedBy + "\") " + 
// 				"ON DUPLICATE KEY UPDATE " + 
// 					"presence=" + r.presence + ", " + 
// 					"changedAt=\"" + changedAt + "\", " + 
// 					"changedBy=\"" + changedBy + "\";\n";
// 			dbc.query(queryStr,
// 				// eslint-disable-next-line no-unused-vars
// 				(err, info) => {
// 					if (err) {
// 						logger.info(errors.dbPost, err);

// 						errorCount = errorCount + 1;
// 						if (errorCount + successCount == req.body.length) {
// 							if (errorCount == 0) {
// 								res.status(200).send({
// 									changedBy: changedBy, 
// 									changedAt: changedAt 
// 								});
// 							} else {
// 								res.status(500).send({ code: 500, error: errors.dbPost });
// 							}
// 						}
	
// 					} else {
// 						successCount = successCount + 1;
// 						if (errorCount + successCount == req.body.length) {
// 							if (errorCount == 0) {
// 								res.status(200).send({
// 									changedBy: changedBy, 
// 									changedAt: changedAt 
// 								});
// 							} else {
// 								res.status(500).send({ code: 500, error: errors.dbPost });
// 							}
// 						}
// 					}
// 				}
// 			);
// 		});
// 	}
// });

} // exports
