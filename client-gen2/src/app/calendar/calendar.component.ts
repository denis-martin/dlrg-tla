import { Component, OnInit } from '@angular/core';

import { DataService } from '../data/data.service';

@Component({
  selector: 'app-calendar',
  templateUrl: 'calendar.component.html',
  styles: []
})
export class CalendarComponent implements OnInit {

  constructor(public data: DataService) { }

  ngOnInit() {
  }

}
