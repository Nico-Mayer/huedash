# Spec Delta

## MODIFIED Requirements

### Requirement: Large brightness and white sliders
The brightness and white sliders SHALL show as a thick bar filled from the start up to the value. In the room header they SHALL be horizontal and at least 40 px high, and on light cards horizontal and at least 24 px high. In the control dialog they SHALL be vertical, at least 240 px high and 80 px wide, and filled from the bottom.

#### Scenario: Header brightness
- **WHEN** the Kitchen header shows brightness 40 %
- **THEN** the brightness slider is at least 40 px high and filled to 40 % of its width

#### Scenario: Light card
- **WHEN** the "Ceiling" card shows brightness 70 %
- **THEN** its slider is at least 24 px high and filled to 70 % of its width

#### Scenario: Dialog brightness
- **WHEN** the dialog for "Ceiling" shows brightness 70 %
- **THEN** the brightness slider is vertical, at least 240 px high, and filled from the bottom to 70 % of its height

### Requirement: Value label while in use
The horizontal brightness and white sliders SHALL show the current value above the thumb, in percent for brightness and in kelvin for white, while the user drags, hovers over, or focuses the slider with the keyboard. The label SHALL hide when none of these apply. The vertical sliders in the control dialog SHALL NOT show this label, because the dialog shows the value above the control.

#### Scenario: Dragging brightness
- **WHEN** the user drags the Kitchen brightness slider to 40 %
- **THEN** a label "40 %" shows above the thumb while dragging

#### Scenario: Keyboard focus
- **WHEN** the user focuses the "Ceiling" card brightness slider with the keyboard at 70 %
- **THEN** a label "70 %" shows above the thumb

#### Scenario: Not in use
- **WHEN** the pointer leaves the slider and it has no keyboard focus
- **THEN** no value label shows

#### Scenario: Dialog slider
- **WHEN** the user drags the brightness slider in the dialog for "Ceiling"
- **THEN** no label shows next to the thumb
- **AND** the value at the top of the dialog follows the slider

### Requirement: Smooth movement on outside changes
When the value of a brightness slider, a white slider, or the color pad changes from outside, for example through a scene, another tab, or the Hue app, the control and its status text SHALL move to the new value over a short animation of at most 500 ms instead of jumping.

#### Scenario: Scene changes brightness
- **WHEN** the Kitchen is at 80 % and the user starts a scene that sets it to 30 %
- **THEN** the brightness slider moves from 80 % to 30 % within 500 ms, passing values in between
- **AND** the brightness value in the Kitchen header ends at "30 %"

#### Scenario: Change from the Hue app
- **WHEN** the dialog for "Ceiling" shows white and the Hue app sets it to 2200 K
- **THEN** the white slider moves to 2200 K within 500 ms

### Requirement: No animation for the user's own input
A slider or the color pad SHALL follow the pointer or keyboard directly while the user changes it. After the user releases it, it SHALL stay at the released value when the bridge confirms that value. A slider or the color pad SHALL show its value at once when a page or dialog first shows it.

#### Scenario: Release after dragging
- **WHEN** the user drags the Kitchen brightness from 80 % to 40 % and releases it
- **AND** the bridge then reports 40 %
- **THEN** the slider stays at 40 % and does not move back toward 80 %

#### Scenario: Live change while dragging
- **WHEN** the user drags the Kitchen brightness slider
- **AND** the bridge reports another brightness during the drag
- **THEN** the slider stays under the pointer

#### Scenario: Opening the dialog
- **WHEN** the user opens the dialog for "Ceiling" at 70 %
- **THEN** the dialog brightness slider shows 70 % at once, without moving from another value

## ADDED Requirements

### Requirement: Brightness slider shows the light color
A brightness slider SHALL fill with the current color of its light and show the rest of its track in the same color, faded. A room or zone slider SHALL use one fixed warm light color. A slider whose light or group is off SHALL use a muted, neutral fill.

#### Scenario: Red light
- **WHEN** "Ceiling" is on and set to red
- **THEN** its brightness slider fill is red and its track is faded red

#### Scenario: Room
- **WHEN** the Kitchen is on
- **THEN** the Kitchen header brightness slider uses the warm light color, whatever colors its lights have

#### Scenario: Light off
- **WHEN** "Ceiling" is off
- **THEN** its brightness slider fill is muted and has no color

#### Scenario: Color follows live updates
- **WHEN** "Ceiling" is set to blue in the Hue app
- **THEN** its brightness slider fill turns blue without a reload

### Requirement: White slider shows the white range
A white slider SHALL show a gradient from its warmest to its coolest supported white along the track, with the warm end at the start.

#### Scenario: Ceiling range
- **WHEN** the dialog for "Ceiling" shows white
- **THEN** the white slider runs from a warm orange at 2000 K to a cool white at 6536 K

### Requirement: Visible thumb
The thumb of a brightness or white slider SHALL keep a contrast of at least 3:1 against the fill or gradient behind it, in light and dark mode, for any light color.

#### Scenario: Pale fill
- **WHEN** "Ceiling" is at 6500 K and its brightness slider fill is near white
- **THEN** the thumb is still clearly visible against the fill

### Requirement: Color pad
The color control SHALL be one pad that sets hue and saturation together: hue changes along one axis and saturation along the other, and the pad shows the colors it offers. A marker SHALL show the current color. Releasing the pointer SHALL send the color once.

#### Scenario: Pick a color
- **WHEN** the user drags the marker on the "Lamp" color pad to red at full saturation and releases it
- **THEN** the bridge receives one color command for "Lamp" whose xy value matches sRGB red

#### Scenario: Start at the current color
- **WHEN** "Lamp" shows blue and the user opens its color mode
- **THEN** the marker is at blue

#### Scenario: Group without a reported color
- **WHEN** the user opens the color mode of the Kitchen dialog
- **THEN** the marker starts at white, with no saturation

### Requirement: Color pad keyboard use
The color pad SHALL be usable with the keyboard: the left and right arrow keys change hue, the up and down arrow keys change saturation, and it SHALL announce the current hue and saturation to screen readers. A key press SHALL send the new color.

#### Scenario: Arrow keys
- **WHEN** the "Lamp" color pad has focus and the user presses the right arrow key
- **THEN** the hue changes and the bridge receives a color command for "Lamp"

#### Scenario: Screen reader
- **WHEN** a screen reader focuses the "Lamp" color pad at hue 30 and 70 % saturation
- **THEN** it announces the hue and "70 % saturation"
