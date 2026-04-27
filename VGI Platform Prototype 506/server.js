
//load in express (make sure it is installed), for the server (from node.js)
const express = require('express');
//load in file system to append and write to geojson
const fs = require('fs');
const app = express();
const port = 8080;

//ensure server is able to read the json data sent from the form 
app.use(express.json());
// serves all files stored in the "frontend" folder (html, css, js)
app.use(express.static('frontend')); 

//1. create the 2 seperate file contansts, one for each audit type
//shorted variable name from file name for easier referencing
const objectiveAD  = 'objectiveAuditData.geojson';
const subjectiveAD= 'subjectiveAuditData.geojson';

//create a function to load in the geoJson files, take filepath as an argument
function loadGeoJSON(filepath) {
  //check if file exists 
  if (fs.existsSync(filepath)) {
    // read the file as text, then convert it into a JavaScript object
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  }
  // if the file does NOT exist yet, return an empty GeoJSON structure
  return { type: 'FeatureCollection', features: [] };
}

// create a function to save GeoJSON to the file, to update and store responses
//make the filepath and the data as arguments
function saveGeoJSON(filepath, data) {
  //convert to json and save to file
   fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Submit survey endpoint, runs when user submits survey sucessfully
app.post('/submit-survey', (req, res) => {
  //get the audit data 
  const data = req.body;
  //check to see which survey/audit the user filed out, if type is objective returns true
  const isObjective = data.surveyType === 'objective';
  //if isObjective retrns as true file as objetive if false file is subjective
  const filepath = isObjective ? objectiveAD : subjectiveAD;

  //create feature const which strcrues the geoJson file data
  // Every survey response will become one "Feature" in the collection
  const feature = {
    type: 'Feature',
    geometry: data.geometry ?? null,
    properties: {
      ...data,
      timestamp: new Date().toISOString()
    }
  };
  //load in existing audit file first to not overwrite
  //append new response to file and run save function
  const collection = loadGeoJSON(filepath);
  collection.features.push(feature);
  saveGeoJSON(filepath, collection);
  //if it is saved sucessfully, return true
  res.json({ success: true });
});

//////////////////////////////////////////////

//observation counts
app.get('/observation-counts', (req, res) => {
  //create 2 constants to store the repsonse counts
  const objective  = {};
  const subjective = {};
  // count objective
  if (fs.existsSync(objectiveAD)) {
    const collection = loadGeoJSON(objectiveAD);
    //loop through file of responses to count unqiue entries for the segment
    collection.features.forEach(f => {
      const id = f.properties.segmentId;
      // if i've seen this segment id before, add 1 to its count
      // if not, start it at 1
      if (id) objective[id] = (objective[id] || 0) + 1;
    });
  }
  // count subjective
  if (fs.existsSync(subjectiveAD)) {
    const collection = loadGeoJSON(subjectiveAD);
    collection.features.forEach(f => {
      const id = f.properties.segmentId;
      if (id) subjective[id] = (subjective[id] || 0) + 1;
    });
  }

  res.json({ objective, subjective });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});``