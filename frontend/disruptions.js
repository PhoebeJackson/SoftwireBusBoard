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
    document.getElementById('stop1').innerHTML = stopNames[0]
    document.getElementById('stop2').innerHTML = stopNames[1]
    var list1 = document.getElementById('list1')
    var buses1 = jsonObj[stopNames[0]]
    buses1.forEach(bus => {
        var listElem = document.createElement('li')
        listElem.innerHTML = bus2string(bus)
        list1.appendChild(listElem)
    })

    var list2 = document.getElementById('list2')
    var buses2 = jsonObj[stopNames[1]]
    buses2.forEach(bus => {
        var listElem = document.createElement('li')
        listElem.innerHTML = bus2string(bus)
        list2.appendChild(listElem)
    })
}