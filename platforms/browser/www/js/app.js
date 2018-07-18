// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.baronbrew.tilthydrometer', // App bundle ID
  name: 'Tilt Hydrometer', // App name
  theme: 'auto', // Automatic theme detection
  statusbar: {
      iosOverlaysWebView: true,
      enabled: true,
  },
  // App root data
  data: function () {
    return {
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
  },
  // App root methods
  methods: {
    helloWorld: function () {
      app.dialog.alert('Hello World!');
    },
  },
  // App routes
  routes: routes,
});

// Init/Create main view
var mainView = app.views.create('.view-main', {
  url: '/'
});

//templates
var displayTemplate = $$('#displaytemplate').html();
var compileddisplayTemplate = Template7.compile(displayTemplate);

var sgcallistTemplate = $$('#sgcallisttemplate').html();
var compiledsgcallistTemplate = Template7.compile(sgcallistTemplate);

//Permissions
var permissions;

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
  console.log("Device is ready!");
          // Specify a shortcut for the location manager holding the iBeacon functions.
          window.locationManager = cordova.plugins.locationManager;

          // Start tracking beacons
          initScan();
  
          console.log(device);
  
          //permissions = cordova.plugins.permissions;
  
          //permissions.checkPermission(permissions.BLUETOOTH, checkBluetoothPermissionCallback, null);
          //permissions.checkPermission(permissions.ACCESS_COARSE_LOCATION, checkCoarseLocationPermissionCallback, null);
});

  // Specify your beacon 128bit UUIDs here.
  var regions = [
      { uuid: 'A495BB10-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB20-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB30-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB40-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB50-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB60-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB70-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BB80-C5B1-4B44-B512-1370F02D74DE' }

  ];

  // Dictionary of beacons.
  var beacons = {};

  function checkBluetoothPermissionCallback(status) {
      if (!status.hasPermission) {
          var errorCallback = function () {
              console.warn('BLUETOOTH permission is not turned on');
          }

          permissions.requestPermission(
              permissions.BLUETOOTH,
              function (status) {
                  if (!status.hasPermission) errorCallback();
              },
              errorCallback);
      }
  }

  function checkCoarseLocationPermissionCallback(status) {
      if (!status.hasPermission) {
          var errorCallback = function () {
              console.warn('ACCESS_COARSE_LOCATION permission is not turned on');
          }

          permissions.requestPermission(
              permissions.ACCESS_COARSE_LOCATION,
              function (status) {
                  if (!status.hasPermission) errorCallback();
              },
              errorCallback);
      }
  }
  //beacon delegate
  var delegate = null;

  function toggleBluetooth() {
      console.log('toggleBluetooth');
      // if(device.version)  don't toggle if android and 4
      if ((device.platform == "Android") && (device.version.startsWith("4"))) {
          console.log("skipping toggle, Android 4.x");
      }
      else {
          locationManager.disableBluetooth();
          //wait 5s then enable
          locationManager.enableBluetooth();
      }
  }


  function stopScan() {
      console.log("stopScan");
      // Start ranging beacons.
          locationManager.stopRangingBeaconsInRegion(beaconRegion);
  }

  function startScan() {
      console.log("startScan");
      // Start ranging beacons.
      for (var i in regions) {
          var beaconRegion = new locationManager.BeaconRegion(
              i + 1,
              regions[i].uuid);

          // Start ranging.
          locationManager.startRangingBeaconsInRegion(beaconRegion);
      }

  }

  function toggleUnits(color) {
    var displaytempunits = localStorage.getItem('displayTempunits-' + color)||"°F";
    var displayfermunits = localStorage.getItem('displayFermunits-' + color)||"";
    if (displaytempunits == "°F" && displayfermunits == "") {
        localStorage.setItem('displayTempunits-' + color,"°C");
        localStorage.setItem('displayFermunits-' + color,"");
    }
    if (displaytempunits == "°C" && displayfermunits == "") {
        localStorage.setItem('displayTempunits-' + color,"°C");
        localStorage.setItem('displayFermunits-' + color,"°P");
    }
    if (displaytempunits == "°C" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        localStorage.setItem('displayFermunits-' + color,"°P");
    }
    if (displaytempunits == "°F" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        localStorage.setItem('displayFermunits-' + color,"");
    }
    updateSGcallist(color);
  }
    
