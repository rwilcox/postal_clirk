const axios = require('axios')

/*
    Is the current version currently published on NPM?
    If so STOP THE RELEASE PROCESS.
*/

let packageJson = require("../package.json")
let version = packageJson.version
let name = packageJson.name

let requestOptions = {
    url: `https://registry.npmjs.org/${name}/${version}`,
}


axios( requestOptions )
    .then( (res) => {
        console.log("WARNING: POTENTIALLY RE-PUBLISHING VERSION!! BUMP VERSION!")
        process.exit(1)
    })
    .catch( (err) => {
        console.log("... version looks good...")
    })