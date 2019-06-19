var webpackCfg = require( './config/webpack.config.js' );
// Karma configuration
// Generated on Wed Jun 08 2016 09:26:53 GMT-0400 (EDT)

var debug = process.argv.indexOf( '--debug' ) > -1;

module.exports = function ( config ) {
	config.set( {

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha', 'sinon' ],

		// list of files / patterns to load in the browser
		files: [
			'node_modules/babel-polyfill/dist/polyfill.js',
			'test/**/*Test.js'
		],

		// list of files to exclude
		exclude: [

		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'test/**/*Test.js': [ 'webpack' ]
		},

		webpack: webpackCfg,
		webpackServer: {
			noInfo: true
		},
		coverageReporter: {
			dir: 'target/coverage/',
			reporters: [ {
				type: 'html'
			}, {
				type: 'text'
			} ],
			watermarks: {
				statements: [ 50, 75 ],
				functions: [ 50, 75 ],
				branches: [ 50, 75 ],
				lines: [ 50, 75 ]
			}
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: [ 'mocha', 'coverage' ],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: [ debug ? 'Chrome' : 'PhantomJS' ],

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false,

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity,

		client: {
			mocha: {
				timeout: debug ? '3600000' : '2000'
			}
		}

	} )
}
