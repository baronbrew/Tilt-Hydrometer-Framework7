// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.baronbrew.tilthydrometer', // App bundle ID
  name: 'Tilt Hydrometer', // App name
  theme: 'auto', // Automatic theme detection
  statusbar: {
      overlay: true,
      iosOverlaysWebView: true,
      enabled: false,//disable for android
      iosTextColor: 'white',
      iosBackgroundColor: 'black',
  },
  touch: {
    tapHold: true,
    fastClicks:true,
    materialRipple:true,
    activeState: true,
    disableContextMenu: false,
    },
  panel: {
    swipe: 'both',
  },
  // App root data
  data: function () {
    return {
      defaultCloudURL : 'https://script.google.com/a/baronbrew.com/macros/s/AKfycbydNOcB-_3RB3c-7sOTI-ZhTnN43Ye1tt0EFvvMxTxjdbheaw/exec',
      tiltColors : ['RED', 'GREEN', 'BLACK', 'PURPLE', 'ORANGE', 'BLUE', 'YELLOW', 'PINK']
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

//Templates
var displayTemplate = $$('#displaytemplate').html();
var compileddisplayTemplate = Template7.compile(displayTemplate);

var filelistTemplate = $$('#filelisttemplate').html();
var compiledfilelistTemplate = Template7.compile(filelistTemplate);

var sgcallistTemplate = $$('#sgcallisttemplate').html();
var compiledsgcallistTemplate = Template7.compile(sgcallistTemplate);

var settingsTemplate = $$('#settingstemplate').html();
var compiledsettingsTemplate = Template7.compile(settingsTemplate);

//Permissions
var permissions;

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
  console.log("Device is ready!");
          //restore settings if needed
          app.data.tiltColors.forEach(restoreLoggingSettings);
          app.data.tiltColors.forEach(restoreCalibrationPoints);
          app.data.tiltColors.forEach(restorePreferredUnits);
          // Specify a shortcut for the location manager holding the iBeacon functions.
          window.locationManager = cordova.plugins.locationManager;
          // Start tracking beacons
          initScan();
          //detect orientation change for fixing status bar if needed 
          window.addEventListener('orientationchange', doOnOrientationChange);
          //detect when app is opened from background
          document.addEventListener('resume', onResume, false);
          document.addEventListener("pause", onPause, false);
          console.log(device);
          if (device.platform == 'Android' || device.platform == 'amazon-fireos'){
          setInterval(function(){ watchBluetooth(); }, 30000);//check if tilts are connected every 30 seconds, toggle bluetooth if not
          permissions = cordova.plugins.permissions;
          permissions.checkPermission(permissions.BLUETOOTH, checkBluetoothPermissionCallback, null);
          permissions.checkPermission(permissions.ACCESS_COARSE_LOCATION, checkCoarseLocationPermissionCallback, null);
          }
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
      // if(device.version)  don't toggle if android and 4
      if ((device.platform == "Android") && (device.version[0] == "4") || device.platform == 'iOS') {
          console.log("skipping toggle, Android 4.x or iOS");
      }
      else if (bluetoothToggled == false) {
          bluetoothToggled = true;
          locationManager.disableBluetooth();
          stopScan();
          console.log('toggleBluetooth');
          //wait 3.5s then enable
          setTimeout(function(){
            locationManager.enableBluetooth();
            bluetoothToggled = false;
            startScan();
        },3500);
      }
  }

  function doOnOrientationChange() {
    switch(window.orientation) {  
      case -90 || 90:
        app.statusbar.hide();
        $$('.card').css('max-width','45%');
        $$('.card').css('font-size','80%');
        $$('.navbar').css('display','none');
        break; 
      default:
        app.statusbar.show();
        $$('.card').css('max-width','100%');
        $$('.card').css('font-size','100%');
        $$('.navbar').css('display','block');
        break; 
    }
}


  function startScan() {
      console.log("startScan");
      scanningToast = app.toast.create({text: 'Scanning for nearby Tilts...<br>Ensure Bluetooth and Location Services are enabled and Tilt is floating.', icon: '<i class="material-icons">bluetooth_searching</i>', position: 'bottom', }).open();
      // Start ranging beacons.
      for (var i in regions) {
          var beaconRegion = new locationManager.BeaconRegion(
              i,
              regions[i].uuid);
             //console.log(beaconRegion);
          // Start ranging.
          locationManager.startRangingBeaconsInRegion(beaconRegion);
        }
  }

  function stopScan() {
    // Stop ranging beacons.
    for (var i in regions) {
        var beaconRegion = new locationManager.BeaconRegion(
            i,
            regions[i].uuid);
           //console.log(beaconRegion);
        // Start ranging.
        locationManager.stopRangingBeaconsInRegion(beaconRegion);
      }
}

  function toggleUnits(color) {
    var displaytempunits = localStorage.getItem('displayTempunits-' + color)||"°F";
    var displayfermunits = localStorage.getItem('displayFermunits-' + color)||"";
    if (displaytempunits == "°F" && displayfermunits == "") {
        localStorage.setItem('displayTempunits-' + color,"°C");
        NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
        //update radio buttons
        $$("input[name=gravityRadio-" + color + "][value='SG']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
    }
    if (displaytempunits == "°C" && displayfermunits == "") {
        localStorage.setItem('displayTempunits-' + color,"°C");
        NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
    }
    if (displaytempunits == "°C" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°F']").prop("checked",true);
    }
    if (displaytempunits == "°F" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='SG']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°F']").prop("checked",true);
    }
    updateSGcallist(color);
  }

  function getUnitsFromSettings(color) {
  var displayFermUnits = $$(("input[type='radio'][name='gravityRadio-" + color + "']:checked")).val();
  if (displayFermUnits == 'SG'){//remove pseudo-units
      displayFermUnits = '';
  }
  localStorage.setItem('displayFermunits-' + color, displayFermUnits);
  var displayTempUnits = $$(("input[type='radio'][name='temperatureRadio-" + color + "']:checked")).val();
  localStorage.setItem('displayTempunits-' + color, displayTempUnits);
  updateSGcallist(color);
  }
    
//adds color specific attributes
  function addtoScan(beacon){
    //tilt found, close scanning for tilts message
    scanningToast.close();
    //add time since last update
    beacon.lastUpdate = localStorage.getItem('lastUpdate-' + beacon.Color)||beacon.timeStamp;
    //make sure tilt card is visible
    $$('#tiltcard-' + beacon.Color).show();
    $$('#accordion-' + beacon.Color).show();
    //update list of in range beacons
    var inRangeBeacons = localStorage.getItem('inrangebeacons')||'NONE';
    var inRangeBeaconsArray = inRangeBeacons.split(',');
    var indexOfColor = inRangeBeaconsArray.indexOf(beacon.Color);
        if (indexOfColor < 0){
        inRangeBeaconsArray.push(beacon.Color);
        localStorage.setItem('inrangebeacons',inRangeBeaconsArray);
        }
    var date = new Date(beacon.timeStamp);
    beacon.displaytimeStamp = date.toLocaleString();
    //add beer name
    beacon.Beername = localStorage.getItem('beerName-' + beacon.Color);
    if (beacon.Beername === null){
        NativeStorage.getItem('beerName-' + beacon.Color, function (result) { 
            if(result !== undefined){
            localStorage.setItem('beerName-' + beacon.Color, result);
            }
         }, function (e) { });
         setTimeout(function(){beacon.Beername = localStorage.getItem('beerName-' + beacon.Color)||'Untitled';},250);
    }
    //add calibrated SG and Temp (F) for cloud posting
    beacon.SG = getCalFerm(beacon.Color).toFixed(4);
    beacon.Temp = getCalTemp(beacon.Color).toFixed(1);
    //handle null RSSI values from iOS by using previous value if value is "0"
    if (beacon.rssi == 0){
        beacon.displayRSSI = localStorage.getItem('prevRSSI-' + beacon.Color)||""
    }else{
        beacon.displayRSSI = beacon.rssi + " dBm";
        localStorage.setItem('prevRSSI-' + beacon.Color,beacon.displayRSSI);
    }
    //log data upon seeing tilts in range
    if (resumed){
        setTimeout(function(){logNow();}, 4000);
        resumed = false;
    }
}

  function initScan() {
      // The delegate object holds the iBeacon callback functions
      // specified below.
      delegate = new locationManager.Delegate();
      console.log('initScan');
      //will log data and toggle bluetooth (works for android phones, doesn't work on iOS)
      resumed = true;
      // Called continuously when ranging beacons.
      delegate.didRangeBeaconsInRegion = function (pluginResult) {
          if (pluginResult.beacons.length > 0) {
              for (var i in pluginResult.beacons) {
                  // Insert beacon into table of found beacons.
                  var beacon = pluginResult.beacons[i];
                  //add timestamp
                  beacon.timeStamp = Date.now();
                  //assign color by UUID
                  switch (beacon.uuid[6]) {
                         case "1" : beacon.Color = "RED";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "2" : beacon.Color = "GREEN";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "3" : beacon.Color = "BLACK";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "4" : beacon.Color = "PURPLE";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "5" : beacon.Color = "ORANGE";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "6" : beacon.Color = "BLUE";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "7" : beacon.Color = "YELLOW";
                         addtoScan(beacon);
                         updateBeacons();
                         break;
                         case "8" : beacon.Color = "PINK";
                         addtoScan(beacon);
                         updateBeacons();
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
          if (pluginResult.region.identifier == 0){//update display after each scan period regardless if Beacon found
              updateBeacons();
          }
      };

      // Set the delegate object to use.
      locationManager.setDelegate(delegate);

      // Request permission from user to access location info.
      // This is needed on iOS 8.
      locationManager.requestWhenInUseAuthorization();
      startScan();
      //update beacons even if nothing scanned
      updateInterval = setInterval(function(){ 
          updateBeacons();
        }, 1000);
        
  }
    //populate list of logging files
    var listOfCSVFiles = localStorage.getItem('listOfCSVFiles')||false;//set to false if no csv files exist
    if (listOfCSVFiles){//only create list of csv files exist
    var listOfCSVFilesArray = listOfCSVFiles.split(',');
    var displayhtml = compiledfilelistTemplate(listOfCSVFilesArray);
    $$('#fileList').html(displayhtml);
    };

    //reset list of found beacons
    localStorage.setItem('foundbeacons','NONE');
    localStorage.setItem('inrangebeacons','NONE');

    //globals
    //set blutooth toggled state
    bluetoothToggled = false;
    resumed = false;

    function updateBeacons() {
    for (var key in beacons) {
    var beacon = beacons[key];
    var currentTime = Date.now();
    //add display value and units
    beacon.displayTempunits = localStorage.getItem('displayTempunits-' + beacon.Color)||"°F";
    switch (beacon.displayTempunits){
        case "°F" : 
        beacon.uncaldisplayTemp = beacon.uncalTemp;
        beacon.caldisplayTemp = beacon.uncalTemp;//need to change once temperature calibration is setup
        break;
        case "°C"  : beacon.uncaldisplayTemp = ((beacon.uncalTemp - 32) * 5 / 9).toFixed(1);
        beacon.caldisplayTemp = ((beacon.uncalTemp - 32) * 5 / 9).toFixed(1);
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
    //setup tilt cards (generate new card once for each Tilt found)
    var foundBeacons = localStorage.getItem('foundbeacons');
    if (foundBeacons === null){//system cleared local storage while scanning
        //restore settings if needed
        app.data.tiltColors.forEach(restoreLoggingSettings);
        app.data.tiltColors.forEach(restoreCalibrationPoints);
        app.data.tiltColors.forEach(restorePreferredUnits);
        localStorage.setItem('foundbeacons', 'NONE');
        return;//can't continue
    }
    var foundBeaconsArray = foundBeacons.split(',');
    var inRangeBeacons = localStorage.getItem('inrangebeacons')||'NONE';
    var inRangeBeaconsArray = inRangeBeacons.split(',');
    //reset list of tilt cards if new tilt color found
    if (foundBeaconsArray.indexOf(beacon.Color) < 0){
        foundBeaconsArray.push(beacon.Color);
        localStorage.setItem('foundbeacons',foundBeaconsArray);
        var displayhtml = compileddisplayTemplate(beacons);
        var tiltCard  = $$('#tiltCard').html(displayhtml);
        var settingshtml = compiledsettingsTemplate(beacons);
        var settingspanel = $$('#settingsPanel').html(settingshtml);
        for (var i = 1; i < foundBeaconsArray.length; i++) {
        //setup javascript for each card
        doOnOrientationChange();
        //populate calibration point list
        updateSGcallist(foundBeaconsArray[i]);
        //show beer name in settings
        showBeerName(foundBeaconsArray[i]);
        //show email if available
        showEmail(foundBeaconsArray[i]);
        //show cloud URLs
        showCloudURLs(foundBeaconsArray[i]);
        //setup device toggle
        toggleDeviceLogging(foundBeaconsArray[i]);
        //set up cloud logging toggles
        toggleDefaultCloudURL(foundBeaconsArray[i]);
        toggleCustomCloudURL1(foundBeaconsArray[i]);
        toggleCustomCloudURL2(foundBeaconsArray[i]);
        //console.log(foundBeaconsArray[i]);
        //set up cloud interval stepper
        cloudIntervalStepper(foundBeaconsArray[i]);
        //set up buttons
        $$('#unitstoggle-' + foundBeaconsArray[i]).on('click', function (e) {
            var unitscolor = e.currentTarget.id.split("-");
            //console.log('clicked ' + unitscolor[1]);
            toggleUnits(unitscolor[1]);
            updateBeacons();
          });
          //set up change units in settings
        $$('#unitsradio-' + foundBeaconsArray[i]).on('click', function (e) {
            var unitscolor = e.currentTarget.id.split("-");
            setTimeout ( function() { getUnitsFromSettings(unitscolor[1]);
            updateBeacons(); }, 300);
          });
        $$('#calprompt-' + foundBeaconsArray[i]).on('click', function (e) {
            var calcolor = e.currentTarget.id.split("-");
            //console.log('clicked ' + calcolor[1]);
            app.dialog.prompt('Enter actual gravity or tap "Cancel" to calibrate temperature:', 'Calibrate TILT | ' + calcolor[1], function (actual) {
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
                 app.toast.create({text: 'Success calibrating ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
              } else if (calSGindex > 0 && uncalSGindex < 0){
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 uncalSGpointsArray.splice(calSGindex, 1, uncalSGpoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalSGpoint + ' (uncal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
             }
                else if (calSGindex < 0 && uncalSGindex > 0){
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 actualSGpointsArray.splice(uncalSGindex, 1, actualSGpoint);
                 actualSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 app.toast.create({text: 'Success calibrating ' + actualSGpoint + ' (actual) to ' + uncalSGpoint + ' (uncal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
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
                 app.toast.create({text: 'Success calibrating ' + uncalTemppoint + ' (uncal.) to ' + actualTemppoint + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
              } else{
                 localStorage.setItem('actualTemppoints-' + calcolor[1], actualTemppointsArray);
                 uncalTemppointsArray.splice(calTempindex, 1, uncalTemppoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalTemppoints-' + calcolor[1], uncalTemppointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalTemppoint + ' (uncal.) to ' + actualTemppoint + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
             }
            }else{
                app.dialog.alert('The calibration point ' + actualTemp + 'is out of range or not a number. Please try again.', 'Calibration Error');
            }
                });
                });
            });
        $$('#logprompt-' + foundBeaconsArray[i]).on('click', function (e) {
                //var calcolor = e.currentTarget.id.split("-");
                startLogging(e.currentTarget);
                
        });   
        }
    }
    //update beer name
    beacon.Beername = localStorage.getItem('beerName-' + beacon.Color)||'Untitled';
    //update timer for last scan recieved
    beacon.numberSecondsAgo = ((currentTime - beacon.timeStamp) / 1000).toFixed(1);
    localStorage.setItem('lastUpdate-' + beacon.Color,beacon.timeStamp);
    //get time since last cloud logged
    beacon.lastCloudLogged = ((Date.now() - localStorage.getItem('lastCloudLogged-' + beacon.Color)) / 1000 / 60).toFixed(0);
    //disconnect if no scans within 2 minutes
    if (Number(beacon.numberSecondsAgo) > 120){
        $$('#tiltcard-' + beacon.Color).hide();
        $$('#accordion-' + beacon.Color).hide();
        var indexOfColor = inRangeBeaconsArray.indexOf(beacon.Color);
        if (indexOfColor > -1){
        inRangeBeaconsArray.splice(indexOfColor, 1);
        localStorage.setItem('inrangebeacons',inRangeBeaconsArray);
        }
    }
    //check freshness of tilt connections for Android, toggle if average exceeds 60s
    var totalSecondsAgo = 0;
    for (var i = 1; i < inRangeBeaconsArray.length; i++){
        var lastUpdate = Number(localStorage.getItem('lastUpdate-' + inRangeBeaconsArray[i]))||Date.now();
        var SecondsAgo = (Date.now() - lastUpdate) / 1000;
        totalSecondsAgo += SecondsAgo;
    }
    var averageSecondsAgo = (totalSecondsAgo / (inRangeBeaconsArray.length - 1)).toFixed(0);
    if (averageSecondsAgo > 60 && averageSecondsAgo < 65){//toggle bluetooth after 60 seconds disconnected when Android bluetooth fails   
        if (!bluetoothToggled){
        toggleBluetooth();
        }
    }
    //initialize display units
    //update data fields in Tilt card template
    $$('#beerName' + beacon.Color).html(beacon.Beername.split(',')[0]);
    $$('#lastCloudLogged' + beacon.Color).html(beacon.lastCloudLogged + 'm ago');
    $$('#uncalSG' + beacon.Color).html(beacon.uncalSG);
    $$('#uncaldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.uncaldisplayFerm) + beacon.displayFermunits);
    $$('#caldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.caldisplayFerm) + beacon.displayFermunits);
    $$('#uncalTemp' + beacon.Color).html(beacon.uncalTemp);
    $$('#uncaldisplayTemp+displayTempunits' + beacon.Color).html(String(beacon.uncaldisplayTemp) + beacon.displayTempunits);
    $$('#caldisplayTemp+displayTempunits' + beacon.Color).html(String(beacon.caldisplayTemp) + beacon.displayTempunits);
    $$('#numberSecondsAgo' + beacon.Color).html(beacon.numberSecondsAgo);
    $$('#displayRSSI' + beacon.Color).html(beacon.displayRSSI);
    $$('#displaytimeStamp' + beacon.Color).html(beacon.displaytimeStamp + ' v1.0.12');
    $$('#percentScaleSG' + beacon.Color).css('width', String((beacon.uncalSG - 0.980) / (1.150 - 0.980) * 100) + "%");
    $$('#percentScaleTemp' + beacon.Color).css('width', String((beacon.uncalTemp - 0) / (185 - 0) * 100) + "%");
    //update Tilt objects
    localStorage.setItem('tiltObject-' + beacon.Color,JSON.stringify(beacon));
    //log to cloud or device
    var cloudInterval = localStorage.getItem('cloudInterval-' + beacon.Color)||15;
    if (Number(cloudInterval) <= Number(beacon.lastCloudLogged)){
        postToCloudURLs(beacon.Color);
        logToDevice(beacon.Color);
        localStorage.setItem('lastCloudLogged-' + beacon.Color, Date.now());//reset timer
    };
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
//save updated calibration points to native storage
NativeStorage.setItem('uncalSGpoints-' + color, uncalSGpoints, function (result) { }, function (e) { });
NativeStorage.setItem('actualSGpoints-' + color, actualSGpoints, function (result) { }, function (e) { });
};

function convertSGtoPreferredUnits (color, SG) {
var displayFermunits = localStorage.getItem('displayFermunits-' + color)||'';
    switch (displayFermunits){
        case '' : return ( SG * 1 ).toFixed(3);
        break;
        //0.005 added to prevent rounding to a negative 0 from sg of 1.000
        case '°P'  : return ( 0.005 - 616.868 + 1111.14 * SG - 630.272 * SG * SG + 135.997 * SG * SG * SG ).toFixed(1);
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
//temporary array for finding correct x and y values
var unCalSGPointsTempArray = uncalSGpoints.split(',');
var SG = localStorage.getItem('uncalSG-' + color);
//add current value to calibration point list
unCalSGPointsTempArray.push(SG);
//sort list lowest to highest
unCalSGPointsTempArray.sort(function(a, b){return a-b;});
var indexSG = unCalSGPointsTempArray.indexOf(SG);
var calSG = linearInterpolation (Number(SG), Number(unCalSGPointsArray[indexSG-1]), Number(actualSGPointsArray[indexSG-1]), Number(unCalSGPointsArray[indexSG]), Number(actualSGPointsArray[indexSG]));
return calSG;
}

function getCalTemp (color) {
    //copy above for temp calibration
    return Number(localStorage.getItem('uncalTemp-' + color));
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

function clearBeerName (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    var currentBeerNameArray = currentBeerName.split(',');
    var localJSONfileName = localStorage.getItem('localJSONfileName-' + color)||'not logging';
    var localCSVfileName = localStorage.getItem('localCSVfileName-' + color)||'not logging';
    localStorage.setItem('localJSONfileName-' + color, 'not logging');
    localStorage.setItem('localCSVfileName-' + color, 'not logging');
    //warn user that about deleting name with associated cloud ID or if device logging is in progress
    if (Number(currentBeerNameArray[1] > 0) || localCSVfileName != 'not logging' || localJSONfileName != 'not logging' ){
        var notificationFull = app.notification.create({
            icon: '<i class="f7-icons">check</i>',
            title: 'Name and Cloud ID Cleared',
            titleRightText: 'alert',
            subtitle: currentBeerName + ' disconnected from cloud log and/or device log.',
            text: 'tap here to undo',
            closeTimeout: 8000,
            closeOnClick: true,
          });
        notificationFull.open();
        notificationFull.on('click', 
         function() { 
             //restore beername and cloud file name if user cancels deletion
          localStorage.setItem('beerName-' + color, currentBeerName);
          localStorage.setItem('localJSONfileName-' + color, localJSONfileName);
          localStorage.setItem('localCSVfileName-' + color, localCSVfileName);
          showBeerName(color);
         });
    }
    localStorage.setItem('beerName-' + color, 'Untitled');
    localStorage.setItem('localJSONfileName-' + color, 'not logging');
    localStorage.setItem('localCSVfileName-' + color, 'not logging');
    $$('#cloudStatus' + color).html('');
    $$('#deviceStatus' + color).html('');
    showBeerName(color);
}

function setBeerName (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    var currentBeerNameArray = currentBeerName.split(',');
    var newBeerNameRaw = $$('#currentbeername-' + color).val();
    var newBeerName = newBeerNameRaw.trim();
    var validBeerName = newBeerName.replace('/', '-');
    //only update beer name if field is not empty
    if (newBeerName == "") {
        var notificationFull = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Error Saving Name',
            titleRightText: 'alert',
            subtitle: 'No name entered.',
            text: 'Please enter a beer name.',
            closeTimeout: 5000,
          });
        notificationFull.open();
        //warn if name has an associated cloud ID
    } else if (Number(currentBeerNameArray[1]) > 0) {
        var notificationFull = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Error Saving Name',
            titleRightText: 'alert',
            subtitle: 'Cloud logging in progress.',
            text: 'Please clear name before saving new name.',
            closeTimeout: 5000,
          });
        notificationFull.open();
        }
        //don't warn if beer name doesn't have a cloud id associated
      else {
        var notificationFull = app.notification.create({
            icon: '<i class="f7-icons">check</i>',
            title: 'Saved',
            titleRightText: 'alert',
            subtitle: 'Beer name for TILT | ' + color + ' saved as ' + validBeerName,
            text: 'Name will be displayed and used for logging.',
            closeTimeout: 5000,
          });
        notificationFull.open();
        localStorage.setItem('beerName-' + color, validBeerName);
        NativeStorage.setItem('beerName-' + color, validBeerName, function (result) { }, function (e) { });
        showBeerName(color);
    }
}

function showBeerName (color){
    var beerName = localStorage.getItem('beerName-' + color)||'Untitled';
    var beerNameArray = beerName.split(',');
    //set beer name in settings panel unless it is untitled leave blank
    if (beerName == 'Untitled'){
    $$('#currentbeername-' + color).val('');
    }
    else {
    $$('#currentbeername-' + color).val(beerName);
    }
    //set beer name on tilt card
    $$('#beerName' + color).html(beerNameArray[0]);
}

function toggleDeviceLogging (color) {
    var toggle = app.toggle.create({
        el: '#toggleDeviceLogging-' + color,
        on: {
          change: function () {
            var deviceLoggingEnabled = localStorage.getItem('deviceLoggingEnabled-' + color)||'0';
            if (toggle.checked){
                deviceLoggingEnabled = '1';
                localStorage.setItem('deviceLoggingEnabled-' + color, deviceLoggingEnabled);
                logToDevice(color,'device logging toggled');
            }
            if (!toggle.checked){
                deviceLoggingEnabled = '0';
                localStorage.setItem('deviceLoggingEnabled-' + color, deviceLoggingEnabled);
            }
          NativeStorage.setItem('deviceLoggingEnabled-' + color, deviceLoggingEnabled, function (result) { }, function (e) { });
          }
        }
      })
    var deviceLoggingEnabled = localStorage.getItem('deviceLoggingEnabled-' + color)||'0';
    if (deviceLoggingEnabled == '1' && !toggle.checked){
            toggle.toggle();
    }
    else if (deviceLoggingEnabled == '0' && toggle.checked){
        toggle.toggle();
     }
}

function deviceToggle (color) {
    var toggle = app.toggle.get('#toggleDeviceLogging-' + color);
    toggle.toggle();
}

function toggleDefaultCloudURL (color) {
    var toggle = app.toggle.create({
        el: '#toggleDefaultCloudURL-' + color,
        on: {
          change: function () {
            var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'0,0,0';
            var cloudURLsenabledArray = cloudURLsenabled.split(',');
            if (toggle.checked){
                cloudURLsenabledArray[0] = '1';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
                postToCloudURLs(color);
            }
            if (!toggle.checked){
                cloudURLsenabledArray[0] = '0';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
            }
            NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
          }
        }
      })
    var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'0,0,0';
    var cloudURLsenabledArray = cloudURLsenabled.split(',');
    if (cloudURLsenabledArray[0] == '1' && !toggle.checked){
            toggle.toggle();
    }
    else if (cloudURLsenabledArray[0] == '0' && toggle.checked){
        toggle.toggle();
     } 
}

function defaultToggle (color) {
    var toggle = app.toggle.get('#toggleDefaultCloudURL-' + color);
    toggle.toggle();
}

function setDefaultCloudURL (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newDefaultCloudURLRaw = $$('#defaultCloudURL-' + color).val();
    var newDefaultCloudURL = newDefaultCloudURLRaw.trim();
    localStorage.setItem('cloudurls-' + color, newDefaultCloudURL + ',' + customCloudURLsArray[1] + ',' + customCloudURLsArray[2]);
    NativeStorage.setItem('cloudurls-' + color, newDefaultCloudURL + ',' + customCloudURLsArray[1] + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">check</i>',
        title: 'New Default Cloud URL Saved',
        titleRightText: 'alert',
        subtitle: newDefaultCloudURL.substring(0,32) + '...',
        text: 'URL will be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}

function clearDefaultCloudURL (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newDefaultCloudURL = app.data.defaultCloudURL;
    $$('#defaultCloudURL-' + color).val('');
    localStorage.setItem('cloudurls-' + color, newDefaultCloudURL + ',' + customCloudURLsArray[1] + ',' + customCloudURLsArray[2]);
    NativeStorage.setItem('cloudurls-' + color, newDefaultCloudURL + ',' + customCloudURLsArray[1] + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">info</i>',
        title: 'Default Cloud URL Reset',
        titleRightText: 'alert',
        subtitle: newDefaultCloudURL.substring(0,32) + '...',
        text: 'Original default URL will be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}

function toggleCustomCloudURL1 (color) {
    var toggle = app.toggle.create({
        el: '#toggleCustomCloudURL1-' + color,
        on: {
          change: function () {
            var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
            var cloudURLsenabledArray = cloudURLsenabled.split(',');
            if (toggle.checked){
                cloudURLsenabledArray[1] = '1';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
                postToCloudURLs(color);

            }
            else if (!toggle.checked){
                cloudURLsenabledArray[1] = '0';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
            }
            NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
          }
        }
      })
      var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
      var cloudURLsenabledArray = cloudURLsenabled.split(',');
      if (cloudURLsenabledArray[1] == '1' && !toggle.checked){
         toggle.toggle();
      }
      if (cloudURLsenabledArray[1] == '0' && toggle.checked){
        toggle.toggle();
     }
}

function custom1Toggle (color) {
    var toggle = app.toggle.get('#toggleCustomCloudURL1-' + color);
    toggle.toggle();
}

function setCustomCloudURL1 (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newCustomCloudURL1Raw = $$('#customCloudURL1-' + color).val();
    var newCustomCloudURL1 = newCustomCloudURL1Raw.trim();
    localStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + newCustomCloudURL1 + ',' + customCloudURLsArray[2]);
    NativeStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + newCustomCloudURL1 + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">check</i>',
        title: 'Custom Cloud URL 1 Saved',
        titleRightText: 'alert',
        subtitle: newCustomCloudURL1.substring(0,32) + '...',
        text: 'URL will be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}

function clearCustomCloudURL1 (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newCustomCloudURL1 = '';
    $$('#customCloudURL1-' + color).val('');
    localStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + newCustomCloudURL1 + ',' + customCloudURLsArray[2]);
    NativeStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + newCustomCloudURL1 + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">info</i>',
        title: 'Custom Cloud URL 1 Cleared',
        titleRightText: 'alert',
        subtitle: customCloudURLsArray[1].substring(0,32) + '...',
        text: 'URL will no longer be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}


function toggleCustomCloudURL2 (color) {
    var toggle = app.toggle.create({
        el: '#toggleCustomCloudURL2-' + color,
        on: {
          change: function () {
            var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
            var cloudURLsenabledArray = cloudURLsenabled.split(',');
            if (toggle.checked){
                cloudURLsenabledArray[2] = '1';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
                postToCloudURLs(color);

            }
            else if (!toggle.checked){
                cloudURLsenabledArray[2] = '0';
                localStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray);
            }
            NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
          }
        }
      })
      var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
      var cloudURLsenabledArray = cloudURLsenabled.split(',');
      if (cloudURLsenabledArray[2] == '1' && !toggle.checked){
        toggle.toggle();
      }
      if (cloudURLsenabledArray[2] == '0' && toggle.checked){
        toggle.toggle();
     }
}

function custom2Toggle (color) {
    var toggle = app.toggle.get('#toggleCustomCloudURL2-' + color);
    toggle.toggle();
}

function setCustomCloudURL2 (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newCustomCloudURL2Raw = $$('#customCloudURL2-' + color).val();
    var newCustomCloudURL2 = newCustomCloudURL2Raw.trim();
    localStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + customCloudURLsArray[1] + ',' + newCustomCloudURL2);
    NativeStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + customCloudURLsArray[1] + ',' + newCustomCloudURL2, function (result) { }, function (e) { });
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">check</i>',
        title: 'Custom Cloud URL 2 Saved',
        titleRightText: 'alert',
        subtitle: newCustomCloudURL2.substring(0,32) + '...',
        text: 'URL will be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}

function clearCustomCloudURL2 (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var customCloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var customCloudURLsArray = customCloudURLs.split(',');
    var newCustomCloudURL2 = '';
    $$('#customCloudURL2-' + color).val('');
    localStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + customCloudURLsArray[1] + ',' + newCustomCloudURL2);
    var notificationFull = app.notification.create({
        icon: '<i class="f7-icons">info</i>',
        title: 'Custom Cloud URL 2 Cleared',
        titleRightText: 'alert',
        subtitle: customCloudURLsArray[2].substring(0,32) + '...',
        text: 'URL will no longer be used for cloud logging.',
        closeTimeout: 5000,
      });
    notificationFull.open();
}

function postToCloudURLs (color, comment) {
    //get beer name from local storage in case beer name updated from prompt
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    if (comment === undefined){
        comment = "";
    };
    var beacon = JSON.parse(localStorage.getItem('tiltObject-' + color));
    var cloudURLs = localStorage.getItem('cloudurls-' + color) || app.data.defaultCloudURL + ',,';
    var cloudURLsArray = cloudURLs.split(',');
    var cloudURLsenabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
    var cloudURLsenabledArray = cloudURLsenabled.split(',');
    var inRangeBeacons = localStorage.getItem('inrangebeacons')||'NONE';
    var inRangeBeaconsArray = inRangeBeacons.split(',');
    var indexOfColor = inRangeBeaconsArray.indexOf(color);
    if (cloudURLsenabled == '0,0,0' || indexOfColor < 0){
       return;//return undefined if no cloud options checked or Tilts not in range
       }
       var notificationCloud = app.notification.create({
        icon: '<i class="preloader"></i>',
        title: 'Connecting to cloud...',
        titleRightText: 'alert',
        subtitle: currentBeerName.split(',')[0] + ' (' + color + ' TILT)',
        text: 'Allow up to 30 seconds to connect.',
        closeOnClick: true,
        closeTimeout: 30000,
      });
    setTimeout(function(){ notificationCloud.open(); }, 1000); //prevents notification being overwritten by device log notification
    for (var i = 0; i < 3; i++) {
        if (cloudURLsenabledArray[i] == '1'){
        //convert beacon timeStamp (UTC) to Excel formatted Timepoint (local time)
        var timeStamp = new Date(beacon.timeStamp);
        var localTime = timeStamp.toLocaleString();
        var tzOffsetDays = timeStamp.getTimezoneOffset() / 60 / 24;
        var localTimeExcel = timeStamp.valueOf() / 1000 / 60 / 60 / 24 + 25569 - tzOffsetDays;
        //only send beer name with beer ID if using default cloud URL
         if (i != 0){
            currentBeerName = currentBeerName.split(',')[0];
         }
        app.request.post(cloudURLsArray[i], encodeURI("Timepoint=" + localTimeExcel + "&SG=" + beacon.SG + "&Temp=" + beacon.Temp + "&Color=" + beacon.Color + "&Beer=" + currentBeerName + "&Comment=" + comment), function (stringData){
            localStorage.setItem('lastCloudLogged-' + color, Date.now());
            //try to parse data from Baron Brew Google Sheets
            try {
            var jsonData = JSON.parse(stringData);
            //different notification depending on if beer name exists and data should be logged or if beer name doesn't exist and new log needs to be started
            if (jsonData.result.indexOf("Start New Log") > -1){
            var notificationSuccess = app.notification.create({
                icon: '<i class="f7-icons">check</i>',
                title: 'Ready to Start New Log',
                titleRightText: 'alert',
                subtitle: localTime,
                text: jsonData.result,
                closeOnClick: false,
                closeTimeout: 8000,
              });
            notificationSuccess.open();
            }else{
            var notificationSuccess = app.notification.create({
                icon: '<i class="f7-icons">check</i>',
                title: 'Success Logging to Cloud',
                titleRightText: 'alert',
                subtitle: localTime,
                text: jsonData.result,
                closeOnClick: false,
                closeTimeout: 8000,
              });
            notificationSuccess.open();
            }
            //set beername with returned cloud ID
            var beerNameArray = jsonData.beername.split(",");
            if (beerNameArray[1] !== undefined && comment != 'End of log') {
              localStorage.setItem('beerName-' + color, jsonData.beername);
              NativeStorage.setItem('beerName-' + color, jsonData.beername, function (result) { }, function (e) { });
                showBeerName(color);
                $$('#cloudStatus' + color).html('<a class="link external" href="' + jsonData.doclongurl + '">&nbsp;<i class="f7-icons size-15">cloud_fill</i><span id="lastCloudLogged' + beacon.Color +'"></span></a>');
                localStorage.setItem('docLongURL-' + color, jsonData.doclongurl);
            }
            }
            //json parse error - just show "result" if not Baron Brew Google Sheets
            catch(error){
                var notificationSuccess = app.notification.create({
                    icon: '<i class="f7-icons">check</i>',
                    title: 'Success Logging to Cloud',
                    titleRightText: 'alert',
                    subtitle: localTime,
                    text: jsonData.result,
                    closeOnClick: false,
                    closeTimeout: 8000,
                  });
                notificationSuccess.open();
                $$('#cloudStatus' + beacon.Color).html('<i class="f7-icons size-15">cloud_fill</i><span id="lastCloudLogged' + beacon.Color +'"></span>');

            }
        }, function (errorData) {
            var notificationCloudError = app.notification.create({
                icon: '<i class="f7-icons">info</i>',
                title: 'Error Logging to Cloud',
                titleRightText: 'alert',
                subtitle: 'TILT | ' + color,
                text: 'Check WiFi or Internet connection.',
                closeTimeout: 5000,
              });
            notificationCloudError.open();
            $$('#cloudStatus' + beacon.Color).html('cloud error');

        },
        'text'
        );
        }
    }
}

function cloudIntervalStepper (color) {
    var cloudIntervalCurrent = localStorage.getItem('cloudInterval-' + color)||'15';
    var stepper = app.stepper.create({
        el: '#cloudStepper-' + color,
        on : {
            change: function () {
            var cloudInterval = stepper.getValue();
            localStorage.setItem('cloudInterval-' + color, cloudInterval);
            NativeStorage.setItem('cloudInterval-' + color, cloudInterval, function (result) { }, function (e) { });
            if (cloudInterval == 15){
                app.toast.create({text: 'Set to minimum logging interval.', icon: '<i class="material-icons">check</i>', position: 'center', closeTimeout: 2000}).open();
            }
            }
        }
    })
    app.stepper.setValue('#cloudStepper-' + color, Number(cloudIntervalCurrent));
}

function clearEmail (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    localStorage.setItem('emailAddress-' + color,'');
    NativeStorage.setItem('emailAddress-' + color, '', function (result) { }, function (e) { });
    //$$('#emailAddress-' + color).val('');
    showEmail(color);
}
        

function setEmail (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var newEmailOriginal = $$('#emailAddress-' + color).val();
    var newEmail = newEmailOriginal.trim();
    if (ValidateEmail(newEmail)){
    var notificationEmailOK = app.notification.create({
            icon: '<i class="f7-icons">check</i>',
            title: 'Saved',
            titleRightText: 'alert',
            subtitle: newEmail,
            text: 'Email address will be used to send a link to your cloud log as well as allow edit access.',
            closeTimeout: 5000,
    });
    notificationEmailOK.open();
    localStorage.setItem('emailAddress-' + color, newEmail);
    NativeStorage.setItem('emailAddress-' + color, newEmail, function (result) { }, function (e) { });
    showEmail(color);
    }else{
        var notificationEmailBad = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Error Saving Email',
            titleRightText: 'alert',
            subtitle: 'Email: ' + newEmail,
            text: 'Email address must be valid to save. Leave blank and a link will be provided in the app. Edit access may be requested later.',
            closeTimeout: 8000,
    });
    notificationEmailBad.open();
    }
}

function showEmail (color){
   var email = localStorage.getItem('emailAddress-' + color)||'';
    $$('#emailAddress-' + color).val(email);
}

function showCloudURLs (color){
    var urls = localStorage.getItem('cloudurls-' + color)||',,';
    var urlsArray = urls.split(',');
    if (urlsArray[0] == app.data.defaultCloudURL){
        $$('#defaultCloudURL-' + color).val('');
    }else{
        $$('#defaultCloudURL-' + color).val(urlsArray[0]);
    }
     $$('#customCloudURL1-' + color).val(urlsArray[1]);
     $$('#customCloudURL2-' + color).val(urlsArray[2]);
 }

function ValidateEmail(email) {
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
    return (true)
  }
    return (false)
}

function startLogging(button) {
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var beerName = localStorage.getItem('beerName-' + color)||'Untitled';
    var beerNameArray = beerName.split(',');
    var email = localStorage.getItem('emailAddress-' + color)||$$('#emailAddress-' + color).val();
    if (email == ''){
        email = '@';
    };
    var emailValid = ValidateEmail(email);
    var cloudURLsEnabled = localStorage.getItem('cloudurlsenabled-' + color);
    var cloudURLsEnabledArray = cloudURLsEnabled.split(',');
    //check if device logging in progress
    var deviceLoggingJSONFileName = localStorage.getItem('localJSONfileName-' + color)||'not logging';
    var deviceLoggingCSVFileName = localStorage.getItem('localCSVfileName-' + color)||'not logging';
    //auto-toggle default cloud url if not enabled and button pressed to start logging
    var defaultToggle = app.toggle.get('#toggleDefaultCloudURL-' + color);
    var deviceToggle = app.toggle.get('#toggleDeviceLogging-' + color);
    if (!defaultToggle.checked && !deviceToggle.checked){
        defaultToggle.toggle();
        deviceToggle.toggle();
        //return after toggling so user will know default cloud URL will be used.
        return;
    }
    //handle the following situations: beer already logging, email address invalid, beer name not set (Untitled)
    if (Number(beerNameArray[1]) > 0 || deviceLoggingJSONFileName != 'not logging' || deviceLoggingCSVFileName != 'not logging'){
        if (Number(beerNameArray[1]) > 0 && cloudURLsEnabledArray.indexOf('1') > -1 ) {
        var notificationLogStarted = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Already Logging',
            titleRightText: 'alert',
            subtitle: 'Cloud logging for TILT | ' + color +  ' in progress.',
            text: 'Data will be added to the current log.',
            closeTimeout: 5000,
          });
            notificationLogStarted.open();
            setTimeout(function(){
                logToDevice(color);
                postToCloudURLs(color);
            },3000);
        } else if (deviceLoggingCSVFileName != 'not logging' && deviceLoggingJSONFileName != 'not logging') {//already logging to device but not cloud
            var notificationLogStarted = app.notification.create({
                icon: '<i class="f7-icons">info</i>',
                title: 'Already Logging to Device',
                titleRightText: 'alert',
                subtitle: 'Device logging for TILT |' + color + ' in progress.',
                text: 'Data will be added to the current device log.',
                closeTimeout: 5000,
              });
                notificationLogStarted.open();
                setTimeout(function(){
                    logToDevice(color);
                    postToCloudURLs(color, email);
                    //console.log(email);
                },3000);
        } else {
                logToDevice(color, 'start new local log');
            }
        //only warn email invalid if at least one cloud url is active
    }  else if (!emailValid && cloudURLsEnabledArray.indexOf('1') > -1) {
        var notificationEmailInvalid = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Email not provided or is invalid',
            titleRightText: 'alert',
            subtitle: 'Log will be started without email address.',
            text: 'Tap to Cancel',
            closeTimeout: 5000,
            closeOnClick: true,
          });
        notificationEmailInvalid.open();
        var cancelT = setTimeout(function() { 
            localStorage.setItem('emailAddress-' + color, '');
            showEmail(color);
            postToCloudURLs(color,'@');
            logToDevice(color, 'start new local log');
            app.preloader.show();
            setTimeout(function() {app.preloader.hide();}, 3000);
            }, 5000);
        notificationEmailInvalid.on('click', 
         function() { 
            clearInterval(cancelT);
         });
         app.preloader.show();
         setTimeout(function() {app.preloader.hide();}, 3000);
    } else if (beerNameArray[0] == 'Untitled'){
        app.dialog.prompt('Enter new beer name or leave blank for "Untitled".','Enter Beer Name?', function(newBeerName) { 
        var validBeerName = newBeerName.replace('/', '-');
        localStorage.setItem('beerName-' + color, validBeerName);
        showBeerName(color);
        postToCloudURLs(color, email);
        //comments starts device log
        logToDevice(color, 'start new local log');
        app.preloader.show();
        setTimeout(function() {app.preloader.hide();}, 3000);
    });
    } else {
        postToCloudURLs(color, email);
        logToDevice(color, 'start new local log');
        app.preloader.show();
        setTimeout(function() {app.preloader.hide();}, 3000);
    }
}

function logOnce(button) {
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    app.dialog.prompt('Enter comment below and tap "OK"','Add Comment', function (comment) {
        postToCloudURLs(color, comment);
        logToDevice(color, comment);
    }, function(){
        //cancelled
    })
}

function endLog(button) {
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    var currentBeerNameArray = currentBeerName.split(',');
    var notificationLogEnded = app.notification.create({
        icon: '<i class="f7-icons">info</i>',
        title: 'Success Ending Log',
        titleRightText: 'alert',
        subtitle: 'Logging completed for ' + currentBeerNameArray[0] + ' (' + color + ' TILT)',
        text: 'Tap to Undo',
        closeTimeout: 5000,
        closeOnClick: true,
      });
    notificationLogEnded.open();
    //end log unless user cancels within 5 seconds
    var cancelE = setTimeout(function() { 
            localStorage.setItem('beerName-' + color, 'Untitled');
            showBeerName(color);
            postToCloudURLs(color, "End of log");
            localStorage.setItem('localJSONfileName-' + color, 'not logging');
            localStorage.setItem('localCSVfileName-' + color, 'not logging');
            $$('#deviceStatus' + color).html('');
            $$('#beername-' + color).val('');
            $$('#cloudStatus' + color).html('');
            }, 5000);
            notificationLogEnded.on('click', 
            function() { 
               clearTimeout(cancelE);
            });
}

function writeToFile(fileName, data, isAppend, fileType, color) {
    var errorHandler = function (fileName, e) {  
        var msg = '';
    
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'Storage quota exceeded';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'File not found';
                break;
            case FileError.SECURITY_ERR:
                msg = 'Security error';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'Invalid modification';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'Invalid state';
                break;
            default:
                msg = 'Unknown error';
                break;
        };
    
        console.log('Error (' + fileName + '): ' + msg);
    }
    if (fileType == 'json'){
        data = JSON.stringify(data, null, '\t');
    }
    //var pathToFile = cordova.file.dataDirectory + fileName;
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (directoryEntry) {
            directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function (e) {
                        // for real-world usage, you might consider passing a success callback
                        //console.log('Write of file "' + fileName + '" completed.');
                        if (fileType == 'csv'){
                        localStorage.setItem('localCSVfileName-' + color, fileName);
                        }else{
                        localStorage.setItem('localJSONfileName-' + color, fileName);
                        }
                    };

                    fileWriter.onerror = function (e) {
                        // you could hook this up with our global error handler, or pass in an error callback
                        console.log('Write failed: ' + e.toString());
                    };
                    // If we are appending data to file, go to the end of the file.
                    if (isAppend) {
                    try {
                    fileWriter.seek(fileWriter.length);
                      }
                    catch (e) {
                    console.log("file doesn't exist!");
                          }
                      }
                    if (fileType == 'csv'){
                    var blob = new Blob([data + '\n'], { type: 'text/plain' });
                }else{
                    var blob = new Blob([data], { type: 'text/plain' });
                }
                    fileWriter.write(blob);
                }, errorHandler.bind(null, fileName));
            }, errorHandler.bind(null, fileName));
        }, errorHandler.bind(null, fileName));
    }

