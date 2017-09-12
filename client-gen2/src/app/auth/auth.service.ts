import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

import { AES, SHA256, enc } from 'crypto-js';

import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';

import { AuthModalComponent } from './auth-modal.component';

const apiBasePath = "/";
const ciphertest = "1234567890";

@Injectable()
export class AuthService 
{
	public static instance: AuthService;

	private httpReqHeaders: Headers;
	private modalRef: BsModalRef;
	private cipherChallenge: string;

	public userName = "Unbekannter";
	public needLogin = true;
	public needDataKey = true;
	public dataKeyHash: string;

	private resolves: ((param) => void)[] = [];
	private rejects: ((param) => void)[] = [];
	
	constructor(
		private modalService: BsModalService,
		private http: Http)
	{
		if (AuthService.instance != null) {
			console.warn("AuthService should not be instantiated more than once");
		} else {
			AuthService.instance = this;
		}
		this.httpReqHeaders = new Headers();
		this.httpReqHeaders.append("Content-Type", "application/json; charset=utf-8");
		console.info("AuthService initialized");
	}

	getUserName(): string { return this.userName; }
	getUserShortName(): string { return this.userName.split(" ")[0]; }

	login()
	{
		return new Promise((resolve, reject) => 
		{
			if (!this.modalRef) {
				this.http.get(apiBasePath + "api/login")
					.toPromise()
					.then((response) => 
					{
						console.info("login test: success");
						this.needLogin = false;
						var resp = response.json();
						this.userName = resp.user;
						this.cipherChallenge = resp.ciphertest;
						
						if (this.checkCipher(this.cipherChallenge)) {
							resolve();
						} else {
							this.loginModal(resolve, reject);
						}
					})
					.catch((response) => 
					{
						this.needLogin = true;
						if (response.status == 401) {
							var resp = response.json();
							console.info("login test: need to log in, user:", resp.user);
							this.userName = resp.user;
							this.loginModal(resolve, reject);
						} else {
							console.error("login test: undefined error", response);
							this.loginModal(resolve, reject);
						}
					});
			} else {
				this.loginModal(resolve, reject);
			}
		});
	}

	// to be called from modal
	doLogin(passphrase: string, dataKey: string)
	{
		if (dataKey) {
			this.dataKeyHash = SHA256(dataKey).toString();
		}
		return new Promise((resolve, reject) => 
		{
			if (this.needLogin) {
				this.http.post(apiBasePath + "api/login", 
					JSON.stringify({ user: this.userName, passphrase: passphrase }), 
					{ headers: this.httpReqHeaders }
				).toPromise()
					.then((response) => 
					{
						console.info("doLogin: success");
						this.needLogin = false;
						var resp = response.json();
						this.cipherChallenge = resp.ciphertest;

						if (this.checkCipher(this.cipherChallenge)) {
							resolve();
						} else {
							reject(response);
						}
					})
					.catch((response) => 
					{
						this.needLogin = true;
						if (response.status == 401) {
							var resp = response.json();
							console.warn("doLogin: failed, user:", resp.user);
							this.userName = resp.user;
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

	// show modal and register new resolves/rejects
	private loginModal(resolve, reject)
	{
		this.resolves.push(resolve);
		this.rejects.push(reject);

		if (!this.modalRef) {
			this.modalRef = this.modalService.show(AuthModalComponent, AuthModalComponent.modalOptions);
			this.modalRef.content.auth = this;
			// called when dialog closes successfully
			this.modalRef.content.resolve = (param) => {
				this.modalRef = null;
				this.resolves.forEach(element => {
					element(param);
				});
				this.resolves.length = 0;
				this.rejects.length = 0;
			};
			// called when dialog closes with failure (should not happen)
			this.modalRef.content.reject = (param) => {
				console.error("auth service: this should never be called");
				this.modalRef = null;
				this.rejects.forEach(element => {
					element(param);
				});
				this.resolves.length = 0;
				this.rejects.length = 0;
			};
		}
		this.modalRef.content.authSuccess = !this.needLogin && this.needDataKey;
		this.modalRef.content.decFailed = !this.needLogin && this.needDataKey;
	}

	private checkCipher(challenge): boolean
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

	encrypt(plaintext): string
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
	
	decrypt(ciphertext): string
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
