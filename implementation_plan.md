# Implementation Plan - User Info UI Update

I will update the `UserInfo` page to match the provided design requirements.

## User Review Required
- **Mock Data**: Since the backend does not currently support Level, XP, Bio, Badges, or Social Links, I will use mock data for these fields to demonstrate the UI.
- **High Scores**: I will pull available high scores from `localStorage`.

## Proposed Changes

### `src/pages/UserInfo.tsx`

- **Layout**: Implement the proposed layout:
    - **Banner**: Cyberpunk-themed background image.
    - **Profile Header**: Avatar with neon border, Username, Level, Title, Bio, Social Links.
    - **Stats Section**: Rank, Total Games, High Scores (aggregated).
    - **Badges Section**: Grid of badges (mocked).
    - **History Section**: List of recent matches (mocked).
- **Styling**: Use Tailwind CSS with the existing color palette (Neon Blue, Pink, Green).

## Verification Plan

### Manual Verification
- **Visual Inspection**: Check if the page matches the description in the text file.
- **Data Display**: Verify that the username and email from the real user (localStorage) are displayed correctly.
- **High Scores**: Verify that high scores from `localStorage` are displayed in the Stats section.
