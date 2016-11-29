import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import 'rxjs/add/operator/map';
var centraLinkip = 'http://192.168.1.113:3000/'

@Injectable()
export class FileService {
    constructor(private http:Http){}
    getFiles(beginTime,endTime){
        return this.http.get(centraLinkip+'file/'+beginTime+'/'+endTime)
    }
};
