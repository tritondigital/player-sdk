$(document).ready(function () {
  configurePlatformIdButtons();
  //configureGDPRButtons();
});
//Change platformid buttons - Triton Digital QA usage only.
var platformid = "prod";
var platformIdLink = platformid;
var playerStarted;
var flvPlayerStatus = "stopped";
var blockWidth = 15;
var blockHeight = 15;
var svg = document.querySelector("svg");
var svgns = "http://www.w3.org/2000/svg";
var runnerRect = document.createElementNS(svgns, "rect");
var streamDataTimeoutId = null;
var streamingType = "station";
var currentVolume = 0.5;
var flvTagData = {};
var totalTags = 0;
let scope = null;
let selectedRect = null;
let totalTimeshiftDuration = null;
let timeshiftSliderStartValue = 0;
var maximumRewindTime = 10800;
var rewindedTime = 0;
let adjustTime;
let setTime = 0;
let hours;
let minutes;
let seconds;

const program = {
  startTime: 0,  
  isProgram: false,
  programInfo: "" 
};


if (getUrlVars()["platformid"]) {
  platformid = getUrlVars()["platformid"];
  platformIdLink = platformid;

  if (platformid === "local") {
    platformIdLink = "local";
     platformid = "prod";
    //  platformid = "preprod";
  }

  if (platformid === "versioning") {
    platformIdLink = "versioning";
    platformid = "prod";
  }
} else if (location.host.startsWith("localhost")) {
  platformIdLink = "local";
  platformid = "prod";
} else if (
  location.host.startsWith("playercore.preprod01.streamtheworld.net")
) {
  platformid = "preprod";
  platformIdLink = platformid;
} else if (location.href.includes("web/v/")) {
  platformid = "prod";
  platformIdLink = "versioning";
}

var tech = getUrlVars()["tech"] || "flash";
var sbm = getUrlVars()["sbm"] == "false" ? false : true;
var aSyncCuePointFallback = getUrlVars()["aSyncCuePointFallback"] == "false" ? false : true;
var hls = getUrlVars()["hls"] == "false" ? false : true;
var forceTimeShift =  getUrlVars()["forceTimeShift"] == "true" ? true : false;
var streamWhileMuted =  getUrlVars()["streamWhileMuted"] == "true" ? true : false;
var audioAdaptive = getUrlVars()["audioAdaptive"] == "true" ? true : false;
var streamAutoStart = false;

var player; /* TD player instance */
var station = "TRITONRADIOMUSIC"; /* Default audio station */

var adPlaying; /* boolean - Ad break currently playing */
var currentTrackCuePoint; /* Current Track */
var livePlaying; /* boolean - Live stream currently playing */
var podcastPlaying;
var companions; /* VAST companion banner object */
var song; /* Song object that wraps NPE data */
var GAActive = true; //getUrlVars()[ 'gaactive' ] == "true" ? true : false;
var GADebug = getUrlVars()["gadebug"] == "true" ? true : false;
//var allowPersonalisedAds = getUrlVars()['allowPersonalisedAds'] == "true" ? true : false;
var allowPersonalisedAds = true;
var tcfFramework = false; //getUrlVars()['tcfFramework'] == "true" ? true : false;
var playerServicesRegion = getUrlVars()["playerServicesRegion"] || "us";

//idSync
var age = getUrlVars()["age"] || "";
var dob = getUrlVars()["dob"] || "";
var yob = getUrlVars()["yob"] || "";
var gender = getUrlVars()["gender"] || "";
var ip = getUrlVars()["ip"] || "";
var menuItem = "none";

var idSyncStation =
  getUrlVars()["idSyncStation"] != undefined
    ? getUrlVars()["idSyncStation"]
    : station;
var currentStation = ""; /* String - Current station played */
var flowAds = false;
// var canvas = document.getElementById('flvCanvas');
// var ctx = this.canvas.getContext('2d');
var flvPacketCount = 0;
var canvasWidth = 975;
var canvasHeight = 400;
var timeshiftPrograms = [];

function initPlayer() {
  var techPriority;
  switch (tech) {
    case "flash_html5":
      techPriority = ["Flash", "Html5"];
      break;
    case "flash":
      techPriority = ["Flash"];
      break;
    case "html5":
      techPriority = ["Html5"];
      break;
    case "html5_flash":
    default:
      techPriority = ["Html5", "Flash"];
      break;
  }

  playerServicesRegion =
    playerServicesRegion == "us" ? "" : playerServicesRegion;

  /* TD player configuration object used to create player instance */
  var tdSdkConfig = {
    // #STRV-807: Using Analytics.js with universal tracking ID:
    analytics: {
      active: GAActive,
      debug: GADebug,
      appInstallerId: "tdtestapp",
      // If tracking id is null, default to Triton analytics (not used in Triton analytics):
      trackingId: null,
      trackingEvents: ["play", "stop", "pause", "resume"],
      sampleRate: 5,

      platformId: platformid + "01",
    },
    //locale: 'es',
    coreModules: [
      {
        id: "MediaPlayer",
        playerId: "td_container",
        platformId: platformid + "01", //prod01 by default.
        isDebug: true,
        techPriority: techPriority,
        allowPersonalisedAds: allowPersonalisedAds,
        playerServicesRegion: playerServicesRegion,
        streamWhileMuted: streamWhileMuted,
        //defaultTrackingParameters:{ user:{ streamtheworld_user:1 } },
        sbm: {
          active: sbm,
          aSyncCuePointFallback: aSyncCuePointFallback,
        },
        hls: hls,
        forceHls: false,
        audioAdaptive: audioAdaptive,
        geoTargeting: {
          desktop: {
            isActive: true,
          },
          iOS: {
            isActive: true,
          },
          android: {
            isActive: true,
          },
        },
        idSync: {
          station: idSyncStation,
          age: age,
          dob: dob,
          yob: yob,
          gender: gender,
          ip: ip,
        },
        adStitcher: true,
        plugins: [
          {
            id: "vastAd",
          },
          {
            id: "mediaAd",
          },
          {
            id: "onDemand",
          },
        ] /*These plugins are specific to the Flash controller - Each plugin contains id (String) and other optional config*/,
      },
      {
        id: "UserRegistration",
        tenantId: "see_1670",
        platformId: platformid + "01",
      },
      {
        id: "NowPlayingApi",
        platformId: platformid + "01",
      },
      {
        id: "Npe",
      },
      {
        id: "PlayerWebAdmin",
      },
      {
        id: "SyncBanners",
        elements: [
          {
            id: "td_synced_bigbox",
            width: 300,
            height: 250,
          },
          {
            id: "td_synced_leaderboard",
            width: 728,
            height: 90,
          },
        ],
        vastCompanionPriority: ["static", "iframe", "html"],
      },
      {
        id: "TargetSpot",
      },
    ],
    playerReady: onPlayerReady,
    configurationError: onConfigurationError,
    moduleError: onModuleError,
    adBlockerDetected: onAdBlock,
  };

  player = new TDSdk(tdSdkConfig);
}

function toggleStreamWhileMuted(checked){
  this.streamWhileMuted = checked;
  window.location.href = getWindowLocation();
}

function toggleForceTimeShift(checked){
  this.forceTimeShift = checked;
  window.location.href = getWindowLocation();
}

function toggleSBM(checked) {
  this.sbm = checked;
  window.location.href = getWindowLocation();
}

function toggleNowPlaying(checked) {
  this.aSyncCuePointFallback = checked;
  window.location.href = getWindowLocation();
}

function toggleHLS(checked) {
  this.hls = checked;
  window.location.href = getWindowLocation();
}

function toggleAdaptiveAudio(checked) {
  this.audioAdaptive = checked;
  window.location.href = getWindowLocation();
}

function updatePlayerServicesRegion(region) {
  this.playerServicesRegion = region;
  window.location.href = getWindowLocation();
}

function loadHtml() {
  this.tech = "html5";
  this.menuItem = "liveStreaming";
  window.location.href = getWindowLocation();
}

