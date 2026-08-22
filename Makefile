.PHONY: check lint test

check:
	@./gpu check

lint:
	@shellcheck gpu tests/*.sh

test:
	@tests/gpu_alias_test.sh
