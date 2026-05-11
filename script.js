function startTimer() {
    elapsedTime = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        elapsedTime++;
        document.getElementById("timer").textContent = "Time: " + elapsedTime + "s";
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 17,
        center: { lat: 34.2414, lng: -118.5289 },
        disableDoubleClickZoom: true,
        gestureHandling: false,
        zoomControl: false,
        disableDefaultUI: true,
        styles: [
            { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] }
        ]
    });
    map.addListener("dblclick", function(event) {
        if (!gameActive) return;
        let clickedlat = event.latLng.lat();
        let clickedlng = event.latLng.lng();
        checkAnswer(clickedlat, clickedlng);
    });
}

const locations = [
    {name: "Bookstein Hall", lat: 34.241950341731375, lng: -118.53080514819607},
    {name: "University Library", lat: 34.240043495320116, lng: -118.52921816808438},
    {name: "Bayramian Hall", lat: 34.24037589613267, lng: -118.53115687391062},
    {name: "Student Campus Store", lat: 34.23743264478635, lng: -118.52839293984084},
    {name: "Live Oak", lat: 34.23832956528646, lng: -118.52811513196527}
];

let map;
let currentLocationIndex = 0;
let score = 0;
let gameActive = false;
let circles = [];
let timerInterval;
let elapsedTime = 0;
let incorrectCount = 0;

function startGame() {
    gameActive = true;
    currentLocationIndex = 0;
    score = 0;
    incorrectCount = 0;
    document.getElementById("score").textContent = "Score: " + score;
    document.getElementById("prompt").textContent = "Find: " + locations[0].name;
    document.getElementById("feedback").textContent = "";
    document.getElementById("gameLog").innerHTML = "";
    circles.forEach(circle => circle.setMap(null));
    circles = [];
    addToLog("Where is " + locations[0].name + "??", true);
    startTimer();
}

function checkAnswer(clickedlat, clickedlng) {
    const currentLocation = locations[currentLocationIndex];
    const distance = getDistance(clickedlat, clickedlng, currentLocation.lat, currentLocation.lng);

    if (distance < 50) {
        score++;
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("map").className = "correct-animation";
        addToLog("Your answer is correct!!", true);
    } else {
        incorrectCount++;
        document.getElementById("feedback").textContent = "Wrong!";
        document.getElementById("map").className = "incorrect-animation";
        addToLog("Sorry wrong location.", false);
    }

    setTimeout(function() {
        document.getElementById("map").className = "";
    }, 1500);

    document.getElementById("score").textContent = "Score: " + score;
    currentLocationIndex++;

    if (currentLocationIndex >= locations.length) {
        gameActive = false;
        stopTimer();
        checkHighScore();
        addToLog("Game Over! " + score + " Correct, " + incorrectCount + " Incorrect. Time: " + elapsedTime + "s", true);
        document.getElementById("prompt").textContent = "Game Over!";
        document.getElementById("feedback").textContent = score + " Correct, " + incorrectCount + " Incorrect";
    } else {
        document.getElementById("prompt").textContent = "Find: " + locations[currentLocationIndex].name;
        addToLog("Where is " + locations[currentLocationIndex].name + "??", true);
    }

    let bounds = {
        north: currentLocation.lat + 0.0003,
        south: currentLocation.lat - 0.0003,
        east: currentLocation.lng + 0.0005,
        west: currentLocation.lng - 0.0005
    };

    let rectangle = new google.maps.Rectangle({
        map: map,
        bounds: bounds,
        fillColor: distance < 50 ? "#00FF00" : "#FF0000",
        fillOpacity: 0.4,
        strokeColor: distance < 50 ? "#00FF00" : "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
    });
    circles.push(rectangle);
}

function getDistance(lat1, lng1, lat2, lng2) {
    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);
    return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
}

function checkHighScore() {
    let best = localStorage.getItem("bestTime");
    if (!best || elapsedTime < parseInt(best)) {
        localStorage.setItem("bestTime", elapsedTime);
        document.getElementById("highScore").textContent = "Best Time: " + elapsedTime + "s";
    } else {
        document.getElementById("highScore").textContent = "Best Time: " + best + "s";
    }
}

function addToLog(message, isCorrect) {
    let logDiv = document.getElementById("gameLog");
    let entry = document.createElement("p");
    entry.textContent = message;
    entry.style.color = isCorrect ? "green" : "red";
    logDiv.appendChild(entry);
}

initMap();
document.getElementById("startGame").addEventListener("click", startGame);
window.addEventListener("load", function() {
    let saved = localStorage.getItem("bestTime");
    if (saved) {
        document.getElementById("highScore").textContent = "Best Time: " + saved + "s";
    }
});