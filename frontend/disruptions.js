function onLoad() {
    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', `http://localhost:3000/disruptionsBlog`, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.onload = function() {
        // Handle response here using e.g. xhttp.status, xhttp.response, xhttp.responseText
        showResults(xhttp.response)
    }
    xhttp.send();
}

function showResults(disruptionData) {
    var jsonObj = JSON.parse(disruptionData)
    var disruptionsStrings = jsonObj["strings"]
    var theList = document.getElementById('disruptionList')
    theList.className = "list-group"
    disruptionsStrings.forEach((disrupStr) => {
        var eachElem = document.createElement('li')
        eachElem.innerHTML = disrupStr
        eachElem.className = "list-group-item"
        theList.appendChild(eachElem)
    })
}