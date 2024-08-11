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
      defaultCloudURL : 'https://script.google.com/a/baronbrew.com/macros/s/AKfycbxNznAqo4-omN0btiOXUFGKRXjhoaGZwMF02PW4EiN3e7R3Gg/exec',
      tiltColors : ['RED', 'GREEN', 'BLACK', 'PURPLE', 'ORANGE', 'BLUE', 'YELLOW', 'PINK'],
      appVersion : '1.0.88'
    };
  },
  // App root methods
  methods: {
    helloWorld: function () {
      app.dialog.alert('Hello World!');
    },
  },
  on: {
    // each object key means same name event handler
    pageInit: function (page) {
      appInit()
    }
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

//Permissions
var permissions;

//Interval Timers
var watchBluetoothInterval;

let stdInInterval;
let globalPort;
async function appInit() {
    const connectButton = document.getElementById("connect");
    connectButton.addEventListener('click', async() => {
    const filter = { usbVendorId: 0x2E8A };
    const port = await navigator.serial.requestPort({ filters: [filter] });
    globalPort = port;
    await port.open({ baudRate: 9600 });
    stdInInterval = setInterval(function() {
        writeToPort("asyncio.run(tiltscanner('','','','','',1100))\r", port);
     }, 1120);
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    // Listen to data coming from the serial device.
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        break;
      }
      //console.log(value);
      // value is a string.
      if (value.substring(0, 4) == 'a495' && value.indexOf('.') > 0){
        let tiltscanArray = value.split(',');
        for (let i = 2; i < tiltscanArray.length; i++) {
                tiltscanArray[i] = Number(tiltscanArray[i]);
                }
         tiltscanArray[0] = tiltscanArray[0].substring(0, 8) + '-' + tiltscanArray[0].substring(8, 12) + '-' + tiltscanArray[0].substring(12, 16) + '-' + tiltscanArray[0].substring(16, 20) + '-' + tiltscanArray[0].substring(21, 32);
         //console.log(tiltscanArray);
         initScan(tiltscanArray);
      }

    }
    //await port.close();
        
    });
    let ssid = 'default_ssid';
    let password = 'default_pass'
    $$('.open-prompt').on('click', function () {
        app.dialog.prompt('Enter your WiFi SSID', 'SSID',
        function (ssid_entry) {
        ssid = ssid_entry;
        app.dialog.prompt('Enter your WiFi password for ' + ssid, 'Password',
        function (password_entry) {
        password = password_entry;
        console.log("saveWiFi('" + ssid + "','" + password + "')\r");
        console.log(globalPort);
        writeToPort("saveWiFi('" + ssid + "','" + password + "')\r", globalPort);
    },
        function (ssid) {console.log('cancelled')});},
        function (ssid) {console.log('cancelled')});});


        

    }

