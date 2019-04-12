/**
 * Ad Quartile
 */
define([
    'dojo/_base/declare'
], function( declare ){

    var adQuartile = declare([], {

        quartileMap : [ 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete' ],

        constructor:function()
        {
            console.log( 'adQuartile::constructor' );
        },

        getQuartileByIndex:function( index )
        {
            return this.quartileMap[ index ];
        },

        isValidType:function( type )
        {
            for ( var j = 0; j < this.length(); j++ )
            {
                if( this.quartileMap[j] == type )
                    return true;
            }
            return false;
        },

        length:function()
        {
            return this.quartileMap.length;
        }

    });

    return adQuartile;

});
