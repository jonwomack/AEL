
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
    /*
       currLat = 33.774577;
       currLon = -84.397340;
       currAlt = 286;
       */
    currLat = position.coords.latitude;
    currLon =position.coords.longitude;
    currAlt = position.coords.altitude;

    tempLat = currLat;
    tempLon = currLon;
    tempAlt = currAlt;
    if (currLat == null || currLon == null || currAlt == null) {
        demo.innerHTML = "Lat, Lon, or Alt isn't storing";
    }
    //currHeading = 180;
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
//setInterval(function() {updatePosition(); }, 3000);
//Updating the Position - Occurs every 3 seconds and only updates if you move more than 7 meters
function updatePosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePositionHelper);
    } else {
        demo.innerHTML = "Geolocation cannot be updated.";
    }
}
function updatePositionHelper(position) {
    tempLat = currLat;
    tempLon = currLon;
    //tempLat = position.coords.latitude;
    //tempLon = position.coords.longitude;
    //tempAlt = position.coords.altitude;
    let changeInXDistance = calculateDistance(tempLat, currLat, tempLon, currLon);
    let changeInYDistance = tempAlt - currAlt;
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


var file;
function insertObject(fileType) {
    let input;
    let objectURL;
    if (fileType === 'glb') {
        input = document.getElementById("insert");
        file = input.files[0];
        objectURL = URL.createObjectURL(file);
        console.log(objectURL);
        insertObjectGlb(objectURL);
    } else if (fileType === 'png') {
        input = document.getElementById("insert2");
        file = input.files[0];
        objectURL = URL.createObjectURL(file);
        console.log(objectURL);
        insertObjectPng(objectURL);
    }
}
function insertObjectGlb(objectURL) {
    let el = document.createElement('a-entity');
    el.setAttribute('gltf-model', objectURL);
    el.setAttribute('id', 'moveable');
    //el.object3D.scale.set(.1, .1, .1);
    el.setAttribute('position', {
        x: currX,
        y: currAlt,
        z: currZ
    });
    let sceneEl = document.querySelector('a-scene');
    sceneEl.appendChild(el);
}
function insertObjectPng(objectURL) {
    let el = document.createElement('a-entity');
    let asset = document.getElementById('assets');
    asset.innerHTML = `<img id="image" src="${objectURL}">`;
    el.setAttribute('geometry', {
        primitive: 'plane',
    });
    el.setAttribute('material', {
        side: 'double',
        shader: 'flat',
        src: `#image`
    });
    el.setAttribute('id', 'moveable');
    //el.object3D.scale.set(.1, .1, .1);
    el.setAttribute('position', {
        x: currX,
        y: currAlt,
        z: currZ
    });
    let sceneEl = document.querySelector('a-scene');
    sceneEl.appendChild(el);
}
function insertObjectTxt() {
    let input = document.getElementById('insert3').value;
    console.log(input);
    let el = document.createElement('a-entity');
    el.setAttribute('text', {
        value: `${input}`,
    });
    el.setAttribute('id', 'moveable');
    el.setAttribute('position', {
        x: currX,
        y: currAlt,
        z: currZ
    });
    let sceneEl = document.querySelector('a-scene');
    sceneEl.appendChild(el);
}



async function setObject() {
    let objName = document.getElementById("objName").value;
    let exists = await objExists(objName);
    if (!exists) {
        createFile(file, objName);
        writeObjectDataGlb(objName, currLat, currLon, currAlt, username, true, file.name)
    } else {
        alert("Object Exists: Change Name");
    }

}

function createFile(file, objName) {
    if (file != null) {
        firebase.storage().ref(`glb/${username}/${objName}/${file.name}`).put(file).then(function (snapshot) {
            console.log('Uploaded a blob or file!');
        });
        demo.innerHTML = "File Uploaded";
    } else {
        demo.innerHTML = "No File";
    }
}
function writeObjectDataGlb(name, latitude, longitude, altitude, username, pub, fileName) {
    firebase.database().ref('/objects/' + name).set({
        longitude: longitude,
        latitude: latitude,
        altitude: altitude,
        username: username,
        public: pub,
        glb: true,
        fileName: fileName
    });
}

async function objExists(name) {
    let promise = new Promise(resolve => {
        let object = false;
        let objects = firebase.database().ref(`objects`);
        objects.once('value').then(function (snapshot) {
            snapshot.forEach(function (childSnapshot){
                let objectName = childSnapshot.key;
                if (name === objectName) {
                    object = true;
                }
            });
        });
        setTimeout(() => resolve(object), 500);
    });
    let value = await promise;
    return value;
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



function moveLeft() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x - 1,
        y: y,
        z: z
    });
}
function moveRight() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x + 1,
        y: y,
        z: z
    });
}
function moveForward() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x,
        y: y,
        z: z + 1
    });
}
function moveBackward() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x,
        y: y,
        z: z - 1
    });
}
function moveUp() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x,
        y: y + 1,
        z: z
    });
}
function moveDown() {
    let el = document.getElementById('moveable');
    let x = el.getAttribute('position').x;
    let y = el.getAttribute('position').y;
    let z = el.getAttribute('position').z;
    el.setAttribute('position', {
        x: x,
        y: y - 1,
        z: z
    });
}


