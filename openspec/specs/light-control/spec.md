# light-control Specification

## Purpose

Lets the user see and control the single lights inside a room or zone, so one lamp can differ from the rest of the group.

## Requirements

### Requirement: Open a room or zone
Selecting a room or zone in the sidebar SHALL open its detail page at `/rooms/<id>` or `/zones/<id>`. The page SHALL show the group's name, how many of its lights are on and how many are unreachable, the group controls, its scenes, and every light in the group, sorted by name.

#### Scenario: Open the kitchen
- **WHEN** the user selects "Kitchen" in the sidebar
- **THEN** the Kitchen detail page opens and lists the Kitchen's lights

#### Scenario: Unreachable light in the header
- **WHEN** a room has 3 lights, 2 of them on and 1 unreachable
- **THEN** its page header says "2 of 3 lights on · 1 unreachable"

#### Scenario: Unknown group
- **WHEN** the user opens `/rooms/<id>` for an id the bridge does not know
- **THEN** the page says the room was not found and the sidebar still lists the other rooms

### Requirement: Light state
Each light on a detail page SHALL show as a card with its name, its product name when the bridge reports one, whether it is on, and its brightness in percent when it supports dimming. The card SHALL show a round indicator with a lightbulb icon in the light's current white or color while the light is on, and a muted indicator while it is off or unreachable.

#### Scenario: Dimmable light
- **WHEN** the "Ceiling" light is on at 70 %
- **THEN** its card shows it as on with brightness 70 %

#### Scenario: Light without dimming
- **WHEN** a light does not support dimming (for example a smart plug)
- **THEN** its card shows only the on/off switch

#### Scenario: Product name
- **WHEN** the bridge reports "Ceiling" as a "Hue Signe"
- **THEN** its card shows "Hue Signe" below the name

#### Scenario: Color indicator
- **WHEN** "Ceiling" is on and set to red
- **THEN** its indicator and bulb icon are red
- **AND** when "Ceiling" turns off, the indicator is muted

#### Scenario: Color follows live updates
- **WHEN** "Ceiling" is set to blue in the Hue app
- **THEN** its indicator turns blue without a reload

### Requirement: Control a single light
The system SHALL let the user switch a single light on or off and, if it supports dimming, set its brightness from 1 to 100 percent when the slider is released. The same optimistic update and error handling as for groups SHALL apply.

#### Scenario: Turn one light off
- **WHEN** the user switches off "Ceiling" in the Kitchen
- **THEN** the bridge receives a command for that light only
- **AND** the other Kitchen lights keep their state

#### Scenario: Unreachable light
- **WHEN** the bridge reports that a light is unreachable (for example powered off at the wall)
- **THEN** the light's row says it is unreachable and its controls are disabled

### Requirement: Limit light command rate
The system SHALL send at most one command per 100 ms to the same light. When the user changes a light faster, the system SHALL send only the latest value once the 100 ms have passed. Each light has its own limit.

#### Scenario: Quick changes
- **WHEN** the user changes the brightness of "Ceiling" three times within 100 ms
- **THEN** the bridge receives the first change at once and the last change after 100 ms
- **AND** the middle change is never sent

#### Scenario: Different lights
- **WHEN** the user changes "Ceiling" and "Counter" at the same time
- **THEN** the bridge receives both changes at once

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
