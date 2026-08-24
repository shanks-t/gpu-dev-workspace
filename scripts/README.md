# Scripts

Local development helpers for this workspace.

## `open-brave-trace`

Opens Brave's trace viewer and reveals a local trace artifact in Finder. The
viewer requires a file-picker or drag-and-drop action, so drag the selected
artifact into the `brave://tracing/` tab after the script runs.

The artifact must already be on this Mac. For a trace created on the Brev VM,
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

### Navigation

| Key | Action |
| --- | --- |
| `w` / `s` | Zoom in/out (`Shift`: faster) |
| `a` / `d` | Pan left/right (`Shift`: faster) |
| `→` / `Shift` + `Tab` | Select previous event |
| `←` / `Tab` | Select next event |

### Mouse controls

| Mode | Input | Action |
| --- | --- | --- |
| Any | Click | Select event |
| Any | `Option` + mouse wheel | Zoom in/out |
| Select | Drag | Box select |
| Select | `Cmd` + click/drag | Add events to the current selection |
| Select | Double-click | Select all events with the same title |
| Pan | Drag | Pan the view |
| Zoom | Drag | Zoom in/out by dragging up/down |
| Timing | Drag | Create or move markers |
| Timing | Double-click | Set marker range to slice |

### General

| Key | Action |
| --- | --- |
| `1`–`4` | Switch mouse mode |
| `Shift` | Hold for temporary select mode |
| `Space` | Hold for temporary pan mode |
| `/` | Search |
| `Enter` | Step through search results |
| `f` | Zoom into selection |
| `z` / `0` | Reset zoom and pan |
| `g` / `G` | Toggle 60 Hz grid |
| `v` | Highlight VSync |
| `h` | Toggle low/high details |
| `m` | Mark current selection |
| `p` | Select power samples over the current selection interval |
| `` ` `` | Show or hide the scripting console |
| `?` | Show help |
