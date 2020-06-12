#!/bin/bash

set -e

echo "check that we can manually set a variable"
echo "================================"
node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://postman-echo.com/"

echo "check that the behavior is different with different log levels"
echo "================================"
LOGGING_LEVEL=debug node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://postman-echo.com/"

echo "check behavior when we forget a variable"
echo "================================"
node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_var" | grep "\"DA_SERVER\" not found"