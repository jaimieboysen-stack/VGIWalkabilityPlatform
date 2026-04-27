// Global variables
  let map;
  //for allowing access to the survey, create a empty varible to later store the users current location
  let userLocation=null;
  //create a empty varible to later store the street segment that was selected by the user
  let activeLayer = null;
  //set user buffer dist
  const setBufferDistance=5;


//Authortative city of victoria datasets
const cityOfVictoriaDatasets = [
  //for the street segments
  {
    name: "Official Streets",
    type: "street",
    file: "data/Street_Network.geojson",
    style: { color: "#ff89c6a3", weight: 4 },
    layerGroup: L.layerGroup()
  },
  //intersection, used for visual display and seperation of the streets for the user
  {
    name: "Official Intersections",
    type: "intersection",
    file: "data/Intersection.geojson",
    style: { color: "#dd2886dd", weight: 2 },
    layerGroup: L.layerGroup(),
    pointToLayer: function(feature, latlng) 
    {return L.circleMarker(latlng,{
          radius: 2,
          fillColor: "#dd2886dd",
          color: "#dd2886dd",
          weight: 0.7,
          opacity: 1,
          fillOpacity: 0.8,
          pane: 'markerPane'
        });
      }
  }];

// initialize the map
$( document ).ready(function() {
	createMap();
});	

// create the map
function createMap(){
  //set view to Victoria, BC lat/lng
	map = L.map('map').setView([48.4284,-123.3656],13);
  //add tile layer
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
  //load in City of Victoria datasets 
  const layerControlObj = {};
  cityOfVictoriaDatasets.forEach(ds => {
    loadCityOfVictoriaGeoJSON(ds);
    layerControlObj[ds.name] = ds.layerGroup;
  });
	// Add a layer control in the top-right corner, for UI
  L.control.layers(null, layerControlObj, { collapsed: false }).addTo(map);
	// Add locate control, also in the top-right corner
  L.control.locate({
    position: 'topright',  
    strings: {title: "Go to my location"},
    locateOptions: {enableHighAccuracy: true }
  }).addTo(map);
  //runs once the map finds the user's location, and saves user position and will switch map interaction to true if they are within the buffer of the selected area
  //create an alert so the user knows they are now able to audit
  map.on("locationfound", function (e) {
    userLocation = e.latlng;
    interactionEnabled = true;
    console.log(userLocation);
   // alert("Location detected. You are now able to begin auditing!");
  });
}
//create a funtion to load in the City of Victoria dataset
//adds click interactions so that the two different feature types (street vs intersection) both trigger different behaviours.
function loadCityOfVictoriaGeoJSON(ds) {
  //get the dataset from the geojson files, the run
  fetch(ds.file)
    .then(r => r.json())
    .then(data => {
      L.geoJSON(data, {
        style: ds.style,
        pointToLayer: ds.pointToLayer,
        onEachFeature: (feature, layer) => {
          layer.on('click', () => ds.type === 'street'
            ? handleStreetClick(feature, layer)
            : handleIntersectionClick(feature, layer)
          );
        }
        //add to map
      }).addTo(ds.layerGroup);
      ds.layerGroup.addTo(map);
    });
}
//create a function to check if a user is within a given buffer of the street (line)
function isWithinBuffer(userLatLng, feature, bufferDistance) {
  // Using turf API for the buffer, first convert the user location to a point format for the API 
  const userPoint = turf.point([userLatLng.lng, userLatLng.lat]);
  const line = turf.lineString(feature.geometry.coordinates);
  // now a buffer can be creayted around geomgtry of the street (in km)
  const buffered = turf.buffer(line, bufferDistance, {units: "kilometers"});
  // Check if user is inside buffered area, and return response
  const result = turf.booleanPointInPolygon(userPoint, buffered);
  console.log("RESULT:", result);
  return result;
}
//function to run open audit choice when map is clicked
//create a function that will run when the user clicks a street segment, taking the selected feature (GeoJSON feature) and layer (Leaflet layer) as arguments
function handleStreetClick(feature, layer) {
//ensure user location is enable, alert user is not
  if (!userLocation) {
    alert("Please enable location first.");
    return;
  }
  //run spatial validation function to check if they are within the set buffer of the selected segment
  const allowed = isWithinBuffer(userLocation, feature, setBufferDistance);
  // run if not within the buffer
  if (!allowed) {
    alert("You are not within range of this street segment.");
    return;
  }
  activeLayer = layer;
  const { StreetSegm: id, StreetName: name } = feature.properties;
  const el = document.getElementById("selectedSegmentText");
  if (el) el.innerHTML = `<b>${name}</b> (Segment ID: ${id})`;
  openAuditChoice();
}
//function for intersection clicks
function handleIntersectionClick(feature, layer) {
  const prop = feature.properties;
  //make title case
  const intName = prop.Intersection
  .toLowerCase()
  .split(" ")
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(" ");
  const popupContent = `<b>Intersection:</b> ${intName}`;
  layer.bindPopup(popupContent).openPopup();
}