async function writeToPort(data, port) {
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();
    await writer.write(data);
    console.log(data);
    writer.close();
    await writableStreamClosed;
    // Allow the serial port to be closed later.
    writer.releaseLock();

}

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
              console.warn('BLUETOOTH_SCAN permission is not turned on');
          }

          permissions.requestPermission(
              permissions.BLUETOOTH_SCAN,
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
        //NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        //NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
        //update radio buttons
        $$("input[name=gravityRadio-" + color + "][value='SG']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
    }
    if (displaytempunits == "°C" && displayfermunits == "") {
        localStorage.setItem('displayTempunits-' + color,"°C");
        //NativeStorage.setItem('displayTempunits-' + color, "°C", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        //NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°C']").prop("checked",true);
    }
    if (displaytempunits == "°C" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        //NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"°P");
        //NativeStorage.setItem('displayFermunits-' + color, "°P", function (result) { }, function (e) { });
        $$("input[name=gravityRadio-" + color + "][value='°P']").prop("checked",true);
        $$("input[name=temperatureRadio-" + color + "][value='°F']").prop("checked",true);
    }
    if (displaytempunits == "°F" && displayfermunits == "°P") {
        localStorage.setItem('displayTempunits-' + color,"°F");
        //NativeStorage.setItem('displayTempunits-' + color, "°F", function (result) { }, function (e) { });
        localStorage.setItem('displayFermunits-' + color,"");
        //NativeStorage.setItem('displayFermunits-' + color, "", function (result) { }, function (e) { });
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
  updateTempcallist(color);
  }
    
//adds color specific attributes
  function addtoScan(beacon){
    //console.log(beacon);
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
            //postToCloudURLs(beacon.Color);
            //logToDevice(beacon.Color);
        },4000);
        localStorage.setItem('loggingTimer-' + beacon.Color, Date.now());//reset timer
    };
        }
    //add beer name
    beacon.Beername = localStorage.getItem('beerName-' + beacon.Color);
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

  function initScan(scanResult) {
          if (scanResult.length == 6) {
            //create beacon object
                  const names = ['uuid','mac','major','minor','battw','rssi'];
                  let beacon = names.reduce((a, v, i) => ({ ...a, [v]: scanResult[i]}), {});
                  //console.log(beacon.mac);
                  //add timestamp
                  beacon.timeStamp = Date.now();
                  //assign color by UUID and Minor Range. FW 1005 and 1006 is HD
                  if (Number(beacon.minor) > 5000 || beacon.minor == 1005 && beacon.major == 999 || beacon.minor == 1006 && beacon.major == 999){
                      beacon.hd = true;
                  }else{
                      beacon.hd = false;
                  }
                switch (beacon.uuid[6] + "-" + beacon.hd) {
                    case "1-false" : beacon.Color = "RED-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "1-true" : beacon.Color = "RED•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "2-false" : beacon.Color = "GREEN-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "2-true" : beacon.Color = "GREEN•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "3-false" : beacon.Color = "BLACK-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "3-true" : beacon.Color = "BLACK•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "4-false" : beacon.Color = "PURPLE-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "4-true" : beacon.Color = "PURPLE•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "5-false" : beacon.Color = "ORANGE-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "5-true" : beacon.Color = "ORANGE•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "6-false" : beacon.Color = "BLUE-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "6-true" : beacon.Color = "BLUE•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "7-false" : beacon.Color = "YELLOW-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "7-true" : beacon.Color = "YELLOW•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "8-false" : beacon.Color = "PINK-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
                    break;
                    case "8-true" : beacon.Color = "PINK•HD-" + beacon.mac[8] + beacon.mac[9] + beacon.mac[10] + beacon.mac[11];
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
                  beacons[beacon.Color] = beacon;
                  //console.log(beacons);
                  updateBeacons();
                  
              }
      };

      startScan();
      //update beacons even if nothing scanned
      updateInterval = setInterval(function(){ 
          updateBeacons();
        }, 1000);
        
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
        //populate logging links
        var docLongURL = localStorage.getItem('docLongURL-' + foundBeaconsArray[i]);
        if (docLongURL !== null){
        $$('#cloudStatus' + foundBeaconsArray[i]).html('<a class="link external" href="' + docLongURL + '" target="_system">&nbsp;<i class="material-icons size-15">cloud</i><span id="lastCloudLogged' + foundBeaconsArray[i] +'"></span></a>');
        }
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
    $$('#lastCloudLogged' + beacon.Color).html(beacon.lastCloudLogged + 'm ago');
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
//NativeStorage.setItem('uncalSGpoints-' + color, uncalSGpoints, function (result) { }, function (e) { });
//NativeStorage.setItem('actualSGpoints-' + color, actualSGpoints, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('uncalTemppoints-' + color, uncalTemppoints, function (result) { }, function (e) { });
    //NativeStorage.setItem('actualTemppoints-' + color, actualTemppoints, function (result) { }, function (e) { });
    };

