/**
 * VAST Non Linear Ad
 */
define([
    'dojo/_base/declare'
], function ( declare ) {

    var vastNonLinearAd = declare([], {

        constructor:function()
        {
            console.log('vastNonLinearAd::constructor');

            this.id = null;
            this.width = 0;
            this.height = 0;
            this.expandedWidth = 0;
            this.expandedHeight = 0;
            this.resourceType = null;
            this.creativeType = null;//Mime type of static resource
            this.url = null;//URL of the ad
            this.code = null;//Wraps block of code (generally script or IFrame) if the ad is not a URL or URI.
            this.clickThroughURL = null;//URL to open as a destination page when user clicks on the ad.
            this.adParameters = null;//Data to be passed into the ad.
            this.scalable = false;
            this.maintainAspectRatio = false;
            this.apiFramework = null;
            this.minSuggestedDuration = null;//Suggested duration to display non-linear ad, typically for animation to complete. Expressed in standard time format hh:mm:ss
        }

    });

    return vastNonLinearAd;

});