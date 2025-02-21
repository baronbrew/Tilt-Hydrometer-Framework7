// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.baronbrew.tilthydrometer', // App bundle ID
  name: 'Tilt Hydrometer', // App name
  theme: 'auto', // Automatic theme detection
  statusbar: {
      overlay: false,
      iosOverlaysWebView: false,
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
      tiltColors : ['RED', 'GREEN', 'BLACK', 'PURPLE', 'ORANGE', 'BLUE', 'YELLOW', 'PINK'],
      appVersion : '1.0.93'
    };
  },
  dialog: {
    // set default title for all dialog shortcuts
    usernamePlaceholder: 'Wifi Name',
    passwordPlaceholder: 'Wifi Password',
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

var tempcallistTemplate = $$('#tempcallisttemplate').html();
var compiledtempcallistTemplate = Template7.compile(tempcallistTemplate);

var settingsTemplate = $$('#settingstemplate').html();
var compiledsettingsTemplate = Template7.compile(settingsTemplate);

var picoTemplate = $$('#picotemplate').html();
var compiledpicoTemplate = Template7.compile(picoTemplate);


//Permissions
var permissions;

//Interval Timers
var watchBluetoothInterval;

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
  console.log("Device is ready!");
  document.addEventListener("resume", onResume, false);
  document.addEventListener("pause", onPause, false);
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
          console.log(device);
          setTimeout(function() { navigator.splashscreen.hide(); }, 100);
          if (device.platform == 'Android' || device.platform == 'amazon-fireos'){
          watchBluetoothInterval = setInterval(function(){ watchBluetooth(); }, 30000);//check if tilts are connected every 30 seconds, toggle bluetooth if not
          permissions = cordova.plugins.permissions;
          permissions.checkPermission(permissions.BLUETOOTH_SCAN, checkBluetoothPermissionCallback, null);
          permissions.checkPermission(permissions.BLUETOOTH_ADVERTISE, checkBluetoothAdvertisePermissionCallback, null);
          permissions.checkPermission(permissions.ACCESS_FINE_LOCATION, checkFineLocationPermissionCallback, null);
          //permissions.checkPermission(permissions.ACCESS_COARSE_LOCATION, checkCoarseLocationPermissionCallback, null);
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
      { uuid: 'A495BB80-C5B1-4B44-B512-1370F02D74DE' },
      { uuid: 'A495BC02-C5B1-4B44-B512-1370F02D74DE' }//Tilt Pico IP address Beacon

  ];

  // Dictionary of Tilts.
  var beacons = {};
  // Array of Tilt Picos.
  var tiltPicos = { tiltPico : [] };
  //SSID and password for Pico
  var picoSSID = '';
  var picoPassword = '';
  var picoFabVisible = false;

  function checkBluetoothPermissionCallback(status) {
      if (!status.hasPermission) {
          var errorCallback = function () {
              console.warn('BLUETOOTH_SCAN and/or BLUETOOTH_ADVERTISE permission is not turned on');
          }

          permissions.requestPermission(
              permissions.BLUETOOTH_SCAN,
              function (status) {
                  if (!status.hasPermission) errorCallback();
              },
              errorCallback);
      }
  }

  function checkBluetoothAdvertisePermissionCallback(status) {
    if (!status.hasPermission) {
        var errorCallback = function () {
            console.warn('BLUETOOTH_ADVERTISE permission is not turned on');
        }

        permissions.requestPermission(
            permissions.BLUETOOTH_ADVERTISE,
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

function checkFineLocationPermissionCallback(status) {
    if (!status.hasPermission) {
        var errorCallback = function () {
            console.warn('ACCESS_FINE_LOCATION permission is not turned on');
        }

        permissions.requestPermission(
            permissions.ACCESS_FINE_LOCATION,
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
      if ((device.platform == "Android") && (device.version == "4") || device.platform == 'iOS') {
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
      case -90:
        app.statusbar.hide();
        $$('.card').css('max-width','45%');
        $$('.card').css('font-size','80%');
        $$('.navbar').css('display','none');
        break;
      case 90:
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
      scanningToast = app.toast.create({text: '<i class="material-icons">bluetooth_searching</i> Scanning for nearby TILT hydrometers.<br>Ensure Bluetooth and Location Services are enabled and TILT is floating.', position: 'bottom', closeButton: true, closeButtonText: 'close', closeButtonColor: 'red',}).open();
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
    console.log('toggle units ' + color);
    var displaytempunits = localStorage.getItem('displayTempunits-' + color)||"°F";
    var displayfermunits = localStorage.getItem('displayFermunits-' + color)||"";
    switch (displaytempunits + displayfermunits) {
     case ("°F"):
        localStorage.setItem('displayTempunits-' + color,"°C");
        NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
        //update radio buttons
        $$("input[name=gravityRadio-" + color + "][value='SG']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
        break;
     case ("°C"):
        localStorage.setItem('displayTempunits-' + color,"°C");
        NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
        break;
     case ("°C°P"):
        localStorage.setItem('displayTempunits-' + color,"°F");
        NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°F']").prop("checked",true);
        break;
     case ("°F°P"):
        localStorage.setItem('displayTempunits-' + color,"°F");
        NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='SG']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°F']").prop("checked",true);
        break;
    }
    updateSGcallist(color);
  }

  function getUnitsFromSettings(color) {
  var displayFermUnits = $$(("input[type='radio'][name='gravityRadio-" + color + "']:checked")).val();
  if (displayFermUnits == 'SG'){//remove pseudo-units
      displayFermUnits = '';
  }
  //console.log(displayFermUnits);
  localStorage.setItem('displayFermunits-' + color, displayFermUnits);
  NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
  var displayTempUnits = $$(("input[type='radio'][name='temperatureRadio-" + color + "']:checked")).val();
  localStorage.setItem('displayTempunits-' + color, displayTempUnits);
  NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
  updateSGcallist(color);
  updateTempcallist(color);
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
    //set displayed time stamp
    var date = new Date(beacon.timeStamp);
    beacon.displaytimeStamp = date.toLocaleString();
    //update list of in range beacons
    var inRangeBeacons = localStorage.getItem('inrangebeacons')||'NONE';
    var inRangeBeaconsArray = inRangeBeacons.split(',');
    var indexOfColor = inRangeBeaconsArray.indexOf(beacon.Color);
        if (indexOfColor < 0){//check if new Tilt color in range
        inRangeBeaconsArray.push(beacon.Color);
        localStorage.setItem('inrangebeacons',inRangeBeaconsArray);
        }else{ //if no new Tilt color in range, check interval to log to cloud or device
        var cloudInterval = localStorage.getItem('cloudInterval-' + beacon.Color)||15;
        var lastCloudLogged = Number(localStorage.getItem('loggingTimer-' + beacon.Color))||Date.now() - (30 * 60 * 1000);
        beacon.loggingTimer = (Date.now() - lastCloudLogged) / 1000 / 60;//min since last logged
        if (Number(cloudInterval) <= beacon.loggingTimer){
        setTimeout(function(){ 
            postToCloudURLs(beacon.Color);
            logToDevice(beacon.Color);
        },4000);
        localStorage.setItem('loggingTimer-' + beacon.Color, Date.now());//reset timer
    };
        }
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
}

  function initScan() {
      // The delegate object holds the iBeacon callback functions
      // specified below.
      delegate = new locationManager.Delegate();
      console.log('initScan');
      // Called continuously when ranging beacons.
      delegate.didRangeBeaconsInRegion = function (pluginResult) {
          if (pluginResult.beacons.length > 0) {
            //console.log(pluginResult.beacons);
              for (var i in pluginResult.beacons) {
                  // Insert beacon into table of found beacons.
                  var beacon = pluginResult.beacons[i];
                  //process Tilt Pico Beacon
                  if (picoFabVisible){
                    toggleVisibility('picoFAB', 'block');
                  }else{
                    toggleVisibility('picoFAB', 'none');
                  }
                  if (beacon.uuid == 'a495bc02-c5b1-4b44-b512-1370f02d74de' && beacon.rssi > -60 && beacon.major == 999 && beacon.minor == 999){
                    scanningToast.close();
                    if (!picoFabVisible){
                        picoFabVisible = true;
                        toggleVisibility('picoFAB', 'block');
                    }
                    break
                }
                  else if (beacon.uuid == 'a495bc02-c5b1-4b44-b512-1370f02d74de' && beacon.major == 999 && beacon.minor == 998){
                        scanningToast.close();
                        console.log('Could not connect to NTP server.')
                        if (!picoFabVisible){
                            picoFabVisible = true;
                            toggleVisibility('picoFAB', 'block');
                        }
                        if (picoSSID != 'SSID_password_incorrect_ntp'){
                            app.dialog.alert('Failed to connect to Internet time servers (NTP). Check WiFi password.');
                            picoSSID = 'SSID_password_incorrect_ntp';
                        }
                        break
                    }
                  else if (beacon.uuid == 'a495bc02-c5b1-4b44-b512-1370f02d74de' && beacon.major == 999 && beacon.minor == 997){
                        scanningToast.close();
                        console.log('Wifi connection failed.')
                        if (!picoFabVisible){
                            toggleVisibility('picoFAB', 'block');
                        }
                        if (picoSSID != 'SSID_password_incorrect_wifi'){
                            app.dialog.alert('Failed to connect to WiFi. Check WiFi Name and password.');
                            picoSSID = 'SSID_password_incorrect_wifi';
                        }
                        break
                    }
                  else if (beacon.uuid == 'a495bc02-c5b1-4b44-b512-1370f02d74de'){
                    var LANprefix = uint16ToIp(beacon.major, beacon.minor).split('.',1);
                    if (LANprefix[0] == '192' || LANprefix[0] == '172' || LANprefix[0] == '10'){
                         picoFabVisible = false;
                         var tiltPicoIPAddr = uint16ToIp(beacon.major, beacon.minor);
                         if (tiltPicos.tiltPico.findIndex(tiltPico => tiltPico.ip_address == tiltPicoIPAddr) == -1){
                          app.dialog.alert('IP Address: ' + tiltPicoIPAddr, "Tilt Pico Connected to WiFi")
                          tiltPicos.tiltPico.unshift({ 'ip_address': tiltPicoIPAddr });
                          updatePicoList();
                          picoFabVisible = false;
                          //getPicoData(tiltPicoIPAddr);
                          //console.log(tiltPicos);
                          break
                         }
                         }
                    break
                  }
                  //add timestamp
                  beacon.timeStamp = Date.now();
                  //assign color by UUID and Minor Range. FW 1005, 1006, 1007 is HD
                  if (beacon.minor > 5000 || beacon.minor == 1005 && beacon.major == 999 || beacon.minor == 1006 && beacon.major == 999 || beacon.minor == 1007 && beacon.major == 999){
                      beacon.hd = true;
                  }else{
                      beacon.hd = false;
                  }
                switch (beacon.uuid[6] + "-" + beacon.hd) {
                    case "1-false" : beacon.Color = "RED";
                    break;
                    case "1-true" : beacon.Color = "RED•HD";
                    break;
                    case "2-false" : beacon.Color = "GREEN";
                    break;
                    case "2-true" : beacon.Color = "GREEN•HD";
                    break;
                    case "3-false" : beacon.Color = "BLACK";
                    break;
                    case "3-true" : beacon.Color = "BLACK•HD";
                    break;
                    case "4-false" : beacon.Color = "PURPLE";
                    break;
                    case "4-true" : beacon.Color = "PURPLE•HD";
                    break;
                    case "5-false" : beacon.Color = "ORANGE";
                    break;
                    case "5-true" : beacon.Color = "ORANGE•HD";
                    break;
                    case "6-false" : beacon.Color = "BLUE";
                    break;
                    case "6-true" : beacon.Color = "BLUE•HD";
                    break;
                    case "7-false" : beacon.Color = "YELLOW";
                    break;
                    case "7-true" : beacon.Color = "YELLOW•HD";
                    break;
                    case "8-false" : beacon.Color = "PINK";
                    break;
                    case "8-true" : beacon.Color = "PINK•HD";
                    break;
             }
                  //setup HD tilt
                if (beacon.hd){
                    beacon.uncalTemp = beacon.major / 10;
                    localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                    beacon.uncalSG = (beacon.minor / 10000).toFixed(4);
                    localStorage.setItem('uncalSG-' + beacon.Color, beacon.uncalSG);
                    localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                    beacon.tempDecimals = 1;
                    beacon.sgDecimals = 4;
                } else {
                //setup SD tilt
                  beacon.uncalTemp = beacon.major;
                  localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                  beacon.uncalSG = (beacon.minor / 1000).toFixed(3);
                  localStorage.setItem('uncalSG-' + beacon.Color, beacon.uncalSG);
                  localStorage.setItem('uncalTemp-' + beacon.Color, beacon.uncalTemp);
                  beacon.tempDecimals = 0;
                  beacon.sgDecimals = 3;
                }
                  addtoScan(beacon);
                  updateBeacons();
                  //set key by UUID
                  var key = beacon.Color;
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
    
    //set blutooth toggled state
    bluetoothToggled = false;

    function updateBeacons() {
    for (var key in beacons) {
    var beacon = beacons[key];
    var currentTime = Date.now();
    //add display value and units
    beacon.displayTempunits = localStorage.getItem('displayTempunits-' + beacon.Color)||"°F";
    switch (beacon.displayTempunits){
        case "°F" : 
        beacon.uncaldisplayTemp = beacon.uncalTemp;
        beacon.caldisplayTemp = (getCalTemp(beacon.Color)).toFixed(beacon.tempDecimals);
        break;
        case "°C"  : beacon.uncaldisplayTemp = ((beacon.uncalTemp - 32) * 5 / 9).toFixed(1);
        beacon.caldisplayTemp = ((getCalTemp(beacon.Color) - 32) * 5 / 9).toFixed(1);
        break;
    }
    beacon.displayFermunits = localStorage.getItem('displayFermunits-' + beacon.Color)||"";
    switch (beacon.displayFermunits) {
        case "" : 
        beacon.uncaldisplayFerm = beacon.uncalSG;
        beacon.caldisplayFerm = (getCalFerm(beacon.Color)).toFixed(beacon.sgDecimals);
        break;
        default : 
        beacon.uncaldisplayFerm = convertSGtoPreferredUnits(beacon.Color, beacon.uncalSG);
        beacon.caldisplayFerm = convertSGtoPreferredUnits(beacon.Color, getCalFerm(beacon.Color));
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
        //populate logging links
        var docLongURL = localStorage.getItem('docLongURL-' + foundBeaconsArray[i]);
        if (docLongURL !== null){
        $$('#cloudStatus' + foundBeaconsArray[i]).html('<a class="link external" href="' + docLongURL + '" target="_system">&nbsp;<i class="material-icons size-15">cloud</i><span id="lastCloudLogged' + foundBeaconsArray[i] +'"></span></a>');
        }
        const now = new Date();
        const offsetSeconds = now.getTimezoneOffset() * 60; // Returns offset in seconds
        //if Tilt Pico connected, add sync button to card
        $$('#tiltpicosync-' + foundBeaconsArray[i]).html('<a id="tiltpicosync-' + foundBeaconsArray[i] + '"' + 'class="link">|&nbsp;SYNC&nbsp;TILT&nbsp;PICO</a>');
        document.getElementById('tiltpicosync-' + foundBeaconsArray[i]).addEventListener('click', function(e) {
            var colorClicked =  e.target.id.split('-')[1];
            var cloudsEnabled = localStorage.getItem('cloudurlsenabled-' + colorClicked)||'1,0,0';
            var cloudURLs = localStorage.getItem('cloudurls-' + colorClicked)||app.data.defaultCloudURL;
            var cloudURLsArr = cloudURLs.split(',');
            for (let i = 0; i < cloudsEnabled.split(',').length; i++){
                if (cloudsEnabled[i] == 0){
                    cloudURLsArr[i] = ''
                }
            }
            cloudURLs = cloudURLsArr.join(',');
            console.log(cloudURLs);
            var cloudInterval = localStorage.getItem('cloudInterval-' + colorClicked)||'15';
            getPicoData(tiltPicos.tiltPico[0].ip_address + 
             '/sync?beername=' + beacons[colorClicked].Beername +
             '&color=' + colorClicked.replace('•','-') + 
             '&tilttempcal=' + localStorage.getItem('uncalTemppoints-' + colorClicked) +
             '&actualtempcal=' + localStorage.getItem('actualTemppoints-' + colorClicked) +
             '&tiltSGcal=' + localStorage.getItem('uncalSGpoints-' + colorClicked) +
             '&actualSGcal=' + localStorage.getItem('actualSGpoints-' + colorClicked) +
             '&cloudurls=' +  cloudURLs +
             '&cloudinterval=' + cloudInterval + 
             '&timezoneoffsetsec=' + offsetSeconds);
      });
        //populate calibration point list
        updateSGcallist(foundBeaconsArray[i]);
        updateTempcallist(foundBeaconsArray[i]);
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
          //set up saved unit preferences
        var displayFermunits = localStorage.getItem('displayFermunits-' + foundBeaconsArray[i])||'SG';
        var displayTempunits = localStorage.getItem('displayTempunits-' + foundBeaconsArray[i])||'°F';
        $$("input[name=gravityRadio-" + foundBeaconsArray[i] + "][value='" + displayFermunits + "']").prop("checked",true);
        $$("input[name=temperatureRadio-" + foundBeaconsArray[i] + "][value='" + displayTempunits + "']").prop("checked",true);
        $$('#calprompt-' + foundBeaconsArray[i]).on('click', function (e) {
            var calcolor = e.currentTarget.id.split("-");
            //console.log('clicked ' + calcolor[1]);
            app.dialog.prompt('Enter actual gravity or tap "Cancel" to calibrate temperature:', 'Calibrate TILT | ' + calcolor[1], function (actual) {
             var actualSGpoints = localStorage.getItem('actualSGpoints-' + calcolor[1])||'-0.001,1.0000,10.000';
             var actualSGpointsArray = actualSGpoints.split(',');
             var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + calcolor[1])||'-0.001,1.0000,10.000';
             var uncalSGpointsArray = uncalSGpoints.split(',');
             var actualSGpoint = String(Number(actual).toFixed(4));
             var uncalSGpoint = localStorage.getItem('uncalSG-' + calcolor[1]);
             //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
             var calSGindex = actualSGpointsArray.indexOf(actualSGpoint);
             console.log(actualSGpointsArray + ", " + actualSGpoint);
             var uncalSGindex = uncalSGpointsArray.indexOf(uncalSGpoint);
             if (Number(actual) > 0.500 && Number(actual) < 2.000){
              if (calSGindex < 0 && uncalSGindex < 0){
                 actualSGpointsArray.push(actualSGpoint);
                 actualSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 uncalSGpointsArray.push(uncalSGpoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalSGpoint + ' (pre-cal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
              } else if (calSGindex > 0 && uncalSGindex < 0){
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 uncalSGpointsArray.splice(calSGindex, 1, uncalSGpoint);
                 uncalSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalSGpoint + ' (pre-cal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
             }
                else if (calSGindex < 0 && uncalSGindex > 0){
                 localStorage.setItem('uncalSGpoints-' + calcolor[1], uncalSGpointsArray);
                 actualSGpointsArray.splice(uncalSGindex, 1, actualSGpoint);
                 actualSGpointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualSGpoints-' + calcolor[1], actualSGpointsArray);
                 app.toast.create({text: 'Success calibrating ' + actualSGpoint + ' (actual) to ' + uncalSGpoint + ' (pre-cal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
                }
            }else{
                app.dialog.alert('The calibration point ' + actual + ' is out of range or not a number. Please try again.', 'Calibration Error');
            }
            //update list of calibration points in settings
            updateSGcallist(calcolor[1]);
            }, function () {
                app.dialog.prompt('Enter actual temperature:', 'Calibrate '+ calcolor[1], function (actualTemp){
               var actualTemppoints = localStorage.getItem('actualTemppoints-' + calcolor[1])||'-100000,100000';
               var actualTemppointsArray = actualTemppoints.split(',');
               var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + calcolor[1])||'-100000,100000';
               var uncalTemppointsArray = uncalTemppoints.split(',');
               var uncalTemppoint = localStorage.getItem('uncalTemp-' + calcolor[1]);
               if (localStorage.getItem('displayTempunits-' + calcolor[1]) == "°C") {
                    var actualTemppointToast = Number(actualTemp).toFixed(1);
                    var uncalTemppointToast = ((Number(uncalTemppoint) - 32 ) * 5 / 9).toFixed(1);
                    var actualTemppoint = ((Number(actualTemp) * 9 / 5) + 32).toFixed(1);
                    }else{//degrees F
                    var actualTemppointToast = Number(actualTemp).toFixed(1);
                    var uncalTemppointToast = Number(uncalTemppoint).toFixed(1);
                    var actualTemppoint = Number(actualTemp).toFixed(1);
                }
                var actualTempToast = actualTemp;
                //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
                var calTempindex = actualTemppointsArray.indexOf(actualTemppoint);
             if (Number(actualTemp) > -1 && Number(actualTemp) < 213){
              if (calTempindex < 0){//new calibration point was entered
                 actualTemppointsArray.push(actualTemppoint);
                 actualTemppointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('actualTemppoints-' + calcolor[1], actualTemppointsArray);
                 uncalTemppointsArray.push(uncalTemppoint);
                 uncalTemppointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalTemppoints-' + calcolor[1], uncalTemppointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalTemppointToast + ' (pre-cal.) to ' + actualTemppointToast + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
              } else{
                 localStorage.setItem('actualTemppoints-' + calcolor[1], actualTemppointsArray);
                 uncalTemppointsArray.splice(calTempindex, 1, uncalTemppoint);
                 uncalTemppointsArray.sort(function(a, b){return a-b;});
                 localStorage.setItem('uncalTemppoints-' + calcolor[1], uncalTemppointsArray);
                 app.toast.create({text: 'Success calibrating ' + uncalTemppointToast + ' (pre-cal.) to ' + actualTemppointToast + ' (actual)', icon: '<i class="material-icons">adjust</i>', position: 'center', closeTimeout: 4000}).open();
             }
            }else{
                app.dialog.alert('The calibration point "' + actualTempToast + '" is out of range or not a number. Please try again.', 'Calibration Error');
            }
            updateTempcallist(calcolor[1]);
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
        //$$('#accordion-' + beacon.Color).hide();
        var indexOfColor = inRangeBeaconsArray.indexOf(beacon.Color);
     if (indexOfColor > -1){
        inRangeBeaconsArray.splice(indexOfColor, 1);
        localStorage.setItem('inrangebeacons',inRangeBeaconsArray);
        }
    }

    //initialize display units
    //update data fields in Tilt card template
    $$('#beerName' + beacon.Color).html(beacon.Beername.split(',')[0]);
    $$('#lastCloudLogged' + beacon.Color).html(beacon.lastCloudLogged + ' min');
    $$('#uncalSG' + beacon.Color).html(beacon.uncalSG);
    $$('#uncaldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.uncaldisplayFerm) + beacon.displayFermunits);
    $$('#caldisplayFerm+displayFermunits' + beacon.Color).html(String(beacon.caldisplayFerm) + beacon.displayFermunits);
    $$('#uncalTemp' + beacon.Color).html(beacon.uncalTemp);
    $$('#uncaldisplayTemp+displayTempunits' + beacon.Color).html(String(beacon.uncaldisplayTemp) + beacon.displayTempunits);
    $$('#caldisplayTemp+displayTempunits' + beacon.Color).html(String(beacon.caldisplayTemp) + beacon.displayTempunits);
    $$('#numberSecondsAgo' + beacon.Color).html(beacon.numberSecondsAgo);
    $$('#displayRSSI' + beacon.Color).html(beacon.displayRSSI);
    $$('#displaytimeStamp' + beacon.Color).html(beacon.displaytimeStamp + ' v' + app.data.appVersion);
    $$('#percentScaleSG' + beacon.Color).css('width', String((beacon.uncalSG - 0.980) / (1.150 - 0.980) * 100) + "%");
    $$('#percentScaleTemp' + beacon.Color).css('width', String((beacon.uncalTemp - 0) / (185 - 0) * 100) + "%");
    //update Tilt objects
    localStorage.setItem('tiltObject-' + beacon.Color,JSON.stringify(beacon));
    };
}

function updateSGcallist(color) {
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.0000,10.000';
var uncalSGpointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.0000,10.000';
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

function updateTempcallist(color) {
    var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + color)||'-100000,100000';
    var uncalTemppointsArray = uncalTemppoints.split(',');
    var actualTemppoints = localStorage.getItem('actualTemppoints-' + color)||'-100000,100000';
    var actualTemppointsArray = actualTemppoints.split(',');
    var displayTempcallistArray = [];
    for (var i = 1; i < actualTemppointsArray.length - 1; i++){
        var actualdisplayTempcalpoint = convertTemptoPreferredUnits (color, Number(actualTemppointsArray[i]));
        var uncaldisplayTempcalpoint = convertTemptoPreferredUnits (color, Number(uncalTemppointsArray[i]));
        var points = JSON.parse('{ "color" : "' + color + '", "uncalpoint" : "' + uncaldisplayTempcalpoint + '", "actualpoint" : "' + actualdisplayTempcalpoint + '" }');
        displayTempcallistArray.push(points);
    };
    var displayTempcallistObject = {};
    displayTempcallistObject.Tempcalpoints = displayTempcallistArray;
    $$('#tempcallisttemplate-' + color).html(compiledtempcallistTemplate(displayTempcallistObject));
    //save updated calibration points to native storage
    NativeStorage.setItem('uncalTemppoints-' + color, uncalTemppoints, function (result) { }, function (e) { });
    NativeStorage.setItem('actualTemppoints-' + color, actualTemppoints, function (result) { }, function (e) { });
    };

function convertSGtoPreferredUnits (color, SG) {
var displayFermunits = localStorage.getItem('displayFermunits-' + color)||'';
    switch (displayFermunits){
        case '' : return ( SG * 1 ).toFixed(4);
        //0.005 added to prevent rounding to a negative 0 from sg of 1.000
        case '°P'  : return ( 0.005 - 616.868 + 1111.14 * SG - 630.272 * SG * SG + 135.997 * SG * SG * SG ).toFixed(1);
        case '°Bx'  : return ((((((182.4601 * SG) - 775.6821) * SG) + 1262.7794) * SG) - 669.5622).toFixed(1);
        case '%ABV'  : return convertSGtoABV(color, SG, false);
        case '%ABV*' : return convertSGtoABV(color, SG, true);
    }
}

function convertTemptoPreferredUnits (color, Temp) {
var displayTempunits = localStorage.getItem('displayTempunits-' + color)||'°F';
    switch (displayTempunits){
        case '°F' : return Temp.toFixed(1);
        break;
        case '°C'  : return ((Temp - 32) * 5 / 9).toFixed(1);
    }
}


function linearInterpolation (x, x0, y0, x1, y1) {
    var a = (y1 - y0) / (x1 - x0);
    var b = -a * x0 + y0;
    return a * x + b;
  }

function getCalFerm (color){
//get cal points from local storage
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.0000,10.000';
var unCalSGPointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.0000,10.000';
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
//get cal points from local storage
var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + color)||'-100000,100000';
var unCalTempPointsArray = uncalTemppoints.split(',');
var actualTemppoints = localStorage.getItem('actualTemppoints-' + color)||'-100000,100000';
var actualTempPointsArray= actualTemppoints.split(',');
//temporary array for finding correct x and y values
var unCalTempPointsTempArray = uncalTemppoints.split(',');
var Temp = localStorage.getItem('uncalTemp-' + color);
//add current value to calibration point list
unCalTempPointsTempArray.push(Temp);
//sort list lowest to highest
unCalTempPointsTempArray.sort(function(a, b){return a-b;});
var indexTemp = unCalTempPointsTempArray.indexOf(Temp);
var calTemp = linearInterpolation (Number(Temp), Number(unCalTempPointsArray[indexTemp-1]), Number(actualTempPointsArray[indexTemp-1]), Number(unCalTempPointsArray[indexTemp]), Number(actualTempPointsArray[indexTemp]));
return calTemp;
}

function deleteSGCalPoint (checkbox){
//get color and index of selected point to delete in format as follows (sgcalpoints-{{color}}-{{@index}})
var selectedPoint = checkbox.id.split('-');
var color = selectedPoint[1];
var index = Number(selectedPoint[2]) + 1;
console.log(index);
var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.0000,10.000';
var unCalSGPointsArray = uncalSGpoints.split(',');
var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.0000,10.000';
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
        var deleteduncalpointToast = convertSGtoPreferredUnits(color, Number(deleteduncalpoint));
        var deleteduncalpointToast = convertSGtoPreferredUnits(color, Number(deleteduncalpoint));
        app.toast.create({text: 'Calibration points Deleted: ' + deleteduncalpointToast + ' (pre-cal.) and ' + deletedactualpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
    }
    },300);
}

function deleteTempCalPoint (checkbox){
    //get color and index of selected point to delete in format as follows (tempcalpoints-{{color}}-{{@index}})
    var selectedPoint = checkbox.id.split('-');
    var color = selectedPoint[1];
    var index = Number(selectedPoint[2]) + 1;
    console.log(index);
    var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + color)||'-100000,100000';
    var unCalTempPointsArray = uncalTemppoints.split(',');
    var actualTemppoints = localStorage.getItem('actualTemppoints-' + color)||'-100000,100000';
    var actualTempPointsArray = actualTemppoints.split(',');
    var deleteduncalpoint = unCalTempPointsArray[index];
    var deletedactualpoint = actualTempPointsArray[index];
    //remove from temp cal points array
    unCalTempPointsArray.splice(index, 1);
    actualTempPointsArray.splice(index, 1);
    //update local storage with new cal points
    localStorage.setItem('uncalTemppoints-' + color,unCalTempPointsArray);
    localStorage.setItem('actualTemppoints-' + color,actualTempPointsArray);
    //delete point half second after checking box
    setTimeout(function(){ 
        if (checkbox.checked){
            updateTempcallist(color);
            var deleteduncalpointToast = convertTemptoPreferredUnits(color, Number(deleteduncalpoint));
            var deletedactualpointToast = convertTemptoPreferredUnits(color, Number(deletedactualpoint));
            app.toast.create({text: 'Calibration points deleted: ' + deleteduncalpointToast + ' (pre-cal.) and ' + deletedactualpointToast + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
        }
        },300);
    }

function getUncalibratedSGPoint (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    $$('#uncalSG-' + color).val(localStorage.getItem('uncalSG-' + color));
}

function getUncalibratedTempPoint (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var uncalTemp = localStorage.getItem('uncalTemp-' + color);
    var units = localStorage.getItem('displayTempunits-' + color);
    if (units == "°C"){
        uncalTemp = ((uncalTemp - 32) * 5 / 9).toFixed(1);
    }
    $$('#uncalTemp-' + color).val(uncalTemp);
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
    var actualSGpoints = localStorage.getItem('actualSGpoints-' + color)||'-0.001,1.0000,10.000';
    var actualSGpointsArray = actualSGpoints.split(',');
    var uncalSGpoints = localStorage.getItem('uncalSGpoints-' + color)||'-0.001,1.0000,10.000';
    var uncalSGpointsArray = uncalSGpoints.split(',');
    var actualSGpoint = String(Number(actual).toFixed(4));
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
        app.toast.create({text: 'Success: Set calibration ' + uncalSGpoint + ' (pre-cal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
     } else if (calSGindex > 0 && uncalSGindex < 0){
        localStorage.setItem('actualSGpoints-' + color, actualSGpointsArray);
        uncalSGpointsArray.splice(calSGindex, 1, uncalSGpoint);
        uncalSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('uncalSGpoints-' + color, uncalSGpointsArray);
        app.toast.create({text: 'Success: Changed calibration from ' + uncalSGpoint + ' (pre-cal.) to ' + actualSGpoint + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
    }
       else if (calSGindex < 0 && uncalSGindex > 0){
        localStorage.setItem('uncalSGpoints-' + color, uncalSGpointsArray);
        actualSGpointsArray.splice(uncalSGindex, 1, actualSGpoint);
        actualSGpointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('actualSGpoints-' + color, actualSGpointsArray);
        app.toast.create({text: 'Success: Changed calibration from ' + actualSGpoint + ' (actual) to ' + uncalSGpoint + ' (pre-cal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
       }
   }else{
       app.dialog.alert('Error: The calibration point ' + actual + ' is out of range or not a number. Please try again.', 'Calibration Error');
   }
   //update list of calibration points in settings
   updateSGcallist(color);

}

function addTempPoints (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1];
    var units = localStorage.getItem('displayTempunits-' + color)||"°F";
   //get values from settings panel
    var actual = $$('#actualTemp-' + color).val();
    var uncalTemppoint = $$('#uncalTemp-' + color).val();
    //convert values from display units to default units if needed
    if (units == "°C"){
        actual = ((actual * 9 / 5) + 32).toFixed(1);
        uncalTemppoint = ((uncalTemppoint * 9 / 5) + 32).toFixed(1);
    }
    //console.log(actual);
    var actualTemppoints = localStorage.getItem('actualTemppoints-' + color)||'-100000,100000';
    var actualTemppointsArray = actualTemppoints.split(',');
    var uncalTemppoints = localStorage.getItem('uncalTemppoints-' + color)||'-100000,100000';
    var uncalTemppointsArray = uncalTemppoints.split(',');
    var actualTemppoint = Number(actual).toFixed(1);
    //console.log(uncalTemppoint);
    //add uncal. point only if actual doesn't already exist, otherwise replace with new uncal. point
    var calTempindex = actualTemppointsArray.indexOf(actualTemppoint);
    var uncalTempindex = uncalTemppointsArray.indexOf(uncalTemppoint);
    var actualTemppointToast = convertTemptoPreferredUnits(color, Number(actualTemppoint));
    var uncalTemppointToast = convertTemptoPreferredUnits(color, Number(uncalTemppoint));
    if (Number(actual) > -1 && Number(actual) < 213){
     if (calTempindex < 0 && uncalTempindex < 0){
        actualTemppointsArray.push(actualTemppoint);
        actualTemppointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('actualTemppoints-' + color, actualTemppointsArray);
        uncalTemppointsArray.push(uncalTemppoint);
        uncalTemppointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('uncalTemppoints-' + color, uncalTemppointsArray);
        app.toast.create({text: 'Success: Set calibration ' + uncalTemppointToast + ' (uncal.) to ' + actualTemppointToast + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
     } else if (calTempindex > 0 && uncalTempindex < 0){
        localStorage.setItem('actualTemppoints-' + color, actualTemppointsArray);
        uncalTemppointsArray.splice(calTempindex, 1, uncalTemppoint);
        uncalTemppointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('uncalTemppoints-' + color, uncalTemppointsArray);
        app.toast.create({text: 'Success: Changed calibration from ' + uncalTemppointToast + ' (uncal.) to ' + actualTemppointToast + ' (actual)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
    }
       else if (calTempindex < 0 && uncalTempindex > 0){
        localStorage.setItem('uncalTemppoints-' + color, uncalTemppointsArray);
        actualTemppointsArray.splice(uncalTempindex, 1, actualTemppoint);
        actualTemppointsArray.sort(function(a, b){return a-b;});
        localStorage.setItem('actualTemppoints-' + color, actualTemppointsArray);
        app.toast.create({text: 'Success: Changed calibration from ' + actualTemppointToast + ' (actual) to ' + uncalTemppointToast + ' (uncal.)', icon: '<i class="material-icons">done</i>', position: 'center', closeTimeout: 4000}).open();
       }
   }else{
       app.dialog.alert('Error: The calibration point "' + actual + '" is out of range or not a number. Please try again.', 'Calibration Error');
   }
   //update list of calibration points in settings
   updateTempcallist(color);

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
    validBeerName = newBeerName.replace(',', '-');
    validBeerName = newBeerName.replace('&', ' and ');
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

function postToCloudURLsDisabled (color, comment) {
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
        stopScan();//stop bt scan while using wifi
        var colorLogged = beacon.Color.replace("•HD","");
        app.request.post(cloudURLsArray[i], encodeURI("Timepoint=" + localTimeExcel + "&SG=" + beacon.SG + "&Temp=" + beacon.Temp + "&Color=" + colorLogged + "&Beer=" + currentBeerName + "&Comment=" + comment), function (stringData){
            startScan();//restart scanning
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
                $$('#cloudStatus' + color).html('<a class="link external" href="' + jsonData.doclongurl + '" target="_system">&nbsp;<i class="material-icons size-15">cloud_done</i><span id="lastCloudLogged' + beacon.Color +'"></span></a>');
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
                $$('#cloudStatus' + beacon.Color).html('<i class="material-icons size-15">cloud_done</i><span id="lastCloudLogged' + beacon.Color +'"></span>');

            }
        }, function (errorData) {
            startScan();//restart scanning
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
    beacon.Color = beacon.Color.replace("•HD","");
    writeToFile(CSVfileName, localTime + ',' + localTimeExcel + ',' + beacon.SG + ',' + beacon.Temp + ',' + beacon.Color + ',' + currentBeerName + ',' + comment, isAppend,'csv', color);
    writeToFile(JSONfileName, { Timestamp : localTime, Timepoint : localTimeExcel, SG : beacon.SG, Temp : beacon.Temp, Color : beacon.Color, Beer : currentBeerName, Comment : comment }, isAppend,'json', color);
    $$('#deviceStatus' + color).html('<a class="link">| &nbsp;<i class="f7-icons size-15">share</i>&nbsp;</a>');
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
    //remove •HD tag for logging file
    beacon.Color = beacon.Color.replace("•HD","");
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
        body: '<p>Attached CSV file can be viewed in Excel, Google Sheets, and directly in web browsers.</p><h2>Last Reading</h2><h3>Gravity: ' + String(beacon.caldisplayFerm) + beacon.displayFermunits + '</h3><h3> Temperature: ' + String(beacon.uncaldisplayTemp) + beacon.displayTempunits + '</h3><h3>' + beacon.displaytimeStamp + '</h3><p>You may also view the data directly in the cloud if cloud logging was enabled: <a href="' + localStorage.getItem('docLongURL-' + color) + '">' + localStorage.getItem('docLongURL-' + color) + '</a> Or use our Google Sheets template (https://docs.google.com/spreadsheets/d/1owuNOn25IHQ1Ck8pBgAEGkOifIBA7YhVc5JpE9Tlb1c/edit?usp=sharing) to import your CSV data into a pre-formatted spreadsheet. Works only with the laptop/desktop version of Google Sheets.</p>',
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
        body: '<p>Attached CSV file can be viewed in Excel, Google Sheets, and directly in web browsers. Or use our Google Sheets template (https://docs.google.com/spreadsheets/d/1owuNOn25IHQ1Ck8pBgAEGkOifIBA7YhVc5JpE9Tlb1c/edit?usp=sharing) to import your CSV data into a pre-formatted spreadsheet. Works with laptop/desktop version of Google Sheets.</p>',
        isHtml: true,
        attachments : filePathAndName });
}

function onResume() {
    //resume scanning, needed for Android 8+ devices
    if ((device.platform == "Android") && (Number(device.version) > 7)) {
        startScan();
        updateInterval = setInterval(function(){ updateBeacons(); }, 1000);
    }
    watchBluetoothInterval = setInterval(function(){ watchBluetooth(); }, 30000);
    scanningToast = app.toast.create({text: '<i class="material-icons">bluetooth_searching</i> Scanning for nearby TILT hydrometers.<br>Ensure Bluetooth and Location Services are enabled and TILT is floating.', position: 'bottom', closeButton: true, closeButtonText: 'close', closeButtonColor: 'red',}).open();
    //set resumed flag to trigger logging as soon as tilts are in range
    //localStorage.setItem('inrangebeacons','NONE');
    //console.log('resumed');
}

function onPause() {
    //Android 8+ doesn't allow scanning to continue in background
    if ((device.platform == "Android") && (Number(device.version) > 7)) {
        stopScan();
        clearInterval(updateInterval);
    }
    clearInterval(watchBluetoothInterval);
}

function watchBluetooth() {//function run every 30 seconds on Android and Fire devices
     var inRangeBeaconsArray = localStorage.getItem('inrangebeacons').split(',');
     if (inRangeBeaconsArray.length == 1){//no tilts in range
      //toggleBluetooth();
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
            NativeStorage.getItem('uncalTemppoints-' + color, function (result) { 
                if(result !== undefined){
                localStorage.setItem('uncalTemppoints-' + color, result);
                }
             }, function (e) { });
            NativeStorage.getItem('actualTemppoints-' + color, function (result) { 
                if(result !== undefined){
                localStorage.setItem('actualTemppoints-' + color, result);
                }
             }, function (e) { });
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
    //validate default cloud URL, reset if invalid
    if (cloudURLsArray[0].includes('http')){
        //default cloud URL has valid protocol preamble
    }else{
        //if invalid use the default cloud URL instead
        cloudURLsArray[0] = app.data.defaultCloudURL;
    }
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
    var notificationCloudTimeout = setTimeout(function(){ notificationCloud.open(); }, 2000); //prevents notification being overwritten by device log notification
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
        stopScan();//stop bt scan while using wifi
        var colorLogged = beacon.Color.replace("•HD","");
        cordova.plugin.http.setDataSerializer('utf8');
        cordova.plugin.http.setRequestTimeout(120.0);
        cordova.plugin.http.post(
            cloudURLsArray[i],
            encodeURI("Timepoint=" + localTimeExcel + "&SG=" + beacon.SG + "&Temp=" + beacon.Temp + "&Color=" + colorLogged + "&Beer=" + currentBeerName + "&Comment=" + comment),
            { "content-type" : "application/x-www-form-urlencoded; charset=utf-8" },
            function (objectData){
            startScan();//restart scanning
            localStorage.setItem('lastCloudLogged-' + color, Date.now());
            //try to parse data from Baron Brew Google Sheets
            try {
            var jsonData = JSON.parse(objectData.data);
            clearTimeout(notificationCloudTimeout);
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
                $$('#cloudStatus' + color).html('<a class="link external" href="' + jsonData.doclongurl + '" target="_system">&nbsp;<i class="material-icons size-15">cloud_done</i><span id="lastCloudLogged' + beacon.Color +'"></span></a>');
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
                $$('#cloudStatus' + beacon.Color).html('<i class="material-icons size-15">cloud_done</i><span id="lastCloudLogged' + beacon.Color +'"></span>');

            }
        }, function (errorData) {
            clearTimeout(notificationCloudTimeout);
            startScan();//restart scanning
            var notificationCloudError = app.notification.create({
                icon: '<i class="f7-icons">info</i>',
                title: 'Error Logging to Cloud',
                titleRightText: 'alert',
                subtitle: 'TILT | ' + color,
                text: JSON.stringify(errorData),
                closeTimeout: 8000,
              });
            notificationCloudError.open();
            console.log(JSON.stringify(errorData));
            $$('#cloudStatus' + beacon.Color).html('cloud error');

        }
        );
        }
    }
}

function convertSGtoABV (color, SG, isTComp){
    SG = Number(SG);
    if (isTComp){
        var Temp = getCalTemp(color);
        SG = -0.0003996 * (68-Temp) + SG;
    }
    var densityArray = [0.78934,0.78987,0.79038,0.79087,0.79137,0.79188,0.79237,0.79287,0.79336,0.79384,0.79432,0.79481,0.79529,0.79577,0.79625,0.79672,0.79717,0.79764,0.79809,0.79855,0.79901,0.79945,0.79991,0.80035,0.80079,0.80122,0.80165,0.80208,0.80252,0.80294,0.80336,0.80379,0.80421,0.80462,0.80505,0.80546,0.80586,0.80627,0.80668,0.80709,0.80749,0.80790,0.80830,0.80869,0.80910,0.80949,0.80988,0.81027,0.81067,0.81105,0.81145,0.81183,0.81222,0.81260,0.81299,0.81337,0.81375,0.81413,0.81451,0.81488,0.81526,0.81563,0.81601,0.81638,0.81675,0.81711,0.81748,0.81784,0.81821,0.81856,0.81893,0.81929,0.81964,0.82000,0.82035,0.82071,0.82106,0.82141,0.82177,0.82212,0.82246,0.82281,0.82315,0.82350,0.82384,0.82419,0.82453,0.82488,0.82522,0.82556,0.82590,0.82625,0.82658,0.82692,0.82726,0.82759,0.82792,0.82826,0.82859,0.82893,0.82925,0.82958,0.82991,0.83024,0.83056,0.83089,0.83121,0.83154,0.83186,0.83219,0.83251,0.83282,0.83315,0.83347,0.83379,0.83410,0.83442,0.83473,0.83505,0.83537,0.83569,0.83601,0.83632,0.83663,0.83694,0.83725,0.83756,0.83787,0.83818,0.83850,0.83881,0.83912,0.83942,0.83973,0.84004,0.84035,0.84065,0.84095,0.84126,0.84157,0.84188,0.84217,0.84248,0.84278,0.84308,0.84339,0.84369,0.84399,0.84429,0.84459,0.84489,0.84520,0.84549,0.84579,0.84608,0.84639,0.84668,0.84698,0.84727,0.84757,0.84787,0.84815,0.84844,0.84874,0.84903,0.84932,0.84962,0.84991,0.85020,0.85049,0.85077,0.85106,0.85136,0.85164,0.85192,0.85222,0.85250,0.85278,0.85307,0.85336,0.85364,0.85393,0.85422,0.85450,0.85478,0.85506,0.85536,0.85564,0.85592,0.85620,0.85649,0.85677,0.85705,0.85733,0.85761,0.85789,0.85818,0.85846,0.85873,0.85901,0.85929,0.85957,0.85984,0.86012,0.86041,0.86069,0.86096,0.86124,0.86151,0.86179,0.86206,0.86234,0.86261,0.86289,0.86316,0.86336,0.86356,0.86399,0.86426,0.86453,0.86481,0.86508,0.86535,0.86562,0.86590,0.86617,0.86644,0.86671,0.86697,0.86724,0.86751,0.86778,0.86805,0.86832,0.86859,0.86885,0.86912,0.86939,0.86966,0.86992,0.87019,0.87045,0.87071,0.87098,0.87125,0.87151,0.87177,0.87204,0.87230,0.87256,0.87282,0.87308,0.87335,0.87360,0.87387,0.87412,0.87439,0.87465,0.87491,0.87516,0.87542,0.87569,0.87594,0.87620,0.87646,0.87672,0.87697,0.87724,0.87749,0.87775,0.87801,0.87826,0.87852,0.87878,0.87903,0.87929,0.87954,0.87980,0.88005,0.88031,0.88056,0.88081,0.88107,0.88132,0.88158,0.88183,0.88208,0.88233,0.88258,0.88284,0.88309,0.88334,0.88359,0.88384,0.88409,0.88434,0.88458,0.88484,0.88509,0.88533,0.88559,0.88583,0.88608,0.88632,0.88658,0.88682,0.88707,0.88732,0.88756,0.88781,0.88805,0.88830,0.88855,0.88879,0.88903,0.88928,0.88952,0.88977,0.89001,0.89025,0.89050,0.89074,0.89098,0.89122,0.89147,0.89171,0.89195,0.89219,0.89243,0.89268,0.89292,0.89315,0.89339,0.89363,0.89387,0.89411,0.89435,0.89459,0.89483,0.89507,0.89531,0.89555,0.89578,0.89602,0.89626,0.89649,0.89672,0.89696,0.89720,0.89743,0.89767,0.89791,0.89814,0.89837,0.89861,0.89884,0.89908,0.89931,0.89954,0.89977,0.90001,0.90025,0.90048,0.90071,0.90094,0.90117,0.90141,0.90163,0.90187,0.90210,0.90234,0.90256,0.90279,0.90303,0.90326,0.90348,0.90371,0.90395,0.90417,0.90440,0.90463,0.90486,0.90509,0.90532,0.90554,0.90577,0.90599,0.90622,0.90646,0.90668,0.90691,0.90713,0.90736,0.90758,0.90781,0.90803,0.90826,0.90848,0.90871,0.90893,0.90916,0.90938,0.90960,0.90982,0.91005,0.91027,0.91050,0.91072,0.91094,0.91116,0.91138,0.91160,0.91183,0.91206,0.91227,0.91249,0.91271,0.91293,0.91315,0.91337,0.91358,0.91381,0.91403,0.91424,0.91446,0.91467,0.91489,0.91510,0.91532,0.91554,0.91575,0.91597,0.91618,0.91639,0.91661,0.91682,0.91704,0.91725,0.91747,0.91768,0.91789,0.91810,0.91831,0.91852,0.91874,0.91895,0.91915,0.91937,0.91958,0.91979,0.91999,0.92021,0.92042,0.92063,0.92084,0.92105,0.92126,0.92147,0.92167,0.92188,0.92209,0.92229,0.92250,0.92271,0.92291,0.92312,0.92332,0.92353,0.92373,0.92394,0.92415,0.92435,0.92455,0.92476,0.92496,0.92517,0.92537,0.92556,0.92577,0.92597,0.92617,0.92637,0.92658,0.92678,0.92699,0.92719,0.92739,0.92759,0.92778,0.92798,0.92818,0.92839,0.92859,0.92879,0.92898,0.92918,0.92938,0.92958,0.92977,0.92997,0.93017,0.93036,0.93056,0.93076,0.93095,0.93116,0.93136,0.93154,0.93174,0.93194,0.93213,0.93232,0.93251,0.93270,0.93290,0.93308,0.93328,0.93347,0.93366,0.93385,0.93404,0.93423,0.93441,0.93461,0.93479,0.93498,0.93516,0.93536,0.93554,0.93573,0.93591,0.93610,0.93629,0.93647,0.93666,0.93684,0.93703,0.93721,0.93739,0.93758,0.93776,0.93794,0.93813,0.93831,0.93849,0.93867,0.93885,0.93903,0.93922,0.93940,0.93957,0.93975,0.93993,0.94011,0.94028,0.94046,0.94064,0.94081,0.94099,0.94117,0.94135,0.94152,0.94169,0.94187,0.94205,0.94222,0.94239,0.94256,0.94274,0.94291,0.94308,0.94325,0.94342,0.94359,0.94376,0.94393,0.94410,0.94427,0.94443,0.94460,0.94477,0.94494,0.94510,0.94527,0.94544,0.94560,0.94577,0.94594,0.94610,0.94627,0.94643,0.94659,0.94676,0.94692,0.94708,0.94725,0.94741,0.94757,0.94773,0.94789,0.94805,0.94821,0.94837,0.94853,0.94869,0.94885,0.94901,0.94917,0.94933,0.94949,0.94964,0.94980,0.94996,0.95011,0.95027,0.95043,0.95058,0.95074,0.95089,0.95104,0.95120,0.95135,0.95151,0.95166,0.95181,0.95196,0.95211,0.95227,0.95242,0.95257,0.95272,0.95287,0.95301,0.95316,0.95331,0.95346,0.95360,0.95375,0.95390,0.95405,0.95419,0.95434,0.95449,0.95463,0.95478,0.95492,0.95506,0.95521,0.95535,0.95549,0.95563,0.95577,0.95591,0.95605,0.95619,0.95634,0.95648,0.95662,0.95676,0.95689,0.95703,0.95717,0.95731,0.95745,0.95758,0.95771,0.95785,0.95799,0.95812,0.95826,0.95839,0.95852,0.95866,0.95880,0.95893,0.95906,0.95920,0.95932,0.95945,0.95958,0.95972,0.95985,0.95998,0.96011,0.96024,0.96036,0.96049,0.96062,0.96075,0.96087,0.96100,0.96112,0.96125,0.96138,0.96150,0.96163,0.96175,0.96187,0.96199,0.96212,0.96224,0.96236,0.96249,0.96261,0.96273,0.96285,0.96297,0.96310,0.96322,0.96334,0.96346,0.96358,0.96369,0.96381,0.96393,0.96406,0.96418,0.96430,0.96442,0.96454,0.96465,0.96477,0.96489,0.96501,0.96513,0.96525,0.96536,0.96548,0.96559,0.96571,0.96583,0.96595,0.96606,0.96618,0.96630,0.96641,0.96653,0.96664,0.96676,0.96687,0.96699,0.96710,0.96722,0.96733,0.96744,0.96756,0.96767,0.96778,0.96789,0.96801,0.96812,0.96823,0.96835,0.96846,0.96857,0.96869,0.96880,0.96891,0.96902,0.96913,0.96925,0.96936,0.96947,0.96958,0.96970,0.96980,0.96991,0.97002,0.97013,0.97025,0.97036,0.97047,0.97057,0.97068,0.97079,0.97090,0.97102,0.97113,0.97123,0.97134,0.97145,0.97156,0.97167,0.97178,0.97188,0.97199,0.97210,0.97221,0.97232,0.97242,0.97253,0.97264,0.97275,0.97285,0.97295,0.97306,0.97317,0.97328,0.97339,0.97349,0.97359,0.97370,0.97381,0.97391,0.97402,0.97412,0.97423,0.97433,0.97444,0.97454,0.97464,0.97474,0.97485,0.97496,0.97507,0.97517,0.97527,0.97538,0.97548,0.97559,0.97570,0.97581,0.97591,0.97602,0.97613,0.97624,0.97634,0.97645,0.97657,0.97667,0.97678,0.97689,0.97699,0.97710,0.97721,0.97732,0.97742,0.97753,0.97764,0.97775,0.97786,0.97797,0.97808,0.97819,0.97830,0.97841,0.97852,0.97863,0.97875,0.97886,0.97897,0.97908,0.97919,0.97930,0.97942,0.97953,0.97964,0.97975,0.97987,0.97998,0.98009,0.98020,0.98031,0.98043,0.98054,0.98066,0.98077,0.98089,0.98100,0.98111,0.98122,0.98133,0.98145,0.98156,0.98168,0.98180,0.98191,0.98203,0.98214,0.98226,0.98238,0.98250,0.98261,0.98273,0.98285,0.98296,0.98308,0.98320,0.98332,0.98344,0.98356,0.98367,0.98379,0.98391,0.98404,0.98416,0.98428,0.98440,0.98452,0.98463,0.98476,0.98488,0.98500,0.98512,0.98524,0.98536,0.98549,0.98560,0.98572,0.98584,0.98596,0.98608,0.98620,0.98633,0.98645,0.98658,0.98670,0.98682,0.98694,0.98706,0.98719,0.98731,0.98744,0.98756,0.98769,0.98781,0.98794,0.98806,0.98819,0.98832,0.98845,0.98857,0.98870,0.98882,0.98895,0.98908,0.98921,0.98934,0.98947,0.98960,0.98973,0.98986,0.98999,0.99013,0.99026,0.99040,0.99052,0.99066,0.99080,0.99093,0.99106,0.99120,0.99133,0.99147,0.99161,0.99174,0.99188,0.99201,0.99215,0.99229,0.99243,0.99257,0.99271,0.99285,0.99299,0.99313,0.99327,0.99341,0.99355,0.99370,0.99384,0.99398,0.99413,0.99427,0.99442,0.99456,0.99470,0.99485,0.99499,0.99513,0.99528,0.99543,0.99557,0.99572,0.99587,0.99601,0.99616,0.99631,0.99645,0.99660,0.99675,0.99690,0.99704,0.99719,0.99734,0.99749,0.99763,0.99778,0.99793,0.99808,0.99823]
    densityArray.push(SG);
    densityArray.sort();
    var densityIndex = densityArray.indexOf(SG)-1;
    return ((1000 - densityIndex) / 10).toFixed(1)||SG;
    }
    
    function advertise_iBeacon (uuid, minor, major){
        console.log(uuid);// = 'a495bb10-c5b1-4b44-b512-1370f02d74de';
        var identifier = 'advertisedBeacon';
        console.log(minor);
        console.log(major);
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid, major, minor);
        
        // The Delegate is optional
        var delegate = new cordova.plugins.locationManager.Delegate();
        
        // Event when advertising starts (there may be a short delay after the request)
        // The property 'region' provides details of the broadcasting Beacon
        delegate.peripheralManagerDidStartAdvertising = function(pluginResult) {
            console.log('peripheralManagerDidStartAdvertising: '+ JSON.stringify(pluginResult.region));
        };
        // Event when bluetooth transmission state changes 
        // If 'state' is not set to BluetoothManagerStatePoweredOn when advertising cannot start
        delegate.peripheralManagerDidUpdateState = function(pluginResult) {
            console.log('peripheralManagerDidUpdateState: '+ pluginResult.state);
        };
        
        cordova.plugins.locationManager.setDelegate(delegate);
    
        // Verify the platform supports transmitting as a beacon
    cordova.plugins.locationManager.isAdvertisingAvailable()
    .then(function(isSupported){
    
        if (isSupported) {
            //stopScan()
            cordova.plugins.locationManager.startAdvertising(beaconRegion)
                .fail(console.error)
                .done();
        } else {
            console.log("Advertising not supported");
        }
    })
    .fail(function(e) { console.error(e); })
    .done();

    setTimeout( function (){
        cordova.plugins.locationManager.stopAdvertising()
        .fail(function(e) { console.error(e); })
        .done();
        if (minor == major && uuid.substring(0, 8) == 'a495bc00'){//finished with sending SSID
            stringToHex(picoPassword, 'a495bc01-');
            wifiConnProgress = 50;
        }//send password
        if (minor == major && uuid.substring(0, 8) == 'a495bc01'){
            initScan()
            wifiConnProgress = 100;
        }//finished sending password, start scanning again
        console.log('done advertising');
    },5000)
    }

//functions for converting WiFi name and password to transmittable iBeacons
function insertDashes(str) {
    // Ensure positions are in ascending order
    const positions = [4, 8, 12].sort((a, b) => a - b);
  
    // Check for invalid positions
    if (positions[0] < 0 || positions[2] > str.length) {
      return "Invalid position";
    }
  
    let result = str.substring(0, positions[0]); // First part
    result += "-" + str.substring(positions[0], positions[1]);
    result += "-" + str.substring(positions[1], positions[2]);
    result += "-" + str.substring(positions[2]); // Last part
  
    return result;
  }
  
  function charToHex(character) {
    const charCode = character.charCodeAt(0);
    const hexCode = charCode.toString(16);
    return hexCode;
  }
  
  function logArrayElementsWithIndex(arr, UUIDpreamble) {
    let i = 1;
    if (i < arr.length) {
        console.log([UUIDpreamble + insertDashes(arr[i]), i, arr.length - 1]); // Output as an array [element, index]
        advertise_iBeacon (UUIDpreamble + insertDashes(arr[i]), i, arr.length - 1);
        i++;
        wifiConnProgress += (i * 10);
        }
    const intervalId = setInterval(() => {
      if (i < arr.length) {
        console.log([UUIDpreamble + insertDashes(arr[i]), i, arr.length - 1]); // Output as an array [element, index]
        advertise_iBeacon (UUIDpreamble + insertDashes(arr[i]), i, arr.length - 1);
        i++;
        wifiConnProgress += (i * 10);
      } else {
        clearInterval(intervalId);
      }
    }, 6000);
  }
  
  //takes a character string, converts it to hex encoding then transmits it as one or more iBeacons.
  function stringToHex(str,UUIDpreamble) {
    let hexString = '';
    for (let i = 0; i < str.length; i++) {
      hexString += charToHex(str[i]);
    }
    const result = [];
    for (let i = 0; i < hexString.length; i += 24) {
      let chunk = hexString.substring(i, i + 24);
      if (i + 24 >= hexString.length && chunk.length < 24) {
        chunk = chunk.padEnd(24, '0');
        result.push(chunk);
      } else {
      result.push(hexString.substring(i, i + 24));
      }
    }
  
    result.unshift(result.length);
    var status = logArrayElementsWithIndex(result, UUIDpreamble);
    return status;
  }

  function uint16ToIp(uint16_1, uint16_2) {
    try {
      // Extract the octets from the 16-bit integers
      const octet1 = (uint16_1 >> 8) & 0xFF;
      const octet2 = uint16_1 & 0xFF;
      const octet3 = (uint16_2 >> 8) & 0xFF;
      const octet4 = uint16_2 & 0xFF;
  
      // Combine the octets into an IP address string
      return `${octet1}.${octet2}.${octet3}.${octet4}`;
  
    } catch (error) {
      console.error("Error converting to IP address:", error);
      return null;
    }
  }

var wifiConnProgress = 0;

  $$('.open-pico-wifi-prompt').on('click', function () {
    picoFabVisible = false
    toggleVisibility('picoFAB', 'none');
    app.dialog.login('Enter WiFi name and password below. Note: Supports only 2.4ghz WiFi.', 'Connect Nearby Tilt Pico to WiFi', function (picoSSID_input, picoPassword_input) {
    picoSSID = picoSSID_input;
    picoPassword = picoPassword_input;
    stringToHex(picoSSID, 'a495bc00-');
    wifiDialog = app.dialog.progress('Connect Tilt Pico to WiFi', wifiConnProgress);
    wifiDialog.setText('Connecting to: ' + picoSSID);
    wifiConnProgress = 0;
    var interval = setInterval(function () {
        wifiDialog.setProgress(wifiConnProgress);
        wifiDialog.setText('Transmitting (' + wifiConnProgress + '%)' + ': ' + picoSSID);
        if (wifiConnProgress >= 50) {
        wifiDialog.setText('Transmitting (' + wifiConnProgress + '%)' + ': ' + picoPassword);
        }
        if (wifiConnProgress === 100) {
          clearInterval(interval);
          wifiDialog.close();
          picoFabVisible = false;

        }
      }, 300)
    setTimeout(function () {
        if (wifiDialog !== undefined) {
            wifiDialog.close();
            picoFabVisible = false;

        }
      }, 35000);
    });
  });

  function resetPico(button){
    picoFabVisible = true
    toggleVisibility('picoFAB', 'block');
    var clickedButton = button.id.split('-');
    var tiltPicoIP = clickedButton[1];
    cordova.plugin.http.get('http://' + tiltPicoIP + '/reset?', {}, {}, 
        function(response) {
        if (response.status == '200'){
        var indexIP = tiltPicos.tiltPico.findIndex(tiltPico => tiltPico.ip_address == tiltPicoIP);
        if (indexIP > -1){
            setTimeout(function() { 
                tiltPicos.tiltPico.splice(indexIP,1);
                updatePicoList();
                }, 2000)
        }
        console.log(response.status);
        }
      }, function(response) {
        app.dialog.alert('Unable to connect to Tilt Pico: ' + tiltPicoIP, 'To manually reset WiFi, press the reset (R) button.');
        console.error(response.error);
        var indexIP = tiltPicos.tiltPico.findIndex(tiltPico => tiltPico.ip_address == tiltPicoIP);
        if (indexIP > -1){
            setTimeout(function() { 
                tiltPicos.tiltPico.splice(indexIP,1);
                updatePicoList();
                }, 2000)
            
            tiltPicos.tiltPico.splice(indexIP,1);
            updatePicoList();
        }
      });
  }


  function toggleVisibility(elementId, visibility) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = visibility;
    }
  }

  function updatePicoList(){
    var picohtml = compiledpicoTemplate(tiltPicos);
    $$('#picoPanel').html(picohtml);
  }

  function getPicoData(tiltPicoIP){
    cordova.plugin.http.get('http://' + tiltPicoIP, {}, {}, 
        function(response) {
        if (response.status == '200'){
            try {
                response.data = JSON.parse(response.data);
                // prints test
                console.log(response.data);
              } catch(e) {
                console.error('JSON parsing error');
              }
        }
      }, function(response) {
        app.dialog.alert('Unable to connect to Tilt Pico: ' + tiltPicoIP, 'To manually reset WiFi, press the reset button.');
        console.error(response.error);
        var indexIP = tiltPicos.tiltPico.findIndex(tiltPico => tiltPico.ip_address == tiltPicoIP);
        if (indexIP > -1){
            tiltPicos.tiltPico.splice(indexIP,1);
            updatePicoList();
        }
      });
  }