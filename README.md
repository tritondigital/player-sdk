# Triton Digital® Player SDK

The Triton Digital® Player SDK allows you to create an HTML5 and chromeless media player connected to all Triton Digital® services (e.g. audio streaming, podcasting, audio advertising, etc.) via JavaScript®. Rendering is done in HTML5, so the media player is available on desktop, tablet, and mobile devices.

The Triton Digital® Player SDK does not provide a user interface (UI),  except for a video container used to display video advertisements and live video streams. The player UI interface and skinning have to be done in HTML, CSS, and JavaScript® by the developer.

The Triton Digital® Player SDK is designed with a modular approach (AMD), where each module gives you access to a specific player feature.

For complete documentation on using the Triton Digital® Player SDK, visit our [online documentation](https://userguides.tritondigital.com/spc/tdplay2/  ).

## Getting Started

The following instructions will get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

&ensp; [Node.Js](https://nodejs.org/en/)

### Installing

First, clone the GitHub project to your local development environment

In your terminal:

npm install
npm run dist

The files `td-sdk.min.js` and `td-sdk.min.js.map` will be created in the `dist` folder.

In your terminal:

```bash
npm start
```

This will open up an SDK Playground where you can test the SDK features.

## Running the tests

In your terminal, navigate to where you forked or cloned the SDK:

```bash
npm run test
```

## Deployment

In your terminal, navigate to where you forked or cloned the SDK:

```bash
npm run dist
```

This will create 2 files in the the `./dist` folder namely `td-sdk.min.js` and `td-sdk.min.js.map` which you can use in your project.

## Built With

&ensp; [Node.Js](https://nodejs.org/en/)

## Contributing

If you wish to contribute to this project, please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details. Please note that we do not provide any support.

## Versioning

We use an internal versioning system. All accepted contributions will be versioned under this versioning scheme.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.md](LICENSE.md) file for details

Execute local unit tests by running `npm run test`.
You can also debug in a chrome test runner by changing the test script in the package.json to `npm run test:debug`.
Test updates in Playground.

