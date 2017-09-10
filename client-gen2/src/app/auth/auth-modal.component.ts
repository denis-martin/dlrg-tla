import { Component, OnInit } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';

import { AuthService } from './auth.service';

@Component({
	selector: 'modal-content',
	templateUrl: 'auth-modal.component.html',
	styles: []
})

export class AuthModalComponent implements OnInit 
{
	public auth: AuthService;
	
	public passphrase: string;
	public dataKey: string;

	public thinking: string;
	public authSuccess = false;
	public authFailed = false;
	public decFailed = false;
	public serverFailure: number;

	public resolve: () => void;
	public reject: () => void;

	static readonly modalOptions = {
		keyboard: false,
		ignoreBackdropClick: true
	}

	constructor(private bsModalRef: BsModalRef) { }

	ngOnInit() 
	{
	}

	ok()
	{
		if (this.auth) {
			this.thinking = "Sende Anmeldeinformationen...";
			this.auth.doLogin(this.passphrase, this.dataKey).then(() => 
			{
				console.info("auth-modal: login ok");
				this.thinking = null;
				this.authSuccess = true;
				this.authFailed = false;
				this.decFailed = false;
				this.serverFailure = null;

				if (this.resolve) {
					this.resolve();
					this.resolve = null;
				}

				this.bsModalRef.hide();
			}).catch((response) => 
			{
				if (response.status == 200) {
					// reject with response 200 = data key is missing
					console.info("auth-modal: data key is missing", response);
					this.thinking = null;
					this.authSuccess = true;
					this.authFailed = false;
					this.decFailed = true;
					this.serverFailure = null;
				} else {
					console.warn("auth-modal: login failed", response);
					this.thinking = null;
					this.authSuccess = false;
					this.authFailed = response.status == 401;
					this.decFailed = false;
					this.serverFailure = response.status == 401 ? null : response.status;
				}
			});
		} else {
			console.error("auth-modal: this.auth is undefined");
		}
	}
}
