#!/bin/bash

set -e

echo "check that we can manually set a variable"
echo "================================"
node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://postman-echo.com/"
echo ""
echo ""

echo "check that the behavior is different with different log levels"
echo "================================"
LOGGING_LEVEL=debug node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://postman-echo.com/"
echo ""
echo ""

echo "check behavior when we forget a variable (should see a message about DA_SERVER not found)"
echo "================================"
node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_var" | grep "\"DA_SERVER\" not found"
echo ""
echo ""

echo "check that Postman variables are read (will see ECHO_SERVER with value from the Postman collection)"
echo "================================"
LOGGING_LEVEL=debug node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" |  grep "ECHO_SERVER: 'https://812dfb8c-678a-43b5-85b5-dc68a169a8f2.mock.pstmn.io/'"