function readFromFile(fileName, cb, fileType) {
        var errorHandler = function (fileName, e) {  
            var msg = '';
        
            switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'Storage quota exceeded';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'File not found';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'Security error';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'Invalid modification';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'Invalid state';
                    break;
                default:
                    msg = 'Unknown error';
                    break;
            };
        
            console.log('Error (' + fileName + '): ' + msg);
        }
        var pathToFile = cordova.file.dataDirectory + fileName;
        //console.log(pathToFile);
        window.resolveLocalFileSystemURL(pathToFile, function (fileEntry) {
            fileEntry.file(function (file) {
                var reader = new FileReader();

                reader.onloadend = function (e) {
                    if (fileType == 'json'){
                        cb(JSON.stringify(this.result));
                    }else{
                    cb(this.result);
                    }
                };

                reader.readAsText(file);
            }, errorHandler.bind(null, fileName));
        }, errorHandler.bind(null, fileName));
    }

function logToDevice(color, comment){
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    var deviceLoggingEnabled = localStorage.getItem('deviceLoggingEnabled-' + color)||'0';
    var inRangeBeacons = localStorage.getItem('inrangebeacons')||'NONE';
    var inRangeBeaconsArray = inRangeBeacons.split(',');
    var indexOfColor = inRangeBeaconsArray.indexOf(color);
    var isAppend = true;
    //check if currently logging, default is 'not logging'
    CSVfileName = localStorage.getItem('localCSVfileName-' + color)||'not logging';
    JSONfileName = localStorage.getItem('localJSONfileName-' + color)||'not logging';
    if (deviceLoggingEnabled == '1' && indexOfColor > -1){//device logging is enabled and tilt is in range
    //process request based on contents of comment
    if (comment == 'start new local log' && CSVfileName != 'not logging' && JSONfileName != 'not logging'){
        isAppend = true;
        comment = '';
    }
    else if (comment == 'start new local log'){
    isAppend = false;
    comment = '';
    }
    else if (comment == 'device logging toggled' && CSVfileName != 'not logging' && JSONfileName != 'not logging'){
        comment = '';
    }
    else if (comment == 'device logging toggled' || CSVfileName == 'not logging' || JSONfileName == 'not logging'){
        var notificationReadyStart = app.notification.create({
            icon: '<i class="f7-icons">info</i>',
            title: 'Ready to Start New Log',
            titleRightText: 'alert',
            subtitle: 'TILT | ' + color + ' device logging enabled',
            text: 'Tap "Start New Log" in settings menu to start logging.',
            closeTimeout: 5000,
          });
        notificationReadyStart.open();
        comment = '';
        return;//return undefined if toggling on and user needs to start new log
    }
    //append to file if user trys to start new log without ending log first
    else if (comment == 'start new local log' && CSVfileName != 'not logging' && JSONfileName != 'not logging'){
            isAppend = true;
            comment = '';
        }
    else if (comment == 'start new local log'){
        isAppend = false;
        comment = '';
    }
    else if (comment === undefined){
        comment = '';
   }
    var beacon = JSON.parse(localStorage.getItem('tiltObject-' + color));
    var timeStamp = new Date(beacon.timeStamp);
    var localTime = timeStamp.toLocaleDateString() + ' ' + timeStamp.toLocaleTimeString();
    var tzOffsetDays = timeStamp.getTimezoneOffset() / 60 / 24;
    var localTimeExcel = timeStamp.valueOf() / 1000 / 60 / 60 / 24 + 25569 - tzOffsetDays;
    //beer name only
    currentBeerName = currentBeerName.split(',')[0];
    var fileNameAppend = timeStamp.getFullYear() + '-' + (timeStamp.getMonth() + 1) + '-' + timeStamp.getDate();
    var defaultfileName = currentBeerName + ' (' + color + ' TILT) ' + fileNameAppend;
    if (isAppend){
        var notificationAppendedLog = app.notification.create({
            icon: '<i class="f7-icons">check</i>',
            title: 'Success Logging to Device',
            titleRightText: 'alert',
            subtitle: currentBeerName + ' (' + color + ' TILT)',
            text: 'Logged to CSV file: ' + CSVfileName,
            closeTimeout: 5000,
          });
    notificationAppendedLog.open();
    writeToFile(CSVfileName, localTime + ',' + localTimeExcel + ',' + beacon.SG + ',' + beacon.Temp + ',' + beacon.Color + ',' + currentBeerName + ',' + comment, isAppend,'csv', color);
    writeToFile(JSONfileName, { Timestamp : localTime, Timepoint : localTimeExcel, SG : beacon.SG, Temp : beacon.Temp, Color : beacon.Color, Beer : currentBeerName, Comment : comment }, isAppend,'json', color);
    $$('#deviceStatus' + color).html('<a class="link">| share&nbsp;<i class="f7-icons size-15">share</i></a>');
    var deviceStatusElement = document.getElementById('deviceStatus' + color);
    deviceStatusElement.addEventListener('click', function(e) {
        emailCurrentCSV(color);
      });
    //isAppend false, will create a new file
    }else {
        CSVfileName = defaultfileName + '.csv';
        JSONfileName = defaultfileName + '.json';
        var notificationNewLog = app.notification.create({
            icon: '<i class="f7-icons">check</i>',
            title: 'New Device Log Started',
            titleRightText: 'alert',
            subtitle: currentBeerName + ' (' + color + ' TILT)',
            text: 'Logged to CSV file: ' + CSVfileName,
            closeTimeout: 5000,
          });
    notificationNewLog.open();
    //set CSV filename
    localStorage.setItem('localCSVfileName-' + color, CSVfileName);
    NativeStorage.setItem('localCSVfileName-' + color, CSVfileName, function (result) { }, function (e) { });
    //add to list of CSV files
    var listOfCSVFiles = localStorage.getItem('listOfCSVFiles')||'';
    var listOfCSVFilesArray = listOfCSVFiles.split(',');
    if (listOfCSVFilesArray.indexOf(CSVfileName) < 0){
    listOfCSVFilesArray.unshift(CSVfileName);
        //remove blank filename
        if (listOfCSVFiles == ''){
            listOfCSVFilesArray.pop();
        }
    localStorage.setItem('listOfCSVFiles',listOfCSVFilesArray);
    NativeStorage.setItem('listOfCSVFiles', listOfCSVFilesArray, function (result) { }, function (e) { });
    }
    //update file list
    var displayhtml = compiledfilelistTemplate(listOfCSVFilesArray);
    $$('#fileList').html(displayhtml);
    //set JSON file name
    localStorage.setItem('localJSONfileName-' + color, JSONfileName);
    NativeStorage.setItem('localJSONfileName-' + color, JSONfileName, function (result) { }, function (e) { });
    //add to list of JSON files
    var listOfJSONFiles = localStorage.getItem('listOfJSONFiles')||'';
    var listOfJSONFilesArray = listOfJSONFiles.split(',');
    //check if filename already exists in list
    if (listOfJSONFilesArray.indexOf(JSONfileName) < 0){
        listOfJSONFilesArray.unshift(JSONfileName);
        //remove blank filename
        if (listOfJSONFiles == ''){
            listOfJSONFilesArray.pop();
        }
        localStorage.setItem('listOfJSONFiles', listOfJSONFilesArray);
        NativeStorage.setItem('listOfJSONFiles', listOfJSONFilesArray, function (result) { }, function (e) { });
    }
    writeToFile(CSVfileName, 'Timestamp,Timepoint,SG,Temp,Color,Beer,Comment', isAppend,'csv', color);
    writeToFile(JSONfileName, { Timestamp : localTime, Timepoint : localTimeExcel, SG : beacon.SG, Temp : beacon.Temp, Color : beacon.Color, Beer : currentBeerName, Comment : comment }, isAppend,'json', color);
    $$('#deviceStatus' + color).html('<a class="link">| share&nbsp;<i class="f7-icons size-15">share</i></a>');
    var deviceStatusElement = document.getElementById('deviceStatus' + color);
    deviceStatusElement.addEventListener('click', function(e) {
        emailCurrentCSV(color);
      });
    }
    //setTimeout(function(){ readFromFile(JSONfileName, function (data) {
        //var fileData = JSON.parse(data);
        //console.log(fileData);
      //  console.log(JSONfileName);
    //},'json');},
    //1000);
 }
}

