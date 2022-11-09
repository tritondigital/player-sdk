|                         |  iOS    |   Android   |  Chrome & Firefox (HTML5)  | Flash |  Safari  |  IE  | EDDGE |
|-------------------------|---------|-------------|----------------------------|-------|----------|------| ------|
| Audio Adaptive (HLS-ES) |   x     |             |                            |       |          |      |   x   |
| Audio Adaptive (HLS-TS) |   x     |    x **     |                            |       |          |      |       |
| HLS TS                  |         |    x **     |                            |       |          |      |       |
| HLS ES                  |   x     |             |                            |       |     x    |  x * |   x   |
| AAC                     |   x     |             |             x              |   x   |     x    |      |   x   |
| MP3                     |   x     |      x      |             x              |   x   |     x    |  x   |   x   |

_Notes_:
- The technologies are ordered by priority in the table above.
- *Only for IE 11 windows 8.1+ with hls.js
- **Battery saving reasons, the HLS-TS streams will be paused in Google Chrome on Android if changing tabs or changing application.
