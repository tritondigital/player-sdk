/**
 * Ad Module Events
 */
define(["dojo/_base/declare", "dojo/on"], function (declare, on) {
  var AdModuleEvents = declare([], {
    AD_MODULE_PLAYBACK_START: "ad-module-playback-start",
    AD_MODULE_PLAYBACK_COMPLETE: "ad-module-playback-complete",
    AD_MODULE_PLAYBACK_DESTROY: "ad-module-playback-destroy",
    AD_MODULE_PLAYBACK_ERROR: "ad-module-playback-error",
    AD_MODULE_COUNTDOWN: "ad-module-countdown",
    AD_MODULE_MEDIA_READY: "ad-module-media-ready",
    AD_MODULE_MEDIA_EMPTY: "ad-module-media-empty",
    AD_MODULE_QUARTILE: "ad-module-quartile",
    AD_MODULE_COMPANIONS: "ad-module-companions",
    AD_MODULE_CLICK_TRACKING: "ad-module-click-tracking",
    AD_MODULE_VAST_ERROR: "ad-module-vast-error",
    AD_MODULE_VAST_EMPTY: "ad-module-vast-empty",
    AD_MODULE_VAST_PROCESS_COMPLETE: "ad-module-vast-process-complete",

    /**
     * Emit an event on the player targetNode (internal use only)
     * @param {string} eventName
     * @param {object} data
     * @param {dom element} targetNode optional, is defined in case of multi instances of a player in the page
     *
     * @ignore
     */
    emit: function (eventName, data, targetNode) {
      if (targetNode && this.config.playerId != targetNode.id) return;

      console.log("AdModuleEvents::emit -->->-> eventName=" + eventName);

      on.emit(this.target, eventName, {
        data: data,
        bubbles: true,
        cancelable: true,
      });
    },
  });

  return AdModuleEvents;
});
