const supertest = require('supertest');
const { matchers } = require('jest-json-schema');

const config = require('./config.js');

const request = supertest('http://localhost:' + config.port);

expect.extend(matchers);

const dateTimePattern = '^[0-9]{4}-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9].[0-9]{3}Z$';
const datePattern = '^[0-9]{4}-[0-1][0-9]-[0-3][0-9](T00:00:00.000Z)?$';
//const datePattern = '^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$';

let cookie = '';

describe('POST /api/login 200', () => {
	it('should return 200', async () => {
		const res = await request
			.post('/api/login')
			.set('X-Client-Cert-S', '/CN=' + config.test.user)
			.send({ user: config.test.user, passphrase: config.test.passphrase });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('code');
		expect(res.body).toHaveProperty('ciphertest');
		expect(res.body.ciphertest).toEqual('U2FsdGVkX183peBCkOPw4CaUAEY2Zf3xpNj/5dr8ft4=');
		expect(res.headers).toHaveProperty('set-cookie');
		expect(res.headers['set-cookie'][0]).toMatch(/^session=(.*)/);
		cookie = res.headers['set-cookie'][0].split(';', 1)[0];
		expect(cookie).toMatch(/^session=(.*)/);
	});
});

describe('GET /api/db/participants 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/participants')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				data_enc: { type: 'string' },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/registrations 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/registrations')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				pId: { type: 'integer' },
				ctId: { type: 'integer' },
				data_enc: { type: 'string' },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'pId', 'ctId', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/qualifications 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/qualifications')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				pId: { type: 'integer' },
				qtId: { type: 'integer' },
				data_enc: { type: 'string' },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'pId', 'qtId', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/coursetypes 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/coursetypes')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' },
				prereq: { type: [ 'string', 'null' ] }
			},
			required: ['id', 'name', 'prereq'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/coursetypechecklists 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/coursetypechecklists')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				ctId: { type: 'integer' },
				item: { type: 'string' },
				order: { type: 'integer' },
				changedAt: { type: [ 'string', 'null' ], pattern: dateTimePattern },
				changedBy: { type: [ 'string', 'null' ] }
			},
			required: ['id', 'ctId', 'item', 'order', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/qualificationtypes 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/qualificationtypes')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' },
				order: { type: 'integer' }
			},
			required: ['id', 'name', 'order'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/seasons 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/seasons')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				name: { type: 'string' },
				begin: { type: 'string', pattern: datePattern },
				begin2: { type: 'string', pattern: datePattern },
				end: { type: 'string', pattern: datePattern },
				data_enc: { type: 'string' },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'name', 'begin', 'begin2', 'end', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/courses 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/courses')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				sId: { type: 'integer' },
				ctId: { type: 'integer' },
				name: { type: 'string' },
				begin: { type: 'string', pattern: datePattern },
				end: { type: 'string', pattern: datePattern },
				capacity: { type: [ 'integer', 'null' ] },
				charge: { type: [ 'number', 'null' ] },
				chargeNonMember: { type: [ 'number', 'null' ] },
				seasonPass: { type: 'integer', mininum: 0, maximum: 1 },
				lane: { type: [ 'string', 'null' ] },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'sId', 'ctId', 'name', 'begin', 'end', 'capacity', 'charge', 'chargeNonMember', 'seasonPass', 'lane', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/courseparticipants 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/courseparticipants')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				sId: { type: 'integer' },
				cId: { type: 'integer' },
				pId: { type: 'integer' },
				instructor: { type: 'integer', mininum: 0, maximum: 1 },
				charge: { type: [ 'number', 'null' ] },
				chargePayedAt: { type: [ 'string', 'null' ], pattern: datePattern },
				familyDiscount: { type: 'integer', mininum: 0, maximum: 1 },
				status: { type: 'integer', mininum: 0, maximum: 3 },
				passSent: { type: 'integer', mininum: 0, maximum: 1 },
				data_enc: { type: 'string' },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'sId', 'cId', 'pId', 'instructor', 'charge', 'chargePayedAt', 'familyDiscount', 'status', 'passSent', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});

describe('GET /api/db/presence 200', () => {
	it('should return 200', async () => {
		const res = await request
			.get('/api/db/presence')
			.set('Cookie', cookie)
			.set('X-Client-Cert-S', '/CN=' + config.test.user);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('length');
		expect(res.body.length).toBeGreaterThan(0);

		const schema = {
			properties: {
				id: { type: 'integer' },
				pId: { type: 'integer' },
				date: { type: 'string', pattern: datePattern },
				presence: { type: 'integer', mininum: 0, maximum: 2 },
				data_enc: { type: [ 'string', 'null' ] },
				changedAt: { type: 'string', pattern: dateTimePattern },
				changedBy: { type: 'string' }
			},
			required: ['id', 'pId', 'date', 'presence', 'data_enc', 'changedAt', 'changedBy'],
			additionalProperties: false
		};

		for (const p of res.body) {
			expect(p).toMatchSchema(schema);
		}
	});
});
