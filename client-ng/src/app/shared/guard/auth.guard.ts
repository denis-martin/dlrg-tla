import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { DataService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate 
{
	constructor(private router: Router, private ds: DataService) {}

	canActivate(): Promise<boolean>|boolean
	{
		if (this.ds.needLogin || this.ds.needDataKey) {
			return new Promise((resolve, reject) => {
				this.ds.isLoggedIn()
					.then(() => resolve(true))
					.catch(() => {
						reject(false);
						this.router.navigate(['/login']);
					});
			});
		} else {
			return true;
		}
	}
}
