# Spec Delta

## MODIFIED Requirements

### Requirement: Start at the current light state
The control dialog for a light SHALL open on brightness. Each mode SHALL start at the current brightness, color temperature, or color of the light, and SHALL follow live changes to it.

#### Scenario: Opens on brightness
- **WHEN** "Ceiling" is at 2700 K and 70 % and the user opens it
- **THEN** the dialog shows the brightness mode at 70 %

#### Scenario: Light in white mode
- **WHEN** "Ceiling" is at 2700 K and the user opens it and selects white
- **THEN** the dialog shows the white slider at 2700 K

#### Scenario: Light in color mode
- **WHEN** "Lamp" shows a color and the user opens it and selects color
- **THEN** the color pad marker is at that color

#### Scenario: Light without dimming
- **WHEN** the user opens a light that supports white but not dimming
- **THEN** the dialog opens on white

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
- **THEN** the mode bar offers power, brightness, and white, and no color

#### Scenario: Unreachable light
- **WHEN** the user clicks the "Plug" card while the plug is unreachable
- **THEN** no dialog opens

#### Scenario: Close the dialog
- **WHEN** the dialog for "Ceiling" is open and the user presses Escape
- **THEN** the dialog closes and focus returns to the "Ceiling" card

## REMOVED Requirements

### Requirement: Light presets
**Reason**: The redesigned dialog shows one large control at a time; the vertical slider and color pad replace the preset buttons.
**Migration**: Drag the brightness or white slider, or use the arrow keys on it.
