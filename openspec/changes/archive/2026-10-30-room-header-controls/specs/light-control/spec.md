# Spec Delta

## ADDED Requirements

### Requirement: Open a light's controls
Clicking a light's card outside its switch and slider SHALL open the control dialog for that light. The dialog SHALL show the light's name as title, its product name when the bridge reports one, and the controls the light supports: on/off, brightness, white, and color. Unreachable lights SHALL NOT open the dialog.

#### Scenario: Open a light
- **WHEN** the user clicks the "Ceiling" card in the Kitchen
- **THEN** a dialog titled "Ceiling" opens with the description "Hue Signe"
- **AND** commands from the dialog go to "Ceiling" only

#### Scenario: Switch does not open the dialog
- **WHEN** the user clicks the switch on the "Ceiling" card
- **THEN** the light turns off and no dialog opens

#### Scenario: Only supported controls
- **WHEN** the user opens a light that supports white but not color
- **THEN** the dialog shows brightness and white, and no Color tab

#### Scenario: Unreachable light
- **WHEN** the user clicks the "Plug" card while the plug is unreachable
- **THEN** no dialog opens

#### Scenario: Close the dialog
- **WHEN** the dialog for "Ceiling" is open and the user presses Escape
- **THEN** the dialog closes and focus returns to the "Ceiling" card

## MODIFIED Requirements

### Requirement: Start at the current light state
The control dialog for a light SHALL start at the current brightness, color temperature, or color of the light, and SHALL follow live changes to it.

#### Scenario: Light in white mode
- **WHEN** "Ceiling" is at 2700 K and the user opens it
- **THEN** the dialog shows the White tab at 2700 K

#### Scenario: Light in color mode
- **WHEN** "Lamp" shows a color and the user opens it
- **THEN** the dialog shows the Color tab at that color

### Requirement: Light presets
The control dialog for a light SHALL offer brightness presets 10, 25, 50, and 100 % and, when white is shown, white presets Warm (2200 K), Soft (2700 K), Neutral (4000 K), and Daylight (6500 K). A white preset outside a light's range SHALL be clamped to the nearest temperature the light supports. A preset SHALL turn the light on.

#### Scenario: Brightness preset
- **WHEN** the dialog for "Ceiling" is open and the user selects 25 %
- **THEN** the bridge receives a command turning "Ceiling" on at 25 % brightness

#### Scenario: White preset clamped
- **WHEN** the dialog for "Counter" is open, its warmest white is 454 mirek (about 2203 K), and the user selects Warm
- **THEN** the bridge receives a command setting "Counter" to 454 mirek

## REMOVED Requirements

### Requirement: Select a light
**Reason**: Clicking a light card now opens its control dialog instead of selecting it.
**Migration**: Use "Open a light's controls".

### Requirement: Select several lights
**Reason**: Multi-select was rarely used, and selected lights with different features made the controls unclear.
**Migration**: Group lights that belong together in a zone in the Hue app and control the zone.

### Requirement: Control selected lights
**Reason**: There is no selection anymore. Each light is controlled in its own dialog.
**Migration**: Open a light's dialog, or control the room or zone from its header.
