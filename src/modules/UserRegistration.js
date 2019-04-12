/**
 * @module UserRegistration
 *
 * @desc
 * Load the See api file<br>
 * <h5>Events fired:</h5><br>
 * module-ready<br>
 * module-error<br>
 * see-api-loaded<br>
 * see-api-error<br>
 * see-gate-event<br>
 * see-regapi-not-ready<br>
 * see-metaapi-not-ready<br>
 * user-logged-in<br>
 * user-login-error<br>
 * user-logged-out<br>
 * user-logout-error<br>
 * user-details<br>
 * user-details-error<br>
 * social-connect<br>
 * social-connect-error<br>
 * register-fields<br>
 * register-fields-error<br>
 * register-user<br>
 * register-user-error<br>
 * user-update<br>
 * user-update-error<br>
 * forgot-password<br>
 * forgot-password-error<br>
 * reset-password<br>
 * reset-password-error<br>
 * meta-set<br>
 * meta-set-error<br>
 * meta-get<br>
 * meta-get-error<br>
 * meta-update<br>
 * meta-update-error<br>
 * meta-delete<br>
 * meta-delete-error<br>
 * meta-clear<br>
 * meta-clear-error<br>
 * meta-list<br>
 * meta-list-error<br>
 * cookie-test-pass<br>
 * cookie-test-fail<br>
 */

var LazyLoad = require('sdk/base/util/LazyLoad');
var Platform = require('sdk/base/util/Platform');

