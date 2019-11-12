$( document ).ready( function () {
	configurePlatformIdButtons();
	configureTechButtons();
	configureSBMButtons();
	configureHLSButtons();
	configureAudioAdaptiveButtons();
	//configureGDPRButtons();
	configureMediaAdButtons();
	configurePlayerServicesRegionButtons();
} );
//Change platformid buttons - Triton Digital QA usage only.
var platformid = 'prod';
var platformIdLink = platformid;

if ( getUrlVars()['platformid'] ) {
	platformid =  getUrlVars()['platformid'];
	platformIdLink = platformid;

	if( platformid === 'local' ){
		platformIdLink = 'local';
		platformid = 'prod';
	}

	if( platformid === 'versioning' ){
		platformIdLink = 'versioning';
		platformid = 'prod';
	}

} else if ( location.host.startsWith('localhost') ){
	platformIdLink = 'local';
	platformid = 'prod';

} 


var tech = getUrlVars()[ 'tech' ] || 'html5';
var sbm = getUrlVars()[ 'sbm' ] == 'false' ? false : true;
var aSyncCuePointFallback = getUrlVars()[ 'aSyncCuePointFallback' ] == 'false' ? false : true;
var hls = getUrlVars()[ 'hls' ] == 'false' ? false : true;
var audioAdaptive = getUrlVars()[ 'audioAdaptive' ] == 'true' ? true : false;
var streamAutoStart = false;

var player; /* TD player instance */
var station = 'TRITONRADIOMUSIC'; /* Default audio station */

var adPlaying; /* boolean - Ad break currently playing */
var currentTrackCuePoint; /* Current Track */
var livePlaying; /* boolean - Live stream currently playing */
var podcastPlaying;
var companions; /* VAST companion banner object */
var song; /* Song object that wraps NPE data */
//var allowPersonalisedAds = getUrlVars()['allowPersonalisedAds'] == "true" ? true : false;
var allowPersonalisedAds = true;
var tcfFramework = false;//getUrlVars()['tcfFramework'] == "true" ? true : false;
var playerServicesRegion = getUrlVars()[ 'playerServicesRegion' ] || 'us';

//idSync
var age = getUrlVars()[ 'age' ] || '';
var dob = getUrlVars()[ 'dob' ] || '';
var yob = getUrlVars()[ 'yob' ] || '';
var gender = getUrlVars()[ 'gender' ] || '';
var ip = getUrlVars()[ 'ip' ] || '';

var idSyncStation = getUrlVars()['idSyncStation'] != undefined ?  getUrlVars()['idSyncStation'] : station;
var currentStation = ''; /* String - Current station played */
var flowAds = false;

function initPlayer() {
	var techPriority;
	switch ( tech ) {
	case 'flash_html5':
		techPriority = [ 'Flash', 'Html5' ];
		break;
	case 'flash':
		techPriority = [ 'Flash' ];
		break;
	case 'html5':
		techPriority = [ 'Html5' ];
		break;
	case 'html5_flash':
	default:
		techPriority = [ 'Html5', 'Flash' ];
		break;

	}

	playerServicesRegion = playerServicesRegion == 'us' ? '' : playerServicesRegion;

	/* TD player configuration object used to create player instance */
	var tdSdkConfig = {		
		//locale: 'es',
		coreModules: [ {
			id: 'MediaPlayer',			
			playerId: 'td_container',
			platformId: platformid + '01', //prod01 by default.
			isDebug: true,
			techPriority: techPriority,
			allowPersonalisedAds: allowPersonalisedAds,
			playerServicesRegion: playerServicesRegion,
			/* (default behaviour) or ['Html5', 'Flash'] or ['Flash'] or ['Html5'] */
			timeShift: { /* The 'timeShift' configuration object is optional, by default the timeShifting is inactive and is Flash only, HTML5 to be tested in a future version of PlayerCore */
				active: 0,
				/* 1 = active, 0 = inactive */
				max_listening_time: 35 /* If max_listening_time is undefined, the default value will be 30 minutes */
			},
			//defaultTrackingParameters:{ user:{ streamtheworld_user:1 } },
			sbm: {
				active: sbm,
				aSyncCuePointFallback: aSyncCuePointFallback
			},
			hls: hls,
			audioAdaptive: audioAdaptive,
			geoTargeting: {
				desktop: {
					isActive: true
				},
				iOS: {
					isActive: true
				},
				android: {
					isActive: true
				}
			},
			idSync: {
				station: idSyncStation,
				age: age,
				dob: dob,
				yob: yob,
				gender: gender,
				ip: ip
			},
			adStitcher: true,
			plugins: [ {
				id: 'vastAd'
			}, {
				id: 'mediaAd'
			}, {
				id: 'onDemand'
			} ] /*These plugins are specific to the Flash controller - Each plugin contains id (String) and other optional config*/
		}, {
			id: 'UserRegistration',
			tenantId: 'see_1670',
			platformId: platformid + '01'
		}, {
			id: 'NowPlayingApi',
			platformId: platformid + '01'
		}, {
			id: 'Npe'
		}, {
			id: 'PlayerWebAdmin'
		}, {
			id: 'SyncBanners',
			elements: [ {
				id: 'td_synced_bigbox',
				width: 300,
				height: 250
			}, {
				id: 'td_synced_leaderboard',
				width: 728,
				height: 90
			} ],
			vastCompanionPriority: [ 'static', 'iframe', 'html' ]
		}, {
			id: 'TargetSpot'
		} ],
		playerReady: onPlayerReady,
		configurationError: onConfigurationError,
		moduleError: onModuleError,
		adBlockerDetected: onAdBlock
	};

	player = new TDSdk( tdSdkConfig );

}

