0.0.1
===========================

  * initial release

0.0.2
==========================

  * minor usability fixes

0.0.3
==========================

  * update to Axios 19.0 [PR #1](https://github.com/rwilcox/postal_clirk/pull/2). NO_PROXY should work, for those in certain enterprise environments that need this.
  * now sets non-zero exit code if Postman request fails
  * if possible, even in error conditions, the CLI will display the response body to the user