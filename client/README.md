# EQUI(NE)\u{00B2} Web Client

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

### `npm run graphql-codegen`

In order to generate TypeScript types and `react-query` hooks based off a GraphQL schema:
1. Make sure your backend is running on `http://localhost:5252/graphql`
2. Create your GraphQL queries/mutations somewhere in `./src/graphql`
3. Run `npm run graphql-codegen`

Graphql-codegen should automatically generate types and hooks based off the server's GraphQL schema and your GraphQL queries/mutations. 

The configuration for graphql-codegen is in `./codegen.yml`. Note that it uses environment variables to determine the desired GraphQL endpoint.


## Misc

### Importing Schemas outside ```src/```
Based on this thread: https://stackoverflow.com/questions/49705170/reactjs-import-component-outside-src-directory/56849993#56849993

CRA is really annoying about tsconfig.json paths and importing stuff from outside the src directory. To import the schmas outside src, I (Harry) ran ```npm init``` in ```/src/schemas```, called the application ```api-schemas```, then added it manaully as a dependency in the local ```./package.json```
```
"api-schemas": "file:../schemas",
```

Then I ran ```npm i api-schemas```

Now you can import the json schemas like
```ts
import mySchema from "api-schemas/path/to/your/schema.json"
```

In my experience in testing mode, changes to api-schemas is automatically detected and updated. If this doesn't happen for you, you may need to manually run ```npm i api-schemas``` whenever you update the schemas.

### Client Socket IO Cors Issues

Make sure you have a SocketIO client version that is compatible with the Flask SocketIO version https://flask-socketio.readthedocs.io/en/latest/intro.html#installation

We are currently using flask-socketio 5.x which restricts us to the JavaScript version 3.x or 4.x

### Socket IO version for testing

Strangely, not all versions of `socket.io` and `socket.io-client` work in Jest. Based off this thread (https://github.com/socketio/socket.io/issues/4180), I think this may have something to do with the test environment being `jsdom` (what we use for testing HTML rendering) instead of `node`. Anyways, in Jest, `socket.io` and `socket.io-client` versions 4.1 work, but 4.5.1 does not.

```
npm i socket.io-client@4.1
npm i -D socket.io@4.1
```

### Client Chartkick Version Issues
Oddly, this combination of chartkick versions works:
- react-chartkick@0.5.1
- chartkick@4.0.4

```
npm i react-chartkick@0.5.1 chartkick@4.0.4
```

But these automatically install versions do not work:
- react-chartkick@0.5.2
- chartkick@4.1.4

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
