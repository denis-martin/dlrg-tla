import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule }   from '@angular/forms';

import { AlertModule } from 'ngx-bootstrap';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { DataService } from './data/data.service';

import { AuthModalComponent } from './auth/auth-modal.component';
import { CalendarComponent } from './calendar/calendar.component';
import { ParticipantsComponent } from './participants/participants.component';

@NgModule({
	declarations: [
		AppComponent,
		CalendarComponent,
		ParticipantsComponent,
		AuthModalComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpModule,
		FormsModule,
		
		AlertModule.forRoot(),
		BsDropdownModule.forRoot(),
		ModalModule.forRoot()
	],
	providers: [
		BsModalService, 
		AuthService,
		DataService
	],
	bootstrap: [AppComponent],
	entryComponents: [AuthModalComponent]
})
export class AppModule { }
