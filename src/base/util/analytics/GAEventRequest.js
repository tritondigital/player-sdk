/**
 * @module GAEventRequest
 */

var Const = require('sdk/base/util/Const');

define( [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/Deferred',
    'sdk/base/util/analytics/GARequest'
], function ( declare, lang, array, deferred, GARequest ) {

    /**
     * @namespace tdapi/modules/analytics/GAEventRequest
     */
    var GAEventRequest = declare( [ GARequest ], {

        //categories
        CATEGORY_INIT: 'Init',
        CATEGORY_STREAMING: 'Streaming',
        CATEGORY_AD: 'Ad',
        CATEGORY_ON_DEMAND: 'On Demand',
        CATEGORY_LISTENER: 'Listener',
        CATEGORY_DEFAULT: 'Default',

        //actions
        ACTION_CONFIG: 'Config',
        ACTION_CONNECTION: 'Connection',
        ACTION_PREROLL: 'Preroll',
        ACTION_PLAY: 'Play',
        ACTION_STOP: 'Stop',
        ACTION_PAUSE: 'Pause',
        ACTION_RESUME: 'Resume',
        ACTION_TRACKING: 'Tracking',
        ACTION_MUTE: 'Mute',
        ACTION_UNMUTE: 'Unmute',

        //labels
        LABEL_SUCCESS: 'Success',
        LABEL_ERROR: 'Error',
        LABEL_STREAM_ERROR: 'Stream Error',
        LABEL_GEOBLOCKING: 'Geoblocking',
        LABEL_UNAVAILABLE: 'Unavailable',
        LABEL_TRACK: 'Track',
        LABEL_CUSTOM: 'Custom',
        LABEL_SPEECH: 'Speech',
        LABEL_BREAK: 'Break',
        LABEL_END_BREAK: 'End Break',
        LABEL_SMART: 'Smart',
        LABEL_DUMB: 'Dumb',

        /**
         * constructor
         */
        constructor: function( ){

            console.log('GAEventRequest::constructor');
            this.inherited( arguments );
            this.broadcasters = Array();

        },

        /**
         * requestGA
         *  @param category String
         *  @param action String
         *  @param label String
         *  @param dimensions object array
         *  @param metrics object array
         */
        requestGA: function( category, action, label, dimensions, metrics ){

            console.log('GAEventRequest::requestGA');

            //validate
            var self = this;
            var object = {};
            lang.mixin( object, { ec : category } );
            lang.mixin( object, { ea : action } );
            lang.mixin( object, { el : label } );
            lang.mixin( object, { t : 'event' } );
            lang.mixin( object, dimensions );
            lang.mixin( object, metrics );

            if( this.validate( object, category, action, label ) ){

                if( object[ this.DIM_STATION ] || object[ this.DIM_MOUNT ] ) {
                    //get broadcaster
                    if( this.broadcasters[ object[ this.DIM_MOUNT ] ] ) {
                        //merge broadcaster avec current object
                        var tmpObj = {};
                        tmpObj[ this.DIM_BROADCASTER ] = this.broadcasters[ object[ this.DIM_MOUNT ] ];
                        lang.mixin( object, tmpObj );
                        this.request( object );
                    } else {
                        this._getBroadcaster( object[ this.DIM_MOUNT ] )
                        .then( function( broadcaster ){

                            //success
                            self.broadcasters[ object[ self.DIM_MOUNT ] ] = broadcaster;
                            var tmpObj = {};
                            tmpObj[ self.DIM_BROADCASTER ] = broadcaster; //old school
                            lang.mixin( object, tmpObj );
                            self.request( object );

                        }, function(){

                            //error
                            self.request( object );

                        } );
                    }

                } else {

                    this.request( object );

                }

            } else {

                //error
                console.log( 'error requestGA' );
            }

        },

        /**
         * getBroadcaster
         */
         _getBroadcaster: function(){

             var def = new deferred();
             def.reject( ); //@TODO with real broadcaster service

             return def.promise;

         },

        /**
         * validate
         * @param object | object
         * @param category | String
         * @param action | String
         * @param label | String
         */
        validate: function( object, category, action, label ){

            var valid = false;

            if ( this.validateType( object ) ){

                switch ( category ) {
                    case this.CATEGORY_INIT:
                        valid = this.validateInitConfig( object );
                        break;
                    case this.CATEGORY_STREAMING:
                            switch ( action ) {
                                case this.ACTION_CONNECTION:
                                    if ( this.validateStreamingConnection( object ) ){
                                        switch ( label ) {
                                            case this.LABEL_SUCCESS:
                                                valid = this.validateStreamingConnectionSuccess( object );
                                                break;
                                            case this.LABEL_STREAM_ERROR:
                                                valid = this.validateStreamingConnectionStreamError( object );
                                                break;
                                            case this.LABEL_GEOBLOCKING:
                                                valid = this.validateStreamingConnectionGeoblocking( object );
                                                    break;
                                            default:
                                                valid = true;
                                        }
                                    } else {
                                        valid = false;
                                    }
                                    break;
                            } //end action

                        break;

                    case this.CATEGORY_AD:
                        switch ( action ) {
                            case this.ACTION_PREROLL:
                                if( this.validateAdPreroll( object ) ){
                                    valid= true;
                                } else {
                                    return false;
                                }
                                break;
                        } //end action
                        break;
                    case this.CATEGORY_ON_DEMAND:
                        valid = this.validateOnDemand( object );
                        break;
                    case this.CATEGORY_LISTENER:
                        valid = this.validateListener( object );
                        break;
                    case this.CATEGORY_DEFAULT:
                        valid = true;
                        break;

                }
            }

            return valid;

        },

        /**
         * ValidateType
         * @param object | object
         */
         validateType: function( object ){

            console.log('GAEventRequest::validateType');

            if( !_validateObject(object, this.TYPE, 'event' )  ) return false;

            return true;
        },

        /**
         * validateInitConfig
         * @param object | object
         */
        validateInitConfig: function( object ){

            console.log('GAEventRequest::validateInitConfig');

            if( !_validateObject( object, this.CATEGORY, 'Init') ) return false;
            if( !_validateObject( object, this.ACTION, 'Config' ) ) return false;
            if( !_validateObject( object, this.LABEL, [ 'Success','Error' ] ) ) return false;

            //dimensions
            if( !_validateObject( object, this.DIM_TECH, [ 'Flash','Html5' ] ) ) return false;
            if( !_validateObject( object, this.DIM_ADBLOCK, [ 'true','false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_SBM, [ 'true','false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_HLS, [ 'true','false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_AUDIO_ADAPTIVE, [ 'true','false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_IDSYNC, [ 'true','false' ] ) ) return false;

            // //metrics
            if( !_validateNotEmptyValue( object, this.METRIC_LOAD_TIME )  ) return false;

            return true;

        },

        /**
        * validateStreamingConnectionSuccess
        * @param object | object
        */
        validateStreamingConnectionSuccess: function( object ){

            console.log( 'GAEventRequest::validateStreamingConnectionSuccess' );

            if( !_validateObject( object, this.DIM_MEDIA_TYPE, [ Const.AUDIO, Const.VIDEO ] ) ) return false;
            if( !_validateObject( object, this.DIM_HLS, [ 'true', 'false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_AUDIO_ADAPTIVE, [ 'true', 'false' ] ) ) return false;

            if( !_validateNotEmptyValue( object, this.METRIC_CONNECTION_TIME ) ) return false;

            return true;

        },

        /**
        * validateStreamingConnectionStreamError
        * @param object | object
        */
        validateStreamingConnectionStreamError: function( object ){

            console.log( 'GAEventRequest::validateStreamingConnectionStreamError' );

            if( !_validateObject( object, this.DIM_MEDIA_FORMAT, [ 'AAC', 'MP3', 'FLV' ] ) ) return false;
            if( !_validateObject( object, this.DIM_HLS, [ 'true', 'false' ] ) ) return false;
            if( !_validateObject( object, this.DIM_AUDIO_ADAPTIVE, [ 'true', 'false' ] ) ) return false;

            if( !_validateNotEmptyValue( object, this.METRIC_STREAM_ERROR_TIME ) ) return false;

            return true;

        },

        /**
        * validateStreamingConnectionGeoblocking
        * @param object | object
        */
        validateStreamingConnectionGeoblocking: function( object ){

            console.log( 'GAEventRequest::validateStreamingConnectionGeoblocking' );

            if( !_validateNotEmptyValue( object, this.DIM_ALTERNATE_CONTENT, [ 'true', 'false' ] ) ) return false;

            return true;

        },

        /**
        * validateStreamingConnection
        * @param object | object
        */
        validateStreamingConnection: function( object ){

            console.log('GAEventRequest::validateStreamingConnection');

            if( !_validateObject( object, this.CATEGORY, 'Streaming' ) ) return false;
            if( !_validateObject( object, this.ACTION, 'Connection' ) ) return false;
            if( !_validateObject( object, this.LABEL, [ 'Success', 'Unavailable', 'Stream Error', 'Geoblocking', 'Failed' ] ) ) return false;

            //dimensions
            if( !_validateNotEmptyValue( object, this.DIM_MOUNT ) && !_validateNotEmptyValue( object, this.DIM_STATION ) ) return false;

            return true;

        },

        /**
        * validateAdPreroll
        * @param object | object
        */
        validateAdPreroll: function( object ){

            console.log( 'GAEventRequest::validateAdPreroll' );

            if( !_validateObject( object, this.CATEGORY, 'Ad' ) ) return false;
            if( !_validateObject( object, this.ACTION, 'Preroll' ) ) return false;
            if( !_validateObject( object, this.LABEL, [ 'Success', 'Error' ] ) ) return false;

            //dimensions
            if( !_validateObject( object, this.DIM_AD_SOURCE, [ 'TAP', 'CM3', 'Others' ] ) ) return false;
            if( !_validateObject( object, this.DIM_AD_FORMAT, [ 'VAST', 'DAAST'])  ) return false;
            if( !_validateObject( object, this.DIM_AD_PARSER, [ 'IMA', 'VASTModule', 'Direct' ] ) ) return false;

            //metric
            if( !_validateNotEmptyValue( object, this.METRIC_CONNECTION_TIME ) ) return false;

            return true;

        },


        /**
        * validateListener
        * @param object | object
        */
        validateOnDemand: function( object ){

            console.log( 'GAEventRequest::validateOnDemand' );

            if( !_validateObject( object, this.CATEGORY, 'On Demand') ) return false;
            if( !_validateObject( object, this.ACTION, 'Play' ) ) return false;
            if( !_validateObject( object, this.LABEL, [ 'Success', 'Error' ] ) ) return false;

            return true;

        },

        /**
        * validateListener
        * @param object | object
        */
        validateListener: function( object ){

            console.log( 'GAEventRequest::validateListener' );

            if( !_validateObject( object, this.CATEGORY, 'Listener') ) return false;
            if( !_validateObject( object, this.ACTION, 'Tracking' ) ) return false;
            if( !_validateObject( object, this.LABEL, [ 'Smart', 'Dumb' ] ) ) return false;

            //dimensions
            if( !_validateNotEmptyValue( object, this.DIM_MOUNT ) && !_validateNotEmptyValue( object, this.DIM_STATION ) ) return false;

            return true;

        }

    });

    /**
     * validateObject
     * @param object | object
     * @param key | String
     * @param validValue | String
     */
    function _validateObject( object, key, validValue ){

        if( lang.isArray( validValue ) ){

            var valid = false;
            array.forEach( validValue, function( item, i ){

                if ( _validateValidValue( object, key, item ) ) {
                    valid = true;
                }

            } );

            return valid;

        } else {

            return _validateValidValue( object, key, validValue );

        }
    }

    /**
     * _validateValidValue
     * @param object | object
     * @param key | String
     * @param validValue | String
     */
    function _validateValidValue( object, key, validValue ){

        if( !_validateNotEmptyValue( object, key )
            || object[ key ].toString() != validValue.toString() ){

            return false;

        }

        return true;
    }

    /**
     * _validateNotEmptyValue
     * @param object | object
     * @param key | String
     */
    function _validateNotEmptyValue(object, key){

        if( !object.hasOwnProperty( key )
            || object[key] == null
            || object[key].toString() == ""
            || object[key] === undefined ){

            return false;
        }

        return true;
    }


    //singleton
    if ( this.GAEventRequestInstance == null ){

        this.GAEventRequestInstance = new GAEventRequest( );

    }

    return this.GAEventRequestInstance;

} );