function loadFlash() {
  this.tech = "flash";
  this.sbm = false;
  this.aSyncCuePointFallback = false;
  window.location.href = getWindowLocation();
}

function playFileClicked() {
  if ($("#fileUrl").val() == "") {
    alert("Please enter a file url");
    return;
  }

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  player.play({
    file: $("#fileUrl").val(),
    enableOmnyAnalytics: true,
    forceTimeShift: forceTimeShift,
  });
  podcastPlaying = true;
}

function pauseFileClicked() {
  if (podcastPlaying) {
    player.pause();
  }
}

function resumeFileClicked() {
  player.resume();
  podcastPlaying = true;
}

function stopFileClicked() {
  if (podcastPlaying) {
    player.stop();
    podcastPlaying = false;
    if ($("#changePlayBackRate").val() !== "1") {
      $("#changePlayBackRate").val("1").change();
    }
  }
}

function backFileClicked() {
  if (podcastPlaying) {
    player.seek(currentTime - 15);
  }
}

function jumpFileClicked() {
  if (podcastPlaying) {
    player.seek(currentTime + 15);
  }
}

function changePlayBackRate(rate) {
  if (podcastPlaying) {
    player.changePlayBackRate(rate)
  }else{
    if ($("#changePlayBackRate").val() !== "1") {
      $("#changePlayBackRate").val("1").change();
    }
  }
}

function showMediaControls() {
  if (!$("#mediaControls").hasClass("show")) {
    $("#mediaControls").addClass("show");
  }
}

function initialiseBootstrapToggles() {
  window.setTimeout(() => {
    $("#sbm-toggle").bootstrapToggle();
    $("#now-playing-toggle").bootstrapToggle();
    $("#hls-toggle").bootstrapToggle();
    $("#adaptive-audio-toggle").bootstrapToggle();
    $("#swm-toggle").bootstrapToggle();
    $("#force-timeshift-toggle").bootstrapToggle();
  }, 50);
}

function configurePlatformIdButtons() {
  $("#platform_" + platformIdLink + "_button").button("toggle");
  $("#platform_local_button").click(function () {
    window.location.href =
      "index.html?platformid=local&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_local_build_button").click(function () {
    window.location.href =
      "index.html?platformid=build&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_dev_button").click(function () {
    window.location.href =
      "index.html?platformid=dev&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_preprodsecured_button").click(function () {
    window.location.href =
      "index.html?platformid=preprodsecured&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_preprod_button").click(function () {
    window.location.href =
      "index.html?platformid=preprod&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_prod_button").click(function () {
    window.location.href =
      "index.html?platformid=prod&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
  $("#platform_prodsecured_button").click(function () {
    window.location.href =
      "index.html?platformid=prodsecured&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });
}
//End platformid configuration - Triton Digital QA usage only.

function configureGDPRButtons() {
  if (allowPersonalisedAds) {
    $("#allow_personalised_ads_true")
      .removeClass("btn-default")
      .addClass("btn-primary active");
    $("#allow_personalised_ads_false")
      .removeClass("btn-primary active")
      .addClass("btn-default");
  } else {
    $("#allow_personalised_ads_false")
      .removeClass("btn-default")
      .addClass("btn-primary active");
    $("#allow_personalised_ads_true")
      .removeClass("btn-primary active")
      .addClass("btn-default");
  }

  if (GAActive) {
    $("#gaactive_true")
      .removeClass("btn-default")
      .addClass("btn-primary active");
    $("#gaactive_false")
      .removeClass("btn-primary active")
      .addClass("btn-default");
  } else {
    $("#gaactive_false")
      .removeClass("btn-default")
      .addClass("btn-primary active");
    $("#gaactive_true")
      .removeClass("btn-primary active")
      .addClass("btn-default");
  }

  if (tcfFramework) {
    $("#tcf_true").removeClass("btn-default").addClass("btn-primary active");
    $("#tcf_false").removeClass("btn-primary active").addClass("btn-default");
  } else {
    $("#tcf_false").removeClass("btn-default").addClass("btn-primary active");
    $("#tcf_true").removeClass("btn-primary active").addClass("btn-default");
  }

  $("#allow_personalised_ads_true").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=true" +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
    tech_html5_button;
  });

  $("#allow_personalised_ads_false").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=false" +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=" +
      tcfFramework;
  });

  $("#gaactive_true").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=true" +
      "&tcfFramework=" +
      tcfFramework;
  });

  $("#gaactive_false").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=false" +
      "&tcfFramework=" +
      tcfFramework;
  });

  $("#tcf_true").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=true";
  });

  $("#tcf_false").click(function () {
    window.location.href =
      "index.html?platformid=" +
      platformIdLink +
      "&tech=" +
      tech +
      "&sbm=" +
      sbm +
      "&aSyncCuePointFallback=" +
      aSyncCuePointFallback +
      "&hls=" +
      hls +
      "&audioAdaptive=" +
      audioAdaptive +
      "&allowPersonalisedAds=" +
      allowPersonalisedAds +
      "&gaactive=" +
      GAActive +
      "&tcfFramework=false";
  });
}

function updateSliderLabel(ui){
  let rewindedTime 
  let nowTime = new Date().getTime()
  let maxRewind = (maximumRewindTime * 1000)
  if (program.isProgram) {
    maxRewind = 0;
    nowTime = program.startTime
  }
  if(ui === "forward"){
    rewindedTime = ((setTime -  nowTime) + maxRewind + 10000)
  }else if (ui === "rewind") {
    rewindedTime = ((setTime -  nowTime) + maxRewind - 10000)
  }else if(ui === "program"){
    rewindedTime = (setTime -  nowTime) + 1000  
  }else{
    rewindedTime = (ui.value -  nowTime) + maxRewind
  }
  if(rewindedTime < 0){
    hours = minutes = seconds ="00"   
  }else{
    if(rewindedTime > maxRewind && ui != "program") {
      rewindedTime = maxRewind
    }
    let sliderLable = new Date(rewindedTime);
    hours = sliderLable.getUTCHours().toString().padStart(2, '0');
    minutes = sliderLable.getUTCMinutes().toString().padStart(2, '0');
    seconds = sliderLable.getUTCSeconds().toString().padStart(2, '0');
  }
  let value = hours + ':' + minutes + ':' + seconds;
  $("#sliderMinLabel").text('-' + value)
}

function updateTime() {
  if (setTime <= 0) {
    this.timeshiftSliderStartValue += 1000
    let label = new Date().toLocaleString('en-US', {   
      hour: 'numeric', // numeric, 2-digit
      minute: 'numeric', // numeric, 2-digit
      second: 'numeric', // numeric, 2-digit
      hour12: true
    });
    console.log("updatetime")
    updateTimeshiftSlider({"text": label});
  } else {
    setTime = setTime + 1000
    let label = toLocaleDate(setTime, true)
    if (program.isProgram){
      updateSliderLabel("program")
    }
    updateTimeshiftSlider({"text": label});
  }
}

function toLocaleDate(timeStamp, format){
  let label = new Date(timeStamp).toLocaleString('en-US', {   
    hour: 'numeric', // numeric, 2-digit
    minute: 'numeric', // numeric, 2-digit
    second: 'numeric', // numeric, 2-digit
    hour12: format
  });
  return label;
}

