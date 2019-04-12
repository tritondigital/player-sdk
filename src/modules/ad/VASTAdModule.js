/**
 * @module VASTAd
 *
 * @desc
 * VAST Ad module
 *
 */

var xmlParser = require('sdk/base/util/XmlParser');

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/request',
    'sdk/base/util/XhrProvider',
    'sdk/modules/ad/base/AdModule',
    'sdk/modules/ad/vastAd/parser/VAST1Parser',
    'sdk/modules/ad/vastAd/parser/VAST2Parser',
    'sdk/modules/ad/vastAd/parser/DAASTParser',
    'sdk/base/ad/AdServerType',
    'sdk/base/ad/TritonRunSpot4Helper'
], function ( declare, lang, array, request, XhrProvider, adModule, vast1Parser, vast2Parser, daastParser, AdServerType, TritonRunSpot4Helper ) {

    /**
     * @namespace tdapi/modules/vastAd
     */
    var vastAdModule = declare([ adModule ], {

        VAST_1_ROOT: 'VideoAdServingTemplate',
        VAST_2_ROOT: 'VAST',
        DAAST_ROOT: 'DAAST',
        VERSION_1_0: '1.0',
        VERSION_2_0: '2.0',
        DAAST_VERSION_1_0: 'DAAST_1.0',

        constructor:function( target, config )
        {
            console.log( 'vastAdModule::constructor' );

            this.target = target;

            this._mediaAdBlankFiles = null;
            this._skipMediaAdPlayback = false;
            this._adBreak = false;
            this._defaultSequence = -1;
            this._vastWrapperAd = null;
            this._wrapperCachedData = null;

            this.vastParser = null;
            this.vastDocument = null;

            this.onPlaybackStartHandler = null;
            this.onQuartileReachedHandler = null;
            this.onClickTrackingElementClickedHandler = null;

            this.xhrProv = new XhrProvider();
        },

        init:function( adConfig )
        {
            console.log('vastAdModule::init - url : ' + adConfig.url + ' - skipMediaAdPlayback : ' + adConfig.skipMediaAdPlayback + ' - sequence : ' + adConfig.sequence );

            this.inherited( arguments );

            this._adBreak = ( adConfig.adBreak ) ? true : false;
            this._skipMediaAdPlayback = adConfig.skipMediaAdPlayback != undefined ? adConfig.skipMediaAdPlayback : false;
            this._defaultSequence = adConfig.sequence != undefined ? adConfig.sequence : -1;

            this.loadVast( adConfig );

        },

        loadVast: function( config )
        {
           if( config.rawXML != undefined )
           {
               
               this._parseVast( xmlParser.parse(config.rawXML).documentElement );

           }
           else if( config.url != undefined )
           {
             this.setMediaAdBlankFiles( null );

             this.xhrProv.request( config.url, config.url, this._getRequestArgs(), lang.hitch( this, this._onVastLoadComplete ), lang.hitch( this, this._onVastLoadError ) );
           }
           else if( config.sid != undefined )
           {
             var tritonRunSpot4Helper = new TritonRunSpot4Helper();
             var vastUrl = tritonRunSpot4Helper.getVastUri( tritonRunSpot4Helper.ENDPOINT, this.config.sid, config.mediaformat );
             this.setMediaAdBlankFiles( tritonRunSpot4Helper.mediaAdBlankFiles );

             this.xhrProv.request( vastUrl, vastUrl, this._getRequestArgs(), lang.hitch( this, this._onVastLoadComplete ), lang.hitch( this, this._onVastLoadError ) );
           }
        },

        setMediaAdBlankFiles:function( array )
        {
            this._mediaAdBlankFiles = array;
        },


        getVastInlineAd: function(){

            console.log('vastAdModule::getVastInlineAd');

            return this.vastDocument.vastAd.inlineAd;
        },


        /***************************************/
        /******* PRIVATE FUNCTIONS  ************/
        /***************************************/

        _onVastLoadComplete: function( url, data )
        {
            console.log( 'vastAdModule::_onVastLoadComplete - url =' + url );

            this._parseVast( data );
        },

        _onVastLoadError: function( url, error )
        {
            console.error( 'vastAdModule::_onVastLoadError - url =' + url + ' - error=' + error );

            if( this._vastWrapperAd != null )
            {
                if ( this._vastWrapperAd.error != null && this._vastWrapperAd.error != '' )
                {
                    this.xhrProv.request( this._vastWrapperAd.error, this._vastWrapperAd.error, this._getRequestArgs(), null, null );
                }

                this._vastWrapperAd = null;
            }

            if( this._adBreak == false )
            {
                this.emit( this.AD_MODULE_VAST_ERROR, { error:error } );
            }

        },

        _parseVast: function( data )
        {
            this.vastDocument = null;
            this.vastParser = null;

            if( data == undefined || data.nodeName == undefined )
            {
                this.emit( this.AD_MODULE_VAST_EMPTY , { adServerType: AdServerType.VAST_AD } );
                return;
            }

            var version = this._getVersion( data.nodeName );

            this.vastParser = this._getVastParser( version );
            if( this.vastParser != null )
                this.vastDocument = this.vastParser.parse( data );

            if( this.vastDocument != null )
            {
                if ( this._needToLoadVASTWrapper( this.vastDocument.vastAd ) )
                {
                    this._vastWrapperAd = this.vastDocument.vastAd.wrapperAd;

                    this._cacheWrapperData( this._vastWrapperAd );

                    this.loadVast( {url:this.vastDocument.vastAd.wrapperAd.vastAdTagURL, skipMediaAdPlayback: this._skipMediaAdPlayback, sequence: this._defaultSequence }   );
                }
                else
                {
                    if( this._vastWrapperAd != null )
                    {
                        this.vastDocument.vastAd.inlineAd.addWrapperLinearTrackingEvents( this._wrapperCachedData.wrapperTrackingEvents );

                        this.vastDocument.vastAd.inlineAd.addImpressions( this._wrapperCachedData.wrapperImpressions );

                        this.vastDocument.vastAd.inlineAd.addWrapperLinearVideoClickTracking( this._wrapperCachedData.wrapperVideoClickTracking );

                        this._vastWrapperAd = null;
                        this._wrapperCachedData = null;
                    }

                    this._vastWrapperAd = null;


                    if( this.vastDocument.vastAd.inlineAd.getCompanionAds( this._defaultSequence ) != undefined && this.vastDocument.vastAd.inlineAd.getCompanionAds( this._defaultSequence).length > 0 ){
                        this.emit(  this.AD_MODULE_COMPANIONS, { companions:this.vastDocument.vastAd.inlineAd.getCompanionAds( this._defaultSequence ) } );
                    }


                    if( this._skipMediaAdPlayback == true ) return;

                    var mediaFiles = this._checkMediaAdBlankFiles( this.vastDocument.vastAd.inlineAd.getLinearMediaFiles( this._defaultSequence ) );

                    if( mediaFiles != null )
                    {
                        var videoClick = this.vastDocument.vastAd.inlineAd.getLinearVideoClick( this._defaultSequence );
                        var clickThrough = videoClick != null ? videoClick.clickThrough : null;
                        var clickTrackings = videoClick != null ? videoClick.clickTrackings : null;

                        this.emit( this.AD_MODULE_MEDIA_READY, { adServerType: AdServerType.VAST_AD,
                                                                 mediaFiles: mediaFiles,
                                                                 clickThrough:clickThrough,
                                                                 clickTrackings:clickTrackings } );
                    }
                    else
                    {
                        this.emit( this.AD_MODULE_MEDIA_EMPTY, { adServerType: AdServerType.VAST_AD } );
                    }
                }
            }
            else
            {
                this.emit( this.AD_MODULE_VAST_EMPTY, { adServerType: AdServerType.VAST_AD } );
            }

        },

        _getVersion:function( node )
        {
            switch ( node )
            {
                case this.VAST_1_ROOT :
                    return this.VERSION_1_0;
                    break;

                case this.VAST_2_ROOT :
                    return this.VERSION_2_0;
                    break;

                case this.DAAST_ROOT :
                    return this.DAAST_VERSION_1_0;
                    break;
            }

            return null;
        },

        _cacheWrapperData:function( vastWrapperAd )
        {
            if( this._wrapperCachedData == null )
                this._wrapperCachedData = { wrapperImpressions:[], wrapperTrackingEvents:[], wrapperVideoClickTracking:[] };

            var wrapperTrackingEvents = this._vastWrapperAd.getLinearTrackingEvents( this._defaultSequence );
            if ( wrapperTrackingEvents != null && wrapperTrackingEvents.length > 0 )
                this._wrapperCachedData.wrapperTrackingEvents = this._wrapperCachedData.wrapperTrackingEvents.concat( wrapperTrackingEvents );

            var wrapperImpressions = this._vastWrapperAd.impressions;
            if ( wrapperImpressions != null && wrapperImpressions.length > 0 )
                this._wrapperCachedData.wrapperImpressions = this._wrapperCachedData.wrapperImpressions.concat( wrapperImpressions );

            var wrapperVideoClick = this._vastWrapperAd.getLinearVideoClick( this._defaultSequence );
            if ( wrapperVideoClick != null && wrapperVideoClick.clickTrackings.length > 0 )
                this._wrapperCachedData.wrapperVideoClickTracking = this._wrapperCachedData.wrapperVideoClickTracking.concat( wrapperVideoClick.clickTrackings );
        },

        _needToLoadVASTWrapper:function( adVast )
        {
            if( adVast.wrapperAd != null && adVast.wrapperAd.vastAdTagURL != null )
                return true;
            else
                return false;
        },

        _getVastParser:function( version )
        {
            switch( version )
            {
                case this.VERSION_1_0 :
                    if( this.vastParser == null )
                        this.vastParser = new vast1Parser( this.target );
                    return this.vastParser;
                    break;
                case this.VERSION_2_0 :
                    if( this.vastParser == null )
                        this.vastParser = new vast2Parser( this.target );
                    return this.vastParser;
                    break;
                case this.DAAST_VERSION_1_0 :
                    if( this.vastParser == null )
                        this.vastParser = new daastParser( this.target );
                    return this.vastParser;
                    break;
            }

            return null;
        },

        _checkMediaAdBlankFiles:function( mediaFiles )
        {
            if( mediaFiles == null ) return null;

            var mediaFilesArr = [];

            var mediaFilesLength = mediaFiles.length;
            for ( var i = 0; i < mediaFilesLength; i++ )
            {
                if( !this._isMediaAdBlankFile( mediaFiles[i].url ) )
                    mediaFilesArr.push( mediaFiles[i] );
            }
            return mediaFilesArr;
        },

        _isMediaAdBlankFile:function( url )
        {
            if ( this._mediaAdBlankFiles == null ||this._mediaAdBlankFiles.length == 0 ) return false;

            var mediaFileName = url.substr( url.lastIndexOf("/") + 1 );
            var mediaAdBlankFilesLength = this._mediaAdBlankFiles.length;

            for ( var i = 0; i < mediaAdBlankFilesLength; i++ )
            {
                if( this._mediaAdBlankFiles[i] == mediaFileName )
                    return true;
            }
            return false;
        },

        /**
         * Return the required parameters for the xhr request.
         * @ignore
         */
        _getRequestArgs: function()
        {
            return {
                handleAs: "xml",
                preventCache: false,
                withCredentials: true,
                headers: { 'X-Requested-With':null, 'Content-Type': 'text/plain; charset=utf-8' }
            }
        }

    });

    return vastAdModule;

});
