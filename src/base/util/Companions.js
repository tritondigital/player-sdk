
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/Evented',
    'dojo/_base/array',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/request',
    'sdk/base/util/XhrProvider'
], function (declare, lang, on, Evented, array, dom, domConstruct, request,  XhrProvider) {

    var companions = window.TdCompanions  = declare([Evented], {

        JS_BANNER_URL: 'https://player.tritondigital.com/tpl/default/jsbanner.php',

        constructor:function()
        {
            console.log('companions::constructor');

            this.listeners = [];
        },

        loadCompanionIframe:function(containerId, adSpotUrl, width, height)
        {
            var container = dom.byId(containerId, document);
            domConstruct.empty(container);
            domConstruct.create("iframe", {src: adSpotUrl, width:width, height:height, scrolling:'no', frameborder:0, marginheight:0, marginwidth:0, allowtransparency:true, style: { margin:0, padding:0 } }, container);
        },

        /**
         * Load static companion within a container (image or swf file)
         *
         * @param containerId
         * @param adSpotUrl
         * @param width
         * @param height
         * @param clickThroughURL - optional
         * @param altText - optional
         * @param adSpotType - optional
         */
        loadCompanionStatic:function(containerId, adSpotUrl, width, height, clickThroughURL, altText, adSpotType)
        {
            altText = altText || '';
            adSpotType = adSpotType || '';

            var container = dom.byId(containerId, document);
            domConstruct.empty(container);

            var extFile = adSpotUrl.substring(adSpotUrl.lastIndexOf(".")+1).toLowerCase();
            if ( adSpotType == 'application/x-shockwave-flash' || extFile == 'swf' ) {
                if ( !swfobject.getFlashPlayerVersion().major > 0) {
                    console.error('companions::loadCompanionStatic - SWF file embed error: Flash is not available. containerId=' + containerId + ', adSpotUrl=' + adSpotUrl);
                    this.emit("companion-load-error", {containerId:containerId, adSpotUrl:adSpotUrl});
                    return;
                }

                adSpotUrl = adSpotUrl + ( ( adSpotUrl.indexOf("?") > -1 ) ? "&" : "?" ) + "cb_" + ( new Date().getTime() );

                console.log('companions::loadCompanionStatic - adSpotURL=' + adSpotUrl);

                var flashArgs = {
                    expressInstall:true,
                    path: adSpotUrl,
                    width: width,
                    height: height,
                    allowScriptAccess: "always",
                    allowfullscreen: true,
                    allowNetworking:"all",
                    minimumVersion: "10.2.0",
                    vars: { clickTAG: encodeURIComponent(clickThroughURL) },
                    params: {
                        scale:"showall",
                        wmode:"opaque",
                        allowScriptAccess:"always",
                        allowNetworking:"all"
                    }
                };

                var flashContentId = "td_flash_companions";
                domConstruct.create("div", {id:flashContentId},container);
                swfobject.embedSWF(adSpotUrl,
                   flashContentId,
                   width,
                   height,
                   "10.2.0",
                   false,
                   { clickTAG: encodeURIComponent(clickThroughURL) },
                   {
                       scale:"showall",
                       wmode:"opaque",
                       allowScriptAccess:"always",
                       allowNetworking:"all"
                   },
                   false,
                   false);

            } else {
                console.log('companions::loadCompanionStatic - adSpotURL=' + adSpotUrl);
                var imgHtml = '';
                if (clickThroughURL != undefined)
                    imgHtml = '<a href="' + clickThroughURL + '" target="_blank">';
                imgHtml += '<img src="' + adSpotUrl + '" width="' + width + '" height="' + height + '" title="' + altText + '" border="0"/>';
                if (clickThroughURL != undefined)
                    imgHtml += '</a>';

                container.innerHTML = imgHtml;
            }
        },

        /**
         * Loads a VAST companion ad in a div element
         * @param {String} containerId Div id in which to load the companion ad
         * @param {String} vastCompanionAd - VAST companion ad (actionscript class) object for the companion
         * 	code - Wraps block of code (generally script or IFrame) if the ad is not a URL or URI
         * 	clickThroughURL - URL to open as a destination page when user clicks on the ad
         * 	adParameters - Data to be passed into the ad
         * 	altText - Alt text to be displayed when the companion ad is rendered in an HTML environment
         * 	id - Optional identifier
         * 	width - Width of the companion
         * 	height - Height of the companion
         * 	expandedWidth - Pixel dimensions of expanding companion ad when in expanded state
         * 	expandedHeight - Pixel dimensions of expanding companion ad when in expanded state
         * 	resourceType - Resource type of the vast companion ad ( html, iframe or static )
         * 	creativeType - Mime type of static resource
         * 	creativeView - Event to track. The creativeView should always be requested when present
         */
        loadVASTCompanionAd:function(containerId, vastCompanionAd)
        {
            console.log('companions::loadVASTCompanionAd - vastCompanionAd.resourceType.name=' + vastCompanionAd.resourceType.name);

            if( vastCompanionAd.content ){
              dom.byId(containerId, document).innerHTML = vastCompanionAd.content;
              return;
            }
            
            switch ( vastCompanionAd.resourceType.name )
            {
                case 'html':
                    
                    if ( vastCompanionAd.code.indexOf("document.write") > -1 )
                    {
                        vastCompanionAd.resourceType.name = "iframe";
                        vastCompanionAd.url = this.JS_BANNER_URL + '?code=' + encodeURIComponent(vastCompanionAd.code);
                        this.loadVASTCompanionAd(containerId, vastCompanionAd);
                    }
                    else
                    {
                        dom.byId(containerId, document ).innerHTML = vastCompanionAd.code;
                    }
                    break;

                case 'iframe':
                    this.loadCompanionIframe(containerId, vastCompanionAd.url, vastCompanionAd.width, vastCompanionAd.height);
                    break;

                case 'static':
                    if ( vastCompanionAd.creativeType == 'text/javascript'){
                        vastCompanionAd.resourceType.name = 'iframe';
                        vastCompanionAd.url = this.JS_BANNER_URL + '?url=' + encodeURIComponent(vastCompanionAd.url);
                        this.loadVASTCompanionAd(containerId, vastCompanionAd);
                    }
                    else
                    {
                        
                        this.loadCompanionStatic(containerId, vastCompanionAd.url, vastCompanionAd.width, vastCompanionAd.height, vastCompanionAd.clickThroughURL, vastCompanionAd.altText, vastCompanionAd.creativeType);
                    }
                    break;

                default:
                    break;
            }

            if (vastCompanionAd.creativeView && vastCompanionAd.creativeView.length ){
                
                vastCompanionAd.creativeView.forEach(function(url){
                    var xhrProv = new XhrProvider();
                    xhrProv.request( url, null, { method:'POST' } );
                });                                
            }
        },

        /**
         * Add an event listener
         * @param {string} eventName The event name
         * @param {function} callback The callback function
         */
        addEventListener:function(eventName, callback)
        {
            //Check if the listener exist before adding it
            var itemIndex = -1;            
            array.forEach(this.listeners, function(item, index){
                if (item.eventName == eventName && item.callback == callback)
                    itemIndex = index;
            },this);

            if ( itemIndex == -1 )
                this.listeners.push({eventName:eventName, callback:callback, listener:on(this, eventName, lang.hitch(this, callback))});
        },

        /**
         * Remove an event listener
         * @param {string} eventName The event name
         * @param {function} callback The callback function
         */
        removeEventListener:function(eventName, callback)
        {
            var itemIndex = -1;
            array.forEach(this.listeners, function(item, index){
                if (item.eventName == eventName && item.callback == callback)
                    itemIndex = index;
            },this);

            if ( itemIndex > -1 )
            {
                this.listeners[itemIndex].listener.remove();
                this.listeners.splice(itemIndex, 1);
            }
        }
    });

    return companions;

});