function initTimeshiftSlider() {
  //Timeshoft slider
  timeshiftSliderStartValue = 0;
  var handle = $("#custom-handle");  
  $("#timeshiftSlider").slider({
    range: "max",
    min: new Date().getTime() - maximumRewindTime * 1000,
    max: new Date().getTime(),
    value: new Date().getTime(),
    start: function (event, ui) {  
      //Fires when sliding starts      
      timeshiftSliderStartValue = ui.value;
    },
    create: function () {
      handle.text($(this).slider("value"));
    },
    slide: function (event, ui) {
      if (ui.value == 0) {
        handle.text("Live");        
        seekLive();
      } else {
        setTime = ui.value;
        clearInterval(adjustTime);
        adjustTime = setInterval(updateTime, 1000);
        if (program.isProgram === true) {
          $("#timeshiftSlider").slider({
            min: program.startTime,
            max: new Date().getTime(),
          })
          updateSliderLabel("program")
        }else{
          $("#timeshiftSlider").slider({
            min: new Date().getTime() - maximumRewindTime * 1000,
            max: new Date().getTime(),
          });
          updateSliderLabel(ui)
        }
        let label = toLocaleDate(setTime, true)
        handle.text(label);
      }
    },
  },   
  
);

  $( "#timeshiftSlider" ).on( "slidestop", function( event, ui ) {
    if (
      timeshiftSliderStartValue ||
      timeshiftSliderStartValue === 0 
    ) {
      $("#hlsLiveButton").removeClass("active");
      var seekval = (-1 * (timeshiftSliderStartValue - ui.value)) / 1000 ;
      if(seekval != 0 && ui.value != 0){
        player.seek(seekval);
        timeshiftSliderStartValue = ui.value;
      }        
    }
  } );
}

function initControlsUi() {
  
  $("#clearDebug").click(function () {
    clearDebugInfo();
  });

  $("#flvDownloadLink").click(function () {
    //https://playerservices.streamtheworld.com/api/livestream-redirect/TRITONRADIOMUSIC.flv
    let flvMountName = $("#flvMount").val();
    let flvUrlMountName = $("#flvUrl").val();
    flvUrlMountName = flvUrlMountName
      ? flvUrlMountName.substring(
          flvUrlMountName.lastIndexOf("/") + 1,
          flvUrlMountName.lastIndexOf(".")
        )
      : "";

    let mountName = flvMountName ? flvMountName : flvUrlMountName;
    downloadInnerHtml(
      "cuePointInfo-" + mountName + ".html",
      "cuePointInfo",
      "text/html"
    );
    downloadInnerHtml(
      "metadataInfo-" + mountName + ".html",
      "metadataInfo",
      "text/html"
    );
  });

  $("#downloadCuepointInfo").click(function () {
    let mountName = generateFlvMountName();
    downloadInnerHtml(
      "cuePointInfo-" + mountName + ".html",
      "cuePointInfo",
      "text/html"
    );
  });

  $("#downloadMetadataInfo").click(function () {
    let mountName = generateFlvMountName();
    downloadInnerHtml(
      "metadataInfo-" + mountName + ".html",
      "metadataInfo",
      "text/html"
    );
  });

  $("#downloadDebugInfo").click(function () {
    let mountName = generateFlvMountName();
    downloadInnerHtml(
      "debugInfo-" + mountName + ".html",
      "debugInformation",
      "text/html"
    );
  });

  $("#seekLiveButton").click(function () {
    seekLive();
  });

  $("#skipAdButton").click(function () {
    skipAd();
  });

  $("#destroyAdButton").click(function () {
    destroyAd();
  });

  $("#setVolume50Button").click(function () {
    setVolume50();
  });

  $("#playTapAdButton").click(function () {
    playTAPAd();
  });

  $("#playTapAdButtonWithTrackingParameters").click(function () {
    playTAPAdButtonWithTrackingParameters();
  });

  $("#playRunSpotAdButton").click(function () {
    playRunSpotAd();
  });

  $("#playRunSpotAdByIdButton").click(function () {
    playRunSpotAdById();
  });

  $("#playVastAdButton").click(function () {
    playVastAd();
  });

  $("#playBloomAdButton").click(function () {
    playBloomAd();
  });

  $("#getArtistButton").click(function () {
    getArtistData();
  });

  // $("#flowAds").click(function () {
  //   flowAds = true;
  //   attachAdListeners();
  //   player.playAd("vastAd", {
  //     url: "http://runspot4.tritondigital.com/RunSpotV4.svc/GetVASTAd?&StationID=undefined&MediaFormat=21&RecordImpressionOnCall=false&AdMinimumDuration=0&AdMaximumDuration=900&AdLevelPlacement=1&AdCategory=1",
  //   });
  // });

  // Init Volume Slider UI
  // this.flvVolumeSlider();

  //Buttons specific to User Registration / MediaPlayer / Selective Bitrate
  $("#loginButton").click(function () {
    player.UserRegistration.emit("user-logged-in");

    var data = {
      dob: "06/29/1980",
      gender: "male",
      zip: "00000",
    };
    data.vid = $("#userVid").val();
    data.tdas = {};
    data.tdas["user-tags"] = $("#userTags").val();
    data.tdas["user-tags-hash"] = $("#userTagsHash").val();

    player.UserRegistration.emit("user-details", data);
  });
  $("#logoutButton").click(function () {
    player.UserRegistration.emit("user-logged-out");
  });
  $("#activateLowButton").click(function () {
    player.MediaPlayer.activateLow();
  });
  $("#deactivateLowButton").click(function () {
    player.MediaPlayer.deactivateLow();
  });
}

function playTimeshiftStream(station, mount) {
  // As per documentation, station takes priority, but if it isn't specified, use the mount:
  if (!station && !mount) {
    alert("Please enter a Station");
    return;
  }

  debug("playTimeshiftStream - station=" + station);

  $("#stationUser").val("");

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  player.play({
    station: station,
    mount: mount,    
    forceTimeShift: forceTimeShift,
    timeShift: false,
    trackingParameters: {
      "dist": 'triton-dist-param',
      "dist-timeshift": 'timeshift-dist-param',
    }
    });

  $("#volumeSlider").val(0.5);
}

function playLiveAudioStream(station, mount) {
  // As per documentation, station takes priority, but if it isn't specified, use the mount:
  if (!station && !mount) {
    alert("Please enter a Station");
    return;
  }

  debug("playLiveAudioStream - station=" + station);

  $("#stationUser").val("");

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  player.play({
    station: station,
    mount: mount,    
    forceTimeShift: forceTimeShift,
    timeShift: false,
    trackingParameters: {
      "dist": 'triton-dist-param',
      "dist-timeshift": 'timeshift-dist-param',
    }
    });

  $("#volumeSlider").val(0.5);
}

function clearFlvValues() {
  this.totalTags = 0;
  this.clearCuepointInfo();
  this.clearDebugInfo();
  this.clearMetadataInfo();
  this.clearFlvVisualizer();
  this.scope.$apply(function () {
    this.scope.updateTagDuration("00:00:00");
    this.scope.updateTotalTags(this.totalTags);
  });
  this.scope.$apply(function () {
    this.scope.updateTagData({});
  });

  $(".flv-player-button")
    .removeClass("fa-play-circle")
    .addClass("spinner-border");

  $(".flv-player-button-parent").attr("disabled", true);
}

function playStreamFLVByUserMount() {
  this.clearFlvValues();

  if ($("#flvMount").val() == "") {
    alert("Please enter a mount");
    return;
  }

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  player.play({
    mount: $("#flvMount").val(),
  });
}

function playFLVStream() {
  this.clearFlvValues();

  if ($("#flvUrl").val() == "") {
    alert("Please enter a FLV url");
    return;
  }

  if (livePlaying) player.stop();

  player.play({
    file: $("#flvUrl").val(),
  });

  this.playerStarted = new Date().getTime();
}

function flvPlayerButton(e) {
  if (!this.scope) {
    this.element = angular.element($("#tagData"));
    this.scope = element.scope();
  }

  if ($("#flvUrl").val() == "") {
    alert("Please enter a URL");
    return;
  }

  if ($("#flvMount").val() == "") {
    alert("Please enter a Callsign");
    return;
  }

  if (flvPlayerStatus == "playing") {
    player.stop();

    while (streamDataTimeoutId--) {
      window.clearTimeout(streamDataTimeoutId); // will do nothing if no timeout with id is present
    }
  } else if (
    $("#flvUrl").val() &&
    $("#flvUrl").val() != "" &&
    flvPlayerStatus == "stopped"
  ) {
    this.playFLVStream();
  } else if (
    $("#flvMount").val() &&
    $("#flvMount").val() != "" &&
    flvPlayerStatus == "stopped"
  ) {
    this.playStreamFLVByUserMount();
  }
}

