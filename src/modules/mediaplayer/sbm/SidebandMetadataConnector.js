/**
 * Sideband metadata connector<br>
 * Class to support Side-Band metadata mechanism<br>
 * Use by HTML5 technology ONLY
 */

define([
    'dojo/_base/declare',
    'dojo/on',
    'dojo/_base/array',
    'dojo/_base/lang',
    'sdk/base/util/EventSourceJS',
    'sdk/base/cuepoints/TrackCuePoint',
    'sdk/base/cuepoints/BreakCuePoint',
    'sdk/base/cuepoints/HlsCuePoint'
], function ( declare, on, array, lang, EventSourceJS, TrackCuePoint, BreakCuePoint, HlsCuePoint ) {

    var sidebandMetadataConnector = declare([ ], {

        /**
         * @var {string[]} Supported Events list
         */
        SUPPORTED_EVENTS: [ 'onMetaData', 'onCuePoint', 'onCuePointPreview', 'onCuePointPreviewExpired' ],

        /**
         * @var {integer} API refresh timeout
         */
        MAX_BACKOFF_RETRY: 3,



        /* Map the xml properties with Track & Ad CuePoints properties */
        cuePointMap : {
            timestamp:'timestamp',
            type:'name',
            /*Track CuePoint*/
            cue_title: TrackCuePoint.CUE_TITLE,
            track_artist_name: TrackCuePoint.ARTIST_NAME,
            track_album_name: TrackCuePoint.ALBUM_NAME,
            program_id: TrackCuePoint.PROGRAM_ID,
            cue_time_duration: TrackCuePoint.CUE_TIME_DURATION,
            cue_time_start: TrackCuePoint.CUE_TIME_START,
            track_id: TrackCuePoint.TRACK_ID,
            track_nowplaying_url: TrackCuePoint.NOW_PLAYING_URL,
            track_cover_url: TrackCuePoint.TRACK_COVER_URL,
            /*Break CuePoint*/
            ad_id: BreakCuePoint.AD_ID,
            ad_type: BreakCuePoint.AD_TYPE,
            cue_title: BreakCuePoint.CUE_TITLE,
            cue_time_duration: BreakCuePoint.CUE_TIME_DURATION,
            ad_url: BreakCuePoint.AD_URL,
            ad_vast_url : BreakCuePoint.AD_VAST_URL,
            ad_vast : BreakCuePoint.AD_VAST,
            /*HLS CuePoint*/
            hls_track_id:HlsCuePoint.HLS_TRACK_ID,
            hls_segment_id:HlsCuePoint.HLS_SEGMENT_ID
        },

        constructor:function()
        {
            console.log( 'sidebandMetadataConnector::constructor' );

            this._eventSource = null;
            this._eventQueue = [];
            this._currentSbmUrl = null;
            this._backOffRetry = 0;
            this.__onMessageHandler = lang.hitch( this, this.__onMessage );
            this.__onOpenHandler = lang.hitch( this, this.__onOpen );
            this.__onErrorHandler = lang.hitch( this, this.__onError );
        },

        /**
         *
         * Initialize EventSource connection
         *
         *
         * @param url
         */

        connect:function( url )
        {
            console.log( 'sidebandMetadataConnector:connect()');

            this._currentSbmUrl = url;

            this.__subscribe( url );
            this.__resetBackOff();
        },
        /**
         *
         * Destroy Sideband metadata connection
         *
         */
        destroy:function()
        {
            console.log( 'sidebandMetadataConnector:destroy()' );

            this.__unlisten();
            this.__close();
        },

        /**
         *
         * Return the current CuePoint
         *
         * @returns {*}
         */
        getCurrentCuePoint:function()
        {

            return this._eventQueue.length > 0 ? this._eventQueue[0] : null;
        },

        /**
         * Shift EventQueue array
         */
        shiftCuePointQueue:function()
        {
            if( this._eventQueue.length )
            {
                this._eventQueue.shift();
            }
        },

        /**
         * Handler to get Sideband metadata fallback
         *
         * @param callback
         *
         * @ignore
         */
        setSidebandMetadataFallbackCallback:function( callback )
        {
            this._sidebandMetadataFallbackCallback = callback;
        },


        /* ########################################################### */
        /* ##################### PRIVATE FUNCTIONS ################### */
        /* ########################################################### */

        __subscribe:function( url )
        {
            console.log( 'sidebandMetadataConnector:subscribe() to ' + url );

            if( this._eventSource != null )
            {
                this._eventSource.close();
                this._eventSource = null;
            }

            if( typeof(EventSource) !== "undefined" )
            {
                this._eventSource = new EventSource( url );
            }
            else
            {
                //no Eventsource
                return;
            }

            this.__listen();
        },

        __listen:function()
        {
            console.log( 'sidebandMetadataConnector:listen()' );

            this._messageListener = on( this._eventSource, 'message', this.__onMessageHandler );
            this._openListener = on( this._eventSource, 'open', this.__onOpenHandler );
            this._errorListener = on( this._eventSource, 'error', this.__onErrorHandler );
        },

        __unlisten:function()
        {
            console.log( 'sidebandMetadataConnector:unlisten()' );

            if( this._messageListener )
            {
                this._messageListener.remove();
            }
            if( this._openListener )
            {
                this._openListener.remove();
            }

            if( this._errorListener )
            {
                this._errorListener.remove();
            }
        },

        /**
         *
         * Close EventSource connection
         *
         */

        __close:function()
        {
            console.log( 'sidebandMetadataConnector:close()' );

            this._currentSbmUrl = null;

            if( this._eventSource != null )
            {
                this._eventSource.close();
                this._eventSource = null;
            }

        },

        __onMessage:function( e )
        {
            console.log( 'sidebandMetadataConnector:message received');
            console.log( e.data );

            var message = JSON.parse( e.data );

            if( message.type != undefined && !this.__isSupportedEvent( message ) ) return;

            var cuePoint = {};

            switch ( message.type )
            {
                case 'onMetaData':
                    this.__onMetadata( message );
                    break;

                case 'onCuePoint':
                    cuePoint = this.__onCuePoint( message );
                    break;

                case 'onCuePointPreview':
                    cuePoint = this.__onCuePointPreview( message );
                    break;

                case 'onCuePointPreviewExpired':
                    cuePoint = this.__onCuePointPreviewExpired( message );
                    break;

                default:
                    break;
            }

            this._eventQueue.push( cuePoint );
        },

        __onCuePoint:function( message )
        {
            console.log( 'sidebandMetadataConnector:cuePoint received');

            var cuePoint = {};

            cuePoint.parameters = message.parameters;
            cuePoint.timestamp = message.timestamp;
            cuePoint.type = message.name;

            for( var key in message.parameters )
            {
                //cuePoint properties names are map with the object this.cuePointMap
                if ( this.cuePointMap[key] )
                {
                    cuePoint[this.cuePointMap[key]] = message.parameters[key];
                }
            }

            if( cuePoint.type == 'ad' )
                cuePoint['isVastInStream'] = ( ( cuePoint[ BreakCuePoint.AD_VAST_URL ] != undefined && cuePoint[ BreakCuePoint.AD_VAST_URL ] != '') || ( cuePoint[ BreakCuePoint.AD_VAST ] && cuePoint[ BreakCuePoint.AD_VAST ] != '' ) ) ? true : false;

            return cuePoint;
        },

        __onMetadata:function( message )
        {
            console.log( 'sidebandMetadataConnector:__onMetadata');
        },

        __onCuePointPreview:function( message )
        {
            console.log( 'sidebandMetadataConnector:__onCuePointPreview');
        },

        __onCuePointPreviewExpired:function( message )
        {
            console.log( 'sidebandMetadataConnector:__onCuePointPreviewExpired');
        },

        __onOpen:function( e )
        {
            console.log( 'sidebandMetadataConnector:connection opened');

            this.__resetBackOff();
        },

        __onError:function( e )
        {
            console.error( 'sidebandMetadataConnector:error' );
            console.log( e );

            if( this._backOffRetry == this.MAX_BACKOFF_RETRY )
            {

                this._sidebandMetadataFallbackCallback();
            }
            else
            {
                this.__reconnect();
            }
        },

        __isSupportedEvent:function( event )
        {
            return ( array.indexOf( this.SUPPORTED_EVENTS, event.type ) != -1 );
        },

        __reconnect:function()
        {
            this._backOffRetry++; 

            if( this._currentSbmUrl != null )
                this.__subscribe( this._currentSbmUrl );

            console.log( 'sidebandMetadataConnector::__reconnect - this.backOffRetry=' + this._backOffRetry );

        },

        __resetBackOff:function()
        {
            console.log( 'sidebandMetadataConnector::__resetBackOff' );

            this._backOffRetry = 0;

        }

    });

    return sidebandMetadataConnector;

});