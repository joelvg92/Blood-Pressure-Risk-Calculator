const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
      patient: "a6889c6d-6915-4fac-9d2f-fc6c42b3a82e"
  }
});

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
      var names = pt.name.map(function(name) {
          return name.given.join(" ") + " " + name.family;
      });
      return names.join(" / ")
  } else {
      return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}


//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
      typeof ob.valueQuantity != 'undefined' &&
      typeof ob.valueQuantity.value != 'undefined' &&
      typeof ob.valueQuantity.unit != 'undefined') {
      return Number(parseFloat((ob.valueQuantity.value)).toFixed(2));
  } else {
      return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
      var BP = observation.component.find(function(component) {
          return component.code.coding.find(function(coding) {
              return coding.code == typeOfPressure;
          });
      });
      if (BP) {
          observation.valueQuantity = BP.valueQuantity;
          formattedBPObservations.push(observation);
      }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
      height: {
          value: ''
      },
      weight: {
          value: ''
      },
      sys: {
          value: ''
      },
      dia: {
          value: ''
      },
      smoke: {
          value: ''
      },
      excercise: {
          value: ''
      },
      diabetes: {
          value: ''
      }
  };
}

var patientInfo = null;

//function to display the observation values you will need to update this
function displayObservation(obs) {
  const getAge = birthDate => Math.floor((new Date() - new Date(birthDate).getTime()) / 3.15576e+10)
  document.getElementById("age").value = getAge(patientInfo.birthDate);
  document.getElementById("gender2").value = patientInfo.gender;
  document.getElementById("sys").value = obs.sys;
  document.getElementById("dia").value = obs.dia;
  document.getElementById("weight").value = obs.weight;
  document.getElementById("height").value = obs.height;
  if(obs.smoke == true){
    document.getElementById("smoke_yes").checked = true;
  }else{
    document.getElementById("smoke_no").checked = true;
  }
  if(obs.diabetes == true){
    document.getElementById("diabetes_yes").checked = true;
  }else{
    document.getElementById("diabetes_no").checked = true;
  }
  if(obs.excercise == true){
    document.getElementById("excercise_yes").checked = true;
  }else{
    document.getElementById("excercise_no").checked = true;
  }
}

function displayObservation2(historyVal) {
  if(historyVal == true){
    document.getElementById("history_yes").checked = true;
  }else{
    document.getElementById("history_no").checked = true;
  }
}

// get patient object and then display its demographics info in the banner
client.request(`Patient/${client.patient.id}`).then(
  function(patient) {
      displayPatient(patient);
      patientInfo = patient;
      console.log(patientInfo);
  }
);



function populateData() {
/*   const table2 = document.getElementById("result");
  let row = table2.rows.length;
  if(row >0){
    table2.deleteRow(0);
  } */
  $('#calculate').prop('disabled', false);
  var query = new URLSearchParams();
  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
      'http://loinc.org|29463-7',
      'http://loinc.org|8302-2',
      'http://loinc.org|8462-4',
      'http://loinc.org|8480-6',
      'http://loinc.org|2085-9',
      'http://loinc.org|2089-1',
      'http://loinc.org|55284-4',
      'http://loinc.org|3141-9',
      'http://loinc.org|72166-2',
      'http://loinc.org|73985-4',
      'http://loinc.org|33248-6',
  ].join(","));
//search medical history
  var query2 = new URLSearchParams();
  query2.set("patient", client.patient.id);
  query2.set("_count", 100);
  query2.set("_sort", "-date");
  query2.set("code", [
      '59621000',
  ].join(","));

  client.request("Observation?" + query, {
      pageLimit: 0,
      flat: true
  }).then(
      function(ob) {

          // group all of the observation resoruces by type into their own
          var byCodes = client.byCodes(ob, 'code');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
          var weight = byCodes('29463-7');
          var height = byCodes('8302-2');
          var smoking = byCodes('72166-2');
          var excercise = byCodes('73985-4');
          var diabetes = byCodes('33248-6');
          console.log(excercise);
          console.log(diabetes);
          // create patient object
          var p = defaultPatient();

          if (typeof systolicbp != 'undefined') {
              p.sys = systolicbp;
          } else {
              p.sys = 'undefined'
          }

          if (typeof diastolicbp != 'undefined') {
              p.dia = diastolicbp;
          } else {
              p.dia = 'undefined'
          }

          p.weight = getQuantityValueAndUnit(weight[0]);
          p.height = getQuantityValueAndUnit(height[0]);
          if(smoking.length>0){
            p.smoke=true;
          }else{
            p.smoke=false;
          }
          if(excercise.length>0){
            p.excercise=true;
          }else{
            p.excercise=false;
          }
          if(diabetes.length>0){
            p.diabetes=true;
          }else{
            p.diabetes=false;
          }
          displayObservation(p);


      });
      client.request("FamilyMemberHistory?" + query2, {
        pageLimit: 0,
        flat: true
    }).then(
        function(ob) {
            console.log(ob)
            var val=false;
            if(ob.length>0){
             val=true;
            }
            displayObservation2(val); 
        });
}
//event listner when the add button is clicked to call the function that will add the note to the weight observation
$('#calculate').prop('disabled', true); // Disables visually + functionally
document.getElementById('populate').addEventListener('click', populateData);
document.getElementById('calculate').addEventListener('click', calculateBP);

