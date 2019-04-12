/**
 * VAST 2 Inline Ad
 */
define([
    'dojo/_base/declare'
], function ( declare ) {

    var vast2InlineAd = declare([ ], {

        constructor:function()
        {
            console.log('vast2InlineAd::constructor');

            this.creatives = [];

            this.inherited( arguments );
        },

        addWrapperLinearTrackingEvents:function( value )
        {
            var linearElement = this._getLinearElement();

            if( linearElement != null )
            {
                linearElement.trackingEvents = linearElement.trackingEvents.concat( value );
            }
        },

        addWrapperLinearVideoClickTracking:function( value )
        {
            var linearElement = this._getLinearElement();

            if( linearElement != null && linearElement.videoClick != null )
            {
                linearElement.videoClick.clickTrackings = linearElement.videoClick.clickTrackings.concat( value );
            }
        },

        addImpressions:function( value )
        {
            if( value != null )
                this.impressions = this.impressions.concat( value );
        },

        addCustomClicks:function( value )
        {
            var linearElement = this._getLinearElement();

            if( linearElement != null && linearElement.videoClick != null )
            {
                linearElement.videoClick.customClicks = linearElement.videoClick.customClicks.concat( value );
            }
        },

        getLinearTrackingEvents:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            return this._getLinearElement() != null ? this._getLinearElement().trackingEvents : null;
        },

        getCompanionAdUrl:function( width, height, vastResourceType, sequence )
        {
            var companionAds = this.getCompanionAds( sequence );

            if ( companionAds == null ) return null;

            var dimensionFit = false;
            var arrayLength = companionAds.length;
            for (var i = 0; i < arrayLength; i++)
            {
                dimensionFit = ( companionAds[i].width == width && companionAds[i].height == height );

                if( dimensionFit != true )
                {
                    if( vastResourceType == null )
                        return companionAds[i];
                    else if( companionAd.resourceType == vastResourceType )
                        return companionAds[i];
                }
            }

            return null;
        },

        getCompanionAds:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            var collectionLength = this.creatives.length;

            for (var i = 0; i < collectionLength; i++)
            {
                if( this.creatives[i].companionAds.length > 0 )
                {
                    if( sequence == -1 )
                        return this.creatives[i].companionAds;
                    else if( this.creatives[i].sequence == sequence )
                        return this.creatives[i].companionAds;
                }
            }
        },

        getLinearMediaFiles:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            return this._getLinearElement( sequence ) != null ? this._getLinearElement( sequence ).mediaFiles : null;
        },

        getLinearMediaFileByIndex:function( index, sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            var index = index;
            if( index == undefined ) { index = 0 }

            return this._getLinearElement( sequence ).mediaFiles[ index ] != null ? this._getLinearElement( sequence ).mediaFiles[ index ] : null;
        },

        getLinearVideoClick:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            return this._getLinearElement( sequence ).videoClick != null ? this._getLinearElement( sequence ).videoClick : null;
        },

        getNonLinearAds:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            var collectionLength = this.creatives.length;

            for (var j = 0; j < collectionLength; j++)
            {
                if( this.creatives[j].nonLinearAds.length > 0 )
                {
                    if( sequence == -1 )
                        return this.creatives[j].nonLinearAds;
                    else if( this.creatives[j].sequence == sequence )
                        return this.creatives[j].nonLinearAds;
                }

            }
        },

        getLinearDuration:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            return this._getLinearElement( sequence ).duration != null ? this._getLinearElement( sequence ).duration : null;
        },

        _getLinearElement:function( sequence )
        {
            var sequence = sequence;
            if( sequence == undefined ) { sequence = -1 }

            var collectionLength = this.creatives.length;
            for (var i = 0; i < collectionLength; i++)
            {
                if( this.creatives[i].linearElement != null )
                {
                    if( sequence == -1 )
                        return this.creatives[i].linearElement;
                    else if( this.creatives[i].sequence == sequence )
                        return this.creatives[i].linearElement;
                }

            }

        }

    });

    return vast2InlineAd;

});