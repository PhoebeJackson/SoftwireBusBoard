// prompt, request, read, sort, print
// 490008660N
const myPrompt = require('prompt-sync')();
import axios from 'axios'

// const stopID = myPrompt('Stop ID: ');
const stopID = '490008660N'
const requestURL = `https://api.tfl.gov.uk/StopPoint/${stopID}/Arrivals`
console.log(requestURL)
axios.get(requestURL)
    .then((response) => {
        console.log(response.data);
    });
