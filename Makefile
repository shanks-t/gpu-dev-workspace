.PHONY: check image image-smoke lint spec spec-check test

check:
	@./gpu check

image:
	@scripts/build-gpu-image

image-smoke:
	@docker run --rm --platform linux/amd64 --entrypoint gpu-image-smoke-test \
		gpu-dev-workspace:$$(sed -n '1p' image/VERSION) --build

lint:
	@shellcheck gpu image/start-gpu-workspace image/smoke-test scripts/* tests/*.sh

test:
	@tests/gpu_alias_test.sh
	@tests/gpu_direct_ssh_test.sh

spec:
	@scripts/new-spec "$(name)" "$(title)"

spec-check:
	@scripts/check-spec "$(path)"
