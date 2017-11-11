### Playback
> Easy caching for easier web development

Playback is a chrome browser extension built to help web development.
When it is activated all post methods in the current tab will be cached avoiding possible round trips to the db.


#### From source code
    npm run build-background

To generate the bundle of the extension. Later load extension from the browser in developer mode.

#### Test

In the console:

    npm run test

##### TODO
* Better icon
* ~~Handle errors gracefully~~
* In extension tutorial
* Error message if chrome is not compatible
* Allow to filter with custom rules
* Allow to persist across sessions
* Cache websockets (does it actually make sense?)