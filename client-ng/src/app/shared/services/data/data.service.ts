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

import * as SchemaTest from './schemas/test.json';
import { Test } from './schemas/test';

@Injectable({
	providedIn: 'root'
})
export class DataService 
{
	readonly schemas = {
		test: SchemaTest.default
	}

	test: Test = {
		lastName: "Bob"
	}

	constructor()
	{
		console.info("DataService is alive", this.test.lastName);
	}
}
