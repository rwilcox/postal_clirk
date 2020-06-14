#!/usr/bin/env node

/**
 * Module / interface for Postal Clirk
 * 
 * original code based on: https://stackoverflow.com/a/46674062/224334
 * @module PostalClirk
 */

const console = require('console')
const process = require('process')
const handlebars = require('handlebars')
const axios = require('axios')
const winston = require('winston')
const _ = require('lodash')
const util = require('util')

const logger = setupLogger( _.defaultTo(process.env.LOGGING_LEVEL, "info") )

/**
 * @typedef PostmanRequest
 * @global
 * @property {string} path - path in the Postman collection hierarchy
 * @property {string} name - name of the Postman request
 */

/**
 * @typedef PostmanVariables
 * @global
 * @property {string} key - name of the postman variable
 * @property {string} value - value of the postman variable
 */

/**
 * @typedef PostmanParsedFileObject
 * @global
 * @property {PostmanRequest[]} requests - requests from the Postman collection
 * @property {PostmanVariables[]} variables - variables set and used by the Postman collection
 */


var fs = require('fs'), // needed to read JSON file from disk
sdk = require('postman-collection'),
Collection = sdk.Collection,
Request = sdk.Request,
Item = sdk.Item,
ItemGroup = sdk.ItemGroup,
myCollection,
requests = []

class VariableException extends Error { }

function setupYargs( yargs ) {
  return yargs.usage('Usage: $0 <command> [options]')
  .command('list [options]', 'List all the requests in this Postman collection (and folders too)', (cmdYargs) => {

    cmdYargs.alias('f', 'file')
    .nargs('f', 1)
    .describe('f', 'the exported Postman collection to act upon')
    .demandOption(['f'])
    .example('$0 list -f postman_collection.postman_collection.json')
  }, handleListCommand )
  .command('run [options] <postmanRequestPath>', 'Run the specified Postman request', (cmdYargs) => {
    cmdYargs.describe('f', 'the exported Postman collection to act upon')
    .alias('f', 'file')
    .nargs('f', 1)
    .describe('e', 'set variable value')
    .alias('e', 'environment')
    .array('e')
    .positional('postmanRequestPath', {describe: "The name of the postman request to run. (Get me from the list command!)", type: "string"})
    .demandOption(['f'])
    .usage("$0 run -f file <postmanRequestPath>")
    .example('$0 run -f postman_collection.postman_collection.json echoRequest')
    .example('$0 run echoRequest -f collection.postman_collection.json -e \"SERVER_URL=http://www.example.com\" -e \"USERNAME=rwilcox\" ')
  }, async function thunk(parsedArgs) {
    try {
      await handleRunCommand(parsedArgs)
   } catch(err) {
     logger.error(`Error happened! ${err}`)
     logger.debug(err.stack)
     process.exit(1)
   } } )
  .demandCommand(1, 'You need at least one command before moving on')
  .example('$0 run --help')
  .example('$0 run -f postman_collection.postman_collection.json echoRequest')
  .example('$0 list -f postman_collection.postman_collection.json')
  .help('h')
  .alias('h', 'help')
  
  .argv
}


function handleListCommand(parsedArgs) {
  logger.info(`parsing collection at ${parsedArgs.file}`)
  logger.info("========================================\n")
  let requests = parseCollectionFile(parsedArgs.file)

  let requestsByPath = _.groupBy(requests, currentRequest => {
     let currentPath =_.dropRight(currentRequest.path.split("/"), 1).join("/")
     return `${currentPath}/`
  })

  _.forOwn(requestsByPath, (itemsArray, pathName) => {
    logger.info(pathName)
    _.each(itemsArray, (currentItem) => {
      logger.info(`  full path: "${currentItem.path}". Name: "${currentItem.name}"`)
    })

  })
}


/**
 * Given the string path version of the request location, find the Postman request associated
 * 
 * @param {PostmanRequest[]} parsedCollectionOfRequests - requests in the file
 * @param {*} requestPath - string path location
 * @returns {PostmanRequest} request found
 */
function findRequest(parsedCollectionOfRequests, requestPath) {
  return _.find(parsedCollectionOfRequests, request => {
    logger.debug(`testing ${request.path}`)
    return request.path == requestPath
  })
}


