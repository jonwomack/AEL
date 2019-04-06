
var currLat;
var currLon;
var currAlt;
var currHeading;
var currX;
var currZ;
const cam = document.getElementById("camera");
const demo = document.getElementById("demo");



const username = localStorage.getItem("username");
const password = localStorage.getItem("password");


//Storing Position i.e. starting AR world
async function getLocation() {
    let promise = new Promise(resolve => {
        let exists = false;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(storePosition);
            if (currLat != null && currLon != null && currAlt != null) {
                exists = true;
            }
        } else {
            demo.innerHTML = "Geolocation is not supported by this browser.";
        }
        setTimeout(() => resolve(exists), 500); // resolve
    });

    // wait for the promise to resolve
    let value = await promise;
    return value;
}
function storePosition(position) {
    currLat = position.coords.latitude;//33.774577;
    currLon =position.coords.longitude;//-84.397340;
    currAlt = position.coords.altitude;//286;
    if (currLat == null || currLon == null || currAlt == null) {
        demo.innerHTML = "Lat, Lon, or Alt isn't storing";
    }
    //if (position.coords.heading != null) {
    //    currHeading = position.coords.heading;
    //} else {
    //currHeading = 0;
    calculateHeading();
    cam.setAttribute('position', {
        x: 0,
        y: currAlt,
        z: 0
    });
    //}
    updatePosition();
    setInterval(updatePosition, 5000);
}
getLocation();
//Updating the Position - Occurs every 5 seconds and only updates if you move more than 7 meters
function updatePosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePositionHelper);
    } else {
        demo.innerHTML = "Geolocation cannot be updated.";
    }
}
function updatePositionHelper(position) {
    let tempLat = position.coords.latitude;
    let tempLon = position.coords.longitude;
    let tempAlt = position.coords.altitude;
    let changeInXDistance = calculateDistance(tempLat, currLat, tempLon, currLon);
    let changeInTotalDistance = Math.sqrt(Math.pow(changeInXDistance, 2) + Math.pow((tempAlt - currAlt), 2));
    if ((Math.pow(changeInTotalDistance, .5) > 5)) {
        currLat = tempLat;
        currLon = tempLon;
        currAlt = tempAlt;
        let changeInBearing = calculateBearing(tempLat, currLat, tempLon, currLon);
        currX = currX + changeInXDistance * Math.sin(toRadians(changeInBearing));
        currZ = currZ + changeInXDistance * -1 * Math.cos(toRadians(changeInBearing));
        cam.setAttribute('position', {
            x: currX,
            y: currAlt,
            z: currZ
        });
    }
}

function placeObjs() {
    var objects = firebase.database().ref('objects');
    objects.once('value').then(function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            let objectName = childSnapshot.key;
            let object = `${childSnapshot.key}`;
            if (snapshot.child(object + '/public').val()) {
                let latitude = snapshot.child(object + '/latitude').val();
                let longitude = snapshot.child(object + '/longitude').val();
                let altitude = snapshot.child(object + '/altitude').val();
                let color = snapshot.child(object + '/color').val();
                let p1 = createObject(latitude, longitude, altitude, color, false);
            }
        });
        createObject(33.774577, -84.397340, 286, 'black', true);
    });
}
placeObjs(); // Wait until position is stored
//createObject(33.774577, -84.397340, 286, 'black', true);



//const einstein2 = new AR(33.77509, -84.39786, 283, "Actual Ein", 'white', true, 'Einstein.glb');
//const einstein = new AR(33.774577, -84.397340, 295 , "ein", 'white', true, 'Einstein.glb');









//Places Objects in AR

async function createObject(objLatitude, objLongitude, objAltitude, objColor, objGltf) {
    let positioned = await getLocation();
    if (positioned) {
        let distance = calculateDistance(currLat, objLatitude, currLon, objLongitude);
        if (distance < 125) {

            let bearing = currHeading + calculateBearing(currLat, objLatitude, currLon, objLongitude);
            demo.innerHTML = "<br>Bearing: " + currHeading;
            let x = distance * Math.sin(toRadians(bearing));
            let y = objAltitude;
            let z = distance * -1 * Math.cos(toRadians(bearing));
            let el = document.createElement('a-entity');
            if (objGltf) {
                el.setAttribute('gltf-model', `ParthenonNormal.glb`);
                //el.object3D.scale.set(.1, .1, .1);
            } else {
                el.setAttribute('geometry', {
                    primitive: 'sphere',
                    radius: 2.5,
                });
                el.setAttribute('material', {
                    color: objColor
                });
            }
            el.setAttribute('position', {
                x: x,
                y: y,
                z: z
            });
            let sceneEl = document.querySelector('a-scene');
            sceneEl.appendChild(el);
        }
    }
}







//Collection of functions used in determining position of the user.

//Sets current heading as the difference between North and user heading.
function calculateHeading() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            if(event.webkitCompassHeading) {
                var compass = event.webkitCompassHeading;
                handleOrientationEvent(compass);
                return true;
            } else if (event.absolute == true) {
                var compass = event.alpha;
                demo.innerHTML = "<br> Heading: " + compass;
                handleOrientationEvent(compass);
                return true;
            } else {
                demo.innerHTML = "<br>Compass Heading Not Working";
                return false;
            }
        }, true);
    } else {
        demo.innerHTML = "<br>Compass Heading Not Working";
        return false;
    }
}
function handleOrientationEvent(compass) {
    currHeading = compass;
}

function toDatabase() {
    location.assign('database.html');
}