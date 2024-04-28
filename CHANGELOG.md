# Release notes:
#2.9.67 (Apr 15 2024)
- Use URL to play timeshift.
- Fix Timeshift display values in playground.
- Support podcast playback speed change.

#2.9.66 (Oct 27 2023)
- Add cuepoint type to debug info

#2.9.65 (Jul 13 2023)
- Audio stops when a call is received.

#2.9.64 (June 8 2023)
- Migrate Google UA to GA4 on Web-SDK.

#2.9.63 (Apr 28 2023)
- Change getPrograms to getCloudStreamInfo
- Timeshift - iOS not working with HLS.js issues.

#2.9.62 (Feb 28 2023)
- Possibility to add custom values for "dist" parameter when using the new time-shifting functions.

#2.9.61 (Feb 28 2023)
- Program Anchoring.
- Various bug reported.

#2.9.60 (Feb 09 2023)
- Add seek from livefunctionality.

#2.9.59 (Nov 16 2022)
- Timeshift Phase 1.5.

#2.9.58 (Sept 30 2022)
- Fix empty source error and add an isReconnect property to the error to determine if the error happened on a reconnect.
#2.9.57 (Jul 13 2022)
- Impressions not fired.

#2.9.56 (Apr 10 2022)
- SWM parameter.

#2.9.55 (Apr 6 2022)
-  Timeshift must use the same scheme as the host URL.

#2.9.54 (Mar 28 2022)
- Widget controls out of sync when using an HLS stream.

#2.9.53 (Feb 18 2022)
- Fix adblock looping through all the object properties.
#2.9.52 (Jan 21 2022)
- Remove Audio Node Src on Error

#2.9.51 (Jan 21 2022)
- Web-SDK sort Now Playing Data
- Web-SDK Use hls.js Library for HLSTS streams

#2.9.50 (Jan 11 2022)
- Web-SDK - Add error message reported by the HTML Player

#2.9.49 (Nov 10 2021)
- Fire the missed opportunity URL
- Add "other" Gender Support to Web-SDK
- Select correct stream for adaptive audio mounts

#2.9.48 (Sept 29 2021)
- Raise STREAM_GEO_BLOCKED_ALTERNATE event

#2.9.47 (Sept 2 2021)
- Timeshift implementation

#2.9.46 (July 20 2021)
- FLV Visualizer and Bootstrap Implementation

#2.9.45 (July 8 2021)
- Google Analytics Category Override

#2.9.44 (April 29 2021)
- Remove White Ops.

#2.9.43 (April 20 2021)
### Features
- Customer Google Analytics.
- Fix for Stencil SAM Cloud widgets.
- FLV Debug tool.
- Changed minification to use babel minify preset.
- Implement TCFv2
- Basic implementation of Omny analytics sdk.
- Timeshift alpha.

#2.9.42 (March 30 2021)
### Features
- Changed minification to use babel minify preset.

#2.9.41 (September 9 2020)
### Features
- Add SyncBanner Refresh function
- Fix ad blocker detection
- Pass GDPR parameters to stream connection

#2.9.40 (July 30 2020)
### Bug Fixes ###
- Add autoplay config option

#2.9.39 (July 29 2020)
### Bug Fixes ###
- Fix lodash and underscore.js conflict issue

#2.9.38 (June 30 2020)
### Bug Fixes ####
- Fix issue between ondemand player and live player
- Handle mute/unmute/pause/resume as normal for the ondemand player
- Implement VAST Wrappers

#2.9.37 (April 9 2020)
### Bug Fixes
- HTML5 Media Player plays two streams when unmuting

#2.9.36 (April 9 2020)
### Bug Fixes
- A2X ad not displaying
- Android Chrome Lock Screen Pause Audio did not Stop Session

#2.9.35 (April 9 2020)
### Bug Fixes
- URL Encoding causes wrong content

#2.9.34 (February 24 2020)
### Bug Fixes
- Chrome on iOS not stopping
- Stream Status Localization Error
- Change mute to stop

#2.9.33 (November 21 2019)
### Bug Fixes
- URI Encode the VAST URL on Web-sdk
- Fix compiling on Windows
### Features
- Expose NotAllowedError as thrown by the HTML5 MediaElement
- Add destroy method to destroy the player when needed

#2.9.30 (June 13 2019)
### Bug Fixes
- Fix CORS issue when confirming the VAST impression

## v2.9.29 (May 14 2019)
### Features
- Add GDPR parameters to idSync object

## v2.9.28 (April 8 2019)
### Features
- Reduce Connection Time to Player Services based on player location & configuration setting

### Bug Fixes
- Measurement requirement -> Change "pause" to "stop"