define( [
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'sdk/modules/base/CoreModule'
], function ( declare, lang, Deferred, coreModule ) {

	/**
	 * @namespace tdapi/modules/UserRegistration
	 */
	var module = declare( [ coreModule ], {

		constructor: function ( config, target ) {
			console.log( 'userRegistration::constructor' );

			this.inherited( arguments );

			this.see = null;
			this.seeRegApi = null;
			this.seeMetaApi = null;

			//Settings to build the SEE api URL
			this.tenantId = config.tenantId;
			this.seeApiUrl = config.seeApiUrl;

			this.platform = new Platform( config.platformId );
		},

		start: function () {
			console.log( 'userRegistration::start' );

			this.emit( 'module-ready', {
				id: 'UserRegistration',
				module: this
			} );
		},

		init: function () {

			var seeApiUrl = ( ( this.seeApiUrl != undefined ) ? this.seeApiUrl : this.platform.endpoint.see ).replace( '{tenantId}', this.tenantId );

			var def = new Deferred();

			LazyLoad.js( seeApiUrl, function(){
                 def.resolve();
            } );


			var successCallback = lang.hitch( this, this._seeApiLoaded );
			var errorCallback = lang.hitch( this, this._seeApiError );

			def.then( function () {
				window._See.bindEvent( 'RegApiReady', successCallback );
			}, function ( err ) {
				errorCallback();
			}, function ( update ) {
				// Do something when the process provides progress information
			} );

		},

		/**
		 * Event function called when the _See.regApi object is loaded
		 *
		 * @return null
		 */
		_seeApiLoaded: function () {
			//execute code only once the see-api.js library has loaded
			console.log( 'userRegistration::_seeApiLoaded' );

			this.see = window._See; //_See base object that will expose the data interfaces
			this.seeRegApi = ( window._See ) ? window._See.regApi : undefined;
			this.seeMetaApi = ( window._See ) ? window._See.metaApi : undefined;

			// Set source for see to StreamingPlayer
			this.see.source = "StreamingPlayer";

			if ( this.see != undefined ) {
				// Bind an event to MetaApiReady at which point all apis will be loaded and
				// initialized.
				this.see.bindOrFireEvent( 'metaApiReady', lang.hitch( this, function () {

					// Announce that the See api is ready
					this.emit( 'see-api-loaded' );

					if ( this.isLoggedIn() ) {
						this.emit( 'user-logged-in' );
					}

				} ) );
			} else {
				// Error handler if See has not loaded properly
				this._seeApiError();
			}
		},

		/**
		 * Event function called when the _See.regApi object fails to load
		 *
		 * @return null
		 */
		_seeApiError: function () {
			console.log( 'userRegistration::_seeApiError' );

			// Announce that the See api failed to load
			this.emit( 'see-api-error' );
		},

		/**
		 * SEE Login API method
		 *
		 * This method takes an object params to process a SEE login:
		 *
		 * params must contain a "method" which will either be:
		 *   "Userpwd" for email/password login
		 *   "Facebook" for Facebook login
		 *   "Google" for Google login
		 *
		 * If the method is Userpwd then there must also be a "username" and "password"
		 *
		 * @param params object Object storing details about the login
		 *
		 * @return null
		 */
		login: function ( params ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::login' );

			switch ( params.method ) {
			case 'Userpwd':
				this.seeRegApi.login( params.username, params.password, params.persist, lang.hitch( this, this._onLoginHandler ) );
				break;

			case 'Facebook':
				this.seeRegApi.loginFacebook( lang.hitch( this, this._onLoginHandler ) );
				break;

			case 'Google':
				this.seeRegApi.loginGoogle( lang.hitch( this, this._onLoginHandler ) );
				break;

			default:
				break;
			}
		},

		/**
		 * SEE connect to social API call
		 *
		 * This method is used to connect the currently logged in user's account
		 * with the passed in social network. It uses the same login functions
		 * as the login method but with a different callback which emits a diff
		 * event.
		 *
		 * @param network string Social network to connect to
		 *
		 * @returns null
		 */
		connectSocial: function ( network ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::connectSocial' );

			switch ( network ) {
			case 'Facebook':
				this.seeRegApi.loginFacebook( lang.hitch( this, this._onConnectSocialHandler ) );
				break;

			case 'Google':
				this.seeRegApi.loginGoogle( lang.hitch( this, this._onConnectSocialHandler ) );
				break;

			default:
				break;
			}
		},

		/**
		 * Removes a social network connection for a user to a particular network
		 *
		 * @param network string Social network to connect to
		 *
		 * @returns null
		 */
		removeSocial: function ( network ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::removeSocial' );

			switch ( network ) {
			case 'Facebook':
				this.seeRegApi.removeSocial( 'facebook', lang.hitch( this, this._onRemoveSocialHandler ) );
				break;

			case 'Google':
				this.seeRegApi.removeSocial( 'google', lang.hitch( this, this._onRemoveSocialHandler ) );
				break;

			default:
				break;
			}
		},

		/**
		 * Getter for the _See.config.user.is_loggedin
		 *
		 * @return boolean User logged in (true or false)
		 */
		isLoggedIn: function () {
			return this.see.config.user.is_loggedin;
		},

		/**
		 * SEE logout API method
		 *
		 * Logs the user out of SEE using the SEE regApi logout call
		 *
		 * @return null
		 */
		logout: function () {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::logout' );

			this.seeRegApi.logout( lang.hitch( this, this._onLogoutHandler ) );
		},

		/**
		 * SEE forgotPassword API method
		 *
		 * Calls the forgotPassword method on the SEE api for the given username
		 *
		 * @param username string User's email address
		 * @param reseturl string [optional] Reset link to use for user password reset
		 *
		 * @return null
		 */
		forgotPassword: function ( username, reseturl ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::forgotPassword' );

			this.seeRegApi.forgotPassword( username, lang.hitch( this, this._onForgotPasswordHandler ), reseturl );
		},

		/**
		 * SEE resetPassword API method
		 *
		 * Calls the resetPassword method on the SEE api for the given username
		 *
		 * @param token    string StickyFish reset password token
		 * @param password string User's new password
		 *
		 * @return null
		 */
		resetPassword: function ( token, password ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::resetPassword' );

			this.seeRegApi.resetPassword( token, password, lang.hitch( this, this._onResetPasswordHandler ) );
		},

		/**
		 * SEE getUserDetails API method
		 *
		 * Calls the SEE regApi getUserDetails method
		 *
		 * @param refresh boolean [optional] Refresh details from server (true/false)
		 *
		 * @return null
		 */
		getUserDetails: function ( refresh ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::getUserDetails' );

			this.seeRegApi.getUserDetails( lang.hitch( this, this._onGetUserDetailsHandler ), refresh );
		},

		/**
		 * SEE registerFields API method
		 *
		 * Calls the SEE regApi registerFields method
		 *
		 * @return null
		 */
		registerFields: function () {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::registerFields' );

			this.seeRegApi.registerFields( lang.hitch( this, this._onRegisterFieldsHandler ) );
		},

		/**
		 * SEE registerUser API method
		 *
		 * Calls the SEE regApi registerUser method with an object containing
		 * the user's registration field data.
		 *
		 * @param fields  object  Object of field data from the reg form
		 * @param persist integer 0|1 to set persistent login status for the user
		 *
		 * @return null
		 */
		registerUser: function ( fields, persist ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::registerUser' );

			this.seeRegApi.registerUser( fields, persist, lang.hitch( this, this._onRegisterUserHandler ) );
		},

		/**
		 * SEE updateUser API method
		 *
		 * Calls the SEE regApi updateUser method with an object containing
		 * the user's profile update field data.
		 *
		 * @param fields object Object of field data from the update form
		 *
		 * @return null
		 */
		updateUser: function ( fields ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::updateUser' );

			this.seeRegApi.updateUser( fields, lang.hitch( this, this._onUpdateUserHandler ) );
		},

		/**
		 * SEE completeRegister API method
		 *
		 * Calls the SEE regApi completeRegister method with an object containing
		 * the user's remaining registration field data.
		 *
		 * @param fields  object  Object of field data from the reg form
		 * @return null
		 */
		completeRegisterUser: function ( fields ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::updateUser' );

			this.seeRegApi.completeRegister( fields, lang.hitch( this, this._onLoginHandler ) );
		},

		/**
		 * SEE setLanguage API Method
		 *
		 * Changes the user display language for see
		 *
		 * @param language string The language to change to
		 *
		 * @return null
		 */
		setLanguage: function ( language ) {
			console.log( 'userRegistration::setLanguage' );
			this.see.setLanguage( language, lang.hitch( this, this._onSetLanguageHandler ) );
		},

		/**
		 * SEE getStatusLevel API method
		 *
		 * Calls the SEE regApi getStatusLevel method
		 *
		 * @param ladder  string  Ladder to get status data on
		 * @param refresh boolean [optional] Refresh status data from server (true/false)
		 *
		 * @return null
		 */
		getStatusLevel: function ( ladder, refresh ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::getStatusLevel' );

			this.seeRegApi.getStatusLevel( ladder, refresh, lang.hitch( this, this._onGetStatusLevel ) );
		},

		/**
		 * SEE getLadderStatusLevels API method
		 *
		 * Calls the SEE regApi getLadderStatusLevels method
		 *
		 * @param ladder  string  Ladder to get status data on
		 *
		 * @return null
		 */
		getLadderStatusLevels: function ( ladder ) {
			if ( this.seeRegApi == undefined ) {
				this.emit( 'see-regapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::getLadderStatusLevels' );

			this.seeRegApi.getLadderStatusLevels( ladder, lang.hitch( this, this._onGetLadderStatusLevels ) );
		},

		/*********************************
		 *     User MetaData methods     *
		 *********************************/

		/**
		 * metaSet(_doc_, _type_, _[options]_)
		 * metaGet(_id_, _[options]_)
		 * metaUpdate(_id_, _doc_, _[options]_)
		 * metaDelete(_id_, _[options]_)
		 * metaList(_key_, _[options]_)
		 */

		/**
		 * SEE metaApi.set API method
		 *
		 * Calls the SEE metaApi set method, passing a doc, a type and optional settings
		 *
		 * @param array  doc     Document to add
		 * @param string type    A classification to add the document to
		 * @param array  options [optional] Options array for call
		 *
		 * Accepted options are:
		 *  - uniq      [integer, default 0] When set to 1, ensures unique document type. If another
		 *              document of given type exists, throws an error
		 *
		 * @return null
		 */
		metaSet: function ( doc, type, options ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaSet' );

			options = ( typeof options == 'object' ) ? options : {};
			options.callback = lang.hitch( this, this._onMetaSetHandler );

			this.seeMetaApi.set( doc, type, options );
		},

		/**
		 * SEE metaApi.get API method
		 *
		 * Calls the SEE metaApi get method, passing an id and optional settings
		 *
		 * @param string id      ID of document to retrieve
		 * @param array  options [optional] Options array for call
		 *
		 * Accepted options are:
		 *  - full      [integer, default 0] When set to 1, will return full document from Mongo
		 *
		 * @return null
		 */
		metaGet: function ( id, options ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaGet' );

			options = ( typeof options == 'object' ) ? options : {};
			options.callback = lang.hitch( this, this._onMetaGetHandler );

			this.seeMetaApi.get( id, options );
		},

		/**
		 * SEE metaApi.update API method
		 *
		 * Calls the SEE metaApi update method, passing an id and a doc
		 *
		 * @param string id  ID of document to update
		 * @param array  doc Document to add
		 *
		 * @return null
		 */
		metaUpdate: function ( id, doc ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaUpdate' );

			var options = {
				callback: lang.hitch( this, this._onMetaUpdateHandler )
			};

			this.seeMetaApi.update( id, doc, options );
		},

		/**
		 * SEE metaApi.delete API method
		 *
		 * Calls the SEE metaApi delete method, passing an id to delete
		 *
		 * @param string id ID of document to delete
		 *
		 * @return null
		 */
		metaDelete: function ( id ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaDelete' );

			var options = {
				callback: lang.hitch( this, this._onMetaDeleteHandler )
			};

			this.seeMetaApi.del( id, options );
		},

		/**
		 * SEE metaApi.clear API method
		 *
		 * Calls the SEE metaApi clear method, passing an type to match on and delete
		 *
		 * @param string type Type of documents to delete
		 *
		 * @return null
		 */
		metaClear: function ( type ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaClear' );

			var options = {
				callback: lang.hitch( this, this._onMetaClearHandler )
			};

			this.seeMetaApi.clear( type, options );
		},

		/**
		 * SEE metaApi.list API method
		 *
		 * Calls the SEE metaApi list method, passing a type and optional settings
		 *
		 * @param string type    A classification to add the document to
		 * @param array  options [optional] Options array for call
		 *
		 * Accepted options are:
		 *  - full      [integer, default 0] When set to 1, will return full document from Mongo
		 *  - reverse   [integer, default: 0] If set to 1 will reverse the sort so they are sorted DESC by creation (_id)
		 *  - afterid   [string] If supplied, will start returning list after the given id
		 *  - pagesize  [integer, default: 10, max: 50] determine the number of documents to get back.
		 *
		 * @return null
		 */
		metaList: function ( type, options ) {
			if ( !this.seeMetaApi ) {
				this.emit( 'see-metaapi-not-ready' );
				return;
			}

			console.log( 'userRegistration::metaList' );

			options = ( typeof options == 'object' ) ? options : {};
			options.callback = lang.hitch( this, this._onMetaListHandler );

			this.seeMetaApi.list( type, options );
		},

		/**
		 * SEE triggerEvent function
		 *
		 * Triggers an event eventName within the SEE application
		 *
		 * @param string eventName Event name
		 *
		 * @return null
		 */
		triggerEvent: function ( eventName ) {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return;
			}

			console.log( 'userRegistration::triggerEvent' );

			this.see.triggerEvent( eventName );
		},

		/**
		 * SEE bindEvent function
		 *
		 * Binds to a SEE event eventName within the SEE application
		 *
		 * @param string   eventName Event name
		 *
		 * @param function action    Function to trigger on event
		 *
		 * @param object   scope     Scope to execute action from
		 *
		 * @return null
		 */
		bindEvent: function ( eventName, action, scope ) {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return;
			}

			console.log( 'userRegistration::triggerEvent' );

			this.see.bindEvent( eventName, action, scope );
		},

		/**
		 * SEE bindOrFireEvent function
		 *
		 * Binds to a SEE event eventName within the SEE application, and either
		 * fires action if event triggered or will fire when triggered
		 *
		 * @param string   eventName Event name
		 *
		 * @param function action    Function to trigger on event
		 *
		 * @param object   scope     Scope to execute action from
		 *
		 * @return null
		 */
		bindOrFireEvent: function ( eventName, action, scope ) {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return;
			}

			console.log( 'userRegistration::triggerEvent' );

			this.see.bindOrFireEvent( eventName, action, scope );
		},

		/**
		 * SEE cookieTest
		 *
		 * Calls to SEE to ensure third party cookies are being set by main server
		 *
		 * @return null
		 */
		cookieTest: function () {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return;
			}

			console.log( 'userRegistration::cookieTest' );

			callback = lang.hitch( this, this._onCookieTest );

			this.see.cookieTest( callback );
		},

		/**
		 * Determine if Games are enabled for this tenant
		 *
		 * Note: this will change in phase3 to reference a toggle in
		 * _See.config.tenant
		 *
		 * @return null
		 */
		isGamesEnabled: function () {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return false;
			}

			console.log( 'userRegistration::isGamesEnabled' );

			return this.see.config.tenant.playerShowGames;
		},

		/**
		 * Get and return the _See.config.user object
		 *
		 * @return object SEE user config object
		 */
		getUserConfig: function () {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return false;
			}

			console.log( 'userRegistration::getUserConfig' );

			return this.see.config.user;
		},

		/**
		 * Get and return the _See.config object
		 *
		 * @return object SEE general config object
		 */
		getConfig: function () {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return false;
			}

			console.log( 'userRegistration::getConfig' );

			return this.see.config;
		},

		/**
		 * Instructs SEE to initialize/load all widgets under the given element
		 *
		 * @return null
		 */
		initWidgets: function ( element ) {
			if ( !this.see ) {
				this.emit( 'see-not-ready' );
				return false;
			}

			console.log( 'userRegistration::initWidgets' );

			this.see.initWidgets( element );
		},

		/*****************************
		 *     "Private" Methods     *
		 *****************************/

		/**
		 * Handler for the SEE regApi login call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onLoginHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user is logged in
				this.emit( 'user-logged-in', result.context );
				break;

			case 'FAIL':
				// Announce the login failed
				this.emit( 'user-login-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi login call used by the connectSocial method
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onConnectSocialHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user is logged in
				this.emit( 'social-connect', result.context );
				break;

			case 'FAIL':
				// Announce the login failed
				this.emit( 'social-connect-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi removeSocial call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onRemoveSocialHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the social connection was removed
				this.emit( 'social-remove', result.context );
				break;

			case 'FAIL':
				// Announce the social connection failed
				this.emit( 'social-remove-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi logout call
		 *
		 * Takes a single param object that contains the result of the SEE regApi logout call.
		 *
		 * @param result object API call result object
		 *
		 * @return null
		 */
		_onLogoutHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user has been logged out
				this.emit( 'user-logged-out', result.context );
				break;

			case 'FAIL':
				// Announce the user logout failed
				this.emit( 'user-logout-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi forgotPassword call
		 *
		 * Takes a single param object that contains the result of the SEE regApi forgotPassword call.
		 *
		 * @param result object API call result object
		 *
		 * @return null
		 */
		_onForgotPasswordHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user forgot password request is sent
				this.emit( 'forgot-password', result.context );
				break;

			case 'FAIL':
				// Announce the user forgot password request failed
				this.emit( 'forgot-password-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi resetPassword call
		 *
		 * Takes a single param object that contains the result of the SEE regApi resetPassword call.
		 *
		 * @param result object API call result object
		 *
		 * @return null
		 */
		_onResetPasswordHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user password reset is complete
				this.emit( 'reset-password', result.context );
				break;

			case 'FAIL':
				// Announce the user password reset failed
				this.emit( 'reset-password-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi getUserDetails call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onGetUserDetailsHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce we received the user details
				this.emit( 'user-details', result.context );
				break;

			case 'FAIL':
				// Announce the user details call failed
				this.emit( 'user-details-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi registerFields call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onRegisterFieldsHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the registerFields api call succeeded
				this.emit( 'register-fields', result.context );
				break;

			case 'FAIL':
				// Announce the registerFields api call failed
				this.emit( 'register-fields-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi registerUser call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onRegisterUserHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user is registered (and logged in)
				this.emit( 'register-user', result.context );
				break;

			case 'FAIL':
				// Announce the user registration has failed
				this.emit( 'register-user-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi updateUser call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onUpdateUserHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'user-update', result.context );
				break;

			case 'FAIL':
				this.emit( 'user-update-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE language change call
		 *
		 * Takes a single param object that contains the result of the SEE language call.
		 *
		 * @param result object API call result object
		 *
		 * @return null
		 */
		_onSetLanguageHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce the user's language has been changed
				this.emit( 'language-change-success', result.context );
				break;

			case 'FAIL':
				// Announce the user language change failed
				this.emit( 'language-change-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi getStatusLevel call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onGetStatusLevel: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce we received the user details
				this.emit( 'user-status', result.context );
				break;

			case 'FAIL':
				// Announce the user details call failed
				this.emit( 'user-status-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE regApi getLadderStatusLevels call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onGetLadderStatusLevels: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				// Announce we received the user details
				this.emit( 'status-levels', result.context );
				break;

			case 'FAIL':
				// Announce the user details call failed
				this.emit( 'status-levels-error', result.context );
				break;

			case 'DELAY':
			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi set call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaSetHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-set', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-set-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi get call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaGetHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-get', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-get-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi update call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaUpdateHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-update', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-update-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi del call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaDeleteHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-delete', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-delete-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi clear call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaClearHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-clear', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-clear-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the SEE metaApi list call
		 *
		 * Accepts an object containing the API call result
		 *
		 * @param result object Object containing the API call result
		 *
		 * @return null
		 */
		_onMetaListHandler: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'meta-list', result.context );
				break;

			case 'FAIL':
				this.emit( 'meta-list-error', result.context );
				break;

			default:
				break;
			}
		},

		/**
		 * Handler for the cookieTest call
		 *
		 * Accepts an object containing the cookieTest call result
		 *
		 * @param result object Object containing the cookieTest call result
		 *
		 * @return null
		 */
		_onCookieTest: function ( result ) {
			switch ( result.status ) {
			case 'PASS':
				this.emit( 'cookie-test-pass' );
				break;

			case 'FAIL':
				this.emit( 'cookie-test-fail' );
				break;

			default:
				break;
			}
		}

	} );

	return module;

} );
