#!/bin/bash

set -e

#node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://812dfb8c-678a-43b5-85b5-dc68a169a8f2.mock.pstmn.io/"
LOGGING_LEVEL=debug node index.js run -f tests/integration/fixtures/postal_clirk_testing.postman_collection.json "/The test folder/subitem_echo" -e ECHO_SERVER="https://812dfb8c-678a-43b5-85b5-dc68a169a8f2.mock.pstmn.io/"