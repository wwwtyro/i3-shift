# i3-shift

**i3-shift** is a utility for the i3 window manager. It shifts the current workspace left or right with circular wrapping over workspace numbers 1–10. When executed, it renames the focused workspace to the next available number in the specified direction, discarding any previous labels.

## Build

```sh
deno compile --allow-run i3-shift.ts
```

## Usage

- Shift the workspace left:
  ```bash
  ./i3-shift left
  ```

- Shift the workspace right:
  ```bash
  ./i3-shift right
  ```

## Integrating with i3 Config

To bind the utility to key combinations in i3, add the following entries to your i3 configuration file (usually located at `~/.config/i3/config`):

```i3
# Shift workspace to the left with mod+Control+Left
bindsym $mod+Control+Left exec --no-startup-id i3-shift left

# Shift workspace to the right with mod+Control+Right
bindsym $mod+Control+Right exec --no-startup-id i3-shift right
```

> **Note:**  
> You'll need to make sure the i3-shift binary is in a directory that is included in the PATH environment variable visible to i3. You can also specify the full path to the binary in the i3 configuration file.