//adds color specific attributes
  function addtoScan(beacon){
    //add time since last update
    beacon.lastUpdate = localStorage.getItem('lastUpdate-' + beacon.Color)||beacon.timeStamp;
    //make sure tilt card is visible
    $$('#tiltcard-' + beacon.Color).show();
    var date = new Date(beacon.timeStamp);
    beacon.displaytimeStamp = date.toLocaleString();
    //handle bad RSSI values from iOS by using previous value if value is "0"
    if (beacon.rssi == 0){
        beacon.displayRSSI = localStorage.getItem('prevRSSI-' + beacon.Color)||""
    }else{
        beacon.displayRSSI = beacon.rssi + " dBm";
        localStorage.setItem('prevRSSI-' + beacon.Color,beacon.displayRSSI);
    }    
}

  function initScan() {
      // The delegate object holds the iBeacon callback functions
      // specified below.
      delegate = new locationManager.Delegate();

      console.log('initScan');

      locationManager.enableBluetooth();

      // Called continuously when ranging beacons.
      delegate.didRangeBeaconsInRegion = function (pluginResult) {
          if (pluginResult.beacons.length > 0) {
              //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
              for (var i in pluginResult.beacons) {
                  // Insert beacon into table of found beacons.
                  var beacon = pluginResult.beacons[i];
                  //add timestamp
                  beacon.timeStamp = Date.now();
                  //assign color by UUID
                  switch (beacon.uuid[6]) {
                         case "1" : beacon.Color = "RED";
                         addtoScan(beacon);
                         break;
                         case "2" : beacon.Color = "GREEN";
                         addtoScan(beacon);
                         break;
                         case "3" : beacon.Color = "BLACK";
                         addtoScan(beacon);
                         break;
                         case "4" : beacon.Color = "PURPLE";
                         addtoScan(beacon);
                         break;
                         case "5" : beacon.Color = "ORANGE";
                         addtoScan(beacon);
                         break;
                         case "6" : beacon.Color = "BLUE";
                         addtoScan(beacon);
                         break;
                         case "7" : beacon.Color = "YELLOW";
                         addtoScan(beacon);
                         break;
                         case "8" : beacon.Color = "PINK";
                         addtoScan(beacon);
                         break;
                  }
                  //setup HD tilt
                if (beacon.minor > 2000){
                    beacon.uncalTemp = beacon.major / 10;
                    localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                    beacon.uncalSG = (beacon.minor / 10000).toFixed(4);
                    localStorage.setItem('uncalSG-' + beacon.Color, beacon.uncalSG);
                    localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                    beacon.hd = true;
                } else {
                //setup SD tilt
                  beacon.uncalTemp = beacon.major;
                  localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                  beacon.uncalSG = (beacon.minor / 1000).toFixed(3);
                  localStorage.setItem('uncalSG-' + beacon.Color, beacon.uncalSG);
                  localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                  beacon.hd = false;
                }
                  //set key by UUID
                  var key = beacon.uuid;
                  beacons[key] = beacon;
                  //console.log(beacons);
              }
          }
      updateBeacons();
      };

      // Set the delegate object to use.
      locationManager.setDelegate(delegate);

      // Request permission from user to access location info.
      // This is needed on iOS 8.
      locationManager.requestWhenInUseAuthorization();

      startScan();
  }
    
    //reset list of found beacons
    localStorage.setItem('foundbeacons','NONE');

    function updateBeacons() {
    for (var key in beacons) {
    var beacon = beacons[key];
    var currentTime = Date.now();
    
    //add display value and units
    beacon.displayTempunits = localStorage.getItem('displayTempunits-' + beacon.Color)||"°F";
    switch (beacon.displayTempunits){
        case "°F" : 
        beacon.uncaldisplayTemp = beacon.uncalTemp;
        break;
        case "°C"  : beacon.uncaldisplayTemp = ((beacon.uncalTemp - 32) * 5 / 9).toFixed(1);
        break;
    }
    beacon.displayFermunits = localStorage.getItem('displayFermunits-' + beacon.Color)||"";
    switch (beacon.displayFermunits) {
        case "" : 
        beacon.uncaldisplayFerm = beacon.uncalSG;
        beacon.caldisplayFerm = (getCalFerm(beacon.Color)).toFixed(3);
        break;
        case "°P" : beacon.uncaldisplayFerm = convertSGtoPreferredUnits(beacon.Color, beacon.uncalSG);
        beacon.caldisplayFerm = convertSGtoPreferredUnits(beacon.Color, getCalFerm(beacon.Color));
        break;
    }

    //get calibrated values
    beacon.SG = getCalFerm(beacon.Color);

    
    //setup tilt cards (generate new card once for each Tilt found)
    var foundBeacons = localStorage.getItem('foundbeacons');
    var foundBeaconsArray = foundBeacons.split(",");
    //reset list of tilt cards if new tilt color found
    if (foundBeaconsArray.indexOf(beacon.Color) < 0){
        foundBeaconsArray.push(beacon.Color);
        localStorage.setItem('foundbeacons',foundBeaconsArray);
        var displayhtml = compileddisplayTemplate(beacons);
        var tiltCard  = $$('#tiltCard').html(displayhtml);
        var foundBeaconsArraylength = foundBeaconsArray.length;
        //populate calibration point list
        updateSGcallist(beacon.Color);
        //setup javascript for each card
        for (var i = 1; i < foundBeaconsArraylength; i++) {
        //set up buttons
        console.log(beacon.Color);
        $$('#unitstoggle-' + foundBeaconsArray[i]).on('click', function (e) {
            var unitscolor = e.currentTarget.id.split("-");
            //console.log('clicked ' + unitscolor[1]);
            toggleUnits(unitscolor[1]);
            updateBeacons();
          });
        $$('#calprompt-' + foundBeaconsArray[i]).on('click', function (e) {
            var calcolor = e.currentTarget.id.split("-");
            //console.log('clicked ' + calcolor[1]);
            app.dialog.prompt('Enter actual SG/Concentration or tap "Cancel" to calibrate temperature:', 'Calibrate ' + calcolor[1], function (actual) {
             var actualSGpoints = localStorage.getItem('actualSGpoints-' + calcolor[1])||'-0.001,1.000,10.000';
             var actualSGpointsArray = actualSGpoints.split(',');
             var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + calcolor[1])||'-0.001,1.000,10.000';
             var uncalSGpointsArray = uncalSGpoints.split(',');
             var actualSGpoint = String(Number(actual).toFixed(3));
             var uncalSGpoint = localStorage.getItem('uncalSG-' + calcolor[1]);
             //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
             var calSGindex = actualSGpointsArray.indexOf(actualSGpoint);
             var uncalSGindex = uncalSGpointsArray.indexOf(uncalSGpoint);
             if (Number(actual) > 0.500 && Number(actual) < 2.000){
              if (calSGindex < 0 && uncalSGindex < 0){
                 actualSGpointsArray.push(actualSGpoint);
                 actualSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 uncalSGpointsArray.push(uncalSGpoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 app.toast.create({text: 'Success: Set ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
              } else if (calSGindex > 0 && uncalSGindex < 0){
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 uncalSGpointsArray.splice(calSGindex, 1, uncalSGpoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 app.toast.create({text: 'Success: Changed ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
             }
                else if (calSGindex < 0 && uncalSGindex > 0){
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 actualSGpointsArray.splice(uncalSGindex, 1, actualSGpoint);
                 actualSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 app.toast.create({text: 'Success: Changed ' + actualSGpoint + ' (actual) to ' + uncalSGpoint + ' (uncal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
                }
            }else{
                app.dialog.alert('The calibration point ' + actual + ' is out of range or not a number. Please try again.', 'Calibration Error');
            }
            //update list of calibration points in settings
            updateSGcallist(calcolor[1]);
            }, function () {
                app.dialog.prompt('Enter actual temperature:', 'Calibrate '+ calcolor[1], function (actualTemp){
               var actualTemppoints = localStorage.getItem('actualTemppoints-' + calcolor[1])||'-0.001,1.000,10.000';
               var actualTemppointsArray = actualTemppoints.split(',');
               var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + calcolor[1])||'0,1000';
               var uncalTemppointsArray = uncalTemppoints.split(',');
               var actualTemppoint = String(Number(actualTemp).toFixed(0));
               var uncalTemppoint = localStorage.getItem('uncalTemp-' + calcolor[1]);
               //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
               var calTempindex = actualTemppointsArray.indexOf(actualTemppoint);
             if (Number(actualTemp) > -1 && Number(actualTemp) < 213){
              if (calTempindex < 0){
                 actualTemppointsArray.push(actualTemppoint);
                 actualTemppointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualTemppoints-' + calcolor[1], actualTemppointsArray);
                 uncalTemppointsArray.push(uncalTemppoint);
                 uncalTemppointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalTemppoints-' + calcolor[1], uncalTemppointsArray);
                 app.toast.create({text: 'Set ' + uncalTemppoint + ' (uncal.) to ' + actualTemppoint + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
              } else{
                 localStorage.setItem('actualTemppoints-' + calcolor[1], actualTemppointsArray);
                 uncalTemppointsArray.splice(calTempindex, 1, uncalTemppoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalTemppoints-' + calcolor[1], uncalTemppointsArray);
                 app.toast.create({text: 'Reset ' + uncalTemppoint + ' (uncal.) to ' + actualTemppoint + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
             }
            }else{
                app.dialog.alert('The calibration point ' + actualTemp + 'is out of range or not a number. Please try again.', 'Calibration Error');
            }
                });
                });
            });       
        }
    }
    
    //update timer for last scan recieved
    beacon.numberSecondsAgo = ((currentTime - beacon.timeStamp) / 1000).toFixed(1);
    localStorage.setItem('lastUpdate-' + beacon.Color,beacon.timeStamp);
    //disconnect if no scans within 2 minutes
    if (Number(beacon.numberSecondsAgo) > 120){
        $$('#tiltcard-' + beacon.Color).hide();
    }
    //initialize display units
    //update data fields in Tilt card template
    $$('#uncalSG' + beacon.Color).html(beacon.uncalSG);
    $$('#uncaldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.uncaldisplayFerm) + beacon.displayFermunits);
    $$('#caldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.caldisplayFerm) + beacon.displayFermunits);
    $$('#uncalTemp' + beacon.Color).html(beacon.uncalTemp);
    $$('#uncaldisplayTemp+displayTempunits' + beacon.Color).html(String(beacon.uncaldisplayTemp) + beacon.displayTempunits);
    $$('#numberSecondsAgo' + beacon.Color).html(beacon.numberSecondsAgo);
    $$('#displayRSSI' + beacon.Color).html(beacon.displayRSSI);
    $$('#displaytimeStamp' + beacon.Color).html(beacon.displaytimeStamp);
    $$('#percentScaleSG' + beacon.Color).css('width', String((beacon.uncalSG - 0.980) / (1.150 - 0.980) * 100) + "%");
    $$('#percentScaleTemp' + beacon.Color).css('width', String((beacon.uncalTemp - 0) / (185 - 0) * 100) + "%");
    //update Tilt objects
    localStorage.setItem('tiltObject-' + beacon.Color,JSON.stringify(beacon));
    //console.log(beacon);
    
    };


}

function updateSGcallist(color) {
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.000,10.000';
var uncalSGpointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.000,10.000';
var actualSGpointsArray = actualSGpoints.split(',');
var displaySGcallistArray = [];
for (var i = 1; i < actualSGpointsArray.length - 1; i++){
    var actualdisplayFermcalpoint = convertSGtoPreferredUnits (color, Number(actualSGpointsArray[i]));
    var uncaldisplayFermcalpoint = convertSGtoPreferredUnits (color, Number(uncalSGpointsArray[i]));
    var points = JSON.parse('{ "color" : "' + color + '", "uncalpoint" : "' + uncaldisplayFermcalpoint + '", "actualpoint" : "' + actualdisplayFermcalpoint + '" }');
    displaySGcallistArray.push(points);
};
var displaySGcallistObject = {};
displaySGcallistObject.SGcalpoints = displaySGcallistArray;
$$('#sgcallisttemplate-' + color).html(compiledsgcallistTemplate(displaySGcallistObject));
};

function convertSGtoPreferredUnits (color, SG) {
var displayFermunits = localStorage.getItem('displayFermunits-' + color)||'';
    switch (displayFermunits){
        case '' : return ( SG * 1 ).toFixed(3);
        break;
        case '°P'  : return ( -616.868 + 1111.14 * SG - 630.272 * SG * SG + 135.997 * SG * SG * SG ).toFixed(1);
        break;
        case '°Bx'  : return ( -584.6957 + 1083.2666 * SG -577.9848 * SG * SG + 124.5209 * SG * SG * SG ).toFixed(1);
    }
}

function linearInterpolation (x, x0, y0, x1, y1) {
    var a = (y1 - y0) / (x1 - x0);
    var b = -a * x0 + y0;
    return a * x + b;
  }

function getCalFerm (color){
//get cal points from local storage
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.000,10.000';
var unCalSGPointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.000,10.000';
var actualSGPointsArray= actualSGpoints.split(',');
var SG = localStorage.getItem('uncalSG-' + color);
//temporary array for finding correct x and y values
var unCalSGPointsTempArray = uncalSGpoints.split(',');
//add current value to calibration point list
unCalSGPointsTempArray.push(SG);
//sort list lowest to highest
unCalSGPointsTempArray.sort(function(a, b){return a-b;});
var indexSG = unCalSGPointsTempArray.indexOf(SG);
var calSG = linearInterpolation (Number(SG), Number(unCalSGPointsArray[indexSG-1]), Number(actualSGPointsArray[indexSG-1]), Number(unCalSGPointsArray[indexSG]), Number(actualSGPointsArray[indexSG]));
return calSG;
}

function deleteSGCalPoint (checkbox){
//get color and index of selected point to delete in format as follows (sgcalpoints-{{color}}-{{@index}})
var selectedPoint = checkbox.id.split('-');
var color = selectedPoint[1];
var index = Number(selectedPoint[2]) + 1;
console.log(index);
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.000,10.000';
var unCalSGPointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.000,10.000';
var actualSGPointsArray = actualSGpoints.split(',');
var deleteduncalpoint = unCalSGPointsArray[index];
var deletedactualpoint = actualSGPointsArray[index];
//remove from sg cal points array
unCalSGPointsArray.splice(index, 1);
actualSGPointsArray.splice(index, 1);
//update local storage with new cal points
localStorage.setItem('uncalSGpoints-' + color,unCalSGPointsArray);
localStorage.setItem('actualSGpoints-' + color,actualSGPointsArray);
//delete point half second after checking box
setTimeout(function(){ 
    if (checkbox.checked){
        updateSGcallist(color);
        app.toast.create({text: 'Deleted ' + deleteduncalpoint + ' (uncal.) and ' + deletedactualpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
    }
    },300);
}

function getUncalibratedSGPoint (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    $$('#uncalSG-' + color).val(localStorage.getItem('uncalSG-' + color));
}

function addSGPoints (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    //handle quick cal / tare in water
    if (clickedButton[2] != undefined){
        var actual = Number(clickedButton[2]);
        var uncalSGpoint = localStorage.getItem('uncalSG-' + color);
    }else{
        var actual = $$('#actualSG-' + color).val();
        var uncalSGpoint = $$('#uncalSG-' + color).val();
    }
    //console.log(actual);
    var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.000,10.000';
    var actualSGpointsArray = actualSGpoints.split(',');
    var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.000,10.000';
    var uncalSGpointsArray = uncalSGpoints.split(',');
    var actualSGpoint = String(Number(actual).toFixed(3));
    //console.log(uncalSGpoint);
    //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
    var calSGindex = actualSGpointsArray.indexOf(actualSGpoint);
    var uncalSGindex = uncalSGpointsArray.indexOf(uncalSGpoint);
    if (Number(actual) > 0.500 && Number(actual) < 2.000){
     if (calSGindex < 0 && uncalSGindex < 0){
        actualSGpointsArray.push(actualSGpoint);
        actualSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('actualSGpoints-' + color, actualSGpointsArray);
        uncalSGpointsArray.push(uncalSGpoint);
        uncalSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('uncalSGpoints-' + color, uncalSGpointsArray);
        app.toast.create({text: 'Success: Set ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
     } else if (calSGindex > 0 && uncalSGindex < 0){
        localStorage.setItem('actualSGpoints-' + color, actualSGpointsArray);
        uncalSGpointsArray.splice(calSGindex, 1, uncalSGpoint);
        uncalSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('uncalSGpoints-' + color, uncalSGpointsArray);
        app.toast.create({text: 'Success: Changed ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
    }
       else if (calSGindex < 0 && uncalSGindex > 0){
        localStorage.setItem('uncalSGpoints-' + color, uncalSGpointsArray);
        actualSGpointsArray.splice(uncalSGindex, 1, actualSGpoint);
        actualSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('actualSGpoints-' + color, actualSGpointsArray);
        app.toast.create({text: 'Success: Changed ' + actualSGpoint + ' (actual) to ' + uncalSGpoint + ' (uncal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
       }
   }else{
       app.dialog.alert('The calibration point ' + actual + ' is out of range or not a number. Please try again.', 'Calibration Error');
   }
   //update list of calibration points in settings
   updateSGcallist(color);

}