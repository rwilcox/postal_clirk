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
