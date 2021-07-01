const myPrompt = require('prompt-sync')();
import axios from 'axios';
import {DateTime} from "luxon";

//TODO - get long and lat, get nearest ID, call our already function


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

const postcode = myPrompt("Postcode: ")

getStopID(postcode);

function getStopID(postcode: string) {
    let requestURL = `https://api.postcodes.io/postcodes/${postcode}`
    axios.get(requestURL)
        .then((response) => {
            // console.log(response.data);
            console.log(response.data);
            // get coordinates
            const longitude = response.data.result["longitude"];
            const latitude = response.data.result["latitude"];
            console.log(longitude, latitude)
            // TODO - getStopIDs
            //getStopIDs(longitude, latitude);
        })

};


// const stopID = myPrompt('Stop ID: ');
// const stopID = '490008660N'
function getBuses(stopID: string) {

    const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
    const incomingBuses: incomingBus[] = [];
    axios.get(requestURL)
        .then((response) => {
            // console.log(response.data);
            response.data.forEach((element: any) => {
                let bus = new incomingBus(element);
                incomingBuses.push(bus);
            })

            incomingBuses.sort(function (lhs, rhs) {
                return lhs.arrivalTime.toMillis() - rhs.arrivalTime.toMillis()
            })
            console.log(incomingBuses.slice(0, 5).toString())
        });
}