async function handleRunCommand(parsedArgs) {
  let collection = parseCollectionFileToObject(parsedArgs.file)
  let requests = collection.requests

  requestedRequest = findRequest(requests, parsedArgs.postmanRequestPath)

  if ( _.isNil(requestedRequest) ) {
    logger.error(`Could not find request ${parsedArgs.postmanRequestPath} in collection`)
    return
  }

  let definedVariables = postmanVariablesToRecord(collection.variables)
  let variables = Object.assign( definedVariables, environmentStringsToRecord(parsedArgs.environment) )

  logger.debug("variables, overloaded or not = %o", variables)

  try {
    await callRequest(requestedRequest, variables)
  } catch (e) {
    logger.debug(e)

    if (e.response) {  // is it an axios error?
      logger.error("%o", e.response.data)
    }

    // we have displayed information about the error to the user further down the chain
    // (but always show them the result)

    throw e
  }
//  console.dir(requestedRequest)
}


function setupCliFormat() {
  return winston.format.printf(({ level, message, label, timestamp }) => {
    return message // by defgault winston will include the log level in the message. For this CLI tool that is ugly. RPW 04-28-2019
  });
}


function setupLogger(showLevel="debug") {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.simple(),
      setupCliFormat()
    ),
    transports: [
      new (winston.transports.Console)({level: showLevel})
      // ^^^ super oddball syntax(??!!) Thanks, winston. (la sigh...)
    ] } )
}

/**
 * Given a path to a Postman collection, return its requests
 * @param {string} filename 
 * @returns {PostmanRequest[]} array of requests in the exported Postman collection
 */
function parseCollectionFile(filename) {
  // Load a collection to memory from a JSON file on disk 
 return parseCollection( JSON.parse(fs.readFileSync(filename).toString()) )
}


/**
 * Given a path to a Postman collection, return gathered information
 * @param {string} filename path to the exported Postman collection
 * @returns {PostmanParsedFileObject} parsed file object
 */
function parseCollectionFileToObject(filename) {
  let output = {}
  let parsedObject = JSON.parse(fs.readFileSync(filename).toString() )

  output.requests = parseCollection( parsedObject )
  output.variables = parseCollectionForVariables(parsedObject)

  return output
}

/**
 * Given a path to a Postman collection, return its variables
 * @param {string} filename Path to the exported Postman collection
 * @returns {PostmanVariables[]} postman variables
 */
function parseCollectionForVariables(jsonStr) {
  myCollection = new Collection(jsonStr)
  return myCollection.variables
}

/**
 * From a JSON string, parse it as a Postman collection
 * @param {string} jsonStr - string containing JSON
 * @returns {PostmanRequest[]} an array of the results found, regardless of where in the Postman hierarchy they were created.
 */
function parseCollection(jsonStr) {
  myCollection = new Collection(jsonStr)

  myCollection.items.each(function (item) {
    // Check if this is a request at the top level
    if (Item.isItem(item)) {
      logger.debug(`Found ${item.name} at top level`)
      if (item.request && Request.isRequest(item.request)) {
        item.path = "/" + item.name
        requests.push(item);
      }
    }
    // Check if this is a folder at the top level
    else if (ItemGroup.isItemGroup(item)) {
      let parentNamespace = "/" + item.name
      logger.debug(`Digging into folder ${item.name}`)
      item.items.each(function (item) {
        requests.push(dfs(item, [], parentNamespace));
      })
    }
  });

  // Flatten. After flattening requests will an array of PostmanRequest objects
  requests = _.flattenDeep(requests)
  return requests
}


function dfs(item, requests, namespace) { // fn -> Depth first search
    // Check if this is a request
    if (Item.isItem(item)) {
      if (item.request && Request.isRequest(item.request)) {
        item.path = `${namespace}/${item.name}`

        logger.debug(`  ... found sub-item ${item.name}. Path is ${item.path}`)
        requests.push(item);
      }
    }
    // Check if this is a nested folder
    else if (ItemGroup.isItemGroup(item)) {
      // Check if this is an empty folder
      if (item.items && (item.items.count() === 0)) {
        return requests;
      }
      // Do a depth first search for requests on the nested folder
      item.each(function (item) {
        logger.debug("  Digging into subfolder ${item.name}")
        requests.push(dfs(item, [], `${namespace}/${item.name}`));
      })
    }

    return requests;
};


