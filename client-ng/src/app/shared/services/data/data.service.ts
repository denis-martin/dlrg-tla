/*	
 * Copyright 2019 Denis Martin.  This file is part of dlrg-tla.
 * 
 * dlrg-tla is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dlrg-tla is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dlrg-tla.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { timer, Subscription } from 'rxjs';

import { AES, SHA256, enc } from 'crypto-js';
import Ajv from 'ajv';

import * as SchemaParticipant from './schemas/participant.json';
import * as SchemaRegistration from './schemas/registration.json';
import * as SchemaQualification from './schemas/qualification.json';
import * as SchemaCourseType from './schemas/coursetype.json';
import * as SchemaCourseTypeCheckList from './schemas/coursetypechecklist.json';
import * as SchemaQualificationType from './schemas/qualificationtype.json';
import * as SchemaSeason from './schemas/season.json';
import * as SchemaCourse from './schemas/course.json';
import * as SchemaCourseParticipant from './schemas/courseparticipant.json';

import { IParticipant } from './schemas/participant';
import { IRegistration } from './schemas/registration';
import { IQualification } from './schemas/qualification';
import { ICourseType } from './schemas/coursetype';
import { ICourseTypeCheckList } from './schemas/coursetypechecklist';
import { IQualificationType } from './schemas/qualificationtype';
import { ISeason } from './schemas/season';
import { ICourse } from './schemas/course';
import { ICourseParticipant } from './schemas/courseparticipant';

const apiBasePath = "http://localhost:3100/";
const ciphertest = "1234567890";

// handles /api/db/{table} calls
class TableConnector
{
	private isSyncing = false;
	private autoSync = false;
	private validate: any;
	private timerSub?: Subscription;

	constructor(private table: string, private schema: any, private refreshRate: number, private ds: DataService) 
	{
		var ajv = new Ajv({ allErrors: true });
		this.validate = ajv.compile(schema);
	}

	sync(autoSync = false): void 
	{
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
			.subscribe((data: any /*: HttpResponse<Object>*/) => {
				console.log("HTTP GET " + apiBasePath + "api/db/" + this.table + " was successful", data);
				const items: Array<any> = data;
				items.forEach(item => {
					if (item['id'] in (this.ds as any)[this.table]) {
						let remoteChangedAt = new Date(item['changedAt']);
						let localChangedAt = new Date((this.ds as any)[this.table][item['id']].changedAt);
						if (remoteChangedAt > localChangedAt) {
							console.info("Updating", item);
							(this.ds as any)[this.table][item['id']] = this.unwrap(item);
						}
					} else {
						(this.ds as any)[this.table][item['id']] = this.unwrap(item);
					}
				});
				console.log((this.ds as any)[this.table]);
				if (autoSync && !this.autoSync) {
					this.autoSync = true;
					this.timerSub = timer(this.refreshRate, this.refreshRate)
						.subscribe(t => { this.sync(); });
				}
				this.isSyncing = false;
			}, (error) => {
				this.handleError(error);
				this.isSyncing = false;
			});
	}

	stopSync()
	{
		if (this.timerSub) {
			this.timerSub.unsubscribe();
		}
	}

	private handleError(response: any): void
	{
		console.error("HTTP request failed", response);
		if (response.status == 401) {
			this.ds.isLoggedIn().catch(err => {}); // check login state
		}
	}

	unwrap(item: any): any
	{
		const parsedItem = item;
		if (item['data_enc']) {
			const dec = this.ds.decrypt(item['data_enc']);
			if (dec) {
				parsedItem['data'] = JSON.parse(dec);
			}
		}
		const valid = this.validate(parsedItem);
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
	
	private cipherChallenge?: string;

	public userName?: string;
	public needLogin = true;
	public needDataKey = true;
	public dataKeyHash: string | null = null;

	readonly schemas = {
		participant: SchemaParticipant.default,
		registration: SchemaRegistration.default,
		qualification: SchemaQualification.default,
		coursetype: SchemaCourseType.default,
		coursetypechecklist: SchemaCourseTypeCheckList.default,
		qualificationtype: SchemaQualificationType.default,
		season: SchemaSeason.default,
		course: SchemaCourse.default,
		courseparticipant: SchemaCourseParticipant.default
	}

	participants: { [k: number]: IParticipant } = {}
	registrations: { [k: number]: IRegistration } = {}
	qualifications: { [k: number]: IQualification } = {}
	coursetypes: { [k: number]: ICourseType } = {}
	coursetypechecklists: { [k: number]: ICourseTypeCheckList } = {}
	qualificationtypes: { [k: number]: IQualificationType } = {}
	seasons: { [k: number]: ISeason } = {}
	courses: { [k: number]: ICourse } = {}
	courseparticipants: { [k: number]: ICourseParticipant } = {}

	tableConnectors = {
		participants: new TableConnector('participants', this.schemas.participant, 5000, this),
		registrations: new TableConnector('registrations', this.schemas.registration, 5000, this),
		qualifications: new TableConnector('qualifications', this.schemas.qualification, 5000, this),
		coursetypes: new TableConnector('coursetypes', this.schemas.coursetype, 120000, this),
		coursetypechecklists: new TableConnector('coursetypechecklists', this.schemas.coursetypechecklist, 120000, this),
		qualificationtypes: new TableConnector('qualificationtypes', this.schemas.qualificationtype, 120000, this),
		seasons: new TableConnector('seasons', this.schemas.season, 120000, this),
		courses: new TableConnector('courses', this.schemas.course, 5000, this),
		courseparticipants: new TableConnector('courseparticipants', this.schemas.courseparticipant, 5000, this)
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
		this.dataKeyHash = localStorage.getItem("dkh");
		if (this.dataKeyHash) {
			this.needDataKey = false;
		}
		console.info("DataService is alive");
	}

	isLoggedIn()
	{
		return new Promise<void>((resolve, reject) => 
		{
            this.http.get(apiBasePath + "api/login", this.httpOptions)
                .subscribe((data) => {
                    console.info("isLoggedIn(): success", data);
                    this.needLogin = false;
                    const body: any = data;
                    this.userName = body.user;
                    this.cipherChallenge = body.ciphertest;
                    
                    if (this.cipherChallenge && this.checkCipher(this.cipherChallenge)) {
						resolve();
						this.restartSync();
                    } else {
                        reject();
                    }
                }, (error) => {
                    this.needLogin = true;
                    if (error.status == 401) {
						console.log("isLoggedIn(): ", error);
                        var body: any = error.error;
                        console.info("isLoggedIn(): need to log in, user:", body.user);
                        this.userName = body.user;
                        reject();
                    } else {
                        console.error("isLoggedIn(): undefined error", error);
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
		return new Promise<void>((resolve, reject) => 
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

						if (this.cipherChallenge && this.checkCipher(this.cipherChallenge)) {
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
			(this.tableConnectors as any)[t].sync(false); // should be switched to true
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

	encrypt(plaintext: string): string | null
	{
		// returned ciphertext includes IV and salt
		let ciphertext: string | null = null;
		if (this.dataKeyHash) {
			try {
				ciphertext = AES.encrypt(plaintext, this.dataKeyHash).toString();
			} catch (e) {
				console.error("Error encrypting text");
			}
		}
		return ciphertext;
	}
	
	decrypt(ciphertext: string): string | null
	{
		let plaintext: string | null = null;
		if (this.dataKeyHash) {
			try {
				plaintext = AES.decrypt(ciphertext, this.dataKeyHash).toString(enc.Utf8);
			} catch (e) {
				console.error("Error decrypting text");
			}
		}
		return plaintext;
	}
}
