# Spec Delta

## ADDED Requirements

### Requirement: Group presets
The group controls SHALL offer brightness presets 10, 25, 50, and 100 % and, when the color temperature control is shown, white presets Warm (2200 K), Soft (2700 K), Neutral (4000 K), and Daylight (6500 K), clamped to the group's range. A preset SHALL send one group command and turn the group on.

#### Scenario: Brightness preset
- **WHEN** no light is selected and the user selects 50 % in the Kitchen inspector
- **THEN** the bridge receives one command turning the Kitchen group on at 50 % brightness

#### Scenario: White preset
- **WHEN** no light is selected and the user selects Neutral in the Kitchen inspector
- **THEN** the bridge receives one command setting the Kitchen group to 250 mirek (4000 K)