// Volume Slider
function flvVolumeSlider(value) {
  this.currentVolume = value;
  player.setVolume(value);
}

function playAudio(menuItem, streamingType) {
  if (program.isProgram){
    playProgram(program.programInfo)
  }else{
    if (menuItem == "hlsRewind" && streamingType === "station") {
      clearInterval(adjustTime);
      playTimeshiftStream($("#hlsRewindStation").val(), null);
      initTimeshiftSlider();    
      updateTimeshiftSlider({"value": new Date().getTime(),"text": "Live", "label":("-"), "max" : new Date().getTime(), "min" : new Date().getTime() - (maximumRewindTime * 1000)});          
      $("#hlsLiveButton").addClass("active");
    } else if (menuItem === "hlsRewind" && streamingType === "url") {
      getCloudStreamInfo()
      clearInterval(adjustTime);
      playUrl(); 
      initTimeshiftSlider();
      updateTimeshiftSlider({"value": new Date().getTime(),"text": "Live", "label":("-"), "max" : new Date().getTime(), "min" : new Date().getTime() - (maximumRewindTime * 1000)});
      $("#hlsLiveButton").addClass("active");
    } else if (menuItem === "liveStreaming" && streamingType === "url") {
      playUrl();
    } else if (menuItem === "liveStreaming" && streamingType === "station") {
      playStreamByUserStation();
    }
  }
  $("#volumeSlider").val(0.5);
}
function extractStationName(){
  const url = $("#streamUrlUser").val();
  const urlParts = url.split("/");
  const lastPart = urlParts[urlParts.length - 1];
  const stationName = lastPart.split("_")[0].slice(0, -3);
  return stationName;
}
function playUrl() {
  let url = $("#streamUrlUser").val();
  if (url == "") {
    alert("Please enter an url");
    return;
  }

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  player.MediaPlayer.tech.playStream({
    url: $("#streamUrlUser").val(),
    forceTimeShift: true,
    aSyncCuePoint: {
      active: false,
    },
    isHLS: url.indexOf("m3u8") > -1 ? true : false,
  });

  $("#volumeSlider").val(0.5);
}

function playStreamByUserStation() {
  if ($("#stationUser").val() == "") {
    alert("Please enter a Station");
    return;
  }

  if (adPlaying) player.skipAd();

  if (livePlaying) player.stop();

  var trackingParams = $("#stationUserTrackingParameters").val().split(",");
  var params = {};
  for (var i = 0; i < trackingParams.length; i++) {
    var tup = trackingParams[i].split(":");
    params[tup[0]] = tup[1];
  }

  player.play({
    station: $("#stationUser").val(),
    trackingParameters: params,
    timeShift: false,
  });

  if (currentStation != $("#stationUser").val()) {
    currentStation = $("#stationUser").val();
  }
}

function stopStream() {
  clearInterval(adjustTime);
  setTime = 0;
  player.stop();
  program.isProgramRunning = false;
}

function seekFromLive() {  
  let seconds = parseInt($("#seekFromLive").val());
  if(seconds < 0){
    seconds = seconds * -1;
  }
  
  updateTimeshiftSlider({"value" : -seconds, "text" : "-" + formatDate(Math.floor(seconds))});
  player.seekFromLive(seconds) 
}

function rewind(seconds) {
  $("#hlsLiveButton").removeClass("active");
  let val = $("#timeshiftSlider").slider("option", "value");
  this.timeshiftSliderStartValue = val;
  updateTimeshiftSlider({"value" : (val - 10000)});
  updateSliderLabel("rewind");
  player.seek(-10);
  clearInterval(adjustTime);
  if(setTime === 0){
    setTime = new Date().getTime() - 10000
  }else{
    setTime = setTime - 10000
  }
  if (setTime < (new Date().getTime() - maximumRewindTime * 1000)) {
    console.log("setTime: " + setTime)
    setTime = new Date().getTime() - maximumRewindTime * 1000
  }
  let label = toLocaleDate(setTime, true)
  updateTimeshiftSlider({"text": label });
  adjustTime = setInterval(updateTime, 1000);
}

function forward(seconds) {
  $("#hlsLiveButton").removeClass("active");
  let val = $("#timeshiftSlider").slider("option", "value");  
  this.timeshiftSliderStartValue = val;
  updateTimeshiftSlider({"value" : (val + 10000)});
  updateSliderLabel("forward");
  player.seek(10);  
  clearInterval(adjustTime);
  if(setTime === 0){
    setTime = new Date().getTime() + 10000
  }else{
    setTime = setTime + 10000
  }
  if(setTime > new Date().getTime()){
    setTime = new Date().getTime()
  }
  let label = toLocaleDate(setTime, true)

  updateTimeshiftSlider({"text": label });s
  adjustTime = setInterval(updateTime, 1000);
}

function live() {  
  setTime = 0
  program.isProgram = false
  clearInterval(adjustTime)
  updateTimeshiftSlider({"value": new Date().getTime(), "text": "Live", "label":("-")});
  player.seekLive();
  $("#hlsLiveButton").addClass("active");
}

function getCloudStreamInfo() {  
  const selectedValue = $("input[name='streamingType']:checked").val();
  if (selectedValue === "station") {
    player.getCloudStreamInfo($("#hlsRewindStation").val());
  } else if (selectedValue === "url") {
    player.getCloudStreamInfo(extractStationName());
  }
}

function pauseStream() {
  clearInterval(adjustTime);
  player.pause();
}

function resumeStream() {
  if (livePlaying) {
    player.resume();
    adjustTime = setInterval(updateTime, 1000);
  }else{ 
    player.play();
  }
}

function seekLive() {
  player.seekLive();
}

function loadNpApi() {
  if ($("#songHistoryCallsignUser").val() == "") {
    alert("Please enter a Callsign");
    return;
  }

  var isHd = $("#songHistoryConnectionTypeSelect").val() == "hdConnection";

  //Set the hd parameter to true if the station has AAC. Set it to false if the station has no AAC.
  player.NowPlayingApi.load({
    mount: $("#songHistoryCallsignUser").val(),
    hd: isHd,
    numberToFetch: 15,
  });
}

function skipAd() {
  player.skipAd();
}

function destroyAd() {  
  player.destroyAd();
}

function setVolume50() {
  player.setVolume(0.5);
}

function mute() {
  player.mute();
}

function unMute() {
  player.unMute();
}

function getArtistData() {
  if (song && song.artist() != null) song.artist().fetchData();
}

