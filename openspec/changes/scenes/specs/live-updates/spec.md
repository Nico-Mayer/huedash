# Spec Delta

## ADDED Requirements

### Requirement: Show scene status changes in place
When the bridge reports that a scene became active, started playing dynamically, or became inactive, every open page that shows the scene or its room or zone SHALL update within one second, without reloading.

#### Scenario: Scene started in the Hue app
- **WHEN** the user starts "Relax" for the Kitchen in the Hue app
- **THEN** open huedash pages mark "Relax" as active without a reload

#### Scenario: Scene ends after a light change
- **WHEN** the bridge reports "Relax" as inactive
- **THEN** open pages no longer mark it as active
