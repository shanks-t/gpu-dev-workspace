.PHONY: check test plan-fundamentals

check: test
	@python3 -m py_compile workspacectl runpod_workspace/*.py
	@git diff --check

test:
	@python3 -m unittest discover -s tests -v

plan-fundamentals:
	@./workspacectl plan configs/fundamentals.json
