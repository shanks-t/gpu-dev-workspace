.PHONY: check lint test

check:
	@./gpu check

lint:
	@shellcheck gpu scripts/* tests/*.sh

test:
	@tests/gpu_alias_test.sh
