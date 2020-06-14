PROJECT ?= postal-clirk
PROFILE ?= wdstatic
AWS_STREAM_NAME ?= /aws/codebuild/postal-clirk

clean:
	rm -rf docs
	rm jsdocs_md/postal_clirk.md

release:
	node build-scripts/check-for-currently-published.js
	npm publish
	VERSION_TAG=$$(cat package.json | jq -M ".version" | tr -d '\"'); \
	git tag -m "$$VERSION_TAG" v$$VERSION_TAG

docs:
	npm run jsdocs -- -d docs src/main -R README.md

docs_md:
	npm run doxdox -- src/main/*.js --layout markdown --output jsdocs_md/postal_clirk.md

build: docs
	npm build


force_build:
	HEADBRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	aws codebuild start-build --project-name=${PROJECT} --profile=${PROFILE} --source-version=$$HEADBRANCH

latest_build_status:
	BUILDID_PREFORMATED=$$(aws codebuild list-builds-for-project --project-name ${PROJECT} --profile=${PROFILE} --sort-order DESCENDING | jq -M '.ids[0]'); \
	BUILDID=$$(echo $$BUILDID_PREFORMATED | tr -d '\"'); \
	aws codebuild batch-get-builds --ids=$$BUILDID --profile=${PROFILE}


latest_build_results:
	BUILDID_PREFORMATED=$$(aws codebuild list-builds-for-project --project-name ${PROJECT} --profile=${PROFILE} --sort-order DESCENDING | jq -M '.ids[0]'); \
	BUILDID=$$(echo $$BUILDID_PREFORMATED | tr -d '\"'); \
	echo $$BUILDID; \
	BUILD_LOG_STREAM=$$(aws codebuild batch-get-builds --ids=$$BUILDID --profile=${PROFILE} | jq -M ".builds[0].logs.streamName" | tr -d '\"'); \
	echo $$BUILD_LOG_STREAM; \
	aws logs get-log-events --log-group-name="${AWS_STREAM_NAME}" --log-stream-name=$$BUILD_LOG_STREAM --profile=${PROFILE} | jq -M ".events[] | .message" | tr -d '\"'

test:
	bash src/tests/integration/tests.sh
	#npm test


help:
	$(info make release               - publish to NPM)
	$(info make build                 - build the source)
	$(info make force_build           - for the current checked out Git branch, build remote HEAD)
	$(info make latest_build_status   - checking up on the latest build)
	$(info make latest_build_results  - for the latest CodeBuild build, show results on CLI)
	$(info make test                  - run tests)
	$(info make docs_md               - generate documentation from jsdocs)
	$(info make docs                  - generate standard JSDocs documentation)
