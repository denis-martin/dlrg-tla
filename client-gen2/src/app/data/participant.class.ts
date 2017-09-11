
export type Sex = "m" | "f";
export enum Membership { notNeeded = 0, needed = 1 };

export class Participant
{
	private data_enc: string;

	readonly id: number;
	changedBy: string;
	changedAt: string; // no need to convert to Date
	
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
		if (jso) {
			Object.assign(this, jso);
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
		if (!this.data.birthdate) {
			return 0;
		}
		var d = Date.now() - this.getBirthdate().getTime();
		var age = new Date(d);
		return ~~Math.abs(((age.getUTCFullYear() - 1970) + (age.getUTCMonth()+1)/12) * 10) / 10;
	}
}