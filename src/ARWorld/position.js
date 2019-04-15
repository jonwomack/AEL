
var currLat;
var currLon;
var currAlt;
let tempLat;
let tempLon;
let tempAlt;
var currHeading;
var currX;
var currZ;
const cam = document.getElementById("camera");
const demo = document.getElementById("demo");
const hello = document.getElementById("hello");


//const username = localStorage.getItem("username");
//const password = localStorage.getItem("password");


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
    currLat = position.coords.latitude;
    //currLat = 33.774577;
    tempLat = currLat;
    currLon =position.coords.longitude;
    //currLon = -84.397340;
    tempLon = currLon;
    currAlt = position.coords.altitude;
    //currAlt = 286;
    tempAlt = currAlt;
    if (currLat == null || currLon == null || currAlt == null) {
        demo.innerHTML = "Lat, Lon, or Alt isn't storing";
    }
    //if (position.coords.heading != null) {
    //    currHeading = position.coords.heading;
    //} else {
    //currHeading = 0;
    calculateHeading();
    currX = 0;
    currZ = 0;
    cam.setAttribute('position', {
        x: currX,
        y: currAlt,
        z: currZ
    });
}
getLocation();
setInterval(function() {updatePosition(); }, 3000);
//Updating the Position - Occurs every 5 seconds and only updates if you move more than 7 meters
function updatePosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePositionHelper);
    } else {
        demo.innerHTML = "Geolocation cannot be updated.";
    }
}
function updatePositionHelper(position) {
    //tempLat = currLat;
    tempLat = position.coords.latitude;
    //tempLon = currLon;
    tempLon = position.coords.longitude;
    tempAlt = position.coords.altitude;
    let changeInXDistance = calculateDistance(tempLat, currLat, tempLon, currLon);
    let changeInYDistance = tempAlt - currAlt;
    console.log(changeInYDistance);
    let changeInTotalDistance = Math.sqrt(Math.pow(changeInXDistance, 2) + Math.pow(changeInYDistance, 2));
    if (changeInTotalDistance > 5) {
        console.log("here");
        currLat = tempLat;
        currLon = tempLon;
        currAlt = tempAlt;
        let changeInBearing = calculateBearing(tempLat, currLat, tempLon, currLon);
        console.log(changeInBearing);
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
                let objectCreator = snapshot.child(object + '/username').val();
                if (snapshot.child(object +'/glb').val()) {
                    let fileName = snapshot.child(object + '/fileName').val();
                    createObjectGlb(latitude, longitude, altitude, fileName, objectCreator);
                } else {
                    let color = snapshot.child(object + '/color').val();
                    createObject(latitude, longitude, altitude, color);
                }
            }
        });
    });
}
placeObjs();




//Places Objects in AR

async function createObject(objLatitude, objLongitude, objAltitude, objColor) {
    let positioned = await getLocation();
    if (positioned) {
        let distance = calculateDistance(currLat, objLatitude, currLon, objLongitude);
        if (distance < 125000) {
            let bearing = currHeading + calculateBearing(currLat, objLatitude, currLon, objLongitude);
            demo.innerHTML = "<br>Bearing: " + currHeading;
            let x = distance * Math.sin(toRadians(bearing));
            let y = objAltitude;
            let z = distance * -1 * Math.cos(toRadians(bearing));
            let el = document.createElement('a-entity');
            el.setAttribute('geometry', {
                primitive: 'sphere',
                radius: 2.5,
            });
            el.setAttribute('material', {
                color: objColor
            });
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

async function createObjectGlb(objLatitude, objLongitude, objAltitude, fileName, objectCreator) {
    let positioned = await getLocation();
    if (positioned) {
        let distance = calculateDistance(currLat, objLatitude, currLon, objLongitude);
        if (distance < 125000) {
            let url1 = await getGlbFile(fileName, objectCreator);
            //`https://firebasestorage.googleapis.com/v0/b/arworldgt.appspot.com/o/glb%2FMickey%2FParthenonNormal.glb?alt=media&token=0b4cded7-674e-4434-9ee2-402eb93a09bb`;
            //
            let bearing = currHeading + calculateBearing(currLat, objLatitude, currLon, objLongitude);
            demo.innerHTML = "<br>Bearing: " + currHeading;
            let x = distance * Math.sin(toRadians(bearing));
            let y = objAltitude;
            let z = distance * -1 * Math.cos(toRadians(bearing));
            let el = document.createElement('a-entity');
            el.setAttribute('gltf-model', url1);
            //el.object3D.scale.set(.1, .1, .1);
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

async function getGlbFile(fileName, objectCreator) {
    let url1;
    let promise = new Promise(resolve => {
        let exists = false;
        var storage = firebase.storage();
        storage.ref('glb').child(`${objectCreator}/${fileName}`).getDownloadURL().then(function(url) {
            url1 = url;
            exists = true;
        });
        setTimeout(() => resolve(exists), 500); // resolve
    });

    let value = await promise;
    if (value) {
        return url1;
    }
}













//Collection of functions used in determining position of the user.

//Sets current heading as the difference between North and user heading.
function calculateHeading() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", function (event) {
            if ('ondeviceorientationabsolute' in window) {
                window.ondeviceorientationabsolute = function(event) {
                    currHeading = event.alpha;
                    console.log(event.absolute);
                    return true;
                };
            } else if(event.webkitCompassHeading) {
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
    location.assign('../Settings/database.html');
}