function updateTimeshiftSlider(sliderObj){
  if (sliderObj.min || sliderObj.min === 0){
    $("#timeshiftSlider").slider("option", "min", sliderObj.min);
  }
   
  if (sliderObj.max || sliderObj.max === 0){
    $("#timeshiftSlider").slider("option", "max", sliderObj.max);
  }

  if (sliderObj.value || sliderObj.value === 0 ){
    $("#timeshiftSlider").slider("option", "value", sliderObj.value);
  }
  
  if (sliderObj.text){
    $("#custom-handle").text(sliderObj.text);
  }

  if (sliderObj.label !== undefined){
    $("#sliderMinLabel").text(sliderObj.label);
  }
    
}
function onPlayerReady() {
  initControlsUi();

  player.addEventListener("track-cue-point", (e) => {
    onTrackCuePoint(e);
  });
  player.addEventListener("metadata-cue-point", (e) => {
    onMetadataCuePoint(e);
  });
  player.addEventListener("stream-data", (e) => {
    onStreamData(e);
  });
  player.addEventListener("stream-status", (e) => {
    onStatus(e);
  });

  player.addEventListener("ad-break-cue-point", onAdBreak);
  player.addEventListener("ad-break-cue-point-complete", onAdEndBreak);
  player.addEventListener("stream-track-change", onTrackChange);
  player.addEventListener("hls-cue-point", onHlsCuePoint);
  player.addEventListener("speech-cue-point", onSpeechCuePoint);
  player.addEventListener("custom-cue-point", onCustomCuePoint);

  player.addEventListener("stream-geo-blocked", onGeoBlocked);
  player.addEventListener("timeout-alert", onTimeOutAlert);
  player.addEventListener("timeout-reach", onTimeOutReach);
  player.addEventListener("npe-song", onNPESong);

  player.addEventListener("stream-select", onStreamSelect);

  player.addEventListener("stream-start", onStreamStarted);
  player.addEventListener("stream-stop", onStreamStopped);
  player.addEventListener("timeshift-info", onTimeshiftInfo);

  player.addEventListener("media-playback-status", onMediaPlaybackStatus);
  player.addEventListener("media-error", onMediaError);
  player.addEventListener(
    "media-playback-timeupdate",
    onMediaPlaybackTimeUpdate
  );

  player.addEventListener("flv-player-status", onFlvPlayerStatus);
  player.setVolume(1); //Set volume to 100%
  player.addEventListener("timeshift-program-load-error", onTimeshiftProgramLoadError);

  setStatus("Api Ready");
  setTech(player.MediaPlayer.tech.type);

  player.addEventListener("list-loaded", onListLoaded);
  player.addEventListener("list-empty", onListEmpty);
  player.addEventListener("nowplaying-api-error", onNowPlayingApiError);

  player.addEventListener("pwa-data-loaded", onPwaDataLoaded);

  if (tech == "flash") {
    svg = document.querySelector("svg");
    svgns = "http://www.w3.org/2000/svg";
    runnerRect = document.createElementNS(this.svgns, "rect");

    document
      .getElementById("flv-debugger-container")
      .addEventListener("hide.bs.collapse", function () {
        $("#flvHeaderPlayerButton").removeClass("d-none");
      });

    document
      .getElementById("flv-debugger-container")
      .addEventListener("shown.bs.collapse", function (e) {
        $("#flvHeaderPlayerButton").addClass("d-none");
      });
  }
}

/**
 * Event fired in case the loading of the companion ad returned an error.
 * @param e
 */
function onCompanionLoadError(e) {
  debug(
    "tdplayer::onCompanionLoadError - containerId=" +
      e.containerId +
      ", adSpotUrl=" +
      e.adSpotUrl,
    true
  );
}

function onAdPlaybackStart(e) {
  adPlaying = true;

  setStatus("Advertising... Type=" + e.data.type);
}

function onAdPlaybackComplete(e) {
  adPlaying = false;

  console.log(e);
  $("#td_synced_bigbox").empty();
  $("#td_synced_leaderboard").empty();

  if (streamAutoStart) {
    player.play({
      station: station,
    });
  }

  setStatus("Ad Playback Complete");
}

function onAdPlaybackError(e) {
  if (flowAds) {
    player.playAd("vastAd", {
      url: "http://proserv.tritondigital.com/vast/vast2_linear_webteam.xml",
    });
    flowAds = false;
  } else {
    setStatus("Ad Playback Error");
  }
}

function onAdPlaybackDestroy(e) {
  adPlaying = false;

  console.log(e);
  $("#td_synced_bigbox").empty();
  $("#td_synced_leaderboard").empty();

  setStatus("Ad Playback Destroy");
}

function onAdCountdown(e) {
  debug("Ad countdown : " + e.data.countDown + " second(s)");
}

function onVpaidAdCompanions(e) {
  debug("Vpaid Ad Companions");

  //Load Vast Ad companion (bigbox & leaderbaord ads)
  //displayVastCompanionAds( e.companions );
}

function onTimeshiftProgramLoadError(e){
  setStatus("Can't load timeshift program");
}

function onStreamStarted() {
  livePlaying = true;
}

function onStreamSelect() {
  $("#hasHQ").html(player.MediaPlayer.hasHQ().toString());
  $("#isHQ").html(player.MediaPlayer.isHQ().toString());

  $("#hasLow").html(player.MediaPlayer.hasLow().toString());
  $("#isLow").html(player.MediaPlayer.isLow().toString());
}

function onStreamStopped() {
  livePlaying = false;

  clearNpe();
  $("#trackInfo").html("");
  $("#asyncData").html("");

  $("#hasHQ").html("N/A");
  $("#isHQ").html("N/A");

  $("#hasLow").html("N/A");
  $("#isLow").html("N/A");
}

function onMetadataCuePoint(metadata) {
  $("#metadataInfo").append(
    syntaxHighlight(JSON.stringify(metadata.data, null, 2))
  );
  $("#cuePointInfo").append("<br/>");
}

function onStreamData(event) {
  if (this.totalTags == 0) {
    $(".flv-player-button")
      .removeClass("spinner-border")
      .addClass("fa-stop-circle");

    $(".flv-player-button-parent").removeAttr("disabled");
  }

  streamDataTimeoutId = window.setTimeout(() => {
    this.totalTags++;
    // this.drawSquare(event.data.tagType);
    this.drawSVGSquare(event.data);
    if (this.totalTags % 10 == 0) {
      this.scope.$apply(function () {
        this.scope.updateTagDuration(
          (event.data.timestamp / 1000).toString().toHHMMSS()
        );
        this.scope.updateTotalTags(this.totalTags);
      });
    }
  }, event.delay);
}

function drawSVGSquare(data) {
  let point = this.nextPoint();
  let rect = document.createElementNS(this.svgns, "rect");
  let tagColor = "#fff";

  let event = new Event("showInspector_" + this.totalTags, { bubbles: true });
  rect.addEventListener(
    "showInspector_" + this.totalTags,
    this.showFLVData.bind(null, data, rect)
  );
  rect.setAttributeNS(null, "x", point.x);
  rect.setAttributeNS(null, "y", point.y);
  rect.setAttributeNS(null, "width", 15);
  rect.setAttributeNS(null, "height", 15);
  rect.setAttributeNS(null, "stroke-width", 0.5);

  if (data.tagType == 8) {
    rect.setAttributeNS(null, "fill", "#3992de");
    rect.setAttributeNS(null, "stroke", "#000000");
  } else {
    if (data.meta.onListenerInfo) {
      tagColor = "#db5858";
    } else if (data.meta.onMetaData) {
      tagColor = "#73b160";
    } else if (data.meta.onCuePoint) {
      tagColor = "#e9bd5e";
      if (data.meta.onCuePoint.name == "ad") {
        logFLVCuePointInfo(data.meta.onCuePoint, true, event, rect);
      } else {
        logFLVCuePointInfo(data.meta.onCuePoint, false, event, rect);
      }
    }

    rect.setAttributeNS(null, "fill", tagColor);
    rect.setAttributeNS(null, "stroke", "#000000");
  }

  rect.addEventListener("click", function () {
    clearCuepointInfoSelected();
    this.dispatchEvent(event);
  });

  this.svg.appendChild(rect);
  this.flvPacketCount++;
}

function showFLVData(data, rect) {
  this.scope.$apply(function () {
    this.scope.updateTagData(data);
  });

  if (this.selectedRect) {
    this.selectedRect.setAttributeNS(null, "stroke", "#000000");
    this.selectedRect.setAttributeNS(null, "stroke-width", "0.5");
  }

  rect.setAttributeNS(null, "stroke", "#ffffff");
  rect.setAttributeNS(null, "stroke-width", "2");

  this.selectedRect = rect;
}

function buildInspectorTagTypeHtml(tagType) {
  let html = "";
  if (tagType == 8) {
  } else {
  }
}