function convertSGtoPreferredUnits (color, SG) {
var displayFermunits = localStorage.getItem('displayFermunits-' + color)||'';
    switch (displayFermunits){
        case '' : return ( SG * 1 ).toFixed(4);
        break;
        //0.005 added to prevent rounding to a negative 0 from sg of 1.000
        case '°P'  : return ( 0.005 - 616.868 + 1111.14 * SG - 630.272 * SG * SG + 135.997 * SG * SG * SG ).toFixed(1);
        break;
        case '°Bx'  : return ( -584.6957 + 1083.2666 * SG -577.9848 * SG * SG + 124.5209 * SG * SG * SG ).toFixed(1);
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
    var color = clickedButton[1] + '-' + clickedButton[2];
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
        //NativeStorage.setItem('beerName-' + color, validBeerName, function (result) { }, function (e) { });
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
          //NativeStorage.setItem('deviceLoggingEnabled-' + color, deviceLoggingEnabled, function (result) { }, function (e) { });
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
            //NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('cloudurls-' + color, newDefaultCloudURL + ',' + customCloudURLsArray[1] + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
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
            //NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + newCustomCloudURL1 + ',' + customCloudURLsArray[2], function (result) { }, function (e) { });
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
            //NativeStorage.setItem('cloudurlsenabled-' + color, cloudURLsenabledArray, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('cloudurls-' + color, customCloudURLsArray[0] + ',' + customCloudURLsArray[1] + ',' + newCustomCloudURL2, function (result) { }, function (e) { });
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
        //stopScan();//stop bt scan while using wifi
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
              //NativeStorage.setItem('beerName-' + color, jsonData.beername, function (result) { }, function (e) { });
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
            //NativeStorage.setItem('cloudInterval-' + color, cloudInterval, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('emailAddress-' + color, '', function (result) { }, function (e) { });
    //$$('#emailAddress-' + color).val('');
    showEmail(color);
}
        

function setEmail (button){
    var clickedButton = button.id.split('-');
    var color = clickedButton[1] + '-' + clickedButton[2];
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
    //NativeStorage.setItem('emailAddress-' + color, newEmail, function (result) { }, function (e) { });
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
    var color = clickedButton[1] + '-' + clickedButton[2];
    var beerName = localStorage.getItem('beerName-' + color)||'Untitled';
    var beerNameArray = beerName.split(',');
    var email = localStorage.getItem('emailAddress-' + color)||$$('#emailAddress-' + color).val();
    if (email == ''){
        email = '@';
    };
    var emailValid = ValidateEmail(email);
    var cloudURLsEnabled = localStorage.getItem('cloudurlsenabled-' + color)||'1,0,0';
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
    //NativeStorage.setItem('localCSVfileName-' + color, CSVfileName, function (result) { }, function (e) { });
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
    //NativeStorage.setItem('listOfCSVFiles', listOfCSVFilesArray, function (result) { }, function (e) { });
    }
    //update file list
    var displayhtml = compiledfilelistTemplate(listOfCSVFilesArray);
    $$('#fileList').html(displayhtml);
    //set JSON file name
    localStorage.setItem('localJSONfileName-' + color, JSONfileName);
    //NativeStorage.setItem('localJSONfileName-' + color, JSONfileName, function (result) { }, function (e) { });
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
        //NativeStorage.setItem('listOfJSONFiles', listOfJSONFilesArray, function (result) { }, function (e) { });
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
      toggleBluetooth();
    }
}

function postToCloudURLs (color, comment) {
    //get beer name from local storage in case beer name updated from prompt
    var currentBeerName = localStorage.getItem('beerName-' + color)||"Untitled";
    //console.log(beacons[color]);
    if (comment === undefined){
        comment = "";
    };
    if (comment.indexOf("@") > -1){
        var isEmail = 'true';} 
     else {
        var isEmail = 'false';}
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
       /*  var timeStamp = new Date.now();
        var localTime = timeStamp.toLocaleString();
        var tzOffsetDays = timeStamp.getTimezoneOffset() / 60 / 24;
        var localTimeExcel = timeStamp.valueOf() / 1000 / 60 / 60 / 24 + 25569 - tzOffsetDays; */
        //only send beer name with beer ID if using default cloud URL
         if (i != 0){
            currentBeerName = currentBeerName.split(',')[0];
         }
        //stopScan();//stop bt scan while using wifi
        clearInterval(stdInInterval);
        writeToPort("saveLogConfig('" + color + "','" + beacons[color].mac + "','" + currentBeerName + "','" + comment + "','" + isEmail + "','" + cloudURLsArray[i] + "')\r", globalPort);
        setTimeout(function(){ stdInInterval = setInterval(function() { writeToPort("asyncio.run(tiltscanner('','','','','',1100))\r", globalPort); }, 1120) }, 10000) ;
/*         cordova.plugin.http.post(
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
              //NativeStorage.setItem('beerName-' + color, jsonData.beername, function (result) { }, function (e) { });
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
        ); */
        }
    }
}