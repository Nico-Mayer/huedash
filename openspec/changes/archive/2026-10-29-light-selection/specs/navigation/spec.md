# Spec Delta

## MODIFIED Requirements

### Requirement: Inspector for the open group
Room and zone pages SHALL show an inspector. Without a selection it SHALL control the whole group (on/off, brightness, white, color); with selected lights it SHALL control those lights. On screens 1280 px and wider the inspector SHALL be a column on the right; on narrower screens the group controls SHALL be at the top of the page and selected lights SHALL be controlled in a bottom sheet. White and color SHALL be two tabs when both are available.

#### Scenario: Wide screen
- **WHEN** the Kitchen page is open on a screen 1440 px wide
- **THEN** the sidebar, the scenes and lights, and the inspector are side by side

#### Scenario: Tablet
- **WHEN** the Kitchen page is open on a screen 1024 px wide
- **THEN** the sidebar is visible and the inspector is above the scenes

#### Scenario: White and color
- **WHEN** the group supports color temperature and color
- **THEN** the inspector shows the White tab selected and a Color tab

#### Scenario: Select a light on a narrow screen
- **WHEN** the Kitchen page is open on a screen 1024 px wide, scrolled to the lights
- **AND** the user taps the "Ceiling" card
- **THEN** a bottom sheet opens with the controls for "Ceiling"
- **AND** the page keeps its scroll position

#### Scenario: Select mode on a narrow screen
- **WHEN** the user is in select mode on a screen 390 px wide and has selected two lights
- **THEN** a bar shows "Control 2 lights", and selecting it opens the bottom sheet

#### Scenario: Close the sheet
- **WHEN** the bottom sheet is open and the user closes it
- **THEN** the selection is cleared
