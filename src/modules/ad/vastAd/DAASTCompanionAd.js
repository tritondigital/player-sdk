/**
 * DAAST Companion Ad
 */
define([
    'dojo/_base/declare',
    'sdk/modules/ad/vastAd/VASTCompanionAd'
], function ( declare, VASTCompanionAd ) {

    var daastCompanionAd = declare( VASTCompanionAd, {

        constructor:function()
        {
            console.log('daastCompanionAd::constructor');

            this.logoTile = null;
            this.logoTitle = null;
            this.logoArtist = null;
            this.logoURL = null;
        }

    });

    return daastCompanionAd;

});