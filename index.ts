// prompt, request, read, sort, print
// 490008660N
const myPrompt = require('prompt-sync')();
import axios from 'axios';
import {DateTime} from "luxon";

class incomingBus{
    route: string;
    destination: string;
    arrivalTime: DateTime;

    constructor(row: any) {
        this.route = row["lineId"];
        this.destination = row.destinationName;
        this.arrivalTime = DateTime.fromISO(row.expectedArrival)
    }
}

// const stopID = myPrompt('Stop ID: ');
const stopID = '490008660N'
const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
const incomingBuses: incomingBus[] = [];
console.log(requestURL)
axios.get(requestURL)
    .then((response) => {
        console.log(response.data);
        response.data.forEach((element: any) => {
            let bus = new incomingBus(element);
            incomingBuses.push(bus);
        })
        console.log(incomingBuses);
    });

