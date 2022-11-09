var xmlParser = require('sdk/base/util/XmlParser');

/**
 *
 * VAST 2.0 XML Parser
 *
 */
define([
    'dojo/_base/declare',
    'sdk/modules/ad/vastAd/parser/VASTParser',
    'sdk/modules/ad/vastAd/parser/VASTElement',
    'sdk/modules/ad/vastAd/VASTDocument',
    'sdk/modules/ad/vastAd/VASTAd',
    'sdk/modules/ad/vastAd/VAST2InlineAd',
    'sdk/modules/ad/vastAd/VASTWrapperAd',
    'sdk/modules/ad/vastAd/VAST2Creative',
    'sdk/modules/ad/vastAd/VASTLinearElement',
    'sdk/modules/ad/vastAd/VASTNonLinearAd',
    'sdk/modules/ad/vastAd/VASTCompanionAd',
    'sdk/modules/ad/vastAd/VASTTrackingEvent',
    'sdk/modules/ad/vastAd/VASTVideoClick',
    'sdk/modules/ad/vastAd/VASTMediaFile',
    'sdk/modules/ad/vastAd/VASTResourceType'
], function ( declare, VASTParser, VASTElement, VASTDocument, VASTAd, VAST2InlineAd, VASTWrapperAd, VAST2Creative, VASTLinearElement, VASTNonLinearAd, VASTCompanionAd, VASTTrackingEvent, VASTVideoClick, VASTMediaFile, VASTResourceType ) {

    var vast2parser = declare([ VASTParser ], {

        AD:'Ad',
        IMPRESSION:'Impression',
        VAST_AD_TAG_URI:'VASTAdTagURI',
        CREATIVES:'Creatives',
        CREATIVE:'Creative',

        constructor:function()
        {
            console.log( 'vast2parser::constructor' );

            this.vastDocument = null;

            this.inherited( arguments );
        },

        parse:function( xml )
        {
            this.vastDocument = new VASTDocument();
            var adXML = xml.getElementsByTagName( this.AD );

            if( adXML[0] == undefined ) return null;

            var id =  adXML[0].getAttribute( VASTElement.ID );
            var vastAd = new VASTAd( id );

            this.vastDocument.vastAd = vastAd;
            

            this._parseAdTag( adXML );

            return this.vastDocument;
        },

        parseMissedOpportunityError:function( xml )
        {
            this.vastDocument = new VASTDocument();
            var errorXML = xml.getElementsByTagName( VASTElement.ERROR );

            if( errorXML[0] == undefined ) return null;
            
            var errorURL = this.trim( xmlParser.textContent( errorXML[0] ) ) ;
            
            errorURL = errorURL.replace("[TD_DURATION]", "0");
            errorURL = errorURL.replace("[ERRORCODE]", "202");
                           
            return errorURL;
        },
        _parseAdTag:function( xml )
        {
            var xmlLength = xml.length;
            for( var i = 0; i < xmlLength; i++ )
            {
                if( xml[i].getElementsByTagName( VASTElement.INLINE).length > 0 )
                {
                    this.vastDocument.vastAd.inlineAd = this._parseInLineTag( xml[i].getElementsByTagName( VASTElement.INLINE ) );
                }
                else if( xml[i].getElementsByTagName( VASTElement.WRAPPER ).length > 0 )
                {
                    this.vastDocument.vastAd.wrapperAd = this._parseWrapperTag( xml[i].getElementsByTagName( VASTElement.WRAPPER ) );
                }
                else
                {
                    console.error( 'VAST - parseAdTag() - Unsupported VAST tag');
                }
            }
        },

        _parseInLineTag:function( xml )
        {
            var vast2Inline = new VAST2InlineAd();

            var nodeArray = xml[0].childNodes;
            var nodeArrayLength = nodeArray.length;
            for( var i = 0; i < nodeArrayLength; i++ )
            {
                if( nodeArray[i].nodeName == VASTElement.AD_SYSTEM )
                {
                    vast2Inline.adSystem = xmlParser.textContent( nodeArray[i] );
                }
                else if( nodeArray[i].nodeName == VASTElement.AD_TITLE )
                {
                    vast2Inline.adTitle = xmlParser.textContent( nodeArray[i] );
                }
                else if( nodeArray[i].nodeName == VASTElement.ERROR )
                {
                    vast2Inline.errorURL = this.trim( xmlParser.textContent( nodeArray[i] ) );
                }
                else if( nodeArray[i].nodeName == VASTElement.DESCRIPTION )
                {
                    vast2Inline.description = xmlParser.textContent( nodeArray[i] );
                }
            }

            vast2Inline.impressions = this._parseImpressionTag( xml[0].getElementsByTagName( this.IMPRESSION ) );
            vast2Inline.creatives = this._parseCreatives( xml[0].getElementsByTagName( this.CREATIVES ) );

            return vast2Inline;
        },

        _parseWrapperTag:function( xml )
        {
            var vastWrapperAd = new VASTWrapperAd();

            var nodeArray = xml[0].childNodes;
            var nodeArrayLength = nodeArray.length;
            for( var i = 0; i < nodeArrayLength; i++ )
            {
                if( nodeArray[i].nodeName == this.VAST_AD_TAG_URI )
                {
                    vastWrapperAd.vastAdTagURL = this.trim( xmlParser.textContent( nodeArray[i] ) );
                }
                else if( nodeArray[i].nodeName == VASTElement.ERROR )
                {
                    vastWrapperAd.error = this.trim( xmlParser.textContent( nodeArray[i] ) );
                }
            }

            vastWrapperAd.impressions = this._parseImpressionTag( xml[0].getElementsByTagName( this.IMPRESSION ) );
            vastWrapperAd.creatives = this._parseCreatives( xml[0].getElementsByTagName( this.CREATIVES ) );

            return vastWrapperAd;
        },

        _parseImpressionTag:function( xml )
        {
            var impressionsArray = [];

            if( xml == undefined ) return impressionsArray;

            var impressionsArrayLength = xml.length;
            for( var i = 0; i < impressionsArrayLength; i++ )
            {
                impressionsArray.push( this.trim( xmlParser.textContent( xml[i] ) ) );
            }

            return impressionsArray;
        },

        _parseCreatives:function( xml )
        {
            var creativesArray = [];

            if( xml[0] == undefined || xml[0].getElementsByTagName( this.CREATIVE ) == undefined ) return creativesArray;

            var creativesArrayLength = xml[0].getElementsByTagName( this.CREATIVE ).length;
            var creativeArray = xml[0].getElementsByTagName( this.CREATIVE );

            for( var i = 0; i < creativesArrayLength; i++ )
            {
                var creative = this._parseCreative( creativeArray[i] );
                creativesArray.push( creative );
            }

            return creativesArray;
        },

        _parseCreative:function( xml )
        {
            var creative = new VAST2Creative();

            creative.adID = xml.getAttribute( VASTElement.AD_ID );
            creative.id = xml.getAttribute( VASTElement.ID );
            creative.sequence = xml.getAttribute( VASTElement.SEQUENCE );

            if( xml.getElementsByTagName( VASTElement.LINEAR).length != 0 )
            {
                creative.linearElement = this._parseCreativeLinear( xml.getElementsByTagName( VASTElement.LINEAR ) );
            }
            else if( xml.getElementsByTagName( VASTElement.NON_LINEAR_ADS).length != 0 )
            {
                creative.nonLinearAds = this._parseCreativeNonLinearAds( xml.getElementsByTagName( VASTElement.NON_LINEAR_ADS ) );
            }
            else if( xml.getElementsByTagName( VASTElement.COMPANION_ADS).length != 0 )
            {
                creative.companionAds = this._parseCreativeCompanionAds( xml.getElementsByTagName( VASTElement.COMPANION_ADS ) );
            }

            return creative;
        },

        _parseCreativeLinear:function( xml )
        {
            var vastLinearElement = new VASTLinearElement();

            var nodeArray = xml[0].childNodes;
            var nodeArrayLength = nodeArray.length;
            for( var i = 0; i < nodeArrayLength; i++ )
            {
                if( nodeArray[i].nodeName == VASTElement.DURATION )
                {
                    vastLinearElement.duration = xmlParser.textContent( nodeArray[i] );
                }
                else if( nodeArray[i].nodeName == VASTElement.TRACKING_EVENTS )
                {
                    vastLinearElement.trackingEvents = this._parseTrackingEvents( nodeArray[i] );
                }
                else if( nodeArray[i].nodeName == VASTElement.VIDEO_CLICKS )
                {
                    vastLinearElement.videoClick = this._parseVideoClick( nodeArray[i] );
                }
                else if( nodeArray[i].nodeName == VASTElement.MEDIA_FILES )
                {
                    vastLinearElement.mediaFiles = this._parseMediaFiles( nodeArray[i] );
                }
            }

            return vastLinearElement;
        },

        _parseCreativeNonLinearAds:function( xml )
        {
             
            var vastNonLinearAds = [];
            var nonLinearAd = xml[0].getElementsByTagName( VASTElement.NON_LINEAR );
            var nonLinearAdLength = nonLinearAd.length;

            for( var i = 0; i < nonLinearAdLength; i++ )
            {
                var vastNonLinearAd = new VASTNonLinearAd();
                vastNonLinearAd.id = nonLinearAd[i].getAttribute( VASTElement.ID );
                vastNonLinearAd.width = nonLinearAd[i].getAttribute( VASTElement.WIDTH );
                vastNonLinearAd.height = nonLinearAd[i].getAttribute( VASTElement.HEIGHT );
                vastNonLinearAd.expandedWidth = nonLinearAd[i].getAttribute( VASTElement.EXPANDED_WIDTH );
                vastNonLinearAd.expandedHeight = nonLinearAd[i].getAttribute( VASTElement.EXPANDED_HEIGHT );
                vastNonLinearAd.scalable = nonLinearAd[i].getAttribute( VASTElement.SCALABLE) == 'true' ? true : false;
                vastNonLinearAd.maintainAspectRatio = nonLinearAd[i].getAttribute( VASTElement.MAINTAIN_ASPECT_RATIO ) == 'true' ? true : false;
                vastNonLinearAd.apiFramework = nonLinearAd[i].getAttribute( VASTElement.API_FRAMEWORK );
                vastNonLinearAd.minSuggestedDuration = nonLinearAd[i].getAttribute( VASTElement.MIN_SUGGESTED_DURATION );

                var nodeArray = nonLinearAd[i].childNodes;
                var nodeArrayLength = nodeArray.length;
                for (var j = 0; j < nodeArrayLength; j++)
                {
                    if( nodeArray[j].nodeName == VASTElement.AD_PARAMETERS )
                    {
                        vastNonLinearAd.adParameters = xmlParser.textContent( nodeArray[j] );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.NON_LINEAR_CLICK_THROUGH )
                    {
                        vastNonLinearAd.clickThroughURL = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.IFRAME_RESOURCE )
                    {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.IFRAME;
                        vastNonLinearAd.resourceType = vastResourceType;
                        vastNonLinearAd.url = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.HTML_RESOURCE )
                    {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.HTML;
                        vastNonLinearAd.resourceType = vastResourceType;
                        vastNonLinearAd.code = xmlParser.textContent( nodeArray[j] );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.STATIC_RESOURCE )
                    {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.STATIC;
                        vastNonLinearAd.resourceType = vastResourceType;
                        vastNonLinearAd.creativeType = nodeArray[j].getAttribute( VASTElement.CREATIVE_TYPE );
                        vastNonLinearAd.url = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                }

                vastNonLinearAds.push( vastNonLinearAd );
            }

            return vastNonLinearAd;
        },

        _parseCreativeCompanionAds:function( xml )
        {
            var vastCompanionAds = [];
            var companions = xml[0].getElementsByTagName( VASTElement.COMPANION );
            var companionsLength = companions.length;
           
            for (var i = 0; i < companionsLength; i++)
            {
                var vastCompanionAd = new VASTCompanionAd();
                vastCompanionAd.id = companions[i].getAttribute( VASTElement.ID );
                vastCompanionAd.width = companions[i].getAttribute( VASTElement.WIDTH );
                vastCompanionAd.height = companions[i].getAttribute( VASTElement.HEIGHT );
                vastCompanionAd.expandedWidth = companions[i].getAttribute( VASTElement.EXPANDED_WIDTH );
                vastCompanionAd.expandedHeight = companions[i].getAttribute( VASTElement.EXPANDED_HEIGHT );

                var nodeArray = companions[i].childNodes;
                var nodeArrayLength = nodeArray.length;
                for (var j = 0; j < nodeArrayLength; j++)
                {
                    if( nodeArray[j].nodeName == VASTElement.AD_PARAMETERS ) {
                        vastCompanionAd.adParameters = xmlParser.textContent( nodeArray[j] );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.ALT_TEXT ) {
                        vastCompanionAd.altText = xmlParser.textContent( nodeArray[j] );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.COMPANION_CLICK_THROUGH ) {
                        vastCompanionAd.clickThroughURL = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.IFRAME_RESOURCE ) {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.IFRAME;
                        vastCompanionAd.resourceType = vastResourceType;
                        vastCompanionAd.url = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.HTML_RESOURCE ) {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.HTML;
                        vastCompanionAd.resourceType = vastResourceType;
                        vastCompanionAd.code = xmlParser.textContent( nodeArray[j] );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.STATIC_RESOURCE ) {
                        var vastResourceType = new VASTResourceType();
                        vastResourceType.name = vastResourceType.STATIC;
                        vastCompanionAd.resourceType = vastResourceType;
                        vastCompanionAd.creativeType = nodeArray[j].getAttribute( VASTElement.CREATIVE_TYPE );
                        vastCompanionAd.url = this.trim( xmlParser.textContent( nodeArray[j] ) );
                    }
                    else if( nodeArray[j].nodeName == VASTElement.TRACKING_EVENTS ) {
                        var trackings = nodeArray[j].getElementsByTagName( VASTElement.TRACKING );
                        var trackingsLength = trackings.length;
                        if( trackingsLength > 0 ) {
                            
                            vastCompanionAd.creativeView = [];
                            for(var k=0; k < trackingsLength;k++ ){
                                var type = trackings[k].getAttribute( VASTElement.EVENT );
                                if( type == VASTElement.CREATIVE_VIEW ){
                                    vastCompanionAd.creativeView.push(this.trim( xmlParser.textContent( trackings[k] ) ));
                                }
                            }
                        }
                    }
                }
                vastCompanionAds.push( vastCompanionAd );
            }

            return vastCompanionAds;
        },

        _parseTrackingEvents:function( xml )
        {
            var vastTrackingEvents = [];

            var trackings = xml.getElementsByTagName( VASTElement.TRACKING );
            var trackingsLength = trackings.length;
            for( var i = 0; i < trackingsLength; i++ )
            {
                var vastTrackingEvent = new VASTTrackingEvent();
                vastTrackingEvent.urls.push( xmlParser.textContent( trackings[i] ) );
                vastTrackingEvent.type = trackings[i].getAttribute( VASTElement.EVENT );
                vastTrackingEvents.push( vastTrackingEvent );
            }

            return vastTrackingEvents;
        },

        _parseVideoClick:function( xml )
        {
            var vastVideoClick = new VASTVideoClick();

            var nodeArray = xml.childNodes;
            var nodeArrayLength = nodeArray.length;
            for( var i = 0; i < nodeArrayLength; i++ )
            {
                if( nodeArray[i].nodeName == VASTElement.CLICK_THROUGH )
                {
                    vastVideoClick.clickThrough = this.trim( xmlParser.textContent( nodeArray[i] ) );
                }
                else if( nodeArray[i].nodeName == VASTElement.CLICK_TRACKING )
                {
                    vastVideoClick.clickTrackings.push( this.trim( xmlParser.textContent( nodeArray[i] ) ) );
                }
                else if( nodeArray[i].nodeName == VASTElement.CUSTOM_CLICK )
                {
                    vastVideoClick.customClicks.push( this.trim( xmlParser.textContent( nodeArray[i] ) ) );
                }
            }

            return vastVideoClick;
        },

        _parseMediaFiles:function( xml )
        {
            var vastMediaFiles = [];

            var mediaFiles = xml.getElementsByTagName( VASTElement.MEDIA_FILE );
            var mediaFilesLength = mediaFiles.length;
            for( var i = 0; i < mediaFilesLength; i++ )
            {
                var vastMediaFile = new VASTMediaFile();
                vastMediaFile.id = mediaFiles[i].getAttribute( VASTElement.ID );
                vastMediaFile.bitrate = mediaFiles[i].getAttribute( VASTElement.BITRATE );
                vastMediaFile.height = mediaFiles[i].getAttribute( VASTElement.HEIGHT );
                vastMediaFile.width = mediaFiles[i].getAttribute( VASTElement.WIDTH );
                vastMediaFile.delivery = mediaFiles[i].getAttribute( VASTElement.DELIVERY );
                vastMediaFile.type = mediaFiles[i].getAttribute( VASTElement.TYPE );
                vastMediaFile.scalable = mediaFiles[i].getAttribute( VASTElement.SCALABLE ) == 'true' ? true : false;
                vastMediaFile.maintainAspectRatio = mediaFiles[i].getAttribute( VASTElement.MAINTAIN_ASPECT_RATIO ) == 'true' ? true : false;
                vastMediaFile.apiFramework = mediaFiles[i].getAttribute( VASTElement.API_FRAMEWORK );
                vastMediaFile.url = this.trim( xmlParser.textContent( mediaFiles[i] ) );
                vastMediaFiles.push( vastMediaFile );
            }

            return vastMediaFiles;
        }

    });

    return vast2parser;

});
