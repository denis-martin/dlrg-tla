import { Component, OnInit } from '@angular/core';

import { DataService } from '../data/data.service';

@Component({
	selector: 'app-participants',
	templateUrl: 'participants.component.html',
	styles: []
})
export class ParticipantsComponent implements OnInit {

	dataServiceState: string;

	constructor(public data: DataService) { }

	ngOnInit() {
		this.dataServiceState = this.data.getState();
	}

}