function configurePlatformIdButtons() {
	$( '#platform_' + platformIdLink + '_button' ).button( 'toggle' );
	$( "#platform_local_button" ).click( function () {
		window.location.href = 'index.html?platformid=local&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#platform_local_build_button" ).click( function () {
		window.location.href = 'index.html?platformid=build&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#platform_dev_button" ).click( function () {
		window.location.href = 'index.html?platformid=dev&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
  $( "#platform_preprodsecured_button" ).click( function () {
		window.location.href = 'index.html?platformid=preprodsecured&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#platform_preprod_button" ).click( function () {
		window.location.href = 'index.html?platformid=preprod&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#platform_prod_button" ).click( function () {
		window.location.href = 'index.html?platformid=prod&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#platform_prodsecured_button" ).click( function () {
		window.location.href = 'index.html?platformid=prodsecured&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds +  '&tcfFramework=' + tcfFramework;
	} );
}
//End platformid configuration - Triton Digital QA usage only.

//Change tech buttons - Triton Digital QA usage only.
function configureTechButtons() {
	$( '#tech_' + tech + '_button' ).button( 'toggle' );
	$( "#tech_flash_html5_button" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=flash_html5&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds +  '&tcfFramework=' + tcfFramework;
	} );
	$( "#tech_html5_flash_button" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=html5_flash&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds +  '&tcfFramework=' + tcfFramework;
	} );
	$( "#tech_flash_button" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=flash&sbm=false&aSyncCuePointFallback=false' + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( "#tech_html5_button" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=html5&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
}
//End tech configuration - Triton Digital QA usage only.

function configureSBMButtons() {
	if ( sbm ) {
		$( '#sbm_active_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#sbm_inactive_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#sbm_inactive_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#sbm_active_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	if ( aSyncCuePointFallback ) {
		$( '#np_active_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#np_inactive_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#np_inactive_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#np_active_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	$( '#sbm_active_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=true&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( '#sbm_inactive_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=false&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );

	$( '#np_active_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=true' + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( '#np_inactive_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=false' + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
}

function configureHLSButtons() {
	if ( hls ) {
		$( '#hls_active_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#hls_inactive_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#hls_inactive_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#hls_active_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	$( '#hls_active_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&hls=true&aSyncCuePointFallback=' + aSyncCuePointFallback + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( '#hls_inactive_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&hls=false&aSyncCuePointFallback=' + aSyncCuePointFallback + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
}

function configureAudioAdaptiveButtons() {
	if ( audioAdaptive ) {
		$( '#audioadaptive_active_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#audioadaptive_inactive_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#audioadaptive_inactive_button' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#audioadaptive_active_button' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	$( '#audioadaptive_active_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&hls=' + hls + '&audioAdaptive=true&aSyncCuePointFallback=' + aSyncCuePointFallback + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
	$( '#audioadaptive_inactive_button' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&hls=' + hls + '&audioAdaptive=false&aSyncCuePointFallback=' + aSyncCuePointFallback + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework;
	} );
}

function configurePlayerServicesRegionButtons() {
	$('#playerservices_region_' + playerServicesRegion ).button( 'toggle' );

	$( "#playerservices_region_us" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework + '&playerServicesRegion=us';
	} );
	$( "#playerservices_region_eu" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework + '&playerServicesRegion=eu';
	} );
	$( "#playerservices_region_ap" ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=false&aSyncCuePointFallback=false' + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=' + tcfFramework + '&playerServicesRegion=ap';
	} );	
}

function configureGDPRButtons(){
	if ( allowPersonalisedAds ) {
		$( '#allow_personalised_ads_true' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#allow_personalised_ads_false' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#allow_personalised_ads_false' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#allow_personalised_ads_true' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	if ( tcfFramework ) {
		$( '#tcf_true' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#tcf_false' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	} else {
		$( '#tcf_false' ).removeClass( "btn-default" ).addClass( "btn-primary active" );
		$( '#tcf_true' ).removeClass( "btn-primary active" ).addClass( "btn-default" );
	}

	$( '#allow_personalised_ads_true' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=true' + '&tcfFramework=' + tcfFramework;
	} );

	$( '#allow_personalised_ads_false' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=false' + '&tcfFramework=' + tcfFramework;
	} );	

	$( '#tcf_true' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds + '&tcfFramework=true' ;
	} );

	$( '#tcf_false' ).click( function () {
		window.location.href = 'index.html?platformid=' + platformIdLink + '&tech=' + tech + '&sbm=' + sbm + '&aSyncCuePointFallback=' + aSyncCuePointFallback + '&hls=' + hls + '&audioAdaptive=' + audioAdaptive + '&allowPersonalisedAds=' + allowPersonalisedAds  + '&tcfFramework=false';
	} );
}

function configureMediaAdButtons() {

	$( '#stream_auto_start_true' ).click( function () {
		streamAutoStart = true;
		$( '#stream_auto_start_true' ).addClass( "active" );
		$( '#stream_auto_start_false' ).removeClass( "active" );
	} );

	$( '#stream_auto_start_false' ).click( function () {
		streamAutoStart = false;
		$( '#stream_auto_start_false' ).addClass( "active" );
		$( '#stream_auto_start_true' ).removeClass( "active" );
	} );
}

function initControlsUi() {
	$( document ).on( 'click', 'input[data-action="play-live"]', playLiveAudioStream );

	$( "#clearDebug" ).click( function () {
		clearDebugInfo();
	} );

	$( "#playStreamByUserStationButton" ).click( function () {
		playStreamByUserStation();
	} );

	$( "#playUrlButton" ).click( function () {
		if ( $( "#streamUrlUser" ).val() == '' ) {
			alert( 'Please enter an url' );
			return;
		}

		if ( adPlaying )
			player.skipAd();

		if ( livePlaying )
			player.stop();

		player.MediaPlayer.tech.playStream( {
			url: $( "#streamUrlUser" ).val(),
			aSyncCuePoint: {
				active: false
			},
			isHLS:hls
		} );
	} );

	$( "#playFileButton" ).click( function () {
		if ( $( "#fileUrl" ).val() == '' ) {
			alert( 'Please enter an file url' );
			return;
		}

		if ( adPlaying )
			player.skipAd();

		if ( livePlaying )
			player.stop();

		player.play( {
			file: $( "#fileUrl" ).val()
		} );
		podcastPlaying = true;
	} );

	$( "#pauseFileButton" ).click( function () {

		if ( podcastPlaying ) {
			player.pause();
		}
	} );

	$( "#resumeFileButton" ).click( function () {

		player.resume();
		podcastPlaying = true;

	} );

	$( "#stopFileButton" ).click( function () {

		if ( podcastPlaying ) {
			player.stop();
			podcastPlaying = false;
		}
	} );

	$( "#backFileButton" ).click( function () {

		if ( podcastPlaying ) {
			player.seek( currentTime - 15 );
		}
	} );

	$( "#jumpFileButton" ).click( function () {

		if ( podcastPlaying ) {
			player.seek( currentTime + 15 );
		}
	} );

	$( "#stopButton" ).click( function () {
		stopStream();
	} );

	$( "#pauseButton" ).click( function () {
		pauseStream();
	} );

	$( "#resumeButton" ).click( function () {
		resumeStream();
	} );

	$( "#seekLiveButton" ).click( function () {
		seekLive();
	} );

	$( "#muteButton" ).click( function () {
		mute();
	} );

	$( "#unMuteButton" ).click( function () {
		unMute();
	} );

	$( "#skipAdButton" ).click( function () {
		skipAd();
	} );

	$( "#destroyAdButton" ).click( function () {
		destroyAd();
	} );

	$( "#setVolume50Button" ).click( function () {
		setVolume50();
	} );

	$( "#playTapAdButton" ).click( function () {
		playTAPAd();
	} );

	$( "#playTapAdButtonWithTrackingParameters" ).click( function () {
		playTAPAdButtonWithTrackingParameters();
	} );

	$( "#playRunSpotAdButton" ).click( function () {
		playRunSpotAd();
	} );

	$( "#playRunSpotAdByIdButton" ).click( function () {
		playRunSpotAdById();
	} );

	$( "#playVastAdButton" ).click( function () {
		playVastAd();
	} );

	$( "#playVastAdByUrlButton" ).click( function () {
		playVastAdByUrl();
	} );

	$( "#playVastAdByRawXMLButton" ).click( function () {
		playVastAdByRawXML();
	} );

	$( "#playBloomAdButton" ).click( function () {
		playBloomAd();
	} );

	$( "#playMediaAdButton" ).click( function () {
		playMediaAd();
	} );

	$( "#getArtistButton" ).click( function () {
		getArtistData();
	} );

	$( "#flowAds" ).click( function () {
		flowAds = true;
		attachAdListeners();
		player.playAd( 'vastAd', {
			url: 'http://runspot4.tritondigital.com/RunSpotV4.svc/GetVASTAd?&StationID=undefined&MediaFormat=21&RecordImpressionOnCall=false&AdMinimumDuration=0&AdMaximumDuration=900&AdLevelPlacement=1&AdCategory=1'
		} );

	} );

	//Buttons specific to User Registration / MediaPlayer / Selective Bitrate
	$( "#loginButton" ).click( function () {
		player.UserRegistration.emit( 'user-logged-in' );

		var data = {
			dob: '06/29/1980',
			gender: 'male',
			zip: '00000'
		};
		data.vid = $( "#userVid" ).val();
		data.tdas = {};
		data.tdas[ 'user-tags' ] = $( "#userTags" ).val();
		data.tdas[ 'user-tags-hash' ] = $( "#userTagsHash" ).val();

		player.UserRegistration.emit( 'user-details', data );
	} );
	$( "#logoutButton" ).click( function () {
		player.UserRegistration.emit( 'user-logged-out' );
	} );
	$( "#activateLowButton" ).click( function () {
		player.MediaPlayer.activateLow();
	} );
	$( "#deactivateLowButton" ).click( function () {
		player.MediaPlayer.deactivateLow();
	} );

}

function playLiveAudioStream( event ) {
	event.preventDefault();

	var station = $( event.target ).data( 'station' );

	if ( station == '' ) {
		alert( 'Please enter a Station' );
		return;
	}

	debug( 'playLiveAudioStream - station=' + station );

	$( '#stationUser' ).val( '' );

	if ( adPlaying )
		player.skipAd();

	if ( livePlaying )
		player.stop();

	player.play( {
		station: station,
		timeShift: true
	} );
}

function playStreamByUserStation() {
	if ( $( "#stationUser" ).val() == '' ) {
		alert( 'Please enter a Station' );
		return;
	}

	if ( adPlaying )
		player.skipAd();

	if ( livePlaying )
		player.stop();

	var trackingParams = $( "#stationUserTrackingParameters" ).val().split( ',' );
	var params = {};
	for ( var i = 0; i < trackingParams.length; i++ ) {
		var tup = trackingParams[ i ].split( ':' );
		params[ tup[ 0 ] ] = tup[ 1 ];
	}

	player.play( {
		station: $( "#stationUser" ).val(),
		trackingParameters: params,
		timeShift: true
	} );

	if ( currentStation != $( "#stationUser" ).val() ) {
		currentStation = $( "#stationUser" ).val();
	}
}

function stopStream() {
	player.stop();
}

function pauseStream() {
	player.pause();
}

function resumeStream() {
	if ( livePlaying )
		player.resume();
	else
		player.play();
}

function seekLive() {
	player.seekLive();
}

function loadNpApi() {
	if ( $( "#songHistoryCallsignUser" ).val() == '' ) {
		alert( 'Please enter a Callsign' );
		return;
	}

	var isHd = ( $( "#songHistoryConnectionTypeSelect" ).val() == 'hdConnection' );

	//Set the hd parameter to true if the station has AAC. Set it to false if the station has no AAC.
	player.NowPlayingApi.load( {
		mount: $( "#songHistoryCallsignUser" ).val(),
		hd: isHd,
		numberToFetch: 15
	} );
}

function skipAd() {
	player.skipAd();
}

function destroyAd() {
	player.destroyAd();
}

function setVolume50() {
	player.setVolume( .5 );
}

function mute() {
	player.mute();
}

function unMute() {
	player.unMute();
}

function getArtistData() {
	if ( song && song.artist() != null )
		song.artist().fetchData();
}

function onPlayerReady() {
	initControlsUi();

	player.addEventListener( 'track-cue-point', onTrackCuePoint );
	player.addEventListener( 'ad-break-cue-point', onAdBreak );
	player.addEventListener( 'ad-break-cue-point-complete', onAdEndBreak );
	player.addEventListener( 'stream-track-change', onTrackChange );
	player.addEventListener( 'hls-cue-point', onHlsCuePoint );
	player.addEventListener( 'speech-cue-point', onSpeechCuePoint );
	player.addEventListener( 'custom-cue-point', onCustomCuePoint );

	player.addEventListener( 'stream-status', onStatus );
	player.addEventListener( 'stream-geo-blocked', onGeoBlocked );
	player.addEventListener( 'timeout-alert', onTimeOutAlert );
	player.addEventListener( 'timeout-reach', onTimeOutReach );
	player.addEventListener( 'npe-song', onNPESong );

	player.addEventListener( 'stream-select', onStreamSelect );

	player.addEventListener( 'stream-start', onStreamStarted );
	player.addEventListener( 'stream-stop', onStreamStopped );

	player.addEventListener( 'media-playback-status', onMediaPlaybackStatus );
	player.addEventListener( 'media-error', onMediaError );
	player.addEventListener( 'media-playback-timeupdate', onMediaPlaybackTimeUpdate );

	player.setVolume( 1 ); //Set volume to 100%

	setStatus( 'Api Ready' );
	setTech( player.MediaPlayer.tech.type );

	player.addEventListener( 'list-loaded', onListLoaded );
	player.addEventListener( 'list-empty', onListEmpty );
	player.addEventListener( 'nowplaying-api-error', onNowPlayingApiError );

	//player.play( { station:'TRITONRADIOMUSIC', timeShift:true } );

	$( "#fetchSongHistoryByUserCallsignButton" ).click( function () {
		loadNpApi();
	} );

	player.addEventListener( 'pwa-data-loaded', onPwaDataLoaded );

	$( "#pwaButton" ).click( function () {
		loadPwaData();
	} );
}

/**
 * Event fired in case the loading of the companion ad returned an error.
 * @param e
 */
function onCompanionLoadError( e ) {
	debug( 'tdplayer::onCompanionLoadError - containerId=' + e.containerId + ', adSpotUrl=' + e.adSpotUrl, true );
}

function onAdPlaybackStart( e ) {
	adPlaying = true;

	setStatus( 'Advertising... Type=' + e.data.type );
}

function onAdPlaybackComplete( e ) {
	adPlaying = false;

	console.log( e );
	$( "#td_synced_bigbox" ).empty();
	$( "#td_synced_leaderboard" ).empty();

	if ( streamAutoStart ) {
		player.play( {
			station: station
		} )
	}

	setStatus( 'Ad Playback Complete' );

}

function onAdPlaybackError( e ) {

	if ( flowAds ) {
		player.playAd( 'vastAd', {
			url: 'http://proserv.tritondigital.com/vast/vast2_linear_webteam.xml'
		} );
		flowAds = false;
	} else {
		setStatus( 'Ad Playback Error' );
	}

}

function onAdPlaybackDestroy( e ) {
	adPlaying = false;

	console.log( e );
	$( "#td_synced_bigbox" ).empty();
	$( "#td_synced_leaderboard" ).empty();

	setStatus( 'Ad Playback Destroy' );

}

function onAdCountdown( e ) {
	debug( 'Ad countdown : ' + e.data.countDown + ' second(s)' );
}

function onVpaidAdCompanions( e ) {
	debug( 'Vpaid Ad Companions' );

	//Load Vast Ad companion (bigbox & leaderbaord ads)
	//displayVastCompanionAds( e.companions );
}

function onStreamStarted() {
	livePlaying = true;
}

function onStreamSelect() {
	$( '#hasHQ' ).html( player.MediaPlayer.hasHQ().toString() );
	$( '#isHQ' ).html( player.MediaPlayer.isHQ().toString() );

	$( '#hasLow' ).html( player.MediaPlayer.hasLow().toString() );
	$( '#isLow' ).html( player.MediaPlayer.isLow().toString() );
}

function onStreamStopped() {
	livePlaying = false;

	clearNpe();
	$( "#trackInfo" ).html( '' );
	$( "#asyncData" ).html( '' );

	$( '#hasHQ' ).html( 'N/A' );
	$( '#isHQ' ).html( 'N/A' );

	$( '#hasLow' ).html( 'N/A' );
	$( '#isLow' ).html( 'N/A' );
}

function onTrackCuePoint( e ) {
	debug( 'New Track cuepoint received' );
	debug( 'Title:' + e.data.cuePoint.cueTitle + ' - Artist:' + e.data.cuePoint.artistName );
	console.log( e );

	if ( currentTrackCuePoint && currentTrackCuePoint != e.data.cuePoint )
		clearNpe();

	if ( e.data.cuePoint.nowplayingURL && sbm && player.Npe !== undefined )
		player.Npe.loadNpeMetadata( e.data.cuePoint.nowplayingURL, e.data.cuePoint.artistName, e.data.cuePoint.cueTitle );

	currentTrackCuePoint = e.data.cuePoint;

	$( "#trackInfo" ).html( '<p><span class="label label-info">Now Playing:</span><br><b>Title:</b> ' + currentTrackCuePoint.cueTitle + '<br><b>Artist:</b> ' + currentTrackCuePoint.artistName + '</p>' );

}

function onTrackChange( e ) {
	debug( 'Stream Track has changed' );
}

function onHlsCuePoint( e ) {
	debug( 'New HLS cuepoint received' );
	console.log( e );
}

function onSpeechCuePoint( e ) {
	debug( 'New Speech cuepoint received' );
	console.log( e );
}

function onCustomCuePoint( e ) {
	debug( 'New Custom cuepoint received' );
	console.log( e );
}

function onAdBreak( e ) {
	setStatus( 'Commercial break...' );
	console.log( e );
}

function onAdEndBreak( e ) {
	setStatus( this.streamStatus );
	console.log( e );
}

function clearNpe() {
	$( "#npeInfo" ).html( '' );
	$( "#asyncData" ).html( '' );
}

//Song History
function onListLoaded( e ) {
	debug( 'Song History loaded' );
	console.log( e.data );

	$( "#asyncData" ).html( '<br><p><span class="label label-warning">Song History:</span>' );

	var tableContent = '<table class="table table-striped"><thead><tr><th>Song title</th><th>Artist name</th><th>Time</th></tr></thead>';

	var time;
	$.each( e.data.list, function ( index, item ) {
		time = new Date( Number( item.cueTimeStart ) );
		tableContent += "<tr><td>" + item.cueTitle + "</td><td>" + item.artistName + "</td><td>" + time.toLocaleTimeString() + "</td></tr>";
	} );

	tableContent += "</table></p>";

	$( "#asyncData" ).html( "<div>" + tableContent + "</div>" );
}

//Song History empty
function onListEmpty( e ) {
	$( "#asyncData" ).html( '<br><p><span class="label label-important">Song History is empty</span>' );
}

function onNowPlayingApiError( e ) {
	debug( 'Song History loading error', true );
	console.error( e );

	$( "#asyncData" ).html( '<br><p><span class="label label-important">Song History error</span>' );
}

function onTimeOutAlert( e ) {
	debug( 'Time Out Alert' );
}

function onTimeOutReach( e ) {
	debug( 'Time Out Reached' );
}

function onConfigurationError( e ) {
	debug( 'Configuration error', true );
	console.log( e );
}

function onModuleError( object ) {
	var message = '';

	$.each( object.data.errors, function ( i, val ) {
		message += 'ERROR : ' + val.data.error.message + '<br/>';
	} );

	$( "#status" ).html( '<p><span class="label label-important">' + message + '</span><p></p>' );
}

function onStatus( e ) {
	console.log( 'tdplayer::onStatus' );

	this.streamStatus = e.data.status;

	setStatus( e.data.status );
}

function onMediaPlaybackStatus( e ) {
	console.log( 'tdplayer::onMediaPlaybackStatus' );

	debug( e.data.status );

	$( "#filestatus" ).html( '<p><span class="label label-success">Status: ' + e.data.status + '</span></p>' );

	if ( e.data.status == 'Stopped' ) {
		var time = '00:00/00:00';

		$( "#filetime" ).html( '<p><span class="label">' + time + '</span></p>' );
	}
}

function onMediaError( e ) {
	console.log( 'tdplayer::onMediaError' );

	debug( e.data.error );

	$( "#filestatus" ).html( '<p><span class="label label-success">Status: ' + e.data.error + '</span></p>' );
}

var currentTime = 0;

function onMediaPlaybackTimeUpdate( e ) {
	console.log( 'tdplayer::onMediaPlaybackTimeUpdate' );

	currentTime = e.data.playedTime;

	var toto = SecondsToHMS( e.data.playedTime ) + '/' + SecondsToHMS( e.data.duration );

	$( "#filetime" ).html( '<p><span class="label">' + toto + '</span></p>' );

}

function onAdBlock( e ) {
	console.log( 'tdplayer::onAdBlock' );

	debug( e.data.message );
}

function SecondsToHMS( d ) {
	d = Number( d );
	var m = Math.floor( d % 3600 / 60 );
	var s = Math.floor( d % 3600 % 60 );
	return ( ( m > 0 ? ( m >= 10 ? m : '0' + m ) : '00' ) + ':' + ( s > 0 ? ( s >= 10 ? s : '0' + s ) : '00' ) );
}

function onGeoBlocked( e ) {
	console.log( 'tdplayer::onGeoBlocked' );

	setStatus( e.data.text );
}

function setStatus( status ) {
	debug( status );

	$( "#status" ).html( '<p><span class="label label-success">Status: ' + status + '</span></p>' );
}

function setTech( techType ) {
	var apiVersion = player.version.value + '-' + player.version.build;

	var techInfo = '<p><span class="label label-info">Api version: ' + apiVersion + ' - Technology: ' + techType;

	if ( player.flash.available )
		techInfo += ' - Your current version of flash plugin is: ' + player.flash.version.major + '.' + player.flash.version.minor + '.' + player.flash.version.release;

	techInfo += '</span></p>';

	$( "#techInfo" ).html( techInfo );
}

function loadPwaData() {
	if ( $( "#pwaCallsign" ).val() == '' || $( "#pwaStreamId" ).val() == '' ) {
		alert( 'Please enter a Callsign and a streamid' );
		return;
	}

	player.PlayerWebAdmin.load( $( "#pwaCallsign" ).val(), $( "#pwaStreamId" ).val() );
}

function onPwaDataLoaded( e ) {
	debug( 'PlayerWebAdmin data loaded successfully' );
	console.log( e );

	$( "#asyncData" ).html( '<br><p><span class="label label-warning">PlayerWebAdmin:</span>' );

	var tableContent = '<table class="table table-striped"><thead><tr><th>Key</th><th>Value</th></tr></thead>';

	for ( var item in e.data.config ) {
		console.log( item );
		tableContent += "<tr><td>" + item + "</td><td>" + e.data.config[ item ] + "</td></tr>";
	}

	tableContent += "</table></p>";

	$( "#asyncData" ).html( "<div>" + tableContent + "</div>" );
}

function playTAPAd() {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	//player.skipAd();
	player.playAd( 'tap', {
		host: 'cmod.live.streamtheworld.com',
		type: 'preroll',
		format: 'vast',
		stationId: 77583
	} );
}

function playTAPAdButtonWithTrackingParameters() {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'tap', {
		host: 'cmod.live.streamtheworld.com',
		type: 'preroll',
		format: 'vast',
		stationId: 77583,
		trackingParameters: {
			ttag: 'demo'
		}
	} );
}

function playRunSpotAd() {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	//player.skipAd();
	player.playAd( 'vastAd', {
		sid: 3168
	} );
}

function playRunSpotAdById() {
	if ( $( "#runSpotId" ).val() == '' ) return;

	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'vastAd', {
		sid: $( "#runSpotId" ).val()
	} );
}

function playVastAd( url ) {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	if ( url ) {
		player.playAd( 'vastAd', {
			url: url
		} );
	} else {
		player.playAd( 'vastAd', {
			url: 'http://proserv.tritondigital.com/vast/vast2_linear_webteam.xml'
		} );
	}

}

function playVastAdByUrl() {
	if ( $( "#vastAdUrl" ).val() == '' ) return;

	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'vastAd', {
		url: $( "#vastAdUrl" ).val()
	} );
}

function playVastAdByRawXML() {

	if ( $( "#vastAdRawXML" ).val() == '' ) return;

	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'vastAd', {
		rawXML: $( "#vastAdRawXML" ).val()
	} );
}

function playBloomAd() {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'bloom', {
		id: 4974
	} );
}

