#!/usr/bin/env node

// original code based on: https://stackoverflow.com/a/46674062/224334

const console = require('console')
const process = require('process')
const handlebars = require('handlebars')
const axios = require('axios')
const winston = require('winston')
const _ = require('lodash')
const logger = setupLogger( _.defaultTo(process.env.LOGGING_LEVEL, "info") )

var fs = require('fs'), // needed to read JSON file from disk
sdk = require('postman-collection'),
Collection = sdk.Collection,
Request = sdk.Request,
Item = sdk.Item,
ItemGroup = sdk.ItemGroup,
myCollection,
requests = []


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


function findRequest(parsedCollectionOfRequests, requestPath) {
  return _.find(parsedCollectionOfRequests, request => {
    logger.debug(`testing ${request.path}`)
    return request.path == requestPath
  })
}


async function handleRunCommand(parsedArgs) {
  let requests = parseCollectionFile(parsedArgs.file)

  requestedRequest = findRequest(requests, parsedArgs.postmanRequestPath)

  if ( _.isNil(requestedRequest) ) {
    logger.error(`Could not find request ${parsedArgs.postmanRequestPath} in collection`)
    return
  }

  try {
    await callRequest(
      requestedRequest, 
      environmentStringsToRecord(parsedArgs.environment)
    )
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


function parseCollectionFile(filename) {
  // Load a collection to memory from a JSON file on disk 
 return parseCollection( JSON.parse(fs.readFileSync(filename).toString()) )
}


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


async function callRequest(foundRequest, postmanVariables) {

    let requestOptions = postmanRequestToAxiosRequest(foundRequest, postmanVariables)
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


module.exports = { callRequest, parseCollection, parseCollectionFile, findRequest, postmanRequestToAxiosRequest }

if (require.main === module) {
  setupYargs( require('yargs') )
} 