function emailCurrentCSV(color){
    var filePathAndName = cordova.file.dataDirectory + localStorage.getItem('localCSVfileName-' + color);
    //fix for android
    if (device.platform == 'Android' || device.platform == 'amazon-fireos'){
        filePathAndName = 'app://files/' + localStorage.getItem('localCSVfileName-' + color);
    }
    var email = localStorage.getItem('emailAddress-' + color)||'';
    var currentBeerName = localStorage.getItem('beerName-' + color);
    var currentBeerNameArray = currentBeerName.split(',');
    var beacon = JSON.parse(localStorage.getItem('tiltObject-' + color));
    cordova.plugins.email.open({
        to: email,
        subject: 'Tilt Hydrometer Log for ' + currentBeerNameArray[0] + ' (' + color + ' TILT)',
        body: '<p>Attached CSV file can be viewed in Excel, Google Sheets, and directly in web browsers.</p><h2>Last Reading</h2><h3>Gravity: ' + String(beacon.caldisplayFerm) + beacon.displayFermunits + '</h3><h3> Temperature: ' + String(beacon.uncaldisplayTemp) + beacon.displayTempunits + '</h3><h3>' + beacon.displaytimeStamp + '</h3><p>You may also view the data directly in the cloud if cloud logging was enabled: <a href="' + localStorage.getItem('docLongURL-' + color) + '">' + localStorage.getItem('docLongURL-' + color) + '</a> Or use our Google Sheets template to <a href="https://docs.google.com/spreadsheets/d/1owuNOn25IHQ1Ck8pBgAEGkOifIBA7YhVc5JpE9Tlb1c/edit?usp=sharing">import your CSV data into a pre-formatted spreadsheet.</a> Works with laptop/desktop version of Google Sheets.</p>',
        isHtml: true,
        attachments : filePathAndName });
}