function playMediaAd() {
	detachAdListeners();
	attachAdListeners();

	player.stop();
	player.playAd( 'mediaAd', {
		mediaUrl: 'http://proserv.tritondigital.com/vast/mediafiles/GEICOPushItfeaturingSaltNPepa.mp4',
		linkUrl: 'http://www.geico.com/'
	} );
}

function attachAdListeners() {
	player.addEventListener( 'ad-playback-start', onAdPlaybackStart );
	player.addEventListener( 'ad-playback-error', onAdPlaybackError );
	player.addEventListener( 'ad-playback-complete', onAdPlaybackComplete );
	player.addEventListener( 'ad-playback-destroy', onAdPlaybackDestroy );
	player.addEventListener( 'ad-countdown', onAdCountdown );
	player.addEventListener( 'vpaid-ad-companions', onVpaidAdCompanions );
}

function detachAdListeners() {
	player.removeEventListener( 'ad-playback-start', onAdPlaybackStart );
	player.removeEventListener( 'ad-playback-error', onAdPlaybackError );
	player.removeEventListener( 'ad-playback-complete', onAdPlaybackComplete );
	player.removeEventListener( 'ad-playback-destroy', onAdPlaybackDestroy );
	player.removeEventListener( 'ad-countdown', onAdCountdown );
	player.removeEventListener( 'vpaid-ad-companions', onVpaidAdCompanions );
}

