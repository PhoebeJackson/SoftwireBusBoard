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

class BusStop {
    id: string
    commonName: string
    distance: number
    towards: string

    constructor(row: any) {
        this.id = row.id
        this.commonName = row.commonName
        this.distance = row.distance
        this.towards = row.additionalProperties[1].value
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
            getStopIDsFromCoords(latitude, longitude)
        })

};

function getStopIDsFromCoords(lat: number, lon: number, radius: number = 200) {
    let requestURL = `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`
    let busStops: BusStop[] = []
    axios.get(requestURL)
        .then((response) => {
            // console.log(response.data);
            busStops = response.data.stopPoints.map((eachStopData: any) => {
                return new BusStop(eachStopData)
            })

            if (busStops.length < 2) {
                getStopIDsFromCoords(lat, lon, radius+100)
            } else {
                busStops.sort(function (lhs, rhs) {
                    return lhs.distance - rhs.distance
                })
                const nearestStops = busStops.slice(0, 2)
                console.log(nearestStops)

                // nearestStops.forEach(stop => {
                //     console.log(`At ${stop.commonName}, the next buses are:`)
                //     getBuses(stop.id, 5)
                // })
            }
        })
}

// const stopID = myPrompt('Stop ID: ');
// const stopID = '490008660N'
function getBuses(stopID: string, num: number) {
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
            console.log(incomingBuses.slice(0, num).toString())
        });
}

