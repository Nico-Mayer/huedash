# Spec Delta

## MODIFIED Requirements

### Requirement: Show on/off and brightness changes in place
When the bridge reports a new on/off state or brightness for a light, room, or zone, or a new color temperature or color for a light, every open page that shows it SHALL update within one second, without reloading the page.

#### Scenario: Change in the Hue app
- **WHEN** the user turns the Kitchen off in the Hue app
- **THEN** the Kitchen switch in huedash shows off without a reload

#### Scenario: Change in another tab
- **WHEN** the user dims the Kitchen in one huedash tab
- **THEN** another open huedash tab shows the new Kitchen brightness

#### Scenario: Light color changes
- **WHEN** "Ceiling" is selected and the user sets it to red in the Hue app
- **THEN** the inspector shows the Color tab at red without a reload