var artist;

function onNPESong( e ) {
	console.log( 'tdplayer::onNPESong' );
	console.log( e );

	song = e.data.song;

	artist = song.artist();
	artist.addEventListener( 'artist-complete', onArtistComplete );

	var songData = getNPEData();

	displayNpeInfo( songData, false );
}

function displayNpeInfo( songData, asyncData ) {
	$( "#asyncData" ).empty();

	var id = asyncData ? 'asyncData' : 'npeInfo';
	var list = $( "#" + id );

	if ( asyncData == false )
		list.html( '<span class="label label-inverse">Npe Info:</span>' );

	list.append( songData );
}

function onArtistComplete( e ) {
	artist.addEventListener( 'picture-complete', onArtistPictureComplete );

	var pictures = artist.getPictures();
	var picturesIds = [];
	for ( var i = 0; i < pictures.length; i++ ) {
		picturesIds.push( pictures[ i ].id );
	}
	if ( picturesIds.length > 0 )
		artist.fetchPictureByIds( picturesIds );

	var songData = getArtist();

	displayNpeInfo( songData, true );
}

function onArtistPictureComplete( pictures ) {
	console.log( 'tdplayer::onArtistPictureComplete' );
	console.log( pictures );

	var songData = '<span class="label label-inverse">Photos:</span><br>';

	for ( var i = 0; i < pictures.length; i++ ) {
		if ( pictures[ i ].getFiles() )
			songData += '<a href="' + pictures[ i ].getFiles()[ 0 ].url + '" rel="lightbox[npe]" title="Click on the right side of the image to move forward."><img src="' + pictures[ i ].getFiles()[ 0 ].url + '" width="125" /></a>&nbsp;';
	}

	$( "#asyncData" ).append( songData );
}

