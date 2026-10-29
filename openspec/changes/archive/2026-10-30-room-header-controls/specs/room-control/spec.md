# Spec Delta

## ADDED Requirements

### Requirement: Room header
The room or zone page SHALL show a header with the group's name, a status line, an on/off switch, and a brightness slider with its value in percent for the whole group. The status line SHALL start with the active scene's name when one is active, followed by the lights summary. Brightness presets SHALL NOT show in the header.

#### Scenario: Header content
- **WHEN** the Kitchen page is open, the scene "Relax" is active, 2 of 3 lights are on, and 1 is unreachable
- **THEN** the header shows "Kitchen", the status "Relax · 2 of 3 lights on · 1 unreachable", a switch, and a brightness slider

#### Scenario: Dim from the header
- **WHEN** the user releases the Kitchen header brightness slider at 40 %
- **THEN** the bridge receives one command setting the Kitchen group to 40 % brightness

### Requirement: Color and white button
When the group supports color temperature or color, the header SHALL show a "Color and white" button with a small swatch of the colors of its lights that are on. Its accessible name SHALL include the group's name, for example "Color and white for Kitchen". Selecting it SHALL open the control dialog for the group.

#### Scenario: Open the room dialog
- **WHEN** the user selects "Color and white" in the Kitchen header
- **THEN** a dialog titled "Kitchen" opens with the description "Room · 3 lights"

#### Scenario: Zone dialog
- **WHEN** the user selects "Color and white" on the Downstairs page
- **THEN** the dialog description says "Zone" and the number of its lights

#### Scenario: No white or color
- **WHEN** no light in the group supports color temperature or color
- **THEN** the header shows no "Color and white" button

### Requirement: Room dialog
The control dialog for a room or zone SHALL offer brightness, white, and color for the whole group, and SHALL send group commands. White SHALL show when at least one light in the group supports color temperature, and color when at least one supports color.

#### Scenario: Set white for the room
- **WHEN** the Kitchen dialog is open and the user sets the white slider
- **THEN** the bridge receives one command for the Kitchen group

## MODIFIED Requirements

### Requirement: Group presets
The control dialog for a room or zone SHALL offer brightness presets 10, 25, 50, and 100 % and, when the color temperature control is shown, white presets Warm (2200 K), Soft (2700 K), Neutral (4000 K), and Daylight (6500 K), clamped to the group's range. A preset SHALL send one group command and turn the group on.

#### Scenario: Brightness preset
- **WHEN** the Kitchen dialog is open and the user selects 50 %
- **THEN** the bridge receives one command turning the Kitchen group on at 50 % brightness

#### Scenario: White preset
- **WHEN** the Kitchen dialog is open and the user selects Neutral
- **THEN** the bridge receives one command setting the Kitchen group to 250 mirek (4000 K)
