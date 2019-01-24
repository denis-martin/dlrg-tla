import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { routerTransition } from '../router.animations';

import { DataService } from '../shared/services';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	animations: [routerTransition()]
})
export class LoginComponent implements OnInit
{   
	public password: string;
	public dataKey: string;
	public lastError: string;

	constructor(public router: Router, private ds: DataService) {}

	ngOnInit() 
	{
		if (!this.ds.userName) {
			this.ds.isLoggedIn().catch(() => {});
		}
	}

	getUserName(): string { return this.ds.userName || "Unbekannter"; }
	getUserShortName(): string
	{ 
		if (this.ds.userName) {
			return this.ds.userName.split(" ")[0];
		} else {
			return "Unbekannter";
		}
	}

	login()
	{
		this.ds.doLogin(null, this.password, this.dataKey)
			.then(() => {
				this.password = null;
				this.lastError = null;
				this.router.navigate(['/']);
			})
			.catch((response) => {
				if (response.status == 401) {
					this.lastError = "Ungültiges Passwort."
				} else if (response.status == 1403) {
					this.lastError = "Ungültiger Datenschlüssel."
				} else {
					this.lastError = response.message;
				}
			});
	}
}
