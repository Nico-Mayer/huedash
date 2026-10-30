# Spec Delta

## MODIFIED Requirements

### Requirement: Room header
The room or zone page SHALL show a header with the group's name, a status line, an on/off switch, and a brightness slider with its value in percent for the whole group. The status line SHALL start with the active scene's name when one is active, followed by the lights summary.

#### Scenario: Header content
- **WHEN** the Kitchen page is open, the scene "Relax" is active, 2 of 3 lights are on, and 1 is unreachable
- **THEN** the header shows "Kitchen", the status "Relax · 2 of 3 lights on · 1 unreachable", a switch, and a brightness slider

#### Scenario: Dim from the header
- **WHEN** the user releases the Kitchen header brightness slider at 40 %
- **THEN** the bridge receives one command setting the Kitchen group to 40 % brightness

### Requirement: Set group color
On the room or zone detail page, the system SHALL offer a color pad with hue and saturation when at least one light in the group supports color. The system SHALL convert the chosen color to the bridge's CIE xy color space.

#### Scenario: Pick red
- **WHEN** the user picks hue 0 and full saturation for the Living room
- **THEN** the bridge receives a color command whose xy value matches sRGB red

#### Scenario: No color lights
- **WHEN** no light in the group supports color
- **THEN** the color control is not shown

## REMOVED Requirements

### Requirement: Group presets
**Reason**: The redesigned dialog shows one large control at a time; the vertical slider and color pad replace the preset buttons.
**Migration**: Drag the brightness or white slider in the room dialog, or use the arrow keys on it.
