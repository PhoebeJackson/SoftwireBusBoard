const myPrompt = require('prompt-sync')();
import axios from 'axios';
import {DateTime} from "luxon";
import express from 'express';

class IncomingBus {
    route: string;
    destination: string;
    arrivalTime: DateTime;

    constructor(rawIncomingBus: any) {
        this.route = rawIncomingBus["lineId"];
        this.destination = rawIncomingBus.destinationName;
        this.arrivalTime = DateTime.fromISO(rawIncomingBus.expectedArrival)
    }

    getMinutesToArrival() {
        let minutesToArrival = this.arrivalTime.diff(DateTime.now(), 'minutes').minutes
        minutesToArrival = Math.round(minutesToArrival)
        return minutesToArrival < 0 ? 0 : minutesToArrival;
    }

    toString() {
        const minutesToArrival = this.getMinutesToArrival()
        return `\nRoute ${this.route} bus heading to ${this.destination} is expected in: ${minutesToArrival} mins`
    }

    toJSON(){
        return {route: this.route, minutesToArrival: this.getMinutesToArrival(), destination: this.destination}
    }
}

class BusStop {
    id: string
    commonName: string
    distance: number
    towards: string

    constructor(rawBusStopData: any) {
        this.id = rawBusStopData.id
        this.commonName = rawBusStopData.commonName
        this.distance = rawBusStopData.distance
        this.towards = rawBusStopData.additionalProperties[1].value
    }
}

// main("NW51TL");
const app = express()
const port = 3000
app.listen(port, () => {
    console.log(`Departure boards app listening at http://localhost:${port}`)
})
app.use('/frontend', express.static('frontend'));
APIRequest(app)
disruptionAPI(app)

function APIRequest(app: express.Express) {
    app.get('/departureBoards', async function(req, res) {
        const postcodeStr: string = String(req.query.postcode)
        const JSON = await getIncomingBusesFromPostcode(postcodeStr)
        res.send(JSON)
    })
}

function disruptionAPI(app: express.Express) {
    app.get('/disruptionsBlog', async function(req, res) {
        const JSON = await getDisruptions()
        res.send(JSON)
    })
}

async function getDisruptions(): Promise<{}> {
    try {
        let requestURL = `https://api.tfl.gov.uk/Line/Mode/bus/Disruption`
        const response = await axios.get(requestURL)
        const disruptions = response.data
        const disruptionStrings = disruptions.map((disruption: any) => {
            const desc: string = disruption.description
            const lastUpdate: string = disruption.lastUpdate
            const disruptionStr = `${desc}. Last updated: ${lastUpdate}`
            return disruptionStr
        })
        return { "strings": disruptionStrings}
    } catch {
        return {"string": ['Error happened bro']}
    }
}

async function getIncomingBusesFromPostcode(postcode: string) {
    let ourJSON: {[key: string]: {}[]} = {}
    try {
        const [longitude, latitude] = await getCoords(postcode)
        const nearestStops = await getStopsFromCoords(latitude, longitude)
        for (const stop of nearestStops) {
            const incomingBuses = await getBuses(stop.id, 5);
            ourJSON[stop.commonName] = incomingBuses.map( (each: IncomingBus) => {return each.toJSON()})
        }
        return ourJSON
    } catch (error) {
        ourJSON['error'] = [{'message': error}]
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
    } catch(error) { //TODO - do something with this error message from the API
        console.log(postcode)
        throw Error(`This postcode caused this error: ${error}`)
    }
}

async function getStopsFromCoords(lat: number, lon: number, radius: number = 200, num: number = 2): Promise<BusStop[]> {
    let requestURL = `https://api.tfl.gov.uk/StopPoint/?lat=${lat}&lon=${lon}&stopTypes=NaptanPublicBusCoachTram&radius=${radius}`
    const response = await axios.get(requestURL)
    const busStops: BusStop[] = response.data.stopPoints.map((eachStopData: any) => {
        return new BusStop(eachStopData)
    })
    if (busStops.length < num) {
        return await getStopsFromCoords(lat, lon, radius + 100)
    } else {
        busStops.sort(function (lhs: BusStop, rhs: BusStop) {
            return lhs.distance - rhs.distance
        })
        return busStops.slice(0, num)
    }
}

async function getBuses(stopID: string, num: number) {
    const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
    const response = await axios.get(requestURL)
    const incomingBuses: IncomingBus[] = response.data.map((element: any) => {
        let bus = new IncomingBus(element);
        return bus
    })
    incomingBuses.sort(function (lhs, rhs) {
        return lhs.arrivalTime.toMillis() - rhs.arrivalTime.toMillis()
    })
    return incomingBuses.slice(0, num)
}