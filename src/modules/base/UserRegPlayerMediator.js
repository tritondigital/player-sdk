/**
 * User Registration Player Mediator:
 * for a TdPlayerApi player instance with both modules 'MediaPlayer' and 'UserRegistration', this mediator will take actions when user logs-in, logs-out to play specific mounts (i.e. registered mounts for registered users).
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on'
], function(declare, lang, on) {

    var module = declare([ ], {

        TDAS_REG_ONLY:'tdas-reg-only',

        constructor:function( getModuleById, target )
        {
            console.log('userRegPlayerMediator::constructor');

            this.mediaPlayer = getModuleById('MediaPlayer');
            this.userRegistration = getModuleById('UserRegistration');

            this.mediaPlayer.addHqTag( this.TDAS_REG_ONLY );

            on( target, 'stream-start', lang.hitch(this, this._onStreamStarted) );
            on( target, 'stream-stop', lang.hitch(this, this._onStreamStopped) );

            on( target, 'user-logged-out', lang.hitch(this, this._onUserLoggedOut) );
            on( target, 'user-details', lang.hitch(this, this._onUserDetails) );

            this.inherited(arguments);
        },

        /**
         * Stream started - trigger event to User Registration module
         *
         * @private
         */
        _onStreamStarted:function()
        {
            this.userRegistration.triggerEvent( 'playerStart' );
        },

        /**
         * Stream stopped - trigger event to User Registration module
         *
         * @private
         */
        _onStreamStopped:function()
        {
            this.userRegistration.triggerEvent( 'playerStop' );
        },

        /**
         * User logged out
         * @param result
         * @private
         */
        _onUserLoggedOut:function(result)
        {
            console.log('userRegPlayerMediator::_onUserLoggedOut');
            console.log(result);

            this._removeUserParameters();

            this.mediaPlayer.disableHQ();
        },

        /**
         * User Details
         * Access to tdas reg tagged mounts is now allowed - if stream is playing, stop the stream and restart it.
         *
         * tdas-vid - <tenant-id>.<vid>
         * tdas-utags - tdas-reg
         * tdas-utcheck - User Tags Validation Hash returned by TDAS, as-is.
         *
         * Callback result example:
         * { dob:'1980-01-01', gender:'male', zip:'00000', vid:'123456', "tdas":{"user-id":"see_10107....","user-tags":"tdas-reg","user-tags-hash":"..."} }
         *
         * @param result
         * @private
         */
        _onUserDetails:function(result)
        {
            console.log('userRegPlayerMediator::_onUserDetails');
            console.log(result);

            if (!result.data && !result.data) return;

            var userData = {};

            //dob expected format is YYYY-MM-DD. result.data.dob format is: mm/dd/yyyy
            if (result.data.dob) {
                var dobArr = result.data.dob.split('/');
                userData.dob = dobArr[2] + '-' + dobArr[0] + '-' + dobArr[1];
            }

            if (result.data.gender) {
                userData.gender = result.data.gender.substr(0, 1).toLowerCase();
            }

            if (result.data.zip) {
                userData.postalcode = result.data.zip;
            }

            if (result.data.country) {
                userData.country = result.data.country;
            }

            if (result.data.vid) {
                userData['tdas-vid'] = this.userRegistration.tenantId.toString() + '.' + result.data.vid.toString();
            }

            if (result.data.tdas) {
                userData['tdas-utags'] = result.data.tdas['user-tags'];
                userData['tdas-utcheck'] = result.data.tdas['user-tags-hash'];
            }

            if ( this.mediaPlayer.config.defaultTrackingParameters == undefined ) {
                this.mediaPlayer.config.defaultTrackingParameters = {};
            }

            //Merge the default tracking parameters with the user data
            this.mediaPlayer.config.defaultTrackingParameters['user'] = userData;

            this.mediaPlayer.enableHQ();
        },

        _removeUserParameters:function()
        {
            this.mediaPlayer.config.defaultTrackingParameters['user'] = {};
        }

    });

    return module;

} );