function getArtist() {
	if ( song != undefined ) {
		var songData = '<span class="label label-inverse">Artist:</span>';

		songData += '<ul><li>Artist id: ' + song.artist().id + '</li>';
		songData += '<li>Artist birth date: ' + song.artist().getBirthDate() + '</li>';
		songData += '<li>Artist end date: ' + song.artist().getEndDate() + '</li>';
		songData += '<li>Artist begin place: ' + song.artist().getBeginPlace() + '</li>';
		songData += '<li>Artist end place: ' + song.artist().getEndPlace() + '</li>';
		songData += '<li>Artist is group ?: ' + song.artist().getIsGroup() + '</li>';
		songData += '<li>Artist country: ' + song.artist().getCountry() + '</li>';

		var albums = song.artist().getAlbums();
		for ( var i = 0; i < albums.length; i++ ) {
			songData += '<li>Album ' + ( i + 1 ) + ': ' + albums[ i ].getTitle() + '</li>';
		}
		var similars = song.artist().getSimilar();
		for ( var i = 0; i < similars.length; i++ ) {
			songData += '<li>Similar artist ' + ( i + 1 ) + ': ' + similars[ i ].name + '</li>';
		}
		var members = song.artist().getMembers();
		for ( var i = 0; i < members.length; i++ ) {
			songData += '<li>Member ' + ( i + 1 ) + ': ' + members[ i ].name + '</li>';
		}

		songData += '<li>Artist website: ' + song.artist().getWebsite() + '</li>';
		songData += '<li>Artist twitter: ' + song.artist().getTwitterUsername() + '</li>';
		songData += '<li>Artist facebook: ' + song.artist().getFacebookUrl() + '</li>';
		songData += '<li>Artist biography: ' + song.artist().getBiography().substring( 0, 2000 ) + '...</small>';

		var genres = song.artist().getGenres();
		for ( var i = 0; i < genres.length; i++ ) {
			songData += '<li>Genre ' + ( i + 1 ) + ': ' + genres[ i ] + '</li>';
		}
		songData += '</ul>';

		return songData;
	} else {
		return '<span class="label label-important">The artist information is undefined</span>';
	}
}

