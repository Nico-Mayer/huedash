# Spec Delta

## Purpose

Defines how the brightness, white, hue, and saturation sliders look and move, so values are easy to set and changes from outside are easy to follow.

## ADDED Requirements

### Requirement: Large brightness and white sliders
The brightness and white sliders SHALL show as a thick bar filled from the start up to the value, at least 40 px high in the inspector and at least 24 px high on light cards. The hue and saturation sliders keep their current look.

#### Scenario: Inspector brightness
- **WHEN** the Kitchen inspector shows brightness 40 %
- **THEN** the brightness slider is at least 40 px high and filled to 40 % of its width

#### Scenario: Light card
- **WHEN** the "Ceiling" card shows brightness 70 %
- **THEN** its slider is at least 24 px high and filled to 70 % of its width

### Requirement: Value label while in use
The brightness and white sliders SHALL show the current value above the thumb, in percent for brightness and in kelvin for white, while the user drags, hovers over, or focuses the slider with the keyboard. The label SHALL hide when none of these apply.

#### Scenario: Dragging brightness
- **WHEN** the user drags the Kitchen brightness slider to 40 %
- **THEN** a label "40 %" shows above the thumb while dragging

#### Scenario: Keyboard focus
- **WHEN** the user focuses the white slider with the keyboard at 2700 K
- **THEN** a label "2700 K" shows above the thumb

#### Scenario: Not in use
- **WHEN** the pointer leaves the slider and it has no keyboard focus
- **THEN** no value label shows

### Requirement: Smooth movement on outside changes
When the value of a brightness, white, hue, or saturation slider changes from outside, for example through a scene, a preset, another tab, or the Hue app, the slider and its status text SHALL move to the new value over a short animation of at most 500 ms instead of jumping.

#### Scenario: Scene changes brightness
- **WHEN** the Kitchen is at 80 % and the user starts a scene that sets it to 30 %
- **THEN** the brightness slider moves from 80 % to 30 % within 500 ms, passing values in between
- **AND** the status text ends at "On, 30 %"

#### Scenario: Change from the Hue app
- **WHEN** "Ceiling" is selected and the Hue app sets it to 2200 K
- **THEN** the white slider moves to 2200 K within 500 ms

### Requirement: No animation for the user's own input
A slider SHALL follow the pointer or keyboard directly while the user changes it. After the user releases it, the slider SHALL stay at the released value when the bridge confirms that value. A slider SHALL show its value at once when a page or inspector first shows it.

#### Scenario: Release after dragging
- **WHEN** the user drags the Kitchen brightness from 80 % to 40 % and releases it
- **AND** the bridge then reports 40 %
- **THEN** the slider stays at 40 % and does not move back toward 80 %

#### Scenario: Live change while dragging
- **WHEN** the user drags the Kitchen brightness slider
- **AND** the bridge reports another brightness during the drag
- **THEN** the slider stays under the pointer

#### Scenario: Opening the inspector
- **WHEN** the user selects "Ceiling" at 70 %
- **THEN** the inspector brightness slider shows 70 % at once, without moving from another value

### Requirement: Reduced motion
When the browser asks for reduced motion, sliders SHALL jump to a new value from outside without animation.

#### Scenario: Reduced motion
- **WHEN** the browser prefers reduced motion
- **AND** a scene sets the Kitchen to 30 %
- **THEN** the brightness slider shows 30 % at once
