# Spec Delta

## Purpose

Lets each device show huedash in light or dark mode, following the system theme by default or a theme the user picks.

## ADDED Requirements

### Requirement: Follow the system theme by default
When the user has not picked a theme on this device, the system SHALL render in dark mode if the browser prefers a dark color scheme and in light mode otherwise. It SHALL switch modes when the system preference changes, without a reload.

#### Scenario: System prefers dark
- **WHEN** the browser prefers a dark color scheme
- **AND** no theme is stored on this device
- **THEN** every page renders in dark mode

#### Scenario: System prefers light
- **WHEN** the browser prefers a light color scheme
- **AND** no theme is stored on this device
- **THEN** every page renders in light mode

#### Scenario: System preference changes
- **WHEN** the theme is System
- **AND** the system preference changes from light to dark while a page is open
- **THEN** the page switches to dark mode without a reload

### Requirement: Pick a theme in settings
The settings page SHALL show an Appearance section with three choices: Light, Dark, and System. The current choice SHALL be selected. Picking a choice SHALL apply it right away on the open page.

#### Scenario: Default choice
- **WHEN** no theme is stored on this device
- **THEN** the settings page shows System as selected

#### Scenario: Pick dark
- **WHEN** the browser prefers a light color scheme
- **AND** the user picks Dark on the settings page
- **THEN** the page switches to dark mode right away

#### Scenario: Back to system
- **WHEN** the theme is Dark
- **AND** the browser prefers a light color scheme
- **AND** the user picks System
- **THEN** the page switches to light mode

### Requirement: Remember the theme per device
The system SHALL store the picked theme in the browser of this device only, not on the server. The stored theme SHALL apply on every page and after a reload.

#### Scenario: Theme survives reload
- **WHEN** the user picks Light while the browser prefers a dark color scheme
- **AND** reloads the page
- **THEN** the page renders in light mode
- **AND** the settings page shows Light as selected

#### Scenario: Other devices unaffected
- **WHEN** the user picks Dark on one device
- **THEN** another device with no stored theme still follows its system theme

### Requirement: No flash of the wrong theme
The system SHALL apply the resolved theme before the first paint, so a page never shows the other theme while it loads.

#### Scenario: Dark page load
- **WHEN** the resolved theme is dark
- **AND** a page loads
- **THEN** the document has dark mode applied before the page content renders
