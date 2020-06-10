release:
	npm publish


build:
	npm build


force_build:
	HEADBRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	aws codebuild start-build --project-name=postal-clirk --profile=wdstatic --source-version=$$HEADBRANCH


latest_build_results:
	BUILDID_PREFORMATED=$$(aws codebuild list-builds-for-project --project-name postal-clirk --profile=wdstatic --sort-order DESCENDING | jq -M '.ids[0]'); \
	BUILDID=$$(echo $$BUILDID_PREFORMATED | tr -d '\"'); \
	echo $$BUILDID; \
	BUILD_LOG_STREAM=$$(aws codebuild batch-get-builds --ids=$$BUILDID --profile=wdstatic | jq -M ".builds[0].logs.streamName" | tr -d '\"'); \
	echo $$BUILD_LOG_STREAM; \
	aws logs get-log-events --log-group-name="/aws/codebuild/postal-clirk" --log-stream-name=$$BUILD_LOG_STREAM --profile=wdstatic | jq -M ".events[] | .message" | tr -d '\"'


help:
	$(info make release               - publish to NPM)
	$(info make build                 - build the source)
	$(info make force_build           - for the current checked out Git branch, build remote HEAD)
	$(info make latest_build_results  - for the latest CodeBuild build, show results on CLI)
