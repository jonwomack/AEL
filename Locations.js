const waffleHouse = new AR(33.776607,-84.389426, 10, "Waffle House");
    const starBucks = new AR(33.776527, -84.388348, 10, "Starbucks");
    const ncr = new AR(33.779051, -84.389330, 10, "NCR Global" );
    const westVillage = new AR(33.779457, -84.404843, 10, "West Village", 'black');
    const wingZone = new AR(33.779466, -84.405400, 10, "Wing Zone", 'black');
    const fitten = new AR(33.778210, -84.403753, 10, "Fitten", 'black');
    const folk = new AR(33.778907, -84.404858, 10, "Folk", 'black');
    const caldwell = new AR(33.778897, -84.404419, 10, "Caldwell", 'black');
    const fulmer = new AR(33.778625, -84.403892, 10, "Fulmer", 'black');
    const westVillageDiningCommons = new AR(33.779146, -84.404474, 10, "WVDC", 'black');
    const eighth = new AR(33.779803, -84.403961, 10, "Due North", 'black');
    const coor = new AR(33.779125, -84.403064, 10, "East Point", 'black');
    const einstein = new AR(33.775203, -84.397774, 10,  "einstein", 'black');
const ym = new AR(33.776998,-84.389803, 292, "Yogli Mogli", 'blue');

const el = document.getElementById("moving");

<a-entity gltf-model="#einstein" position="0 1.6 -10" rotation="0 -90 0" scale="1 1 2"></a-entity>
<a-asset-item id="einstein" src="Einstein.glb"></a-asset-item>




<p>Dr.Freeman Objects</p>
< button
onClick = "placeObjects(freeman)" > Place < /button>

<button onClick="moveObject()">Move</button>


//Moving Object
function moveObject() {
    setInterval(moveObjectH, 20);
}
function moveObjectH() {
    let x = currX + 100*Math.cos(time);
    let y = currAlt;
    let z = currZ + 100*Math.sin(time);
    el.object3D.position.set(x, y, z);
    time += (5*Math.PI)/360;
}