/**
 * @module ImaSdk
 *
 * @desc
 * Google IMA SDK Module
 */

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'sdk/modules/ad/base/AdModule',
    'sdk/base/ad/TritonRunSpot4Helper',
    'sdk/base/ad/AdServerType',
    'dojo/has'
], function ( declare, lang, adModule, TritonRunSpot4Helper, AdServerType, has ) {


    var ImaSdkModule = declare([ adModule ], {

        VAST_COMPANIONS_PRIORITY : ['static','iframe','html'],
        IMA_LIBRARY_URL: '//imasdk.googleapis.com/js/sdkloader/ima3.js',

        _videoContent: null,
        _countdownTimer: null,
        _adDisplayContainer: null,
        _currentAd: null,
        _adsLoader: null,
        _adsRequest: null,
        _adsManager: null,
        _currentAdConfig: null,

        /**
         * constructor
         * @param target
         * @param config
         */
        constructor:function (target, config) {

            console.log( 'ImaSdkModule::constructor' );

            this.config = config;
            this._imaSdkLoaded = false;
        },

        /**
         * init
         * @param adConfig
         */
        init:function (adConfig) {

            console.log( 'ImaSdkModule::init' );

            //clean up
            this._destroy();
            this._currentAdConfig = adConfig;
            this.createAdDisplayContainer();

        },

        /**
         * destroyAd
         */
        destroyAd:function( shouldRemoveAdsRef ){

            console.log( 'ImaSdkModule::destroyAd' );

            this._destroy( shouldRemoveAdsRef );

            if( shouldRemoveAdsRef != false ){
               this.emit( this.AD_MODULE_PLAYBACK_DESTROY );
            }

        },

        /**
         * skipdAd
         */
        skipAd:function() {

            console.log('ImaSdkModule::skipAd');

            if( this._adsManager && this._adsManager.getAdSkippableState() ){
                this._adsManager.skip();

            } else {

              console.log('skipAd - current Ad is not skippable');

               this.emit( this.AD_MODULE_SKIPPABLE_STATE, { state: this._adsManager.getAdSkippableState()  } );
            }
        },


        /**
         * createAdDisplayContainer
         * @param elementId
         */
        createAdDisplayContainer:function () {

            console.log('ImaSdkModule::createAdDisplayContainer');

            this._videoContent = document.getElementById('tdplayer_od_videonode');           

            if( !this._adDisplayContainer  ){
                this._adDisplayContainer = new google.ima.AdDisplayContainer( document.getElementById( this.config.playerId ), this._videoContent );
                this._adDisplayContainer.initialize();
            }
            this.requestAds();
        },

        /**
         * requestAds
         *
         */
        requestAds:function () {

            console.log('ImaSdkModule::requestAds');

            this._adsLoader = new google.ima.AdsLoader( this._adDisplayContainer );

            // Listen and respond to ads loaded and error events.
            this._adsLoader.addEventListener( google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, lang.hitch( this, this._onAdsManagerLoaded ), false );
            this._adsLoader.addEventListener( google.ima.AdErrorEvent.Type.AD_ERROR, lang.hitch( this, this._onAdError ), false );

            this._adsRequest = new google.ima.AdsRequest();

            //get vast url
            if( this._currentAdConfig.url !== undefined )
            {
                this._adsRequest.adTagUrl = this._currentAdConfig.url + ((this.config.allowPersonalisedAds == undefined || this.config.allowPersonalisedAds ) ? "" : "&npa=1");

            } else if ( this._currentAdConfig.sid !== undefined ) {

                var tritonRunSpot4Helper = new TritonRunSpot4Helper();
                var vastUrl = tritonRunSpot4Helper.getVastUri( tritonRunSpot4Helper.ENDPOINT, this._currentAdConfig.sid, this._currentAdConfig.mediaformat );

                this._adsRequest.adTagUrl = vastUrl;

            } else if ( this._currentAdConfig.rawXML !== undefined ) {

                this._adsRequest.adsResponse = this._currentAdConfig.rawXML;
            }

            this._adsLoader.requestAds(this._adsRequest);
        },

        /**
         * _onAdsManagerLoaded
         * @param adsManagerLoadedEvent
         * @private
         */
        _onAdsManagerLoaded:function ( adsManagerLoadedEvent ) {

            console.log('ImaSdkModule::_onAdsManagerLoaded');
            var self = this;
            var adsRenderingSettings = new google.ima.AdsRenderingSettings();

            this._adsManager = adsManagerLoadedEvent.getAdsManager( this._videoContent, adsRenderingSettings );

            if( this._adsManager !== undefined ) {

                //base events
                this._adsManager.addEventListener( google.ima.AdEvent.Type.STARTED, lang.hitch( this, this._onCompanionsReady ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.STARTED, lang.hitch( this, this._onStarted ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.ALL_ADS_COMPLETED, lang.hitch( this, this._onAllAdsCompleted ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, lang.hitch( this, this._onContentResumeRequested ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.RESUMED, lang.hitch( this, this._onResumed ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.PAUSED, lang.hitch( this, this._onAdPaused ) );

                //Quartile events
                this._adsManager.addEventListener( google.ima.AdEvent.Type.STARTED, lang.hitch( this, this._onQuartileEvent ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.FIRST_QUARTILE, lang.hitch( this, this._onQuartileEvent ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.MIDPOINT, lang.hitch( this, this._onQuartileEvent ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.THIRD_QUARTILE, lang.hitch( this, this._onQuartileEvent ) );
                this._adsManager.addEventListener( google.ima.AdEvent.Type.COMPLETED, lang.hitch( this, this._onQuartileEvent ) );

                //error event
                this._adsManager.addEventListener( google.ima.AdErrorEvent.Type.AD_ERROR, lang.hitch( this, this._onAdError ) );


                //size handler
                var startWidth = document.getElementById( this.config.playerId ).offsetWidth;
                var startHeight = document.getElementById( self.config.playerId ).offsetHeight;

                this.resizeHandler= setInterval(function () {

                    if( startWidth != document.getElementById( self.config.playerId ).offsetWidth ){

                        startWidth = document.getElementById( self.config.playerId ).offsetWidth;
                        startHeight = document.getElementById( self.config.playerId ).offsetHeight;

                        self._adsManager.resize( startWidth, startHeight, google.ima.ViewMode.NORMAL );

                        //resize if ios
                        self._resizeVideoTag(startWidth, startHeight);
                    }

                },250);

                //resize if ios
                this._resizeVideoTag(startWidth, startHeight);


                try {

                    var width = document.getElementById( this.config.playerId ).offsetWidth;
                    var height = document.getElementById( this.config.playerId ).offsetHeight;

                    this._adsManager.init( width, height, google.ima.ViewMode.NORMAL );
                    this._adsManager.start();

                } catch ( adError ) {
                    // An error may be thrown if there was a problem with the VAST response.
                }
            }
        },


        /**
         * _resizeVideoTag
         * Specific for ios
         * @param offsetWidth
         * @param offsetHeight
         * @private
         */
        _resizeVideoTag: function( offsetWidth, offsetHeight ){

            console.log('ImaSdkModule::_resizeVideoTag');
            var videoElement = document.getElementById( 'tdplayer_od_videonode' );

            if(  has("ios") != undefined && videoElement ){

                videoElement.width = offsetWidth;
                videoElement.height = offsetHeight;

            }else if ( videoElement  ){
                videoElement.style.width = '0px';
                videoElement.style.height = '0px';
            }

        },

        /**
         * _onAdPaused
         * @private
         */
        _onAdPaused: function(){

            console.log('ImaSdkModule::_onAdPaused');

            this._removeCountdownTimer();
            this._adsManager.resume();

        },

        /**
         * _onResumed
         * @param adEvent
         * @private
         */
        _onResumed:function( adEvent ){

            console.log('ImaSdkModule::_onResumed');

            var self = this;
            if( this._adsManager ){

                this._countdownTimer = setInterval( function() {
                    var timeRemaining = parseInt( self._adsManager.getRemainingTime() );
                    self._onRemainingTimeChanged( timeRemaining );
                }, 250);

            }
        },

        /**
         * _onStarted
         * @param adEvent
         * @private
         */
        _onStarted:function( adEvent ) {

            console.log('ImaSdkModule::_onStarted');

            var self = this;

            this._removeCountdownTimer();

            this._currentAd = adEvent.getAd();

            this._countdownTimer = setInterval( function() {
                var timeRemaining = parseInt( self._adsManager.getRemainingTime() );
                self._onRemainingTimeChanged( timeRemaining );
            }, 250);

            this.emit( this.AD_MODULE_PLAYBACK_START, { type: AdServerType.VAST_AD } );
        },

        /**
         * _onAllAdsCompleted
         * @param adEvent
         * @private
         */
        _onAllAdsCompleted:function( adEvent ) {

            console.log('ImaSdkModule::_onAllAdsCompleted');

            this._destroy();
            this.emit( this.AD_MODULE_PLAYBACK_COMPLETE , { type: AdServerType.VAST_AD } );
        },

        /**
         * _onRemainingTimeChanged
         * @param remainingTime
         * @private
         */
        _onRemainingTimeChanged:function( remainingTime ) {

            console.log('ImaSdkModule::_onRemainingTimeChanged');

            this.emit( this.AD_MODULE_COUNTDOWN, { countDown: remainingTime } );
        },

        /**
         * _onContentResumeRequested
         * @param adEvent
         * @private
         */
        _onContentResumeRequested:function( adEvent ) {

            console.log('ImaSdkModule::_onContentResumeRequested');

            this._removeCountdownTimer();//stop coundown timer
        },

        /**
         * _clearInterval
         * @private
         */
        _removeCountdownTimer:function(){

            console.log('ImaSdkModule::_removeCountdownTimer');

            if ( this._countdownTimer ) {
                clearInterval( this._countdownTimer );
            }

        },

        /**
         * _onAdError
         * @param adErrorEvent
         * @private
         */
        _onAdError: function ( adErrorEvent ) {

            console.log('ImaSdkModule::_onAdError');
            console.log( adErrorEvent );

            this.emit( this.AD_MODULE_PLAYBACK_ERROR, { error: {message: adErrorEvent.getError().getMessage(), code: adErrorEvent.getError().getErrorCode() } } );

            this._destroy();
        },

        /**
         * _onCompanionsReady
         * @param adEvent
         * @private
         */
        _onCompanionsReady: function ( adEvent ) {

            console.log('ImaSdkModule::_onCompanionsReady');

            if( this.config.companionAdSelectionSettings == undefined || this.config.companionAdSelectionSettings.elements == undefined ) return;

            var companionAdSelectionSettings = new google.ima.CompanionAdSelectionSettings();

            var vastCompanionPriorities = ( this.config.companionAdSelectionSettings.vastCompanionPriority !== undefined ) ? this.config.companionAdSelectionSettings.vastCompanionPriority : this.VAST_COMPANIONS_PRIORITY;
            var companions = [];

            for( var i = 0; i < this.config.companionAdSelectionSettings.elements.length; i++ ) {

                var element = this.config.companionAdSelectionSettings.elements[i];

                for (var j = 0; j < vastCompanionPriorities.length; j++) {
                    var vastCompanionPriority = vastCompanionPriorities[j];

                    companionAdSelectionSettings.creativeType = google.ima.CompanionAdSelectionSettings.CreativeType.ALL;
                    companionAdSelectionSettings.sizeCriteria = google.ima.CompanionAdSelectionSettings.SizeCriteria.SELECT_EXACT_MATCH;

                    switch( vastCompanionPriority )
                    {
                        case  'static':
                            companionAdSelectionSettings.resourceType = google.ima.CompanionAdSelectionSettings.ResourceType.STATIC;
                            break;

                        case  'html':
                            companionAdSelectionSettings.resourceType =  google.ima.CompanionAdSelectionSettings.ResourceType.HTML;
                            break;

                        case  'iframe':
                            companionAdSelectionSettings.resourceType =  google.ima.CompanionAdSelectionSettings.ResourceType.IFRAME;
                            break;

                    }

                    var tmpCompanion = adEvent.getAd().getCompanionAds(  element.width, element.height, companionAdSelectionSettings );

                    if( tmpCompanion.length > 0 )
                    {
                        var vastCompanion  = new Object()
                        vastCompanion.width = element.width;
                        vastCompanion.height = element.height;
                        vastCompanion.content = tmpCompanion[0].getContent();//we should not get two companion of the same size/type but in the case of....
                        vastCompanion.resourceType = new Object();
                        vastCompanion.resourceType.name = vastCompanionPriority;
                        companions.push( vastCompanion );
                        break;
                    }

                }
            }

            if( companions.length > 0 )
            {
                this.emit( this.AD_MODULE_COMPANIONS, {companions: companions} );
            }

        },

        /**
         * _onQuartileEvent
         * @param adEvent
         * @private
         */
        _onQuartileEvent: function ( adEvent ) {

            console.log('ImaSdkModule::_onQuartileEvent');

            switch( adEvent.type ){

                case google.ima.AdEvent.Type.STARTED :
                    this.emit( this.AD_MODULE_QUARTILE, { adQuartile: this.adQuartile.getQuartileByIndex( 0 ), error:false } );
                    break;

                case google.ima.AdEvent.Type.FIRST_QUARTILE :
                    this.emit( this.AD_MODULE_QUARTILE, { adQuartile: this.adQuartile.getQuartileByIndex( 1 ), error:false } );
                    break;

                case google.ima.AdEvent.Type.MIDPOINT :
                    this.emit( this.AD_MODULE_QUARTILE, { adQuartile: this.adQuartile.getQuartileByIndex( 2 ), error:false } );
                    break;

                case google.ima.AdEvent.Type.THIRD_QUARTILE :
                    this.emit( this.AD_MODULE_QUARTILE, { adQuartile: this.adQuartile.getQuartileByIndex( 3 ), error:false } );
                    break;

                case google.ima.AdEvent.Type.COMPLETED :
                    this.emit( this.AD_MODULE_QUARTILE, { adQuartile: this.adQuartile.getQuartileByIndex( 4 ), error:false } );
                    break;

                default :
                    break;
            }

        },

        /**
         * _destroy
         * @private
         */
        _destroy: function( shouldRemoveAdsRef ){

            console.log('ImaSdkModule::_destroy');

            if( shouldRemoveAdsRef ){
                if( this._adDisplayContainer ){
                    this._adDisplayContainer.destroy();
                }

                if( this._adsLoader ){
                    this._adsLoader.destroy();
                }

                if( this._adsManager ){
                    this._adsManager.destroy();
                }
            }

            if ( this.resizeHandler ){
                clearInterval( this.resizeHandler );
            }

            this._resizeVideoTag(0, 0);


            // exit full-screen
            if( this._videoContent ){
                if ( typeof this._videoContent.exitFullscreen === 'function' ) {
                    this._videoContent.exitFullscreen();
                } else if ( typeof this._videoContent.webkitExitFullscreen === 'function' ) {
                    this._videoContent.webkitExitFullscreen();
                } else if ( typeof this._videoContent.mozCancelFullScreen === 'function' ) {
                    this._videoContent.mozCancelFullScreen();
                } else if ( typeof this._videoContent.msExitFullscreen === 'function' ) {
                    this._videoContent.msExitFullscreen();
                }
            }

            this._removeCountdownTimer();
        }



    });

    return ImaSdkModule;
});
