var xmlParser = require('sdk/base/util/XmlParser');
var Platform = require('sdk/base/util/Platform');


define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'sdk/modules/base/CoreModule',
    'sdk/base/cuepoints/TrackCuePoint',
    'sdk/base/cuepoints/BreakCuePoint',
    'sdk/base/util/XhrProvider',
    'dojo/_base/Deferred'
], function (declare, lang, coreModule, TrackCuePoint, BreakCuePoint, XhrProvider, Deferred) {

    /**
     * @namespace tdapi/modules/NowPlayingApi
     */
    var module = declare([ coreModule ], {

        /* Map the xml properties with Track & Ad CuePoints properties */
        cuePointMap : {
            timestamp:'timestamp',
            type:'type',
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
            ad_url: BreakCuePoint.AD_URL
        },

        constructor:function(config, target)
        {
            console.log('nowPlayingApi::constructor');

            this.inherited(arguments);

            this.platform = new Platform( config.platformId );

        },

        start:function()
        {
            console.log('nowPlayingApi::start');

            this.emit('module-ready', { id:'NowPlayingApi', module:this });

        },

        /**
         * @param {string} data.mount
         * @param {boolean} data.hd true will append 'AAC' to the mount
         * @param {number} data.numberToFetch
         * @param {string} data.eventType 'track' or 'ad' @default track
         * @param {string} data.mode = nowPlaying or songHistory @default: songHistory
         *
         * @desc
         * Load the nowplaying api xml file (xhr request)<br>
         * When Access-Control-* headers are set and it is a cross-domain request browsers, dojo xhr send OPTIONS request instead of GET.<br>
         * http://bugs.dojotoolkit.org/ticket/9486<br>
         * http://bugs.dojotoolkit.org/changeset/20403/dojo > enable not sending X-Requested-With by setting that header value to an empty string on a per-request basis.
         */
        load:function( data )
        {
            var deferred = new Deferred();
            var requestArgs = this._getRequestArgs( data.hd ? ( data.mount + 'AAC' ) : data.mount, data.numberToFetch, data.eventType || 'track', data.mode );
            var xhrProv = new XhrProvider();
            xhrProv.request( this.platform.endpoint.nowPlayingHistory, {mount:data.mount, mode:data.mode || 'songHistory',deferred:deferred}, requestArgs, lang.hitch(this, this._onLoadComplete), lang.hitch(this, this._onLoadError ));

            return deferred;
        },

        _onLoadError: function(requestData, error)
        {
            console.error('nowPlayingApi::_onLoadError - mount=' + requestData.mount + ' - error=' + error);

            this.emit('nowplaying-api-error', {mount:requestData.mount, error:requestData.error});

            return requestData.deferred.reject( {mount:requestData.mount, error:requestData.error} );
        },

        _onLoadComplete: function(requestData, data)
        {
            console.log('nowPlayingApi::_onLoadComplete - mount=' + requestData.mount);

            data = data.getElementsByTagName('nowplaying-info');

            var list = [];
            var cuePoint, npInfoAttr, propName, propValue, type, timestamp;
            for (var i = 0; i < data.length; i++) {
                type = data[i].getAttribute('type');
                timestamp = data[i].getAttribute('timestamp');
                npInfoAttr = data[i].childNodes;
                cuePoint = { parameters:{} };
                cuePoint[this.cuePointMap['type']] = type;
                cuePoint[this.cuePointMap['timestamp']] = parseInt(timestamp);
                for (var j = 0; j < npInfoAttr.length; j++) {
                    propName = npInfoAttr[j].getAttribute('name');
                    propValue = xmlParser.textContent(npInfoAttr[j]);

                    //cuePoint properties names are map with the object this.cuePointMap
                    if ( this.cuePointMap[propName] != undefined )
                        cuePoint[this.cuePointMap[propName]] = propValue;

                    //cuePoint.parameters keep reference to the original parameters from the xml file
                    cuePoint.parameters[propName] = propValue;
                }
                list.push(cuePoint);

            }

            //Track list sorted by cueTimeStart
            if(list.length > 0 && list[0].cueTimeStart){
            list = list.sort( function( a, b ){ return a.cueTimeStart-b.cueTimeStart; }).reverse();
            }else if(list.length > 0 && !list[0].cueTimeStart){
                list = list.sort( function( a, b ){ return a.timestamp-b.timestamp; }).reverse();
            }                    

            this._emitNotificationByMode( requestData.mount, requestData.mode, list );

            requestData.deferred.resolve( { mount: requestData.mount, list:list } );
        },

        _emitNotificationByMode: function( mount, mode, list )
        {
            switch ( mode ) {
                case 'songHistory':
                    this._emitSongHistoryNotification( mount, list );
                    break;
                case 'nowPlaying':
                    this._emitNowPlayingNotification( mount, list );
                    break;
                default:
                    break;
            }
        },

        _emitSongHistoryNotification: function( mount, list )
        {
            if ( list.length > 0 )
                this.emit('list-loaded', { mount:mount, list:list });
            else
                this.emit('list-empty', { mount:mount });
        },

        _emitNowPlayingNotification: function( mount, list )
        {
            if ( list.length > 0 )
                this.emit('cue-point', { mount:mount, cuePoint:list[0] });
            else
                this.emit('cue-point-empty', { mount:mount });
        },

        /**
         * Return the required parameters for the xhr request.
         * @ignore
         */
        _getRequestArgs: function( mount, numberToFetch, eventType, mode )
        {
            return {
                handleAs: "xml",
                preventCache: true,
                headers: { 'X-Requested-With':null, 'Content-Type': 'text/plain; charset=utf-8' },
                query: {
                    mountName: mount,
                    numberToFetch: mode == 'nowPlaying' ? 1 : numberToFetch,
                    eventType: eventType
                }
            }
        }

    });

    return module;

});