function environmentStringsToRecord(environmentStrings) {
  let record = {}
  _.each(environmentStrings, currentEnvironment => {
    let [key, value] = currentEnvironment.split("=")
    record[key] = value
  })

  logger.debug("parsed environment strings = %o", record)
  return record
}


/**
 * Transform an array of PostmanVariables into a Plain Ol' Javascript Object
 * @param {PostmanVariables[]} postmanVariables given PostmanVariables, translate them into a {k: v} object
 * @returns {object} array of PostmanVariables now transformed to seperate keys in a single object
 */
function postmanVariablesToRecord(postmanVariables) {
  let output = {}
  let vars = ( postmanVariables ? postmanVariables : [] )
  vars.each(element => {
    output[element.key] = element.value
  })
  
  return output
}

/**
 * For a given Postman request, return objects we can pass to axios
 * @param {PostmanRequest} foundRequest Postman request to process
 * @param {object} postmanVariables - k, v of Postman variable name and values
 * 
 * @returns {object} parameters you should pass to Axios
 */
function postmanRequestToAxiosRequest(foundRequest, postmanVariables) {
  let request = foundRequest.request
  
  // console.dir(request.url)
  var requestPath = request.url.path.join("/")
  var requestURL = `${request.url.host}${requestPath}` // TODO: build this better, we have query params here, at least

  logger.debug(`requestURL is ${requestURL}`)
  var urlFunctor = handlebars.compile( requestURL, {strict: true} )
  var theURL = urlFunctor(postmanVariables)

  logger.debug(request.method); // The HTTP Verb of your request Eg. GET, POST

  var requestHeaders = {}
  _.each(request.headers.all(), (header) => {
    var headerValue = handlebars.compile(header.value, {strict: true})(postmanVariables)
    logger.debug(header.key, headerValue); // Eg. key -> 'Content-Type', value -> 'application/json'
    requestHeaders[ header.key ] = headerValue
  });
  // logger.debug("headers from Postman: %o", request.headers.all())
  logger.debug("processed headers: %o", requestHeaders)

  var requestBody = request.body[ request.body.mode ]
  
  logger.debug(requestBody)
  var requestBody = handlebars.compile(requestBody, {strict: true})(postmanVariables)
  logger.debug("requestBody after getting compiled by handlebars %o", requestBody)
  // You can also access the request body and the auth, certificate and proxy used by the request
  // Your PostmanRequest description is also available

  let requestOptions = {
    url: theURL,
    method: request.method,
    headers: requestHeaders,
  }

  if ( ['POST', 'PUT', 'PATCH'].indexOf(request.method) > -1 ) {
    requestOptions.data = requestBody
  }

  logger.debug("===============================")
  logger.debug("requestOptions: %o ", requestOptions)
  logger.debug("===============================")

  return requestOptions
}

/**
 * Call the Postman request at the given path, using the given variables
 * @param {string} foundRequest path to the Postman request in the exported Postman file
 * @param {object} postmanVariables k,v dictionary that holds values for every Postman variable used in this request
 * @returns {object} axios result
 */
async function callRequest(foundRequest, postmanVariables) {
    let requestOptions  
    try {
      requestOptions = postmanRequestToAxiosRequest(foundRequest, postmanVariables)
    } catch(e) {
      let substrEnds = e.message.indexOf('not defined in')

      if ( substrEnds > -1 ) {
        throw new VariableException(`postman variable ${e.message.substring(0, substrEnds -1)} not found in given variable definitions: ${util.inspect(postmanVariables)}`)
      }
    }
    let response
    try {
      response = await axios(requestOptions)
    } catch(error) {
        logger.debug("Request failed")
        if (error.response) {
          logger.debug("Status: %d", error.response.status)
          logger.debug("Body: %o", error.response.data)
        }
        throw error
    }

    logger.debug(`response status code was ${response.status}`)
    logger.info("%o", response.data)

    return response
}


module.exports = { callRequest, parseCollection, 
  parseCollectionFile, parseCollectionFileToObject, 
  parseCollectionForVariables, 
  findRequest, postmanRequestToAxiosRequest, postmanVariablesToRecord
}

if (require.main === module) {
  setupYargs( require('yargs') )
} 
