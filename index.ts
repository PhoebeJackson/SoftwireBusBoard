const myPrompt = require('prompt-sync')();
import axios from 'axios';
import {DateTime} from "luxon";
import express from 'express';

class incomingBus {
    route: string;
    destination: string;
    arrivalTime: DateTime;

    constructor(row: any) {
        this.route = row["lineId"];
        this.destination = row.destinationName;
        this.arrivalTime = DateTime.fromISO(row.expectedArrival)
    }

    minutes() {
        let minutes = this.arrivalTime.diff(DateTime.now(), 'minutes').minutes
        minutes = Math.round(minutes)
        if (minutes < 0) {
            minutes = 0
        }
        return minutes
    }

    toString() {
        let minutes = this.minutes()
        return `\nRoute ${this.route} bus heading to ${this.destination} is expected in: ${minutes} mins`
    }

    toJSON(){
        return {route: this.route, minutesToArrival: this.minutes(), destination: this.destination}
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

// main("NW51TL");
APIRequest()

function APIRequest() {
    const app = express()
    const port = 3000
    app.get('/departureBoards', async function(req, res) {
        const postcodeStr: string = String(req.query.postcode)
        let JSON = await main(postcodeStr)

        res.send(JSON)
    })
    app.listen(port, () => {
        console.log(`Departure boards app listening at http://localhost:${port}`)
    })
}

async function main(postcode: string) {
    let ourJSON: {[key: string]: {}[]} = {}
    try {
        const [longitude, latitude] = await getCoords(postcode)
        const nearestStops = await getStopsFromCoords(latitude, longitude)
        for (const stop of nearestStops) {
            const incomingBuses = await getBuses(stop.id, 5);
            ourJSON[stop.commonName] = incomingBuses.map( (each: incomingBus) => {return each.toJSON()})
        }
        return ourJSON
    } catch {
        console.log('catch in main')
        ourJSON['error'] = [{'message': 'Something happened'}]
        return ourJSON
    }
}

async function getCoords(postcode: string) {
    let requestURL = `https://api.postcodes.io/postcodes/${postcode}`
    try {
        const response = await axios.get(requestURL)
        const longitude = response.data.result["longitude"];
        const latitude = response.data.result["latitude"];
        return [longitude, latitude]
    } catch {
        console.log(postcode)
        throw Error('post code is not valid?')
    }
}

async function getStopsFromCoords(lat: number, lon: number, radius: number = 200): Promise<BusStop[]> {
    let requestURL = `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`
    const response = await axios.get(requestURL)
    let busStops: BusStop[] = response.data.stopPoints.map((eachStopData: any) => {
        return new BusStop(eachStopData)
    })
    if (busStops.length < 2) {
        return await getStopsFromCoords(lat, lon, radius + 100)
    } else {
        busStops.sort(function (lhs: BusStop, rhs: BusStop) {
            return lhs.distance - rhs.distance
        })
        return busStops.slice(0, 2)
    }
}

async function getBuses(stopID: string, num: number) {
    const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
    const incomingBuses: incomingBus[] = [];
    const response = await axios.get(requestURL)
    response.data.forEach((element: any) => {
        let bus = new incomingBus(element);
        incomingBuses.push(bus);
    })
    incomingBuses.sort(function (lhs, rhs) {
        return lhs.arrivalTime.toMillis() - rhs.arrivalTime.toMillis()
    })
    return incomingBuses.slice(0, num)
}