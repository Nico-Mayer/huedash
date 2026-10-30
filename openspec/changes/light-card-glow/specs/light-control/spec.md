# Spec Delta

## ADDED Requirements

### Requirement: Default white for dim-only lights
A light that supports dimming but reports no white or color SHALL show its indicator in a default warm white while it is on. A light without dimming SHALL keep a muted indicator.

#### Scenario: Dim-only light
- **WHEN** a "Hue White" bulb that supports only dimming is on
- **THEN** its indicator shows the default warm white

#### Scenario: Light without dimming
- **WHEN** "Plug" is on and does not support dimming
- **THEN** its indicator stays muted

### Requirement: Light card glow
While a light is on, reachable, and shows a white or color in its indicator, its card SHALL show a faint glow in that color, coming from the indicator. When the pointer is over the card or the card has keyboard focus, the glow SHALL fill the whole card with a light tint. The glow SHALL be visible in light and dark mode. A light whose indicator is muted SHALL show no glow.

#### Scenario: Glow at rest
- **WHEN** "Ceiling" is on and set to red
- **THEN** its card shows a faint red glow near the indicator

#### Scenario: Glow fills the card on hover
- **WHEN** "Ceiling" is on and the pointer moves over its card
- **THEN** the glow fills the whole card
- **AND** when the pointer leaves, the glow returns to its resting size

#### Scenario: Glow fills the card on keyboard focus
- **WHEN** "Ceiling" is on and the user tabs to its card
- **THEN** the glow fills the whole card

#### Scenario: No glow when off or unreachable
- **WHEN** "Ceiling" turns off, or the bridge reports it as unreachable
- **THEN** its card shows no glow, also on hover

#### Scenario: Dim-only light glows warm white
- **WHEN** a "Hue White" bulb that supports only dimming is on
- **THEN** its card glows in the default warm white

#### Scenario: No glow without dimming
- **WHEN** "Plug" is on and does not support dimming
- **THEN** its card shows no glow

#### Scenario: Glow follows live updates
- **WHEN** "Ceiling" is set to blue in the Hue app
- **THEN** its card glow turns blue without a reload

#### Scenario: Reduced motion
- **WHEN** the browser prefers reduced motion
- **THEN** the glow changes size and color without a transition