function getNPEData() {
	var innerContent = 'NPE Data undefined';

	if ( song != undefined && song.album() ) {
		var _iTunesLink = '';
		if ( song.album().getBuyUrl() != null )
			_iTunesLink = '<a target="_blank" title="' + song.album().getBuyUrl() + '" href="' + song.album().getBuyUrl() + '">Buy on iTunes</a><br/>';

		innerContent = '<p><b>Album:</b> ' + song.album().getTitle() + '<br/>' + _iTunesLink;

		if ( song.album().getCoverArtOriginal() != undefined && song.album().getCoverArtOriginal().url != null ) {
			innerContent += '<img src="' + song.album().getCoverArtOriginal().url + '" style="height:100px" /></p>';
		}
	}

	return innerContent;
}

function getUrlVars() {
	var vars = [],
		hash;
	var hashes = window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ).split( '&' );
	for ( var i = 0; i < hashes.length; i++ ) {
		hash = hashes[ i ].split( '=' );
		vars.push( hash[ 0 ] );
		vars[ hash[ 0 ] ] = hash[ 1 ];
	}
	return vars;
}

function debug( info, error ) {

	if ( error )
		console.error( info );
	else
		console.log( '%cDEBUG : ' + info, 'background:#ccc' );

	$( '#debugInformation' ).append( info );
	$( '#debugInformation' ).append( '\n' );
}

function clearDebugInfo() {
	$( '#debugInformation' ).html( '' );
}
