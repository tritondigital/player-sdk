var Platform = require('sdk/base/util/Platform');

/**
 * @module GARequest
 */
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/cookie',
    'sdk/base/util/XhrProvider'
], function (declare, lang, cookie, XhrProvider) {

    /**
     * @namespace tdapi/modules/analytics/GARequest
     */
    var GARequest = declare([], {

        GA_ENDPOINT: 'https://www.google-analytics.com/collect?',
        GA_ENDPOINT_DEBUG: 'https://www.google-analytics.com/debug/collect?',

        COOKIE_NAME: 'sdk_cid',
        TYPE: 't',

        SAMPLE_RATE: 0.04,

        //event
        CATEGORY: 'ec',
        ACTION: 'ea',
        LABEL: 'el',

        //dimensions
        DIM_TECH: 'cd1',
        DIM_MEDIA_TYPE: 'cd2',
        DIM_MOUNT: 'cd3',
        DIM_STATION: 'cd4',
        DIM_BROADCASTER: 'cd5',
        DIM_MEDIA_FORMAT: 'cd6',
        DIM_AD_SOURCE: 'cd8',
        DIM_AD_FORMAT: 'cd9',
        DIM_AD_PARSER: 'cd10',
        DIM_ADBLOCK: 'cd11',
        DIM_SBM: 'cd12',
        DIM_HLS: 'cd13',
        DIM_AUDIO_ADAPTIVE: 'cd14',
        DIM_IDSYNC: 'cd15',
        DIM_ALTERNATE_CONTENT: 'cd16',
        DIM_AD_COMPANIONS_TYPE: 'cd17',
        DIM_ERROR_MESSAGE: 'cd18',

        //metrics
        METRIC_CONNECTION_TIME: 'cm1',
        METRIC_STREAM_ERROR_TIME: 'cm2',
        METRIC_LOAD_TIME: 'cm3',

        //toggle
        active: true,

        /**
         * constructor
         */
        constructor: function () {

            console.log('GARequest::constructor');

            this.tid = null;
            this.v = 1;
            this.cid = null;
            this.an = "web-sdk";
            this.av = null;
            this.aid = null;
            this.aiid = 'custom';  // custom, widget, player, tdtestapp
            this.active = true;
            this.debug = false;

        },

        /**
         * setActive
         * @param active | Boolean
         */
        setActive: function (active) {
            this.active = active;
            if(active){
                this.cid = this.getCookie();
            }else{
                this.delete_cookie();
            }
        },

        /**
         * setPlatform
         * @param platformId | String
         */
        setPlatform: function (platformId) {

            if (window.location.hostname === 'localhost') {
                this.platform = new Platform('dev01');
            } else {
                this.platform = new Platform(platformId);
            }

            this.tid = this.platform.endpoint.UA;
        },

        /**
         * request
         * @param object | object
         */
        request: function (object) {

            console.log('GARequest::request');

            if (!this.active) return;
            if (object.ec !== "Default" && !this.debug && !_canSendRequest(this.SAMPLE_RATE)) return;


            //url constructor
            var url = this.constructUrl(object);

            //send url
            var xhrProv = new XhrProvider();

            var endPoint = !this.debug ? this.GA_ENDPOINT : this.GA_ENDPOINT_DEBUG;
            xhrProv.request(endPoint + url, null, { method: 'POST', handleAs: 'text', headers: { 'X-Requested-With': null, 'Content-Type': 'text/plain; charset=utf-8' } });

        },

        /**
         * constructUrl
         * @param object | object
         */
        constructUrl: function (object) {

            console.log('GARequest::constructUrl');

            //add constructor parameters
            lang.mixin(object, { tid: this.tid });
            lang.mixin(object, { v: this.v });
            lang.mixin(object, { cid: this.cid });
            lang.mixin(object, { an: this.an });
            lang.mixin(object, { av: this.av });
            lang.mixin(object, { aid: this.aid });
            lang.mixin(object, { aiid: this.aiid });

            //convert to parameters
            var url = '';
            for (var key in object) {
                if (url != '') {
                    url += '&';
                }
                url += key + '=' + encodeURIComponent(object[key]);
            }

            return url;
        },

        /**
         * delete_cookie
         * @param name | String
         */
        delete_cookie: function (name) {

            cookie(this.COOKIE_NAME, "", { expires: 'Thu, 01 Jan 1970 00:00:01 GMT', path: '/' });

        },

        /**
         * getCookie
         */
        getCookie: function () {

            var cname = this.COOKIE_NAME;
            var name = cname + "=";
            var ca = document.cookie.split(';');

            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }

            //generate new cookie
            return _setCookie(this.COOKIE_NAME);

        }

    });

    /**
     * _setCookie
     *  @param cookieName | String
     * private
     */
    function _setCookie(cookieName) {

        var cid = _generateCid();
        var d = new Date();
        var exdays = 365;

        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        cookie(cookieName, cid, { expires: expires, path: '/' });

        return cid;
    }

    /**
     * _generateCid
     * private
     */
    function _generateCid() {

        var d = new Date().getTime();

        var cid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });

        return cid;
    }

    function _canSendRequest(sampleRate) {
        var randomValue = Math.random();

        return randomValue <= sampleRate;
    }


    return GARequest;

});
