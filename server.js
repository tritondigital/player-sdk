// /*eslint no-console:0 */
// var webpack = require('webpack');
// var WebpackDevServer = require('webpack-dev-server');
// var config = require('./config/webpack.config');
//
// new WebpackDevServer(webpack(config), config.devServer)
// .listen(config.port, '10.100.21.50', function(err) {
//   if (err) {
//     console.log(err);
//   }
//   console.log('Listening at localhost:' + config.port);
//   //open('http://localhost:' + config.port + '/webpack-dev-server/');
// });
const express = require( 'express' );
//const logger = require('./logger');

//const argv = require('minimist')(process.argv.slice(2));
const setup = require( './frontendMiddleware' );
const isDev = process.env.NODE_ENV !== 'production' || process.env.env !== 'production';
const ngrok = isDev ? require( 'ngrok' ) : false;
const resolve = require( 'path' ).resolve;
const app = express();

// If you need a backend, e.g. an API, add your custom backend-specific middleware here
// app.use('/api', myApi);

// In production we need to pass these values in instead of relying on webpack

setup( app, {
	outputPath: resolve( process.cwd(), 'dist' ),
	publicPath: '/',
} );

// get the intended port number, use port 3000 if not provided
const port = process.env.PORT || 3000;

// Start your app.
app.listen( port, ( err ) => {
	if ( err ) {
        console.log( err.message );
        //return logger.error( err.message );
	}

	// Connect to ngrok in dev mode
	if ( ngrok ) {
		ngrok.connect( port, ( innerErr, url ) => {
			if ( innerErr ) {
                console.log( innerErr );
			}
            console.log( port, url );
			//logger.appStarted( port, url );
		} );
	} else {
        console.log( port );
		//logger.appStarted( port );
	}
} );
