# Spec Delta

## MODIFIED Requirements

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
