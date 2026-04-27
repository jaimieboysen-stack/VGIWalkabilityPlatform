
//Survery js for my objective and subjective audits

//Funtctions to open/close audit modals on web page so they will be hidden when not in use
//buttons to trigger, have an open and close for audit selection and for objective/subjective

function openAuditChoice() {
  document.getElementById("auditChoiceModal").style.display = "block";
}
function closeAuditChoice() {
  document.getElementById("auditChoiceModal").style.display = "none";
}
function openObjectiveAudit() {
  closeAuditChoice();
  document.getElementById("objectiveSurveyModal").style.display = "block";
}
function openSubjectiveAudit() {
  closeAuditChoice();
  document.getElementById("subjectiveSurveyModal").style.display = "block";
}
// When closing the audit, i also reset all the inputs, so that if the user selects a new section they wont see their previous answers
// I reset selects by setting selectedIndex to 0 (back to the blank default), and also reset the radio buttons by unchecking all of them
// used querySelectorAll to return ALL matching elements to loop through them all at once, vs get ElementById
function closeObjectiveAudit() {
  document.getElementById("objectiveSurveyModal").style.display = "none";
  document.querySelectorAll("#objectiveSurveyModal select").forEach(s => s.selectedIndex = 0);
  document.querySelectorAll("#objectiveSurveyModal input[type='radio']").forEach(r => r.checked = false);
}
//repeat for subjective
function closeSubjectiveAudit() {
  document.getElementById("subjectiveSurveyModal").style.display = "none";
  document.querySelectorAll("#subjectiveSurveyModal select").forEach(s => s.selectedIndex = 0);
  document.querySelectorAll("#subjectiveSurveyModal input[type='radio']").forEach(r => r.checked = false);
}

///////////////////////////////////////////////////////////

// Validation checks for required fields for both audits
//function for objective
function validateObjective() {
  //use id from html page to run the required responses for the drop downs
  const requiredSelects = ["type", "parks", "transit", "lights", "bike", "shade"];
  for (const id of requiredSelects) {
    //use getElementbyId for each, to check if it is empty (.value)
    if (!document.getElementById(id).value) {
       //run an alert if the user did not input or answer all button questions
      alert("Please answer all questions before audit submission.");
      //if not filled, return false, which means the submit function won't run
      return false;
    }
  }
  //use id from html page to run the required responses for the checkboxs
  const requiredRadios = ["benches", "buildings", "graffiti", "sidewalk", "hazards", "buffer"];
  for (const name of requiredRadios) {
    if (!document.querySelector(`input[name="${name}"]:checked`)) {
     //run an alert if the user did not input or answer all button questions
      alert("Please answer all questions before audit submission.");
      //if not filled, return false, which means the submit function won't run
      return false;
    }
  }
  //if all required responses are filled, return true, submit function will go through
  return true;
}
//repeat steps for the function for the subjective audit
function validateSubjective() {
  const requiredSelects = ["traffic_safety", "personal_safety", "comfort_amenities", "enjoyment", "aesthetic", "ease_design"];
  for (const id of requiredSelects) {
    if (!document.getElementById(id).value) {
      alert("Please answer all questions before audit submission..");
      return false;
    }
  }
  return true;
}

///////////////////////////////////////////////////////////
// Sumbit functions for both audits

//if all required questions are answered, this will run on submit button click
    //1. before running makes sure an segment is activly selected on the map for storage
          //using defined variable 'active layer' from map js, should be stored when a use clicks a segment (if within range)
          //stores segmentID, name
function submitObjectiveAudit() {
  if (!activeLayer){ 
    // stop submission if no segment stored (used to ensure everything is running correctly)
    //alert user that no segment is selected to store audit answers to
    alert("No segment selected"); 
    return; 
  }
      //2. run validation function defined ealier
         // if the validation function returns as true, run next part
  if (!validateObjective()) return; 
       //3. format and send the data to the server to be stored as a GeoJSON
  //get the geometry of the selected street segment
    const geometry = activeLayer.toGeoJSON().geometry;
  //call on function
  sendToGeoJSON({
    //set survey type
    surveyType:'objective',
      //get segmentId and streetName from the selected segments data
    segmentId: activeLayer.feature.properties.StreetSegm,
    streetName: activeLayer.feature.properties.StreetName,
      //get geometry
    geometry: geometry,
      //pull all other info from the form questions and get their values
      //for button options, use ?.value, to return undefined if unchecked
    tripPurpose: document.getElementById("objTripPurpose").value,
    familiarity: document.getElementById("objFamiliarity").value,
    frequency: document.getElementById("objFrequency").value,
    groupComp: document.getElementById("objGroupComp").value,
    accessibility: document.getElementById("objAccessibility").value,
    gender: document.getElementById("objGender").value,
    age: document.getElementById("objAge").value,
    landUse: document.getElementById("type").value,
    parks:document.getElementById("parks").value,
    transit: document.getElementById("transit").value,
    benches: document.querySelector('input[name="benches"]:checked')?.value,
    lights: document.getElementById("lights").value,
    buildings: document.querySelector('input[name="buildings"]:checked')?.value,
    graffiti: document.querySelector('input[name="graffiti"]:checked')?.value,
    bike: document.getElementById("bike").value,
    sidewalk: document.querySelector('input[name="sidewalk"]:checked')?.value,
    hazards: document.querySelector('input[name="hazards"]:checked')?.value,
    buffer: document.querySelector('input[name="buffer"]:checked')?.value,
    shade: document.getElementById("shade").value,
  });
//run the close objectice audiot funtion to close the modal when submitted
  closeObjectiveAudit();
}
//follow the same steps for the subjective audit submit function 
function submitSubjectiveAudit() {
  if (!activeLayer)         { alert("No segment selected"); return; }
  if (!validateSubjective()) return; 
  const geometry = activeLayer.toGeoJSON().geometry;
  sendToGeoJSON({
    surveyType:'subjective',
    segmentId: activeLayer.feature.properties.StreetSegm,
    streetName: activeLayer.feature.properties.StreetName,
    geometry: geometry,
    tripPurpose: document.getElementById("subTripPurpose").value,
    familiarity: document.getElementById("subFamiliarity").value,
    frequency: document.getElementById("subFrequency").value,
    groupComp: document.getElementById("subGroupComp").value,
    accessibility: document.getElementById("subAccessibility").value,
    gender: document.getElementById("subGender").value,
    age: document.getElementById("subAge").value,
    traffic_safety: document.getElementById("traffic_safety").value,
    personal_safety: document.getElementById("personal_safety").value,
    comfort_amenities: document.getElementById("comfort_amenities").value,
    enjoyment: document.getElementById("enjoyment").value,
    aesthetic: document.getElementById("aesthetic").value,
    ease_design: document.getElementById("ease_design").value,
  });

  closeSubjectiveAudit();
}
//////////////////////////////////////////
// create a function to take the data entered by the user as an input, and send to the server js file for storage in the geojson files
//use async and await, to wait for and handle the server response
async function sendToGeoJSON(data) {
  try {
    //send data to server endpoint '/submit-survey'
    //use POST, b/c sending data to server
    const res = await fetch('/submit-survey', {
      method:  'POST',
      //in json format
      headers: { 'Content-Type': 'application/json' },
      //convert the data into JSON
      body:    JSON.stringify(data)
    });
    const result = await res.json();
    // log to console to check if the server saved the data
    if (result.success) console.log('Saved to GeoJSON');
  } catch (err) {
    //if unable to save, log to console an error has occured and alert the user
    console.error(' Error, Unable to save:', err);
    alert('Something went wrong saving the survey. Please try again');
  }
}