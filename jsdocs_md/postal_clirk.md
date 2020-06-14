# [postal_clirk](https://github.com/rwilcox/postal_clirk) *0.0.2*

> Run individual Postman requests. Just do not get too clever.


### src/main/index.js


#### console() 

Module / interface for Postal Clirk

original code based on: https://stackoverflow.com/a/46674062/224334






##### Returns


- `Void`



#### fs() 







##### Properties

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |



##### Returns


- `Void`



#### findRequest(parsedCollectionOfRequests, requestPath) 

Given the string path version of the request location, find the Postman request associated




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| parsedCollectionOfRequests | `Array.<PostmanRequest>`  | - requests in the file | &nbsp; |
| requestPath |  | - string path location | &nbsp; |




##### Returns


- `Void`



#### parseCollectionFile(filename) 

Given a path to a Postman collection, return its requests




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| filename | `string`  |  | &nbsp; |




##### Returns


- `Void`



#### parseCollectionFileToObject(filename) 

Given a path to a Postman collection, return gathered information




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| filename | `string`  | path to the exported Postman collection | &nbsp; |




##### Returns


- `PostmanParsedFileObject`  parsed file object



#### parseCollectionForVariables(filename) 

Given a path to a Postman collection, return its variables




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| filename | `string`  | Path to the exported Postman collection | &nbsp; |




##### Returns


- `Array.&lt;PostmanVariables&gt;`  postman variables



#### parseCollection(jsonStr) 

From a JSON string, parse it as a Postman collection




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| jsonStr | `string`  | - string containing JSON | &nbsp; |




##### Returns


- `Void`



#### postmanVariablesToRecord(postmanVariables) 

Transform an array of PostmanVariables into a Plain Ol' Javascript Object




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| postmanVariables | `Array.<PostmanVariables>`  | given PostmanVariables, translate them into a {k: v} object | &nbsp; |




##### Returns


- `Void`



#### postmanRequestToAxiosRequest(foundRequest, postmanVariables) 

For a given Postman request, return objects we can pass to axios




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| foundRequest | `PostmanRequest`  | Postman request to process | &nbsp; |
| postmanVariables | `object`  | - k, v of Postman variable name and values | &nbsp; |




##### Returns


- `object`  parameters you should pass to Axios




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
