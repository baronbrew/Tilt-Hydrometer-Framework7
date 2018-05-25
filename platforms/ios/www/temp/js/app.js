// Initialize app
var myApp = new Framework7()({
    id: 'io.framework7.testapp',
    root: '#app',
    theme: theme,
    data: function () {
      return {
        user: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };
    },
    methods: {
      helloWorld: function () {
        app.dialog.alert('Hello World!');
      },
    },
    routes: routes,
    vi: {
      placementId: 'pltd4o7ibb9rc653x14',
    },
  });


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Theme
var theme = 'md';
if (document.location.search.indexOf('theme=') >= 0) {
  theme = document.location.search.split('theme=')[1].split('&')[0];
}

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
    
            permissions = cordova.plugins.permissions;
    
            permissions.checkPermission(permissions.BLUETOOTH, checkBluetoothPermissionCallback, null);
            permissions.checkPermission(permissions.ACCESS_COARSE_LOCATION, checkCoarseLocationPermissionCallback, null);

});
    //Permissions
    var permissions;

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
                console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
                for (var i in pluginResult.beacons) {
                    // Insert beacon into table of found beacons.
                    var beacon = pluginResult.beacons[i];
                    beacon.timeStamp = Date.now();
                    var key = beacon.uuid;
                    beacons[key] = beacon;
                    

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

    $$('.prompt-ok-red').on('click', function () {
        var emailAddress = localStorage.getItem('emailaddress')||"";
        if (emailAddress == ""){
         myApp.prompt('Please enter your Gmail email address below. (Gmail only)','Start New Cloud Log', function (value) {
         myApp.alert('A link to your cloud log (Google Sheets) will be sent to: ' + value);
        localStorage.setItem('emailaddress',value);
        })
        }else{
         myApp.confirm('A link to your cloud log will be sent to ' + emailAddress, 'Ready to Start', function () {},function () { localStorage.setItem('emailaddress',""); })
    }
    });          

    function updateBeacons() {
        $$.each(beacons, function (key, beacon) {
        if (beacon.uuid[6] == 4){
        var purple  = $$('#purple').text("TILT | PURPLE");
        var purpleSG = $$('#purpleSG').text("SG/Concentration: " + (beacon.minor / 1000).toFixed(3));
        var purpleTemp = $$('#purpleTemp').text("Temperature: " + beacon.major + " F");
        var timeUpdated = ((Date.now() - beacon.timeStamp) / 1000).toFixed(1);
        var purpleUpdated = $$('#purpleUpdated').text("Updated " + timeUpdated + " seconds ago");
        }
        if (beacon.uuid[6] == 8){
        var pink  = $$('#pink').text("TILT | PINK");
        var pinkSG = $$('#pinkSG').text("SG/Concentration: " + (beacon.minor / 1000).toFixed(3));
        var pinkTemp = $$('#pinkTemp').text("Temperature: " + beacon.major + " F");
        var timeUpdated = ((Date.now() - beacon.timeStamp) / 1000).toFixed(1);
        var pinkUpdated = $$('#pinkUpdated').text("Updated " + timeUpdated + " seconds ago");
        if (timeUpdated > 5){
            document.getElementById('pinkCard').style.display = "none";
        }else{document.getElementById('pinkCard').style.display = "block";}
        }
        });
    }
