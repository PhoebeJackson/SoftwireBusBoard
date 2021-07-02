const myPrompt = require('prompt-sync')();
import axios from 'axios';
import {DateTime} from "luxon";
import express from 'express';

const app = express()
const port = 3000
app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.get('/departureBoards', (req, res) => {
    const postcodeStr = req.query.postcode
    res.send(postcodeStr)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

class incomingBus {
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
        if (minutes < 0) {
            minutes = 0
        }
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

// main();

async function main(postcode: string) {
    // const postcode = myPrompt("Postcode: ")
    const [longitude, latitude] = await getCoords(postcode)
    const nearestStops = await getStopsFromCoords(latitude, longitude)
    for (const stop of nearestStops) {
        console.log(`\nThe next buses into ${stop.commonName} are:`)
        const incomingBuses = await getBuses(stop.id, 5);
        console.log(incomingBuses.toString())
    }
}

async function getCoords(postcode: string) {
    let requestURL = `https://api.postcodes.io/postcodes/${postcode}`
    const response = await axios.get(requestURL)
    const longitude = response.data.result["longitude"];
    const latitude = response.data.result["latitude"];
    return [longitude, latitude]
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