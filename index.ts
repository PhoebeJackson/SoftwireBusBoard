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

    toString() {
        let minutes = this.arrivalTime.diff(DateTime.now(), 'minutes').minutes
        minutes = Math.round(minutes)
        return `\nRoute ${this.route} bus heading to ${this.destination} is expected in: ${minutes} mins`
    }
}

const stopID = myPrompt('Stop ID: ');
// const stopID = '490008660N'
const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
const incomingBuses: incomingBus[] = [];
axios.get(requestURL)
    .then((response) => {
        // console.log(response.data);
        response.data.forEach((element: any) => {
            let bus = new incomingBus(element);
            incomingBuses.push(bus);
        })

        incomingBuses.sort(function(lhs, rhs) {
            return lhs.arrivalTime.toMillis() - rhs.arrivalTime.toMillis()
        })
        console.log(incomingBuses.slice(0, 5).toString())
    });

