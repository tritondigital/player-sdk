/**
 * VAST Ad
 */
define([
    'dojo/_base/declare'
], function ( declare ) {

    var VASTAd = declare([], {

        constructor:function( id )
        {
            console.log('VASTAd::constructor');

            this.id = id;
            this.inlineAd = null;
            this.wrapperAd = null;
        }

    });

    return VASTAd;

});