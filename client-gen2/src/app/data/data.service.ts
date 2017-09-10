import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { AuthService } from '../auth/auth.service';

const apiBasePath = "/";

@Injectable()
export class DataService 
{
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

	constructor(private http: Http, private auth: AuthService) 
	{
		console.log("DataService initialized");
		this.startSync();
	}

	private startSyncForTable(table: string): void 
	{
		this.http.get(apiBasePath + "api/db/" + table)
			.toPromise()
			.then(response => {
				console.log("HTTP request was successful", response);
			})
			.catch(this.handleError.bind(this));
	}

	private handleError(response): void
	{
		console.error("HTTP request failed", response);
		if (response.status == 401) {
			this.auth.login();
		}
	}

	getState(): string 
	{
		return "mocked";
	}

	startSync(): void 
	{
		this.auth.login().then(() => 
		{
			this.startSyncForTable("participants");

		}).catch(() =>
		{
			console.error("DataService: Login failed")
		});
	}

}
