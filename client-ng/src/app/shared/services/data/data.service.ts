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

import { AES, SHA256, enc } from 'crypto-js';

import * as SchemaTest from './schemas/test.json';
import { Test } from './schemas/test';

const apiBasePath = "http://localhost:3100/";
const ciphertest = "1234567890";

@Injectable({
	providedIn: 'root'
})
export class DataService 
{
	private httpReqHeaders: HttpHeaders;
	private cipherChallenge: string;

	public userName: string = null;
	public needLogin = true;
	public needDataKey = true;
	public dataKeyHash: string;

	readonly schemas = {
		test: SchemaTest.default
	}

	test: Test = {
		lastName: "Bob"
	}

	constructor(private http: HttpClient)
	{
		this.httpReqHeaders = new HttpHeaders({
			"Content-Type": "application/json; charset=utf-8"
		});
		if (!this.dataKeyHash) {
			this.dataKeyHash = localStorage.getItem("dkh");
			if (this.dataKeyHash) {
				this.needDataKey = false;
			}
		}
		console.info("DataService is alive", this.test.lastName);
	}

	isLoggedIn()
	{
		return new Promise((resolve, reject) => 
		{
            this.http.get(apiBasePath + "api/login")
                .toPromise()
                .then((response: HttpResponse<Object>) => 
                {
                    console.info("isLoggedIn(): success");
                    this.needLogin = false;
                    var body: any = response.body;
                    this.userName = body.user;
                    this.cipherChallenge = body.ciphertest;
                    
                    if (this.checkCipher(this.cipherChallenge)) {
                        resolve();
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
					{ headers: this.httpReqHeaders }
				).toPromise()
					.then((response: any) => 
					{
						console.info("doLogin: success", response);
						this.needLogin = false;
						this.cipherChallenge = response.ciphertest;

						if (this.checkCipher(this.cipherChallenge)) {
							resolve();
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
