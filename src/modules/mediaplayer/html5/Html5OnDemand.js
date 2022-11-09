/**
 * HTML5 On Demand
 *
 * @class Manage HTML5 on demand player
 *
 */
var i18n = require('sdk/base/util/I18n');

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/Evented',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dojo/dom-style',
    'dojo/has',
    'sdk/modules/mediaplayer/html5/Html5Player',
    'sdk/modules/mediaplayer/html5/ConsumptionAnalytics'

], function ( declare, lang, on, Evented, domConstruct, domAttr, domStyle, has, Html5Player, ConsumptionAnalytics ) {

    var html5OnDemand = declare([ Evented ], {

        constructor:function( node )
        {
            console.log( 'html5OnDemand::constructor' );

            this.playerNode = node; //DOM Node

            this.html5Player = new Html5Player();//Instance of HTML5 Playback Class
            this.html5Player.on( 'html5-playback-status', lang.hitch( this, this.__onHTML5PlayerStatus ) );

            this.html5OnDemandNode = this.__createHTML5Elements();//Create div

            this._playbackStatusCallback = null; //Callback function
            this._clickTrackingElementClickedCallback = null; //Callback function

            this._adServerType = null;//Current Ad server type
            this._clickThrough = null; //URL
            this._clickTrackings = null; //Array

            this.onVideoNodeClickHandler = on( this.html5OnDemandNode, 'click', lang.hitch( this, this.__onVideoNodeClick ) );
            this.onVideoNodeTouchHandler = on( this.html5OnDemandNode, 'touchstart', lang.hitch( this, this.__onVideoNodeClick ) );
            this.consumptionAnalytics =  null;
        },


        /*******************************************/
        /************ PUBLIC FUNCTIONS  ************/
        /*******************************************/

        /**
         *
         * Play url
         *
         * @param mediaUrl
         * @param mediaFormat
         *
         * @ignore
         */
        play: function( config )
        {
            this._adServerType = null;

            this.initConsumptionAnalytics( config );
            this.html5Player.play( { url:config.mediaUrl, type:config.mediaFormat, mediaNode:this.audioNode, isLive:false } );
        },

        /**
         *
         * Play Ad url
         *
         * @param mediaUrl
         * @param mediaFormat
         * @param clickThrough
         * @param clickTrackings
         * @param adServerType
         *
         * @ignore
         */
        playAd: function( config )
        {
            this.__initHtml5AdPlayer( this.videoNode );//set videoNode to 100% with black background

            this._clickThrough = config.clickThrough;
            this._clickTrackings = config.clickTrackings;
            this._adServerType = config.adServerType;

            this.html5Player.play( { url:config.mediaUrl, type:config.mediaFormat, mediaNode:this.videoNode, isLive:false } );
        },

        /**
         *
         * Skip
         *
         * @ignore
         */
        skip:function()
        {
            if( this.html5Player == undefined ) return;

            this.html5Player.skip();

            this.__resetHTML5ElementsStyle( this.mediaNode );
        },

        /**
         *
         * Stop
         *
         * @ignore
         */
        stop:function()
        {
            if( this.html5Player == undefined ) return;

            this.html5Player.stop();
        },

        /**
         *
         * Pause
         *
         * @ignore
         */
        pause:function()
        {
            if( this.html5Player == undefined ) return;

            this.html5Player.pause();
        },

        /**
         *
         * Resume
         *
         * @ignore
         */
        resume:function()
        {
            if( this.html5Player == undefined ) return;

            this.html5Player.resume();
        },

        /**
         *
         * Seek
         *
         * @ignore
         */
        seek:function( seekOffset )
        {
            if( this.html5Player == undefined ) return;

            this.html5Player.seek( seekOffset );
        },

        setVolume:function( volumePercent )
        {
            if ( this.html5Player == null ) return;

            this.html5Player.setVolume( volumePercent );
        },

        mute:function()
        {
            if ( this.html5Player == null ) return;

            this.html5Player.mute();
        },

        unMute:function()
        {
            if ( this.html5Player == null ) return;

            this.html5Player.unMute();
        },

        /**
         *
         * Create Media tag (<audio> and <video>) with <source> child node
         *
         */
        initMediaTag:function()
        {
            if( !this.audioNode ){
                this.audioNode = this.__createMediaTag( 'audio' );
            }

            if( !this.videoNode ){
                this.videoNode = this.__createMediaTag( 'video' );
            }

        },


        /**
         *
         * Handler to get playback statuses
         *
         * @param callback
         *
         * @ignore
         */
        setPlaybackStatusHandler:function( callback )
        {
            this._playbackStatusCallback = callback;
        },

        /**
         *
         * Handler to get tracking element click event
         *
         * @param callback
         *
         * @ignore
         */
        setClickTrackingElementClickedHandler:function( callback )
        {
            this._clickTrackingElementClickedCallback = callback;
        },


        /**
         *
         * Clean HTML5 node & tag
         *
         * @ignore
         */
        clean:function()
        {
            if( this.audioNode != null )
            {
                if( has("ie11") )
                {
                    domConstruct.destroy( this.audioNode );
                    this.audioNode = null;
                }
                else
                {
                    if( domAttr.has( this.audioNode, 'src' ) ){
                        domAttr.remove( this.audioNode, 'src' );
                    }

                    if( typeof this.audioNode.webkitExitFullScreen === 'function'){
                        this.audioNode.webkitExitFullScreen();
                    }
                }
            }

            if( this.videoNode != null )
            {
                if( has("ie11") )
                {
                    domConstruct.destroy( this.videoNode );
                    this.videoNode = null;
                }
                else
                {
                    if( domAttr.has( this.videoNode, 'src' ) ){
                        domAttr.remove( this.videoNode, 'src' );
                    }

                    if( typeof window.document.exitFullscreen === 'function'){
                       if(window.document.fullscreen){
                            window.document.exitFullscreen()
                       };
                    }

                    this.__resetHTML5ElementsStyle( this.videoNode );
                }

            }

            this.__createHTML5Elements();
        },

        /*******************************************/
        /************ PRIVATE FUNCTIONS  ***********/
        /*******************************************/

        /**
         *
         * Handle Playback Status Event
         *
         * @param e
         * @private
         */
        __onHTML5PlayerStatus:function( e )
        {
            console.log( 'html5OnDemand::_onHTML5PlayerStatus - type=' + e.type );

            e.adServerType = this._adServerType;

            this.__emitPlaybackStatus( e );
        },

        /**
         *
         * Dispatch Playback Status Event
         *
         * @param e
         * @private
         */
        __emitPlaybackStatus:function( e )
        {
            if ( this._playbackStatusCallback != null )
            {
                var statusMessages = i18n.getLocalization();
                if ( statusMessages == undefined ) return;

                if( !this._adServerType && e.type == 'canPlayThrough')
                    e.type = 'play';

                var msg = this.statusMap[ e.type ];

                if ( msg )
                {
                    statusMsg = (statusMessages[ msg.status ]) ? statusMessages[ msg.status ] : msg.status;
                    codeMsg = (statusMessages[ msg.code ]) ? statusMessages[ msg.code ] : msg.code;
                    this._playbackStatusCallback( { type:statusMsg, code:codeMsg, html5Node: e.mediaNode, adServerType:e.adServerType } );
                }
            }
        },

        __createHTML5Elements:function()
        {
            if( this.html5OnDemandNode == null )
            {
                var onDemandNode = domConstruct.create( 'div' , { id: 'tdplayer_ondemand' }, this.playerNode, "first" );
                return onDemandNode;
            }
        },

        __createMediaTag:function( mediaTagType )
        {
            if( !mediaTagType ) return;

            var node = domConstruct.create( mediaTagType , { id: 'tdplayer_od_'+ mediaTagType +'node', type:mediaTagType }, this.html5OnDemandNode, "first" );
            domAttr.set( node, 'height', '0%' );
            domAttr.set( node, 'width', '0%' );
            domAttr.set( node, 'x-webkit-airplay', 'allow' );//AirPlay support
            var sourceNode = domConstruct.create( 'source' , { id:'tdplayer_od'+ mediaTagType +'source' }, node, "first" );
            domAttr.set( sourceNode, 'src', '' );
            domAttr.set( node, 'playsinline', '' );

            //Required for windows phone. MPJPA-182 - Error: could not complete operation due to error 87b20c01.
            try {
                node.play().catch(function(e){});
                node.pause();
            } catch(err) {
                // console.error('html5OnDemand::__createAudioTag - play/pause failed');
            }

            return node;
        },

        __initHtml5AdPlayer:function( node )
        {
            this.initHTMLElementsStyle( node );

            this.isVideoClicked = false;
        },

        __resetHTML5ElementsStyle:function( node )
        {
            if( !node ) return;

            domStyle.set( node, "width", "0px" );
            domStyle.set( node, "height", "0px" );
            domStyle.set( node, "display", "none" );
        },

        /* TU NE MERITES PAS D'ETRE UNE PUBLIC FUNCTION  */
        initHTMLElementsStyle:function( node )
        {
            if( !node ) return;

            domStyle.set( node, "width", '100%' );
            domStyle.set( node, "height", '100%');
            domStyle.set( node, 'display', 'block' );
            domStyle.set( this.html5OnDemandNode, 'width', '100%' );
            domStyle.set( this.html5OnDemandNode, 'height', '100%' );
            domStyle.set( this.html5OnDemandNode, 'background-color', '#000000' );
            domStyle.set( this.html5OnDemandNode, 'display', 'block' );
        },

        __onVideoNodeClick:function( e )
        {
            if( this._clickThrough == null ) return;

            //HACK DUE TO ANDROID click & touchstart event fired
            if( e.type == 'touchstart' )
                this.onVideoNodeClickHandler.remove();

             this._clickTrackingElementClickedCallback( { clickThrough:this._clickThrough, clickTrackings:this._clickTrackings } );
        },

        initConsumptionAnalytics: function ( config ) 
        {
            if( config.enableOmnyAnalytics && config.omnyOrganizationId != undefined && config.omnyClipId != undefined ) {  
                this.consumptionAnalytics = new ConsumptionAnalytics( this.html5Player);
                this.consumptionAnalytics.init( config.omnyOrganizationId, config.omnyClipId, config.omnySessionId );
            }
        },

        /**
         * Convert html5 playback status code to dojo i18n localized messages
         *
         * @ignore
         */
        statusMap: {
            canPlay: { status:'buffering', code:'MEDIA_BUFFERING' },
            canPlayThrough: { status:'buffering', code:'MEDIA_BUFFERING' },
            dataLoading: { status:'buffering', code:'MEDIA_BUFFERING' },
            emptied: { status:'buffering', code:'MEDIA_BUFFERING' },
            ended: { status:'ended', code:'MEDIA_ENDED' },
            error: { status:'error', code:'MEDIA_ERROR' },
            loadStart: { status:'buffering', code:'MEDIA_BUFFERING' },
            pause: { status:'pause', code:'MEDIA_PAUSED' },
            play: { status:'play', code:'MEDIA_STARTED' },
            stalled: { status:'stop', code:'MEDIA_STOPPED' },
            stop: { status:'stop', code:'MEDIA_STOPPED' },
            suspend: { status:'buffering', code:'MEDIA_BUFFERING' },
            waiting: { status:'buffering', code:'MEDIA_BUFFERING' },
            timeupdate: { status:'timeupdate', code:'MEDIA_TIME_UPDATE' },
            playbackNotAllowed: { status: 'playbackNotAllowed', code: 'PLAY_NOT_ALLOWED' }
        }

    });

    return html5OnDemand;

});
