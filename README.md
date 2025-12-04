# ToolBench

> **IMPORTANT DISCLAIMER:** This plugin is part of my personal ncSender project. If you choose to use it, you do so entirely at your own risk. I am not responsible for any damage, malfunction, or personal injury that may result from the use or misuse of this plugin. Use it with caution and at your own discretion.

Collection of CNC tooling utilities for common machining operations.

## Installation

Install this plugin in ncSender through the Plugins interface.

## Features

### Surfacing Tool
Generate G-code for surfacing operations (fly-cutting) to flatten workpiece surfaces.

**Configuration:**
- Area dimensions (X and Y size)
- Target depth
- Depth of cut per pass
- Stepover percentage
- Bit diameter
- Feed rate and spindle RPM
- Coolant options (Mist M7, Flood M8)
- Spindle delay
- Cut direction (zigzag or one-way)

### Jointer/Cutter Tool
Generate G-code for edge trimming and jointing operations.

**Configuration:**
- Edge selection (top, bottom, left, right)
- Edge length
- Material thickness
- Depth of cut (minimum 0.1mm)
- Trim width
- Number of passes
- Lead-in/out distance
- Bit diameter
- Feed rate and spindle RPM
- Coolant options

### Boring Tool
Generate G-code for boring operations.

**Status:** Basic dialog structure in place. Configuration options coming soon.

## Usage

1. Open the Tools menu in ncSender
2. Select the desired tool (Surfacing, Jointer/Cutter, or Boring)
3. Configure the parameters for your operation
4. Click "Generate G-code"
5. The generated G-code will be loaded into the visualizer

## Units

The plugin supports both metric (mm) and imperial (inches) units based on your ncSender application settings.

## Development

This plugin is part of the ncSender ecosystem: https://github.com/siganberg/ncSender

## License

See main ncSender repository for license information.
# ncsender-plugin-boxjoints
# ncsender-plugin-boxjoints
