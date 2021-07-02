function onEnterPostcode() {
    var postcode = document.getElementById("postcode").value;

    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', `http://localhost:3000/departureBoards?postcode=${postcode}`, true);
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.onload = function() {
        // Handle response here using e.g. xhttp.status, xhttp.response, xhttp.responseText
        console.log(xhttp.response)
    }
    xhttp.send();
}