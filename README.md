# BoxJoints

> **IMPORTANT DISCLAIMER:** This plugin is part of my personal ncSender project. If you choose to use it, you do so entirely at your own risk. I am not responsible for any damage, malfunction, or personal injury that may result from the use or misuse of this plugin. Use it with caution and at your own discretion.

Generate G-code for box joint (finger joint) operations for CNC woodworking.

## Installation

Install this plugin in ncSender through the Plugins interface.

## Features

### Box Joints Generator
Generate G-code for cutting box joints with evenly spaced fingers and slots.

**Configuration:**

**Dimensions:**
- Board Thickness - The thickness of the board material
- Board Width - The width of the board where joints will be cut
- Finger Count - Number of fingers to cut (slots are automatically calculated)
- Fit Tolerance - Extra width added to slots for proper fit (typically 0.1-0.2mm)
- Piece Type - Select A (pins) or B (tails) for mating pieces
- Depth Per Pass - Cutting depth for each pass (can equal board thickness for single pass)

**Machine Settings:**
- Bit Diameter - End mill diameter (must be smaller than calculated slot width)
- Feed Rate - Cutting speed
- Spindle RPM - Spindle rotation speed
- Spindle Delay - Wait time after spindle start
- Coolant Options - Mist (M7) and/or Flood (M8)

**Calculated Dimensions:**
The plugin automatically calculates and displays:
- Finger Width - Calculated as: Board Width ÷ (Finger Count × 2)
- Slot Width - Calculated as: Finger Width + Fit Tolerance

**Validation:**
- Real-time validation ensures slot width is larger than bit diameter
- Error tooltip shows if adjustments are needed (fewer fingers or smaller bit)

## Usage

1. Open the Tools menu in ncSender
2. Select "Box Joints"
3. Configure the dimensions:
   - Enter board thickness and width
   - Choose number of fingers (1-20)
   - Set fit tolerance for snug fit
   - Select piece type (A or B)
   - Set depth per pass
4. Configure machine settings:
   - Enter bit diameter
   - Set feed rate and spindle RPM
   - Enable coolant if needed
5. Verify the calculated finger and slot widths
6. Click "Generate" to create G-code

The generated G-code file will be named:
`BoxJoint_{Piece}_BT-{Thickness}_BW-{Width}_FC-{Count}_DPP-{Depth}.nc`

Example: `BoxJoint_A_BT-19_BW-100_FC-7_DPP-3.nc`

## How Box Joints Work

Box joints create interlocking corners by cutting alternating fingers and slots:
- **Piece A** starts with a finger at the edge
- **Piece B** starts with a slot at the edge
- Both pieces have the same finger width
- Slots are slightly wider (by fit tolerance) than fingers for assembly
- The plugin generates zigzag pocketing toolpaths to clear each slot

## G-code Generation

The plugin generates efficient zigzag pocketing patterns:
- Multiple horizontal passes across slot width (40% stepover)
- Multiple depth passes if needed
- Proper plunge and retract moves
- All moves optimized to stay within slot boundaries

## Units

The plugin supports both metric (mm) and imperial (inches) units based on your ncSender application settings.

## Development

This plugin is part of the ncSender ecosystem: https://github.com/siganberg/ncSender

## License

See main ncSender repository for license information.