function nextPoint() {
  let totalSquaresX = Math.floor(this.canvasWidth / this.blockWidth);
  let totalSquaresY = Math.floor(this.canvasHeight / this.blockHeight);
  let x = (flvPacketCount * this.blockWidth) % this.canvasWidth;
  let y = Math.floor(flvPacketCount / totalSquaresX) * this.blockHeight;

  if (y >= totalSquaresY * this.blockHeight) {
    var bbox = svg.getBBox();
    bbox.height = bbox.height + 200;
    svg.setAttribute("viewBox", [bbox.x, bbox.y, bbox.width, bbox.height]);
    svg.height.baseVal.valueAsString = bbox.height;
    this.canvasHeight = bbox.height;
    this.scrollToBottom();
  }
  return { x: x, y: y };
}

function scrollToBottom() {
  $("#flvSVGCanvas").animate(
    { scrollTop: $("#flvSVGCanvas > *").height() },
    "fast"
  );
}

function onTrackCuePoint(e) {  
  if (tech == "flash") {
    debug("<b>New cuepoint received of type:<span class='badge bg-success'>" + e.data.cuePoint.type + "</span></b>");
    debug(
      syntaxHighlight(JSON.stringify(e.data.cuePoint.parameters, undefined, 2))
    );
  } else {
    debug("<b>New cuepoint received</b>");
    debug(
      "Title:" +
        e.data.cuePoint.cueTitle +
        " - Artist:" +
        e.data.cuePoint.artistName
    );
  }

  console.log(e);

  if (currentTrackCuePoint && currentTrackCuePoint != e.data.cuePoint)
    clearNpe();

  if (e.data.cuePoint.nowplayingURL && sbm && player.Npe !== undefined)
    player.Npe.loadNpeMetadata(
      e.data.cuePoint.nowplayingURL,
      e.data.cuePoint.artistName,
      e.data.cuePoint.cueTitle
    );

  currentTrackCuePoint = e.data.cuePoint;
  this.trackInfo = $("#trackInfo").html(
    "<b>Title: </b>" +
      currentTrackCuePoint.cueTitle +
      "<br><b>Artist: </b> " +
      currentTrackCuePoint.artistName
  );
}

function onTrackChange(e) {
  debug("Stream Track has changed");
}

function onHlsCuePoint(e) {
  debug("New HLS cuepoint received");
  console.log(e);
}

function onSpeechCuePoint(e) {
  debug("New Speech cuepoint received");
  console.log(e);
}

function onCustomCuePoint(e) {
  debug("New Custom cuepoint received");
  console.log(e);
}

function onAdBreak(e) {
  setStatus("Commercial break...");
  if (tech == "flash") {
    debug(syntaxHighlight(JSON.stringify(e.data.adBreakData, null, 2)));
    // logCuePointInfo(e.data.adBreakData, true, null, null);
  }
  console.log(e);
}

function onAdEndBreak(e) {
  debug("Ad Break End");
  setStatus(this.streamStatus);
  console.log(e);
}

function clearNpe() {
  $("#npeInfo").html("");
  $("#asyncData").html("");
}

//Song History
function onListLoaded(e) {
  debug("Song History loaded");
  console.log(e.data);

  $("#asyncData").html(
    '<br><p><span class="label label-warning">Song History:</span>'
  );

  var tableContent =
    '<table class="table table-striped"><thead><tr><th>Song title</th><th>Artist name</th><th>Time</th></tr></thead>';

  var time;
  $.each(e.data.list, function (index, item) {
    time = new Date(Number(item.cueTimeStart));
    tableContent +=
      "<tr><td>" +
      item.cueTitle +
      "</td><td>" +
      item.artistName +
      "</td><td>" +
      time.toLocaleTimeString() +
      "</td></tr>";
  });

  tableContent += "</table></p>";

  $("#asyncData").html("<div>" + tableContent + "</div>");
}

//Song History empty
function onListEmpty(e) {
  $("#asyncData").html(
    '<br><p><span class="label label-important">Song History is empty</span>'
  );
}

function onNowPlayingApiError(e) {
  debug("Song History loading error", true);
  console.error(e);

  $("#asyncData").html(
    '<br><p><span class="label label-important">Song History error</span>'
  );
}

function onTimeOutAlert(e) {
  debug("Time Out Alert");
}

function onTimeOutReach(e) {
  debug("Time Out Reached");
}

function onConfigurationError(e) {
  debug("Configuration error", true);
  console.log(e);
}

function onModuleError(object) {
  var message = "";

  $.each(object.data.errors, function (i, val) {
    message += "ERROR : " + val.data.error.message + "<br/>";
  });

  $("#status").html(
    '<p><span class="label label-important">' + message + "</span><p></p>"
  );
}

function onStatus(e) {
  console.log("tdplayer::onStatus");

  if (!this.scope) {
    let angularElement = angular.element($("#mediaControls"));
    this.scope = angularElement.scope();
  }

  this.streamStatus = e.data.status;

  if (e.data.code == "STATION_NOT_FOUND" && tech == "flash") {
    $(".flv-player-button")
      .addClass("fa-play-circle")
      .removeClass("fa-stop-circle")
      .removeClass("spinner-border");

    $(".flv-player-button-parent").removeAttr("disabled");
  }

  setStatus(e.data.status);  
  this.scope.updatePlayerStatus(e.data.code);
}

function onFlvPlayerStatus(e) {
  flvPlayerStatus = e.data.status;

  if (e.data.status != "playing") {
    $(".flv-player-button")
      .removeClass("fa-stop-circle")
      .addClass("fa-play-circle");
  }
}

function onMediaPlaybackStatus(e) {
  console.log("tdplayer::onMediaPlaybackStatus");
  setStatus(e.data.status);

  if (e.data.status == "Stopped") {
    var time = "00:00/00:00";

    $("#filetime").html(time);
  }
}

function onMediaError(e) {
  console.log("tdplayer::onMediaError");
  setStatus(e.data.error);
}

var currentTime = 0;

function onMediaPlaybackTimeUpdate(e) {
  console.log("tdplayer::onMediaPlaybackTimeUpdate");

  currentTime = e.data.playedTime;

  var toto =
    SecondsToHMS(e.data.playedTime) + "/" + SecondsToHMS(e.data.duration);

  $("#filetime").html(toto);
}

function onAdBlock(e) {
  console.log("tdplayer::onAdBlock");

  debug(e.data.message);
}

function SecondsToHMS(d) {
  d = Number(d);
  var m = Math.floor((d % 3600) / 60);
  var s = Math.floor((d % 3600) % 60);
  return (
    (m > 0 ? (m >= 10 ? m : "0" + m) : "00") +
    ":" +
    (s > 0 ? (s >= 10 ? s : "0" + s) : "00")
  );
}

function onGeoBlocked(e) {
  console.log("tdplayer::onGeoBlocked");

  setStatus(e.data.text);
}

function setStatus(status) {
  debug("<b>" + status + "</b>");
  $("#status").html(status);
}

function setTech(techType) {
  var apiVersion = player.version.value + "-" + player.version.build;

  var techInfo = apiVersion + " - Technology: " + techType;

  if (player.flash.available)
    techInfo +=
      " - Your current version of flash plugin is: " +
      player.flash.version.major +
      "." +
      player.flash.version.minor +
      "." +
      player.flash.version.release;

  techInfo += "</span>";

  $("#techInfo").html(techInfo);
}

function loadPwaData() {
  if ($("#pwaCallsign").val() == "" || $("#pwaStreamId").val() == "") {
    alert("Please enter a Callsign and a streamid");
    return;
  }

  player.PlayerWebAdmin.load($("#pwaCallsign").val(), $("#pwaStreamId").val());
}

function onPwaDataLoaded(e) {
  debug("PlayerWebAdmin data loaded successfully");
  console.log(e);

  $("#asyncData").html(
    '<br><p><span class="label label-warning">PlayerWebAdmin:</span>'
  );

  var tableContent =
    '<table class="table table-striped"><thead><tr><th>Key</th><th>Value</th></tr></thead>';

  for (var item in e.data.config) {
    console.log(item);
    tableContent +=
      "<tr><td>" + item + "</td><td>" + e.data.config[item] + "</td></tr>";
  }

  tableContent += "</table></p>";

  $("#asyncData").html("<div>" + tableContent + "</div>");
}