function displayErrorMessage(text){
document.getElementById('errorMessage').innerHTML =text;
}

var form = document.querySelector('form');
form.addEventListener('change', function() {
  validate();
});


function validate(){
  var age = $('#age').val();
  var gender = $('#gender2').val();
  var wieght = $('#weight').val();
  var height = $('#height').val();
  var sbp = $('#sys').val();
  var dbp = $('#dia').val();
  var excercise_yes = $('#excercise_yes').is(':checked');
  var excercise_no = $('#excercise_no').is(':checked');
  var smoker_yes = $('#smoke_yes').is(':checked');
  var smoker_no = $('#smoke_no').is(':checked');
  var history_no = $('#history_no').is(':checked');
  var history_yes = $('#history_yes').is(':checked');
  var diabetes_no = $('#diabetes_no').is(':checked');
  var diabetes_yes = $('#diabetes_yes').is(':checked');
  if(age == '' || gender=='' || wieght =='' || height=='' || sbp =='' || dbp ==''){
    //displayErrorMessage('All fields are required, values cannot be empty');
    $('#calculate').prop('disabled', true);
  }
  else if(age<45){
    //displayErrorMessage('Value cannot be less than 45');
    $('#calculate').prop('disabled', true);
  }
  else if(sbp<70 || sbp > 139){
    //displayErrorMessage('SBP should be between 70 and 139');
    $('#calculate').prop('disabled', true);
  }
  else if(dbp<49 || dbp > 80){
   // displayErrorMessage('DBP should be between 49 and 80');
    $('#calculate').prop('disabled', true);
  }
  else if(excercise_yes == false && excercise_no == false){
    //displayErrorMessage('Please select an option for excercise');
    $('#calculate').prop('disabled', true);
  }
  else if(history_yes == false && history_no == false){
    //displayErrorMessage('Please select an option for family history');
    $('#calculate').prop('disabled', true);
  }
  else if(diabetes_yes == false && diabetes_no == false){
    //displayErrorMessage('Please select an option for diabetes');
    $('#calculate').prop('disabled', true);
  }
  else if(smoker_yes == false && smoker_no == false){
    //displayErrorMessage('Please select an option for smoke');
    $('#calculate').prop('disabled', true);
  }
  else{
    $('#calculate').prop('disabled', false);
    //isValid=true;
  }
  
}

