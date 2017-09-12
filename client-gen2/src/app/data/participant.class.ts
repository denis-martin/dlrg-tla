import { AuthService } from '../auth/auth.service';

export type Sex = "m" | "f";
export enum Membership { notNeeded = 0, needed = 1 };

export class Participant
{
	private auth: AuthService;

	readonly id: number;
	changedBy: string;
	changedAt: string; // no need to convert to Date

	private data_enc: string;
	
	data: 
	{
		altMail: string;
		birthdate: string;
		city: string;
		dressSize: string;
		email: string;
		firstName: string;
		health: string;
		lastName: string;
		membership: Membership;
		phone: string;
		phoneMobile: string;
		phoneWork: string;
		relationId: number;
		sex: Sex;
		street: string;
		zipCode: string;
	}

	private _data:
	{
		birthdate: Date;
	}

	constructor(jso: Object)
	{
		this.auth = AuthService.instance;
		if (jso) {
			Object.assign(this, jso);
			if (this.data_enc != null) {
				this.data = JSON.parse(this.auth.decrypt(this.data_enc));
			}
		}
	}

	getBirthdate(): Date
	{
		if (!this.data.birthdate) {
			return null;

		} else if (!this._data.birthdate) {
			this._data.birthdate = new Date(this.data.birthdate);
		}
		return this._data.birthdate;
	}

	getAge(): number
	{
		if (this.getBirthdate() == null) {
			return null;
		}
		var d = Date.now() - this.getBirthdate().getTime();
		var age = new Date(d);
		return ~~Math.abs(((age.getUTCFullYear() - 1970) + (age.getUTCMonth()+1)/12) * 10) / 10;
	}
}