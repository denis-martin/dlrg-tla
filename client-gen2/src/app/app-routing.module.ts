import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CalendarComponent } from './calendar/calendar.component';
import { ParticipantsComponent } from './participants/participants.component';

const routes: Routes = [
	{
		path: '',
		redirectTo: '/kalender',
		pathMatch: 'full'
	},
	{
		path: 'kalender',
		component: CalendarComponent
	},
	{
		path: 'teilnehmer',
		component: ParticipantsComponent
	}
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule { }
