.PHONY: check test plan-fundamentals plan-profiling

check: test
	@python3 -m py_compile infra/brev/scripts/brevctl
	@git diff --check

test:
	@python3 -m unittest discover -s tests -v

plan-fundamentals:
	@infra/brev/scripts/brevctl plan fundamentals

plan-profiling:
	@infra/brev/scripts/brevctl plan profiling