function calculateBP() {
/*   const table2 = document.getElementById("result");
  let row2 = table2.rows.length;
  if(row2>0){
    table2.deleteRow(0);
  } */
  var age = $('#age').val();
  var gender = $('#gender2').val();
  var wieght = $('#weight').val();
  var height = $('#height').val();
  var sbp = $('#sys').val();
  var dbp = $('#dia').val();
  var excercise_yes = $('#excercise_yes').is(':checked');
  var excercise_no = $('#excercise_no').is(':checked');
  var smoker_yes = $('#smoke_yes').is(':checked');
  var smoker_no = $('#smoke_no').is(':checked');
  var history_no = $('#history_no').is(':checked');
  var history_yes = $('#history_yes').is(':checked');
  var diabetes_no = $('#diabetes_no').is(':checked');
  var diabetes_yes = $('#diabetes_yes').is(':checked');
  var doesExcercise = checkBooleanValue(excercise_yes, excercise_no);
  var isSmoker = checkBooleanValue(smoker_yes, smoker_no);
  var familyHistory = checkBooleanValue(history_yes, history_no);
  var isDiabetic = checkBooleanValue(diabetes_yes, diabetes_no);
  var totatlPoints = 0;
  //age
  if (age >= 55 && age <= 64) {
      totatlPoints += 2;
  } else if (age >= 65 && age <= 74) {
      totatlPoints += 3;
  } else if (age >= 75) {
      totatlPoints += 4;
  } else {
      totatlPoints += 0;
  }
  //gender
  if (gender == 'male') {
      totatlPoints += 0;
  }
  if (gender == 'female') {
      totatlPoints += 1;
  }
  //excercise
  if (doesExcercise == true) {
      totatlPoints += 1;
  } else {
      totatlPoints += 0;
  }
  //family history
  if (familyHistory == true) {
      totatlPoints += 1;
  } else {
      totatlPoints += 0;
  }

  //diabetic
  if (isDiabetic == true) {
      totatlPoints += 2;
  } else {
      totatlPoints += 0;
  }

  //smoker
  if (isSmoker == true) {
      totatlPoints += 1;
  } else {
      totatlPoints += 0;
  }

  var bmi = bmiCalculator(wieght, height);
  //bmi
  if (bmi >= 25 && bmi <= 29) {
      totatlPoints += 1;
  } else if (bmi >= 30 && bmi <= 39) {
      totatlPoints += 2;
  } else if (bmi >= 40) {
      totatlPoints += 3;
  } else {
      totatlPoints += 0;
  }
  //SBP
  if (sbp >= 110 && sbp <= 114) {
      totatlPoints += 2;
  } else if (sbp >= 115 && sbp <= 119) {
      totatlPoints += 3;
  } else if (sbp >= 120 && sbp <= 124) {
      totatlPoints += 4;
  } else if (sbp >= 215 && sbp <= 129) {
      totatlPoints += 6;
  } else if (sbp >= 130 && sbp <= 134) {
      totatlPoints += 8;
  } else if (sbp >= 135 && sbp <= 139) {
      totatlPoints += 14;
  } else {
      totatlPoints += 0;
  }

  //DBP
  if (age <= 55) {
      if (dbp >= 25 && dbp <= 29) {
          totatlPoints += 1;
      } else if (dbp >= 30 && dbp <= 39) {
          totatlPoints += 2;
      } else if (dbp >= 40) {
          totatlPoints += 3;
      } else {
          totatlPoints += 0;
      }
  }
  if (age <= 55) {
      if (dbp >= 70 && dbp <= 79) {
          totatlPoints += 2;
      } else if (dbp >= 80) {
          totatlPoints += 3;
      } else {
          totatlPoints += 0;
      }
  }
  if (age >= 55 && age <= 64) {
      if (dbp >= 70 && dbp <= 79) {
          totatlPoints -= 1;
      }
      if (dbp >= 80) {
          totatlPoints -= 1;
      }

  }
  if (age >= 65 && age <= 74) {
      if (dbp >= 70 && dbp <= 79) {
          totatlPoints -= 2;
      }
      if (dbp >= 80) {
          totatlPoints -= 3;
      }
  }
  if (age >= 75) {
      if (dbp >= 70 && dbp <= 79) {
          totatlPoints -= 1;
      }
      if (dbp >= 80) {
          totatlPoints -= 2;
      }
  }
  //console.log(totatlPoints);
  var results = processResult(totatlPoints);
  //console.log(results);
  const table = document.getElementById("result");
  let row = table.insertRow();
  row.insertCell(0).innerHTML = table.rows.length;
  row.insertCell(1).innerHTML = results.one;
  row.insertCell(2).innerHTML = results.six;
  row.insertCell(3).innerHTML = results.nine;
  //console.log(Object.values(results));
  displayChart(Object.values(results));
  $("#myModal").modal('show');
}

function bmiCalculator(weight, height) {
  return weight / Math.pow(height, 2);
}
// create a resultSet object
function resultSet() {
  return {
      "one": {
          value: ''
      },
      "six": {
          value: ''
      },
      "nine": {
          value: ''
      }
  };
}


