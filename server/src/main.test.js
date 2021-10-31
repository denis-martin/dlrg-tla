const supertest = require('supertest');

const config = require('./config.js');

const request = supertest('http://localhost:' + config.port);

describe('index.html file is returned', () => {
	it('should return html', async () => {
		const res = await request.get('/');
		expect(res.statusCode).toEqual(200);
		expect(res.headers['content-type']).toMatch(/^text\/html/);
		expect(res.text).toMatch(/<html(.*)>/);
	});
});

describe('GET /api/alive 200', () => {
	it('should return 200', async () => {
		const res = await request.get('/api/alive');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('code');
		expect(res.body.code).toEqual(200);
	});
});

describe('GET /api/login 401', () => {
	it('should return 401', async () => {
		const res = await request.get('/api/login');
		expect(res.statusCode).toEqual(401);
		expect(res.body).toHaveProperty('code');
		expect(res.body).toHaveProperty('user');
		expect(res.body.code).toEqual(401);
	});
});

describe('GET /api/logout 200', () => {
	it('should return 200', async () => {
		const res = await request.get('/api/logout');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toHaveProperty('code');
		expect(res.body.code).toEqual(200);
	});
});
