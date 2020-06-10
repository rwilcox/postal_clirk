About Postman
==================================

[Postman](https://www.getpostman.com/) is a great cross-platform, easy utility for entire development teams to collaborate in an API development process.

Postman has a wide feature set:

  * ability to import and export "collections" of requests
  * GUI request builder
  * ability to include examples of API responses
  * ability to test API responses.
  * ability to organize API requests in a folder
  * evaluate variables (which are declared in a [mustache](https://mustache.github.io/) syntax).

Postman also includes a CLI tool, [newman](https://www.npmjs.com/package/newman) that allows you to execute an entire postman collection and test responses of the requests.

About Postal Clirk
================================

Newman is pretty fancy, but it executes the entire Postman collection as an entire test suite. Which is great if you want to hook up your Postman request assertions to a CI/CD system.

But what if you use Postman to pass around a collection of requests that the user may execute only one of? "That's fine, import it into postman", you say.

Sometimes that means creating or recreating a lot of state in your personal Postman configuration. Or sometimes your workflow requires you to execute one postman request, then another, then take output from the first one and... well, we're developers, can't we do this on the CLI?

Enter Postal Clirk
------------------------------

Postal Clirk executes simple Postman requests on the command line.

It also can be used as a Node library, allowing you to execute Postman requests in scripts of your own.

Features
------------------------------

  * reads exported Postman Collections
  * lists Postman requests in top level of collection or in folder
  * executes Postman requests (with limitations, see below). Imagine: triggering a postman request or dealing with the output the same way you would running `curl` on a remote host. (But a non-developer can actually use the request artifact too!!!)
  * expands Postman variables inside requests: if your local Postman wizard has set up all the requests be based off `{{SERVER_URL}}/api/v1/somerequest` Postal Clirk can provide the value for `SERVER_URL`.

Limitations
================================

You can do LOTS of things with Postman, including creating pre and post scripts. Postal Clirk does not implement all of the Postman runtime, so your more complex commands may fail.

Postal Clirk is (now) very much a 80/20 utility.

Installation
===============================

    $ npm install -g postal_clirk


Using Postal Clirk (CLI)
================================

Basic Usage
--------------------------------

`postal_clirk` is well documented. Use the help options to see more.

However, when opening a Postman collection you'll first want to see the requests and paths defined for you:

    $ postal_clirk list -f postal_clirk_testing.postman_collection.json
    parsing collection at postal_clirk_testing.postman_collection.json
    ========================================

    /The test folder/
    full path: "/The test folder/subitem_echo". Name: "subitem_echo"
    /
    full path: "/echo". Name: "echo"


Now, find the request you want to run and do this:

    $ postal_clirk run "/echo" -f postal_clirk_testing.postman_collection.json -e "A_POSTMAN_VARIABLE=http://example.com"

(You set Postman variables with the `-e` option).

Enhanged Logging
-------------------------------

    $ LOGGING_LEVEL=debug postal_clirk run someCommand -f the_postman_collection.postman_collection.json

And SSL issues (like self signed certs)
---------------------------------

    $ NODE_TLS_REJECT_UNAUTHORIZED=0 postal_clirk run someCommand -f the_postman_collection.postman_collection.json 


Using Postal Clirk (library)
==============================

The main functions of the `postal_clirk` library are as follows:

  * `parseCollection(jsonObject)` / `parseCollectionFile(collectionFilePath)` <-- first open up the file.
  * `findRequest(parseCollectionResult, requestPath)` <-- find the requested request object in the collection
  * `callRequest(theFoundRequest, objectWhereTheKeysAreThePostmanVariablesAndValuesAreWhatToSetItTo)` <-- executes the Postman request
  * `postmanRequestToAxiosRequest`<-- returns you an object you can give to axios. For example, if you want to add something to the axios config, like proxy configuration, get the request via this method and call `axios(theResult)` yourself.

Badges
================================

![build status](
https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiM2hYSE1RZ3BWMVpiUC80aXR1V0lGUUpvYmhtc3ZUY2tjS3VTY2JCV3NDRzRNL09iMzZlaEwvVm14Q2dLSGlJNDR4MHMxL2s4MmoxMSswWjY0R3dPMmU0PSIsIml2UGFyYW1ldGVyU3BlYyI6IllkZ1ltajJIWTQwWk9BRW8iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)
