


// Global variables
let map;

// store counts globally
let observationCounts = { objective: {}, subjective: {} };

//Authortative city of victoria datasets
const cityOfVictoriaDatasets = [
  {
    name: "Official Streets",
    file: "data/Street_Network.geojson",
    layerGroup: L.layerGroup()
  }
];

// initialize
$(document).ready(async function() {
  await loadObservationCounts();
  createMap();
});

// Load in observationcounts from the server
async function loadObservationCounts() {
  try {
    const res = await fetch('http://localhost:8080/observation-counts');
    observationCounts = await res.json();
    console.log('Counts loaded:', observationCounts);
  } catch (err) {
    console.error('Failed to load counts:', err);
  }
}
//change colour based on if the segment has observations
function getColor(id) {
  const total = (observationCounts.objective[id]  || 0) +
                (observationCounts.subjective[id] || 0);
  return total > 0 ? '#e75fa5ca' : '#fff3fcc2'; // pink if observed, grey if not
}
// create the map
function createMap(){
	map = L.map('map').setView([48.4284,-123.3656],13);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);
    
    //load in City of Victoria datasets
  const layerControlObj = {};
  cityOfVictoriaDatasets.forEach(ds => {
   loadCityOfVictoriaGeoJSON(ds);
   layerControlObj[ds.name] = ds.layerGroup;
  });

	// Add a layer control in the top-right corner
  L.control.layers(null, layerControlObj, { collapsed: false }).addTo(map);
	
	// Add locate control
L.control.locate({
    position: 'topright',     
    strings: {
        title: "Go to my location" 
    },
    locateOptions: {
        enableHighAccuracy: true // use GPS for precise location
    }
}).addTo(map);

}

function loadCityOfVictoriaGeoJSON(ds) {
  fetch(ds.file)
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
         // colour streets by observation count
         style: function(feature) {
            const id = String(feature.properties.StreetSegm);
            return { color: getColor(id), weight: 4 };
          },
        onEachFeature: function(feature, layer){
            layer.on('click', function() {
               const id         = String(feature.properties.StreetSegm);
               const name       = feature.properties.StreetName || `Segment ${id}`;
               const objective  = observationCounts.objective[id]  || 0;
               const subjective = observationCounts.subjective[id] || 0;
               layer.bindPopup(`
                <b>Street:</b> ${name}<br>
                <b>Segment ID:</b> ${id}<br>
                <b>Objective Observations:</b> ${objective}<br>
                <b>Subjective Observations:</b> ${subjective}<br>
                <b>Total:</b> ${objective + subjective}
                `).openPopup();
              });
            }
      }).addTo(ds.layerGroup);
      ds.layerGroup.addTo(map);
    })
    .catch(err => console.error(`Failed to load ${ds.file}:`, err));
}