function emailClickedCSV(fileName, color){
    var filePathAndName = cordova.file.dataDirectory + fileName;
    //fix for android
    if (device.platform == 'Android' || device.platform == 'amazon-fireos'){
        filePathAndName = 'app://files/' + fileName;
        }
    var email = localStorage.getItem('emailAddress-' + color)||'';
    cordova.plugins.email.open({
        to: email,
        subject: fileName,
        body: '<p>Attached CSV file can be viewed in Excel, Google Sheets, and directly in web browsers. Or use our Google Sheets template to <a href="https://docs.google.com/spreadsheets/d/1owuNOn25IHQ1Ck8pBgAEGkOifIBA7YhVc5JpE9Tlb1c/edit?usp=sharing">import your CSV data into a pre-formatted spreadsheet.</a> Works with laptop/desktop version of Google Sheets.</p>',
        isHtml: true,
        attachments : filePathAndName });
}

function onResume() {
    //resume scanning, needed for Android 8+ devices
    if ((device.platform == "Android") && (Number(device.version[0]) > 7)) {
        startScan();
        updateInterval = setInterval(function(){ updateBeacons(); }, 1000);
    }
    //toggleBluetooth();
    scanningToast = app.toast.create({text: 'Scanning for nearby Tilts...<br>Ensure Bluetooth and Location Services are enabled and Tilt is floating.', icon: '<i class="material-icons">bluetooth_searching</i>', position: 'bottom', }).open();
    //set resumed flag to trigger logging as soon as tilts are in range
    resumed = true;
}

