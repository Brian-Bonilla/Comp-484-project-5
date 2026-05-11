// Timer Functions

// Starts the timer by resetting elapsed time and running setInterval every 1 second
function startTimer() {
    elapsedTime = 0;
    clearInterval(timerInterval); // Clear any existing timer to prevent stacking
    timerInterval = setInterval(function() {
        elapsedTime++;
        document.getElementById("timer").textContent = "Time: " + elapsedTime + "s";
    }, 1000);
}

// Stops the timer by clearing the interval
function stopTimer() {
    clearInterval(timerInterval);
}

// Creates the Google Map centered on CSUN campus with all controls disabled
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: { lat: 34.2414, lng: -118.5289 }, // CSUN campus coordinates
        disableDoubleClickZoom: true, // Prevents default zoom on double-click so we can use it for the game
        gestureHandling: false, // Disables panning and zooming by user gestures
        // gestureHandling reference: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.gestureHandling
        zoomControl: false,
        disableDefaultUI: true, // Removes all default Google Maps UI controls
        styles: [
            // Hides all map labels so building names don't give away the answers
            { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] }
        ]
    });

    // Listen for double-click events on the map to register the player's guess
    map.addListener("dblclick", function(event) {
        if (!gameActive) return; // Only allow clicks when game is active
        let clickedlat = event.latLng.lat();
        let clickedlng = event.latLng.lng();
        checkAnswer(clickedlat, clickedlng);
    });
}

// Array of 5 CSUN locations with their coordinates

const locations = [
    {name: "Bookstein Hall", lat: 34.241950341731375, lng: -118.53080514819607},
    {name: "University Library", lat: 34.240043495320116, lng: -118.52921816808438},
    {name: "Bayramian Hall", lat: 34.24037589613267, lng: -118.53115687391062},
    {name: "Student Campus Store", lat: 34.23743264478635, lng: -118.52839293984084},
    {name: "Live Oak", lat: 34.23832956528646, lng: -118.52811513196527}
];

let map;
let currentLocationIndex = 0; // Tracks which location the player is currently guessing
let score = 0;                 // Tracks number of correct answers
let gameActive = false;        // Prevents double-clicks when game is not running
let circles = [];              // Stores all rectangles drawn on map so they can be cleared on reset
let timerInterval;             // Stores the setInterval ID so it can be stopped
let elapsedTime = 0;           // Tracks total seconds elapsed
let incorrectCount = 0;        // Tracks number of wrong answers

// Resets all game state and starts a new round
function startGame() {
    gameActive = true;
    currentLocationIndex = 0;
    score = 0;
    incorrectCount = 0;
    document.getElementById("score").textContent = "Score: " + score;
    document.getElementById("prompt").textContent = "Find: " + locations[0].name;
    document.getElementById("feedback").textContent = "";
    document.getElementById("gameLog").innerHTML = "";

    // setMap(null) removes all rectangles from the map
    // setMap reference: https://developers.google.com/maps/documentation/javascript/reference/polygon#Rectangle.setMap
    circles.forEach(circle => circle.setMap(null));
    circles = [];

    addToLog("Where is " + locations[0].name + "??", true);
    startTimer();
}

// Called when player double-clicks the map
// Checks if the click is within 50 meters of the correct location
function checkAnswer(clickedlat, clickedlng) {
    const currentLocation = locations[currentLocationIndex];
    const distance = getDistance(clickedlat, clickedlng, currentLocation.lat, currentLocation.lng);

    if (distance < 50) {
        score++;
        document.getElementById("feedback").textContent = "Correct!";
        document.getElementById("map").className = "correct-animation"; // Flash green border
        addToLog("Your answer is correct!!", true);
    } else {
        incorrectCount++;
        document.getElementById("feedback").textContent = "Wrong!";
        document.getElementById("map").className = "incorrect-animation"; // Flash red border
        addToLog("Sorry wrong location.", false);
    }

    // Remove animation class after 1.5 seconds so it can replay on next answer
    setTimeout(function() {
        document.getElementById("map").className = "";
    }, 1500);

    document.getElementById("score").textContent = "Score: " + score;
    currentLocationIndex++;

    if (currentLocationIndex >= locations.length) {
        // All 5 locations answered - game over
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

    // Draw a rectangle on the correct location - green if correct, red if wrong
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
    circles.push(rectangle); // Store rectangle so it can be cleared on reset
}

// Uses Google Maps geometry library to calculate distance in meters between two points
function getDistance(lat1, lng1, lat2, lng2) {
    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);
    return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
}

// Saves and displays the best (fastest) completion time using localStorage
function checkHighScore() {
    let best = localStorage.getItem("bestTime");
    if (!best || elapsedTime < parseInt(best)) {
        localStorage.setItem("bestTime", elapsedTime);
        document.getElementById("highScore").textContent = "Best Time: " + elapsedTime + "s";
    } else {
        document.getElementById("highScore").textContent = "Best Time: " + best + "s";
    }
}

// Adds a message to the game log - green for correct, red for wrong
function addToLog(message, isCorrect) {
    let logDiv = document.getElementById("gameLog");
    let entry = document.createElement("p");
    entry.textContent = message;
    entry.style.color = isCorrect ? "green" : "red";
    logDiv.appendChild(entry);
}

initMap();
document.getElementById("startGame").addEventListener("click", startGame);

// Load saved best time from localStorage when page loads
window.addEventListener("load", function() {
    let saved = localStorage.getItem("bestTime");
    if (saved) {
        document.getElementById("highScore").textContent = "Best Time: " + saved + "s";
    }
});