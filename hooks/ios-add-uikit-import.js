#!/usr/bin/env node
/*
 * cordova-ios 7 and 8 removed the global prefix header that used to import UIKit into every
 * translation unit. Some plugins still assume it is there: their headers import only
 * Foundation while their implementations use UIKit types, so they fail to compile with
 * "use of undeclared identifier 'UIApplication'" and similar.
 *
 * Upstream has not fixed this - cordova-plugin-advanced-http 3.3.1 (current at the time of
 * writing) still ships the same header - and the files live under platforms/ios, which is
 * regenerated on every `cordova platform add`. So the import is re-applied here on each
 * build instead of being patched by hand.
 *
 * The operation is idempotent: a header that already imports UIKit is left alone.
 */

const fs = require('fs');
const path = require('path');

// Headers known to need UIKit. Keep the list explicit rather than scanning every plugin, so
// the patch stays reviewable and cannot silently rewrite unrelated sources.
const HEADERS = [
    'cordova-plugin-advanced-http/SDNetworkActivityIndicator.h',
    // Fixed upstream in baronbrew/cordova-plugin-ibeacon (LMLogger.h). Kept here so builds
    // still work until package-lock.json is bumped to a commit containing that fix; it is a
    // no-op once the newer plugin version is installed.
    'com.unarin.cordova.beacon/LMLogger.h'
];

const FOUNDATION = '#import <Foundation/Foundation.h>';
const UIKIT = '#import <UIKit/UIKit.h>';

module.exports = function (context) {
    const projectRoot = context.opts.projectRoot;
    const pluginsDir = path.join(projectRoot, 'platforms', 'ios', 'App', 'Plugins');

    if (!fs.existsSync(pluginsDir)) {
        return; // iOS platform not present - nothing to do
    }

    HEADERS.forEach(function (rel) {
        const file = path.join(pluginsDir, rel);
        if (!fs.existsSync(file)) {
            return; // plugin not installed
        }
        const source = fs.readFileSync(file, 'utf8');
        if (source.indexOf('UIKit/UIKit.h') !== -1) {
            return; // already imports UIKit
        }
        if (source.indexOf(FOUNDATION) === -1) {
            console.log('ios-add-uikit-import: no Foundation import to anchor to in ' + rel + ', skipping');
            return;
        }
        const patched = source.replace(FOUNDATION, FOUNDATION + '\n' + UIKIT);
        fs.writeFileSync(file, patched, 'utf8');
        console.log('ios-add-uikit-import: added UIKit import to ' + rel);
    });
};
