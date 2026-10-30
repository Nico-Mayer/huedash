# Spec Delta

## MODIFIED Requirements

### Requirement: Control dialog
The control dialog for a room, zone, or light SHALL open centered over the page on screens 768 px and wider, and as a bottom sheet on narrower screens. It SHALL show a value large at the top (white in kelvin while white is shown, otherwise brightness in percent), one large control below it, and a mode bar at the bottom. Closing the dialog SHALL keep the page's scroll position.

#### Scenario: Wide screen
- **WHEN** the user opens the "Ceiling" dialog on a screen 1440 px wide
- **THEN** the dialog shows centered over the page

#### Scenario: Phone
- **WHEN** the user taps the "Ceiling" card on a screen 390 px wide, scrolled to the lights
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** after closing it, the page keeps its scroll position

#### Scenario: White and color
- **WHEN** the Kitchen supports color temperature and color and the user opens its dialog
- **THEN** the dialog shows the brightness control and a mode bar with power, brightness, color, and white

#### Scenario: Value at the top
- **WHEN** the "Ceiling" dialog shows brightness at 70 % and the user selects white at 2700 K
- **THEN** the value at the top changes from "70 %" to "2700 K"

#### Scenario: Color shows brightness
- **WHEN** the "Lamp" dialog is at 70 % and the user selects color
- **THEN** the value at the top stays "70 %"

#### Scenario: Off light
- **WHEN** the "Ceiling" dialog is open and "Ceiling" is off
- **THEN** the value at the top says "Off"

## ADDED Requirements

### Requirement: Dialog mode bar
The control dialog SHALL show a mode bar with a power button and one button per supported mode: brightness, color, and white. The power button SHALL show and switch the on/off state. Selecting a mode SHALL show its control. The selected mode SHALL be marked for screen readers. A target without any mode SHALL show only the power button.

#### Scenario: Selecting a mode
- **WHEN** the Kitchen dialog is open and the user selects color
- **THEN** the color pad shows and the color button is marked as selected

#### Scenario: Power button
- **WHEN** the "Ceiling" dialog is open, "Ceiling" is on, and the user selects the power button
- **THEN** the bridge receives a command turning "Ceiling" off
- **AND** the power button shows off

#### Scenario: Plug
- **WHEN** the user opens the dialog of a reachable smart plug
- **THEN** the mode bar shows only the power button