function onTimeshiftInfo(e) {  
  let abc = angular.element($("#hls-rewind-containter"));  
  let abcScope = abc.scope(); 

  if(e.data.maximum_rewind_time_sec){
    maximumRewindTime = e.data.maximum_rewind_time_sec;     
    abcScope.$apply(function () {
      abcScope.updateMaximumRewindTime(maximumRewindTime);
    });
  }

  if(e.data.programs){   
    let timeshiftPrograms = e.data.programs.map((item)=>{
      let programId = item.program_episode_id || item.properties.program_id;
      program.startTime = new Date(parseInt(item.properties.program_time_start.trim())).getTime();
      let label = toLocaleDate(program.startTime, false)

      return {"name": item.name, 
        "title": item.properties.program_title, 
        "startTime": label,
        "programId": (programId) ? programId.trim() : "0"
        }
    });
    
    abcScope.$apply(function () {
      abcScope.updateTimeshiftPrograms(timeshiftPrograms);
    });    
  }
  
  if(e.data.programDuration){
    totalTimeshiftDuration = e.data.totalduration - 10;
    let label = toLocaleDate(e.data.programStartTime, true)
    updateTimeshiftSlider({"value": e.data.programStartTime, "text": label });     
  }

  if(e.data.totalduration){
    maximumRewindTime = Math.round((e.data.totalduration/100))*100 ;
    updateTimeshiftSlider({"min": (new Date().getTime() - (maximumRewindTime * 1000)) ,"max": new Date().getTime()}); 
  }

  if(e.data.currentTime){
    let label = toLocaleDate(e.data.currentTime, true)
    updateTimeshiftSlider({"max": new Date().getTime(), "text": label, "value": e.data.currentTime});     
  }  
  
}

function playProgram(timeshiftProgram){
  program.programInfo = timeshiftProgram;
  clearInterval(adjustTime);
  initTimeshiftSlider();    
  updateTimeshiftSlider({"value": 0,"text": " ", "label": "-", "max" : new Date().getTime(), "min" : program.startTime});
  program.isProgram = true;
  const selectedValue = $("input[name='streamingType']:checked").val();
  if (selectedValue === "station") {
    player.playProgram(timeshiftProgram.programId, 0, $("#hlsRewindStation").val());
  } else if (selectedValue === "url") {
    player.playProgram(timeshiftProgram.programId, 0, extractStationName());
  }
}

function formatDate(seconds) {
  var date = new Date(null);
  date.setSeconds(seconds);
  var hhmmssFormat = date.toISOString().substr(11, 8);
  return hhmmssFormat;  
}
function playTAPAd() {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  //player.skipAd();
  player.playAd("tap", {
    host: "cmod601.live.streamtheworld.com",
    type: "preroll",
    format: "vast",
    stationId: 125003,
  });
}

function playTAPAdButtonWithTrackingParameters() {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("tap", {
    host: "cmod.live.streamtheworld.com",
    type: "preroll",
    format: "vast",
    stationId: 77583,
    trackingParameters: {
      ttag: "demo",
    },
  });
}

function playRunSpotAd() {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  //player.skipAd();
  player.playAd("vastAd", {
    sid: 352783,
  });
}

function playRunSpotAdById() {
  if ($("#runSpotId").val() == "") return;

  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("vastAd", {
    sid: $("#runSpotId").val(),
  });
}

function playVastAd(url) {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  if (url) {
    player.playAd("vastAd", {
      url: url,
    });
  } else {
    player.playAd("vastAd", {
      url: "http://proserv.tritondigital.com/vast/vast2_linear_webteam.xml",
    });
  }
}

function playVastAdByUrl() {
  if ($("#vastAdUrl").val() == "") {
    alert("Please enter an URL");
    return;
  }

  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("vastAd", {
    url: $("#vastAdUrl").val(),
  });
}

function playVastAdByRawXML() {
  if ($("#vastAdRawXML").val() == "") return;

  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("vastAd", {
    rawXML: $("#vastAdRawXML").val(),
    adBreak: true,
  });
}

function playBloomAd() {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("bloom", {
    id: 4974,
  });
}

function playFlowAds() {
  flowAds = true;
  attachAdListeners();
  player.playAd("vastAd", {
    url: "http://runspot4.tritondigital.com/RunSpotV4.svc/GetVASTAd?&StationID=undefined&MediaFormat=21&RecordImpressionOnCall=false&AdMinimumDuration=0&AdMaximumDuration=900&AdLevelPlacement=1&AdCategory=1",
  });
}

function playMediaAd() {
  detachAdListeners();
  attachAdListeners();

  player.stop();
  player.playAd("mediaAd", {
    mediaUrl:
      "http://proserv.tritondigital.com/vast/mediafiles/GEICOPushItfeaturingSaltNPepa.mp4",
    linkUrl: "http://www.geico.com/",
  });
}

function attachAdListeners() {
  player.addEventListener("ad-playback-start", onAdPlaybackStart);
  player.addEventListener("ad-playback-error", onAdPlaybackError);
  player.addEventListener("ad-playback-complete", onAdPlaybackComplete);
  player.addEventListener("ad-playback-destroy", onAdPlaybackDestroy);
  player.addEventListener("ad-countdown", onAdCountdown);
  player.addEventListener("vpaid-ad-companions", onVpaidAdCompanions);  
}

function detachAdListeners() {
  player.removeEventListener("ad-playback-start", onAdPlaybackStart);
  player.removeEventListener("ad-playback-error", onAdPlaybackError);
  player.removeEventListener("ad-playback-complete", onAdPlaybackComplete);
  player.removeEventListener("ad-playback-destroy", onAdPlaybackDestroy);
  player.removeEventListener("ad-countdown", onAdCountdown);
  player.removeEventListener("vpaid-ad-companions", onVpaidAdCompanions);
}

var artist;

function onNPESong(e) {
  console.log("tdplayer::onNPESong");
  console.log(e);

  song = e.data.song;

  artist = song.artist();
  artist.addEventListener("artist-complete", onArtistComplete);

  var songData = getNPEData();

  displayNpeInfo(songData, false);
}

function displayNpeInfo(songData, asyncData) {
  $("#asyncData").empty();

  var id = asyncData ? "asyncData" : "npeInfo";
  var list = $("#" + id);

  if (asyncData == false)
    list.html('<span class="label label-inverse">Npe Info:</span>');

  list.append(songData);
}

function onArtistComplete(e) {
  artist.addEventListener("picture-complete", onArtistPictureComplete);

  var pictures = artist.getPictures();
  var picturesIds = [];
  for (var i = 0; i < pictures.length; i++) {
    picturesIds.push(pictures[i].id);
  }
  if (picturesIds.length > 0) artist.fetchPictureByIds(picturesIds);

  var songData = getArtist();

  displayNpeInfo(songData, true);
}

function onArtistPictureComplete(pictures) {
  console.log("tdplayer::onArtistPictureComplete");
  console.log(pictures);

  var songData = '<span class="label label-inverse">Photos:</span><br>';

  for (var i = 0; i < pictures.length; i++) {
    if (pictures[i].getFiles())
      songData +=
        '<a href="' +
        pictures[i].getFiles()[0].url +
        '" rel="lightbox[npe]" title="Click on the right side of the image to move forward."><img src="' +
        pictures[i].getFiles()[0].url +
        '" width="125" /></a>&nbsp;';
  }

  $("#asyncData").append(songData);
}

