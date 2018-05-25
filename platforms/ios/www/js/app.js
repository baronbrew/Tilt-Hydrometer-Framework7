// Dom7
var $$ = Dom7;

// Framework7 App main instance
var app  = new Framework7({
  root: '#app', // App root element
  id: 'com.baronbrew.tilthydrometer', // App bundle ID
  name: 'Tilt Hydrometer', // App name
  theme: 'auto', // Automatic theme detection
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

var displayTemplate = $$('#displaytemplate').html();
console.log(displayTemplate);
var compileddisplayTemplate = Template7.compile(displayTemplate);

//Permissions
var permissions;

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
  console.log("Device is ready!");
          // Specify a shortcut for the location manager holding the iBeacon functions.
          window.locationManager = cordova.plugins.locationManager;

          // Start tracking beacons
          initScan();
  
          // Display refresh timer.
          updateTimer = setInterval(updateBeacons, 500);
  
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

  // Timer that displays list of beacons.
  var updateTimer = null;

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
                        //add time since last update
                         beacon.lastUpdate = ((Date.now() - beacon.timeStamp) / 1000).toFixed(1);
                         break;
                         case "2" : beacon.Color = "GREEN";
                         break;
                         case "3" : beacon.Color = "BLACK";
                         break;
                         case "4" : beacon.Color = "PURPLE";
                         break;
                         case "5" : beacon.Color = "ORANGE";
                         break;
                         case "6" : beacon.Color = "BLUE";
                         break;
                         case "7" : beacon.Color = "YELLOW";
                         break;
                         case "8" : beacon.Color = "PINK";
                         break;
                  }
                  //set key by UUID to enumerate in list
                  var key = beacon.uuid;
                  beacons[key] = beacon;
                  //console.log(beacons);
              }
          }
      };

      // Set the delegate object to use.
      locationManager.setDelegate(delegate);

      // Request permission from user to access location info.
      // This is needed on iOS 8.
      locationManager.requestWhenInUseAuthorization();

      startScan();
  }
    function updateBeacons() {
        var displayhtml = compileddisplayTemplate(beacons);
        //console.log(displayhtml);
        console.log(beacons);
        var tiltCard  = $$('#tiltCard').html(displayhtml);
    for (var key in beacons) {
    var beacon = beacons[key];
    //global stuff
    if (beacon.minor > 2000){
        beacon.minor /= 10;
        beacon.major /= 10;
        beacon.hd = true;
    }
    beacon.uncalSG = beacon.minor / 1000;
    beacon.uncalPlato = 1111.14 * beacon.uncalSG - 630.272 * beacon.uncalSG * beacon.uncalSG + 135.997 * beacon.uncalSG * beacon.uncalSG * beacon.uncalSG - 616.868;
    //color specific
    var purpleSettings = app.form.convertToData('#purple-form');


    var purpleSG = $$('#purpleUncalSG').text("SG/Concentration (uncal.): " + beacon.uncalSG.toFixed(3));
    var purpleTemp = $$('#purpleTemp').text("Temperature: " + beacon.major + " F");
    var timeUpdated = ((Date.now() - beacon.timeStamp) / 1000).toFixed(1);
    var purpleUpdated = $$('#purpleUpdated').text("Updated " + timeUpdated + " seconds ago");
    };
}
