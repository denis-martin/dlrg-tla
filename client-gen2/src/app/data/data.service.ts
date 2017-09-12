import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { AuthService } from '../auth/auth.service';

import { Participant } from './participant.class';

const apiBasePath = "/";

interface ITableConnectorHashMap 
{
    [table: string] : ITableConnector;
}

interface ITableConnector
{
	items: any[];
	startSync(): void;
}

// handles /api/db/{table} calls
class TableConnector<T> implements ITableConnector
{
	private _type: { new(jso: Object): T };
	items: T[] = [];

	constructor(type: { new(jso: Object): T }, private table: string, private refreshRate: number, private ds: DataService) 
	{ 
		this._type = type;
	}

	startSync(): void 
	{
		this.ds.http.get(apiBasePath + "api/db/" + this.table)
			.toPromise()
			.then(response => {
				console.log("HTTP GET " + apiBasePath + "api/db/" + this.table + " was successful", response);
				var items = response.json();
				items.forEach(item => {
					this.items.push(new this._type(item));
				});
				console.log(this.items);
			})
			.catch(this.handleError.bind(this));
	}

	private handleError(response): void
	{
		console.error("HTTP request failed", response);
		if (response.status == 401) {
			this.ds.auth.login();
		}
	}
}

@Injectable()
export class DataService 
{
	db: ITableConnectorHashMap = 
	{
		"participants": new TableConnector(Participant, "participants", 5000, this)
	}

	get participants(): Participant[] { return this.db["participants"].items; }

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

	constructor(public http: Http, public auth: AuthService) 
	{
		this.startSync();
		console.info("DataService initialized");
	}

	getState(): string 
	{
		return "mocked";
	}

	startSync(): void 
	{
		this.auth.login().then(() => 
		{
			Object.keys(this.db).forEach(table => {
				this.db[table].startSync();
			});

		}).catch(() =>
		{
			console.error("DataService: Login failed")
		});
	}

}
