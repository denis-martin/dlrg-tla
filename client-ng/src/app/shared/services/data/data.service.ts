/*	
 * Copyright 2019 Denis Martin.  This file is part of swadit.
 * 
 * swadit is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * swadit is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with swadit.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { timer, Subscription } from 'rxjs';

import { AES, SHA256, enc } from 'crypto-js';
import * as Ajv from 'ajv';

import * as SchemaParticipant from './schemas/participant.json';
import * as SchemaRegistration from './schemas/registration.json';

import { IParticipant } from './schemas/participant';
import { IRegistration } from './schemas/registration';

const apiBasePath = "http://localhost:3100/";
const ciphertest = "1234567890";

// handles /api/db/{table} calls
class TableConnector
{
	private isSyncing = false;
	private autoSync = false;
	private validate: any;
	private timerSub: Subscription;

	constructor(private table: string, private schema: any, private refreshRate: number, private ds: DataService) 
	{
		var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
		this.validate = ajv.compile(schema);
	}

	sync(autoSync = false): void 
	{
		let self = this;
		if (this.autoSync && autoSync) {
			// no action required since autoSync is active
			console.info("Skipping sync since autoSync is active");
			return;
		}
		if (this.isSyncing) {
			console.warn("Syncing already in progress");
			return;
		}
		this.isSyncing = true;
		this.ds.http.get(apiBasePath + "api/db/" + this.table, this.ds.httpOptions)
			.toPromise()
			.then((response: HttpResponse<Object>) => {
				console.log("HTTP GET " + apiBasePath + "api/db/" + this.table + " was successful", response);
				var items: any = response;
				items.forEach(item => {
					if (item['id'] in this.ds[this.table]) {
						let remoteChangedAt = new Date(item['changedAt']);
						let localChangedAt = new Date(this.ds[this.table][item['id']].changedAt);
						if (remoteChangedAt > localChangedAt) {
							console.info("Updating", item);
							this.ds[this.table][item['id']] = this.unpack(item);
						}
					} else {
						this.ds[this.table][item['id']] = this.unpack(item);
					}
				});
				console.log(this.ds[this.table]);
				if (autoSync && !self.autoSync) {
					self.autoSync = true;
					self.timerSub = timer(self.refreshRate, self.refreshRate)
						.subscribe(t => { self.sync(); });
				}
				this.isSyncing = false;
			})
			.catch((response) => {
				self.handleError(response);
				this.isSyncing = false;
			});
	}

	stopSync()
	{
		this.timerSub.unsubscribe();
	}

	private handleError(response): void
	{
		console.error("HTTP request failed", response);
		if (response.status == 401) {
			this.ds.isLoggedIn().catch(err => {}); // check login state
		}
	}

	unpack(item: any): any
	{
		let parsedItem = item;
		parsedItem['data'] = JSON.parse(this.ds.decrypt(item['data_enc']));
		var valid = this.validate(parsedItem);
		if (!valid) {
			console.warn("Validation error", parsedItem, this.validate.errors);
		}
		return parsedItem;
	}
}

@Injectable({
	providedIn: 'root'
})
export class DataService 
{
	public httpOptions = {
		headers: new HttpHeaders({
				"Content-Type": "application/json; charset=utf-8"
			}),
		withCredentials: true
	}
	
	private cipherChallenge: string;

	public userName: string = null;
	public needLogin = true;
	public needDataKey = true;
	public dataKeyHash: string;

	readonly schemas = {
		participant: SchemaParticipant.default,
		registration: SchemaRegistration.default
	}

	participants: { [k: number]: IParticipant } = {}
	registrations: { [k: number]: IRegistration } = {}

	tableConnectors = {
		participants: new TableConnector('participants', this.schemas.participant, 5000, this),
		registrations: new TableConnector('registrations', this.schemas.registration, 5000, this)
	}

	/*
	db = {
		participants: [],
		registrations: [],
		qualifications: [],
		coursetypes: [],
		coursetypechecklists: [],
		qualificationtypes: [],
		seasons: [],
		courses: [],
		courseparticipants: [],
	};

	private refreshRates = {
		participants: 5000,
		registrations: 5000,
		qualifications: 5000,
		coursetypes: 120000,
		coursetypechecklists: 120000,
		qualificationtypes: 120000,
		seasons: 120000,
		courses: 5000,
		courseparticipants: 5000,
	};
	*/

	constructor(public http: HttpClient)
	{
		if (!this.dataKeyHash) {
			this.dataKeyHash = localStorage.getItem("dkh");
			if (this.dataKeyHash) {
				this.needDataKey = false;
			}
		}
		console.info("DataService is alive");
	}

	isLoggedIn()
	{
		return new Promise((resolve, reject) => 
		{
            this.http.get(apiBasePath + "api/login", this.httpOptions)
                .toPromise()
                .then((response: HttpResponse<Object>) => 
                {
                    console.info("isLoggedIn(): success", response);
                    this.needLogin = false;
                    var body: any = response;
                    this.userName = body.user;
                    this.cipherChallenge = body.ciphertest;
                    
                    if (this.checkCipher(this.cipherChallenge)) {
						resolve();
						this.restartSync();
                    } else {
                        reject();
                    }
                })
                .catch((response: HttpErrorResponse) => 
                {
                    this.needLogin = true;
                    if (response.status == 401) {
						console.log("isLoggedIn(): ", response);
                        var body: any = response.error;
                        console.info("isLoggedIn(): need to log in, user:", body.user);
                        this.userName = body.user;
                        reject();
                    } else {
                        console.error("isLoggedIn(): undefined error", response);
                        reject();
                    }
                });
		});
	}

	doLogin(userName: string, passPhrase: string, dataKey: string)
	{
		if (userName) {
            this.userName = userName;
		}
		if (dataKey) {
            this.setDataKey(dataKey);
		}
		return new Promise((resolve, reject) => 
		{
			if (this.needLogin || !this.cipherChallenge) {
				this.http.post(apiBasePath + "api/login", 
					JSON.stringify({ user: this.userName, passphrase: passPhrase }), 
					this.httpOptions
				).toPromise()
					.then((response: any) => 
					{
						console.info("doLogin: success", response);
						this.needLogin = false;
						this.cipherChallenge = response.ciphertest;

						if (this.checkCipher(this.cipherChallenge)) {
							resolve();
							this.restartSync();
						} else {
							reject({ 'status': 1403 });
						}
					})
					.catch((response: HttpErrorResponse) => 
					{
						this.needLogin = true;
						if (response.status == 401) {
							var body = response.error;
							console.warn("doLogin: failed, user:", body.user);
							this.userName = body.user;
							reject(response);
						} else {
							console.error("doLogin: undefined error", response);
							reject(response);
						}
					}); 
			} else {
				if (this.checkCipher(this.cipherChallenge)) {
					resolve();
				} else {
					reject({ status: 401 });
				}
			}
		});
	}

	restartSync()
	{
		for (let t in this.tableConnectors) {
			this.tableConnectors[t].sync(false); // should be switched to true
		}
	}

	setDataKey(dataKey: string)
	{
		this.dataKeyHash = SHA256(dataKey).toString();
	}
	
	private checkCipher(challenge: string): boolean
	{
		if (!this.dataKeyHash) {
			this.dataKeyHash = localStorage.getItem("dkh");
		}
		if (this.dataKeyHash && (this.decrypt(challenge) == ciphertest)) {
			console.info("Decryption successful");
			if (this.needDataKey) {
				localStorage.setItem("dkh", this.dataKeyHash);
			}
			this.needDataKey = false;
		} else {
			console.info("Decryption failed");
			this.needDataKey = true;
		}
		return !this.needDataKey;
	}

	encrypt(plaintext: string): string
	{
		// returned ciphertext includes IV and salt
		var ciphertext = null;
		try {
			ciphertext = AES.encrypt(plaintext, this.dataKeyHash).toString();
		} catch (e) {
			console.error("Error encrypting text");
		}
		return ciphertext;
	}
	
	decrypt(ciphertext: string): string
	{
		var plaintext = null;
		try {
			plaintext = AES.decrypt(ciphertext, this.dataKeyHash).toString(enc.Utf8);
		} catch (e) {
			console.error("Error decrypting text");
		}
		return plaintext;
	}
}
