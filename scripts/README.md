# Scripts

Local development helpers for this workspace.

## `open-brave-trace`

For view pytorch traces in [chromium trace viwer](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/). Note: I use brave, but it works with any chromium based browser I believe.

Opens Brave's trace viewer and reveals a local trace artifact in Finder. The
viewer requires a file-picker or drag-and-drop action, so drag the selected
artifact into the `brave://tracing/` tab after the script runs.

The artifact must already be on local machine. For a trace created on the Brev VM,
copy it down first:

```sh
brev copy \
  gpu-profiling:/home/ubuntu/workspace/curriculum/gpu-mode-lecture-001/artifacts/test_trace_4.json \
  curriculum/gpu-mode-lecture-001/artifacts/
```

Then run:

```sh
scripts/open-brave-trace \
curriculum/gpu-mode-lecture-001/artifacts/pt-profiler-4.json
```