function getArtist() {
  if (song != undefined) {
    var songData = '<span class="label label-inverse">Artist:</span>';

    songData += "<ul><li>Artist id: " + song.artist().id + "</li>";
    songData +=
      "<li>Artist birth date: " + song.artist().getBirthDate() + "</li>";
    songData += "<li>Artist end date: " + song.artist().getEndDate() + "</li>";
    songData +=
      "<li>Artist begin place: " + song.artist().getBeginPlace() + "</li>";
    songData +=
      "<li>Artist end place: " + song.artist().getEndPlace() + "</li>";
    songData +=
      "<li>Artist is group ?: " + song.artist().getIsGroup() + "</li>";
    songData += "<li>Artist country: " + song.artist().getCountry() + "</li>";

    var albums = song.artist().getAlbums();
    for (var i = 0; i < albums.length; i++) {
      songData +=
        "<li>Album " + (i + 1) + ": " + albums[i].getTitle() + "</li>";
    }
    var similars = song.artist().getSimilar();
    for (var i = 0; i < similars.length; i++) {
      songData +=
        "<li>Similar artist " + (i + 1) + ": " + similars[i].name + "</li>";
    }
    var members = song.artist().getMembers();
    for (var i = 0; i < members.length; i++) {
      songData += "<li>Member " + (i + 1) + ": " + members[i].name + "</li>";
    }

    songData += "<li>Artist website: " + song.artist().getWebsite() + "</li>";
    songData +=
      "<li>Artist twitter: " + song.artist().getTwitterUsername() + "</li>";
    songData +=
      "<li>Artist facebook: " + song.artist().getFacebookUrl() + "</li>";
    songData +=
      "<li>Artist biography: " +
      song.artist().getBiography().substring(0, 2000) +
      "...</small>";

    var genres = song.artist().getGenres();
    for (var i = 0; i < genres.length; i++) {
      songData += "<li>Genre " + (i + 1) + ": " + genres[i] + "</li>";
    }
    songData += "</ul>";

    return songData;
  } else {
    return '<span class="label label-important">The artist information is undefined</span>';
  }
}

function getNPEData() {
  var innerContent = "NPE Data undefined";

  if (song != undefined && song.album()) {
    var _iTunesLink = "";
    if (song.album().getBuyUrl() != null)
      _iTunesLink =
        '<a target="_blank" title="' +
        song.album().getBuyUrl() +
        '" href="' +
        song.album().getBuyUrl() +
        '">Buy on iTunes</a><br/>';

    innerContent =
      "<p><b>Album:</b> " + song.album().getTitle() + "<br/>" + _iTunesLink;

    if (
      song.album().getCoverArtOriginal() != undefined &&
      song.album().getCoverArtOriginal().url != null
    ) {
      innerContent +=
        '<img src="' +
        song.album().getCoverArtOriginal().url +
        '" style="height:100px" /></p>';
    }
  }

  return innerContent;
}

function getUrlVars() {
  var vars = [],
    hash;
  var hashes = window.location.href
    .slice(window.location.href.indexOf("?") + 1)
    .split("&");
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split("=");
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
}

function debug(info, error) {
  if (error) console.error(info);
  else console.log("%cDEBUG : " + info, "background:#ccc");

  $("#debugInformation").append(info);
  $("#debugInformation").append("<br/>");
}

function clearDebugInfo() {
  $("#debugInformation").html("");
}

function clearMetadataInfo() {
  $("#metadataInfo").html("");
}

function clearCuepointInfo() {
  $("#cuePointInfo").html("");
}

function clearFlvVisualizer() {
  $("#flvSVG").empty();
  this.flvPacketCount = 0;
  svg.setAttribute("viewBox", [0, 0, 975, 400]);
  this.canvasHeight = 400;
  this.canvasWidth = 975;
  svg.height.baseVal.valueAsString = this.canvasHeight;
}

function clearCuepointInfoSelected(id) {
  $(".cuepoint-info").removeClass("cuepoint-info-active");
}

function cuepointInfoSelected(id, rect) {
  $(".cuepoint-info").removeClass("cuepoint-info-active");
  $("#" + id).addClass("cuepoint-info-active");
  document
    .getElementById("flvSVGCanvas")
    .scrollTo(rect.getAttribute("x"), rect.getAttribute("y"));
}

function logFLVCuePointInfo(cuePoint, isAd, event, rect) {
  duration = isAd
    ? cuePoint.parameters.cue_time_duration
    : cuePoint.cueTimeDuration;
  timePlayed = isAd
    ? cuePoint.parameters.time_played
    : cuePoint.parameters.time_played;

  jQuery(document.body).on(event.type, function () {
    cuepointInfoSelected(event.type, rect);
  });

  var item = $(
    '<div id="' +
      event.type +
      '" style="cursor: pointer" class="cuepoint-info")"></div>'
  );

  formattedCueType =
    '<span style="margin-left: 5px" class="badge ' +
    (isAd ? "bg-danger" : "bg-success") +
    '">' +
    cuePoint.name +
    "</span>";
  item.append(
    "<b>[" +
      timePlayed +
      "] [" +
      (cuePoint.parameters.tag_timestamp / 1000).toString().toHHMMSS() +
      "]</b>" +
      formattedCueType
  );
  item.append("<br/>");
  item.append(
    (duration ? (duration / 1000).toString().toHHMMSS() + " - " : "") +
      (isAd ? cuePoint.parameters.ad_type + " - " : "") +
      (cuePoint.parameters.artist_name
        ? cuePoint.parameters.artist_name + " - "
        : "") +
      (cuePoint.parameters.cue_title ? cuePoint.parameters.cue_title : "")
  );
  item.append("<br/>");
  item.click(function () {
    rect.dispatchEvent(event);
  });
  $("#cuePointInfo").append(item);
}

function logCuePointInfo(cuePoint, isAd) {
  duration = isAd ? cuePoint.duration : cuePoint.cueTimeDuration;
  timePlayed = isAd ? cuePoint.timePlayed : cuePoint.parameters.time_played;
  formattedCueType =
    '<span style="margin-left: 5px" class="badge ' +
    (isAd ? "bg-danger" : "bg-success") +
    '">' +
    cuePoint.type +
    "</span>";
  $("#cuePointInfo").append(
    "<b>[" +
      timePlayed +
      "] [" +
      (cuePoint.tagTimestamp / 1000).toString().toHHMMSS() +
      "]</b>" +
      formattedCueType
  );
  $("#cuePointInfo").append("<br/>");
  $("#cuePointInfo").append(
    (duration ? (duration / 1000).toString().toHHMMSS() + " - " : "") +
      (isAd ? cuePoint.adType + " - " : "") +
      (cuePoint.artistName ? cuePoint.artistName + " - " : "") +
      (cuePoint.cueTitle ? cuePoint.cueTitle : "")
  );
  $("#cuePointInfo").append("<br/>");
}

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

function downloadInnerHtml(filename, elId, mimeType) {
  var elHtml = document.getElementById(elId).innerHTML;
  var link = document.createElement("a");
  mimeType = mimeType || "text/plain";

  link.setAttribute("download", filename);
  link.setAttribute(
    "href",
    "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(elHtml)
  );
  link.click();
}

function generateFlvMountName() {
  let flvMountName = $("#flvMount").val();
  let flvUrlMountName = $("#flvUrl").val();
  flvUrlMountName = flvUrlMountName
    ? flvUrlMountName.substring(
        flvUrlMountName.lastIndexOf("/") + 1,
        flvUrlMountName.lastIndexOf(".")
      )
    : "";

  return flvMountName ? flvMountName : flvUrlMountName;
}

function getWindowLocation() {
  return (
    "index.html?platformid=" +
    platformid +
    "&tech=" +
    tech +
    "&sbm=" +
    sbm +
    "&aSyncCuePointFallback=" +
    aSyncCuePointFallback +
    "&hls=" +
    hls +
    "&audioAdaptive=" +
    audioAdaptive +
    "&allowPersonalisedAds=" +
    allowPersonalisedAds +
    "&gaactive=" +
    GAActive +
    "&tcfFramework=" +
    tcfFramework +
    "&playerServicesRegion=" +
    playerServicesRegion+
    "&streamWhileMuted=" +
    streamWhileMuted +
    "&forceTimeShift=" +
    forceTimeShift
  );
}

String.prototype.toHHMMSS = function () {
  var sec_num = parseInt(this, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes + ":" + seconds;
};