function onPause() {
    //Android 8+ doesn't allow scanning to continue in background
    if ((device.platform == "Android") && (Number(device.version[0]) > 7)) {
        stopScan();
        clearInterval(updateInterval);
    }
}

function watchBluetooth() {//function run every 30 seconds on Android and Fire devices
    var inRangeBeaconsArray = localStorage.getItem('inrangebeacons').split(',');
    if (inRangeBeaconsArray.length == 1){//no tilts in range
            toggleBluetooth();
    }
}

function logNow(){
    var foundBeacons = localStorage.getItem('foundbeacons')||'NONE';
    var foundBeaconsArray = foundBeacons.split(',');
    //console.log('resumed' + foundBeaconsArray[i]);
    for (var i = 1; i < foundBeaconsArray.length; i++) {
        //console.log(foundBeaconsArray[i]);
    logToDevice(foundBeaconsArray[i]);
    postToCloudURLs(foundBeaconsArray[i]);
    }
}

function restoreLoggingSettings(color){
    NativeStorage.getItem('cloudurls-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('cloudurls-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('cloudurlsenabled-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('cloudurlsenabled-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('emailAddress-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('emailAddress-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('cloudInterval-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('cloudInterval-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('deviceLoggingEnabled-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('deviceLoggingEnabled-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('localCSVfileName-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('localCSVfileName-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('localJSONfileName-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('localJSONfileName-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('listOfCSVFiles', function (result) { 
        if(result !== undefined){
        localStorage.setItem('listOfCSVFiles', result);
        }
     }, function (e) { });
    NativeStorage.getItem('listOfJSONFiles', function (result) { 
        if(result !== undefined){
        localStorage.setItem('listOfJSONFiles', result);
        }
     }, function (e) { });
}

function restorePreferredUnits(color){
    NativeStorage.getItem('displayTempunits-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('displayTempunits-' + color, result);
        }
     }, function (e) { });
    NativeStorage.getItem('displayFermunits-' + color, function (result) { 
        if(result !== undefined){
        localStorage.setItem('displayFermunits-' + color, result);
        }
     }, function (e) { });
}

function restoreCalibrationPoints(color){
            NativeStorage.getItem('uncalSGpoints-' + color, function (result) { 
                if(result !== undefined){
                localStorage.setItem('uncalSGpoints-' + color, result);
                }
             }, function (e) { });
            NativeStorage.getItem('actualSGpoints-' + color, function (result) { 
                if(result !== undefined){
                localStorage.setItem('actualSGpoints-' + color, result);
                }
             }, function (e) { });
}