function processResult(result) {
  var res = resultSet();
  if (result == 0) {
      res.one = 3.58;
      res.six = 5.44;
      res.nine = 7.89;
  } else if (result == 1) {
      res.one = 3.74;
      res.six = 5.63;
      res.nine = 8.02;
  } else if (result == 2) {
      res.one = 4.14;
      res.six = 6.52;
      res.nine = 9.21;
  } else if (result == 3) {
      res.one = 4.61;
      res.six = 8.05;
      res.nine = 11.40;
  } else if (result == 4) {
      res.one = 5.15;
      res.six = 9.50;
      res.nine = 14.05;
  } else if (result == 5) {
      res.one = 5.93;
      res.six = 11.21;
      res.nine = 17.53;
  } else if (result == 6) {
      res.one = 7.34;
      res.six = 14.14;
      res.nine = 22.71;
  } else if (result == 7) {
      res.one = 8.91;
      res.six = 17.94;
      res.nine = 28.92;
  } else if (result == 8) {
      res.one = 11.10;
      res.six = 22.29;
      res.nine = 36.18;
  } else if (result == 9) {
      res.one = 13.72;
      res.six = 26.83;
      res.nine = 42.56;
  } else if (result == 10) {
      res.one = 16.81;
      res.six = 31.73;
      res.nine = 49.64;
  } else if (result == 11) {
      res.one = 20.72;
      res.six = 36.63;
      res.nine = 55.80;
  } else if (result == 12) {
      res.one = 23.67;
      res.six = 40.21;
      res.nine = 61.03;
  } else if (result == 13) {
      res.one = 27.52;
      res.six = 43.73;
      res.nine = 64.50;
  } else if (result == 14) {
      res.one = 31.17;
      res.six = 47.93;
      res.nine = 64.50;
  } else if (result == 15) {
      res.one = 35.95;
      res.six = 52.93;
      res.nine = 70.57;
  } else if (result == 16) {
      res.one = 36.39;
      res.six = 53.36;
      res.nine = 72.59;
  } else if (result == 17) {
      res.one = 31.98;
      res.six = 48.56;
      res.nine = 75.53;
  } else if (result == 18) {
      res.one = 33.51;
      res.six = 50.67;
      res.nine = 76.77;
  } else if (result == 19) {
      res.one = 36.03;
      res.six = 54.23;
      res.nine = 77.80;
  } else if (result == 20) {
      res.one = 40.22;
      res.six = 59.11;
      res.nine = 79.86;
  } else if (result == 21) {
      res.one = 47.07;
      res.six = 64.18;
      res.nine = 82.24;
  } else if (result == 22) {
      res.one = 52.53;
      res.six = 65.97;
      res.nine = 83.23;
  } else {
      res.one = 53.31;
      res.six = 70.51;
      res.nine = 87.07;
  }

  return res;
}

function checkBooleanValue(value1, value2) {
  if (value1 == true) {
      return value1;
  } else if (value2 == true) {
      return value2;
  } else {
      return false;
  }
}

function displayChart(result){
  new Chart(document.getElementById("bar-chart"), {
    type: 'bar',
    data: {
      labels: ["1 year", "6 year", "9 year"],
      datasets: [
        {
          label: "Risk %",
          backgroundColor: ["#3e95cd", "#3e95cd","#3e95cd"],
          data: result
        }
      ]
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Predicted blood pressure risk from one to nine years'
      }
    }
});
}

function ckChange1(ckType){
  var ckName = document.getElementsByName(ckType.name);
  var checked = document.getElementById(ckType.id);

  if (checked.checked) {
    for(var i=0; i < ckName.length; i++){

        if(!ckName[i].checked){
            ckName[i].disabled = true;
        }else{
            ckName[i].disabled = false;
        }
    } 
  }
  else {
    for(var i=0; i < ckName.length; i++){
      ckName[i].disabled = false;
    } 
  }    
}
function ckChange2(ckType){
  var ckName = document.getElementsByName(ckType.name);
  var checked = document.getElementById(ckType.id);

  if (checked.checked) {
    for(var i=0; i < ckName.length; i++){

        if(!ckName[i].checked){
            ckName[i].disabled = true;
        }else{
            ckName[i].disabled = false;
        }
    } 
  }
  else {
    for(var i=0; i < ckName.length; i++){
      ckName[i].disabled = false;
    } 
  }    
}
function ckChange3(ckType){
  var ckName = document.getElementsByName(ckType.name);
  var checked = document.getElementById(ckType.id);

  if (checked.checked) {
    for(var i=0; i < ckName.length; i++){

        if(!ckName[i].checked){
            ckName[i].disabled = true;
        }else{
            ckName[i].disabled = false;
        }
    } 
  }
  else {
    for(var i=0; i < ckName.length; i++){
      ckName[i].disabled = false;
    } 
  }    
}
function ckChange4(ckType){
  var ckName = document.getElementsByName(ckType.name);
  var checked = document.getElementById(ckType.id);

  if (checked.checked) {
    for(var i=0; i < ckName.length; i++){

        if(!ckName[i].checked){
            ckName[i].disabled = true;
        }else{
            ckName[i].disabled = false;
        }
    } 
  }
  else {
    for(var i=0; i < ckName.length; i++){
      ckName[i].disabled = false;
    } 
  }    
}