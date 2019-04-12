/**
 * VAST Linear Element
 */
define([
    'dojo/_base/declare'
], function ( declare ) {

    var vastLinearElement = declare([], {

        constructor:function()
        {
            console.log('vastLinearElement::constructor');

            this.duration = null;
            this.trackingEvents = [];//Array of VASTTrackingEvent merged or not
            this.videoClick = null;//VASTVideoClick
            this.mediaFiles = [];//Array of VASTMediaFile
        }

    });

    return vastLinearElement;

});