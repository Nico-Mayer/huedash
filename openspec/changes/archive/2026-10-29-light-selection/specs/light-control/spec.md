# Spec Delta

## ADDED Requirements

### Requirement: Select a light
Clicking a light's card outside its switch and slider SHALL select that light and replace any earlier selection. Unreachable lights SHALL NOT be selectable. Opening another room or zone SHALL clear the selection.

#### Scenario: Select one light
- **WHEN** the user clicks the "Ceiling" card in the Kitchen
- **THEN** the "Ceiling" card is marked as selected and the inspector controls "Ceiling"

#### Scenario: Switch does not select
- **WHEN** the user clicks the switch on the "Ceiling" card
- **THEN** the light turns off and the selection does not change

#### Scenario: Unreachable light
- **WHEN** the user clicks the "Plug" card while the plug is unreachable
- **THEN** nothing is selected

#### Scenario: Another room
- **WHEN** "Ceiling" is selected and the user opens the Living room
- **THEN** no light is selected

### Requirement: Select several lights
Shift-click or Cmd/Ctrl-click on a light's card SHALL add the light to the selection or remove it. A "Select" button in the Lights header SHALL start a select mode in which a plain tap on a card adds or removes the light; "Done" SHALL end the mode and keep the selection. A selected card SHALL show one ring and no other selection mark.

#### Scenario: Add with Shift
- **WHEN** "Ceiling" is selected and the user Shift-clicks "Counter"
- **THEN** both lights are selected and the inspector says "2 lights"

#### Scenario: Remove with Cmd
- **WHEN** "Ceiling" and "Counter" are selected and the user Cmd-clicks "Counter"
- **THEN** only "Ceiling" is selected

#### Scenario: Select mode
- **WHEN** the user selects "Select" and taps "Ceiling" and "Counter"
- **THEN** both cards show the selection ring and both lights are selected

#### Scenario: One ring after Shift-click
- **WHEN** the user Shift-clicks "Counter"
- **THEN** the "Counter" card shows only its selection ring, without a separate focus ring inside the card

### Requirement: Control selected lights
While lights are selected, the inspector SHALL control them instead of the whole group: on/off, brightness, white, and color. White SHALL show when every selected light supports color temperature, and color when every selected light supports color. Each selected light SHALL receive its own command. "Back to room" SHALL clear the selection.

#### Scenario: Dim two lights
- **WHEN** "Ceiling" and "Counter" are selected and the user sets brightness to 40 %
- **THEN** the bridge receives a brightness command for "Ceiling" and one for "Counter"
- **AND** the Kitchen group receives no command

#### Scenario: Color only when all support it
- **WHEN** "Ceiling" (color) and "Counter" (white only) are selected
- **THEN** the inspector shows white controls and no color controls

#### Scenario: Back to room
- **WHEN** a light is selected and the user selects "Back to room"
- **THEN** no light is selected and the inspector controls the Kitchen

### Requirement: Start at the current light state
The inspector SHALL start at the current brightness, color temperature, or color of the selected light, and SHALL follow live changes to it. With several lights selected it SHALL start at the first selected light in name order.

#### Scenario: Light in white mode
- **WHEN** "Ceiling" is at 2700 K and the user selects it
- **THEN** the inspector shows the White tab at 2700 K

#### Scenario: Light in color mode
- **WHEN** "Lamp" shows a color and the user selects it
- **THEN** the inspector shows the Color tab at that color

### Requirement: Light presets
The inspector for selected lights SHALL offer brightness presets 10, 25, 50, and 100 % and, when white is shown, white presets Warm (2200 K), Soft (2700 K), Neutral (4000 K), and Daylight (6500 K). A white preset outside a light's range SHALL be clamped to the nearest temperature the light supports. A preset SHALL turn the lights on.

#### Scenario: Brightness preset
- **WHEN** "Ceiling" is selected and the user selects 25 %
- **THEN** the bridge receives a command turning "Ceiling" on at 25 % brightness

#### Scenario: White preset clamped
- **WHEN** "Counter" is selected, its warmest white is 454 mirek (about 2203 K), and the user selects Warm
- **THEN** the bridge receives a command setting "Counter" to 454 mirek
