.PHONY: check

check:
	@find infra/brev/scripts -maxdepth 1 -type f -print0 | xargs -0 bash -n
	@git diff --check
