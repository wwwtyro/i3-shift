/**
 * i3-shift: Shift the current i3 workspace left or right, wrapping around at 1 and 10.
 *
 * Usage:
 *   i3-shift <left|right>
 */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Workspace {
  id: number;
  num: number;
  name: string;
  visible: boolean;
  focused: boolean;
  rect: Rect;
  output: string;
  urgent: boolean;
}

const MAX_WORKSPACE = 10;

async function getWorkspaces(): Promise<Workspace[]> {
  const cmd = new Deno.Command("i3-msg", {
    args: ["-t", "get_workspaces"],
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const errMsg = new TextDecoder().decode(stderr);
    throw new Error(`Error retrieving workspaces: ${errMsg}`);
  }
  const output = new TextDecoder().decode(stdout);
  return JSON.parse(output) as Workspace[];
}

async function renameWorkspace(oldName: string, newName: string): Promise<string> {
  const commandStr = `rename workspace "${oldName}" to "${newName}"`;
  const cmd = new Deno.Command("i3-msg", {
    args: [commandStr],
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const errMsg = new TextDecoder().decode(stderr);
    throw new Error(`Error renaming workspace: ${errMsg}`);
  }
  return new TextDecoder().decode(stdout);
}

function getNextAvailableNumber(
  currentNum: number,
  direction: "left" | "right",
  used: Set<number>,
): number | null {
  const order: number[] = [];
  if (currentNum === 0) {
    // When current number is 0, consider all numbers 1..MAX_WORKSPACE.
    if (direction === "right") {
      for (let i = 1; i <= MAX_WORKSPACE; i++) {
        order.push(i);
      }
    } else {
      for (let i = MAX_WORKSPACE; i >= 1; i--) {
        order.push(i);
      }
    }
  } else {
    // Build a circular list excluding the current number.
    if (direction === "right") {
      for (let i = 1; i <= MAX_WORKSPACE - 1; i++) {
        const candidate = (((currentNum - 1 + i) % MAX_WORKSPACE) + 1);
        order.push(candidate);
      }
    } else {
      for (let i = 1; i <= MAX_WORKSPACE - 1; i++) {
        const candidate = (((currentNum - 1 - i + MAX_WORKSPACE) % MAX_WORKSPACE) + 1);
        order.push(candidate);
      }
    }
  }
  // Find the first candidate not used by another workspace.
  for (const candidate of order) {
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  // If no candidate is free, return null.
  return null;
}

function usage(): void {
  console.error("Usage: i3-shift <left|right>");
  Deno.exit(1);
}

if (import.meta.main) {
  const args = Deno.args;
  if (args.length !== 1 || (args[0] !== "left" && args[0] !== "right")) {
    usage();
  }
  const direction = args[0] as "left" | "right";

  let workspaces: Workspace[];
  try {
    workspaces = await getWorkspaces();
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }

  // Find the focused workspace.
  const focused = workspaces.find((ws) => ws.focused);
  if (!focused) {
    console.error("No focused workspace found.");
    Deno.exit(1);
  }

  // If the workspace number is missing or negative, treat it as 0.
  const currentNum = focused.num > 0 ? focused.num : 0;

  // Build a set of numbers used by other (non-focused) workspaces.
  const usedNumbers = new Set<number>();
  for (const ws of workspaces) {
    if (!ws.focused && ws.num > 0) {
      usedNumbers.add(ws.num);
    }
  }

  const newNum = getNextAvailableNumber(currentNum, direction, usedNumbers);
  if (newNum === null) {
    console.error("All workspace numbers are in use. No available workspace to move to.");
    Deno.exit(1);
  }

  const newName = newNum.toString();

  try {
    await renameWorkspace(focused.name, newName);
  } catch (e) {
    console.error(e);
    Deno.exit(1);
  }
}
