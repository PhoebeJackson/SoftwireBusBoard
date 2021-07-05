function onEnterPostcode() {
    var postcode = document.getElementById("postcode").value;

    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', `http://localhost:3000/departureBoards?postcode=${postcode}`, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.onload = function() {
        // Handle response here using e.g. xhttp.status, xhttp.response, xhttp.responseText
        showResults(xhttp.response)
    }
    xhttp.send();
}

function showResults(response) {
    var jsonObj = JSON.parse(response)
    var stopNames = []
    for (var stop in jsonObj) {
        stopNames.push(stop)
    }

    var resultSection = document.getElementById('results')
    resultSection.innerHTML = ''

    var resultsHeader = document.createElement('h2')
    resultsHeader.innerHTML = 'Results'
    resultSection.appendChild(resultsHeader)

    for (var stop in jsonObj) {
        var stopName = document.createElement('h3')
        stopName.innerHTML = `${stop}:`
        resultSection.appendChild(stopName)

        var list = document.createElement('ul')
        var buses = jsonObj[stop]
        buses.forEach(bus => {
            var listElem = document.createElement('li')
            listElem.innerHTML = bus2string(bus)
            list.appendChild(listElem)
        })

        resultSection.appendChild(list)
    }
}

function bus2string(bus) {
    return `Route ${bus.route} bus heading to ${bus.destination} is expected in: ${bus.minutesToArrival} mins`
}