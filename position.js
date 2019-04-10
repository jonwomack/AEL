
var currLat;
var currLon;
var currAlt;
var currHeading;
var currX;
var currZ;
const cam = document.getElementById("camera");
const demo = document.getElementById("demo");
const hello = document.getElementById("hello");



const username = localStorage.getItem("username");
const password = localStorage.getItem("password");


//Storing Position i.e. starting AR world
async function getLocation() {
    let promise = new Promise(resolve => {
        let exists = false;
        if ('ondeviceorientationabsolute' in window) {
            hello.innerHTML = "GOTCHA";
        }
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
    console.log("here");
    //currLat = position.coords.latitude;
    currLat = 33.774577;
    //currLon =position.coords.longitude;
    currLon = -84.397340;
    //currAlt = position.coords.altitude;
    currAlt = 286;
    if (currLat == null || currLon == null || currAlt == null) {
        demo.innerHTML = "Lat, Lon, or Alt isn't storing";
    }
    //if (position.coords.heading != null) {
    //    currHeading = position.coords.heading;
    //} else {
    currHeading = 0;
    //calculateHeading();
    cam.setAttribute('position', {
        x: 0,
        y: currAlt,
        z: 0
    });
    //}
    //updatePosition();
    //setInterval(updatePosition, 5000);
}
getLocation();
//storePosition();
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
        if (distance < 125) {
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
        if (distance < 125) {
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