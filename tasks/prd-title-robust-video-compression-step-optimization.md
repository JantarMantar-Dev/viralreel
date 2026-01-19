## Title: Robust Video Compression Step Optimization

## Overview
The current video rendering pipeline has a performance bottleneck in the final compression step. The Node.js process hangs unnecessarily after the underlying `ffmpeg` process has completed, causing delays. Additionally, the process lacks robust handling for file overwrites and error scenarios. This feature aims to optimize the execution flow to resolve promises immediately upon `ffmpeg` completion, ensure existing files are overwritten cleanly, and introduce comprehensive unit testing for reliability.

## Goals
- **Minimize Latency:** Ensure the Node.js `await` resolves the instant the `ffmpeg` process exits.
- **Robust File Handling:** Automatically overwrite output files if they already exist.
- **Reliability:** Handle error cases (process failure, timeouts) gracefully.
- **Verification:** Establish a robust suite of unit tests for the compression logic.

## Technical Constraints & Quality Gates
- **Type Safety:** Must pass `npm run typecheck`.
- **Linting:** Must pass `npm run lint`.
- **Testing:** Unit tests must use the project's standard testing framework (e.g., Jest/Vitest) and cover success/failure paths.

## User Stories

### Story 1: Immediate Process Resolution
**As a** system,
**I want** the compression function's promise to resolve immediately when the `ffmpeg` process exits,
**So that** the pipeline proceeds to the next step without unnecessary waiting.

**Acceptance Criteria:**
- The Node.js wrapper for `ffmpeg` must listen to the `close` or `exit` event properly.
- Any artificial delays or polling mechanisms waiting for file existence should be removed or optimized.
- The `ffmpeg` command should include flags (e.g., `-y`) to prevent interactive prompts that might hang the process.
- The function must return/resolve successfully within milliseconds of the subprocess termination.

### Story 2: Force File Overwrite
**As a** system,
**I want** the compression step to automatically overwrite the destination file if it exists,
**So that** the operation never fails or hangs due to file conflicts.

**Acceptance Criteria:**
- The `ffmpeg` command execution must explicitly include the `-y` flag (or equivalent) to force overwrite.
- Verify that no error is thrown if the target file already exists prior to execution.
- The system should not generate unique filenames (e.g., `video(1).mp4`); it must replace the specific target path.

### Story 3: Robust Unit Testing
**As a** developer,
**I want** a comprehensive unit test suite for the compression function,
**So that** regressions and edge cases are caught early.

**Acceptance Criteria:**
- Tests must mock the child process execution to simulate:
  - Successful immediate exit (code 0).
  - Error exit (non-zero code).
  - Process timeout or hang (if timeout logic is implemented).
- Verify that the function throws appropriate errors when `ffmpeg` fails.
- Verify that the function resolves correctly when `ffmpeg` succeeds.
- Tests must run in CI/CD environment without hanging.

## Dependencies
- `ffmpeg` must be installed/available in the environment.
- Node.js `child_process` (spawn/exec) module.