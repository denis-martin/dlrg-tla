import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/shared/services';

@Component({
    selector: 'app-blank-page',
    templateUrl: './blank-page.component.html',
    styleUrls: ['./blank-page.component.scss']
})
export class BlankPageComponent implements OnInit 
{
    constructor(public ds: DataService) {}

    ngOnInit() {
        
    }
}
