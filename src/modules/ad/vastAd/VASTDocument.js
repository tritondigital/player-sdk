/**
 * VAST Document
 */
define([
    'dojo/_base/declare'
], function ( declare ) {

    var VASTDocument = declare([], {

        constructor:function()
        {
            console.log('vastDocument::constructor');

            this.vastAd = null;
        }

    });

    return VASTDocument;

});