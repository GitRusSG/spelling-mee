# Spelling Mee — All Requirements

## Introduction

**Spelling Mee** is a mobile and web application for children in Singapore (grades K1–P6) and their parents, designed to help prepare for school spelling tests. A child hears a word and must spell it correctly by typing it, tapping letters on a keyboard, or speaking letters one by one using voice recognition. The app is deployed as both a React Native mobile app and a web app via GitHub Pages.

---

## Core App

### 1. Home Screen — Spelling Test List

As a User, I want to see all available Word Lists on the home screen so that I can quickly choose one and start a Spelling Test.

1. Display all available Word Lists (Built-in and Custom) on the home screen
2. Display the name and word count for each Word List
3. Display a button to create a new Custom List
4. Tapping a Word List opens the Spelling Test launch screen
5. Tapping create new list opens the Custom List creation screen

---

### 2. Built-in Word Lists

As a Parent, I want access to ready-made word lists aligned with the Singapore school curriculum.

1. Provide at least two Built-in Lists: "Top Schools" and "Grade 1 Minimum"
2. Display Built-in Lists separately from Custom Lists
3. Prevent deleting or modifying Built-in Lists
4. Show all words in a Built-in List before the test begins

---

### 3. Creating and Editing a Custom List

As a Parent, I want to create my own Word Lists for upcoming school spelling tests.

1. Prompt for a list name when creating a new Custom List
2. Allow adding words one at a time
3. Allow deleting individual words
4. Allow renaming a Custom List
5. Allow deleting an entire Custom List
6. Show error and prevent saving if no name is provided
7. Show error and prevent saving if no words are added
8. Persist Custom Lists locally on the device between sessions

---

### 4. Conducting a Spelling Test

As a Child, I want to hear a word and type its spelling so that I can practise.

1. Play the audio pronunciation of the first word when a test starts
2. Provide a text input field for typing the spelling
3. Replay audio when the repeat button is tapped
4. Compare answers case-insensitively
5. Show correct/incorrect feedback immediately and advance to the next word
6. Show the Result screen when all words are completed
7. Display progress (e.g., "Word 3 of 10")
8. Show error with retry option if audio is unavailable

---

### 5. Audio Pronunciation

As a Child, I want to hear the correct pronunciation of a word.

1. Play audio pronunciation using the Speaker (TTS)
2. Use standard British English accent as the default
3. Replay with no more than 500ms delay on repeat
4. Fall back to text-to-speech synthesis if audio file is unavailable

---

### 6. Letter-by-Letter Keyboard Mode

As a Child, I want to spell a word by tapping letters one by one.

1. Display alphabet letter buttons instead of text input when in letter mode
2. Display the entered letter sequence on screen as letters are tapped
3. Compare the letter sequence case-insensitively on submit
4. Allow deleting the last entered letter (backspace)

---

### 7. Spelling Test Results Screen

As a User, I want to see the outcome of a Spelling Test.

1. Display overall percentage of correct answers
2. Display all words with correct/incorrect labels
3. Show the correct spelling alongside incorrect answers
4. Provide a retake button
5. Provide a home button

---

### 8. Monetisation — Ads and Subscription

As a product owner, I want to monetise through advertising and subscriptions.

1. Display ad banners to users without an active subscription
2. Hide all ads when the user has an active subscription
3. Provide a subscription management screen with benefits and pricing
4. Process payments through platform in-app purchase (App Store / Google Play)
5. Show error and leave status unchanged if payment is declined

---

## User Accounts & Community

### 9. User Account Registration

As a Parent, I want to create an account to access authenticated features.

1. Provide a registration screen accessible from the home screen
2. Create account and authenticate on valid email + password submission
3. Require password to be at least 8 characters
4. Show error if email is already registered
5. Show validation error for invalid email format
6. Show validation error for password shorter than 8 characters
7. Navigate to authenticated home screen on successful registration

---

### 10. User Account Login and Logout

As a Parent, I want to log in to access my shared lists across devices.

1. Provide a login screen accessible from the home screen
2. Authenticate and navigate to home on valid credentials
3. Show error for incorrect credentials
4. Persist authentication session locally between app launches
5. Provide a logout option in account settings
6. Clear session and return to unauthenticated state on logout

---

### 11. Custom List Sharing Agreement

As a Parent, I want to understand that my lists will be shared with the community.

1. Display sharing notice when creating a list while authenticated
2. Require sharing agreement acceptance before saving
3. Cancel save and return to edit screen if agreement is declined
4. Store sharing agreement acceptance timestamp with each list
5. Publish the list to the Community Library on save

---

### 12. Community Library Browsing

As a Parent, I want to browse word lists created by other users.

1. Display Community Library section when authenticated
2. Show each shared list with name, word count, and creator display name
3. Show preview of all words when a shared list is tapped
4. Add list to user's available lists when "Use this list" is tapped
5. Prompt login/register if user is not authenticated

---

### 13. Account-Gated Custom List Creation

As a product owner, I want list creation to require an account.

1. Redirect unauthenticated users to login when they tap create list
2. Disable create button with explanatory message when not authenticated
3. Allow unauthenticated users to use Built-in and existing local lists
4. Migrate local Custom Lists to account on authentication with sharing agreement prompt

---

## Voice Settings

### 14. TTS Voice Selection

As a User, I want to choose from different TTS voices.

1. Provide a voice selection screen in app settings
2. Display available voices with accent, gender, and speed labels
3. Play a sample word when a voice is tapped
4. Save selection as the active Voice Profile on confirm
5. Use the active Voice Profile for all Spelling Tests
6. Provide at least three options: British English female, male, and slower rate
7. Default to British English female at normal speed if no profile is selected

---

### 15. TTS Voice Speed Adjustment

As a Parent, I want to adjust speaking speed for younger children.

1. Provide a speed slider (0.5x to 1.5x) on the voice selection screen
2. Play a sample word immediately when speed is adjusted
3. Persist speed as part of the active Voice Profile
4. Apply saved speed to all TTS playback during tests

---

### 16. Audio Source Priority

As a User, I want the app to use the best available audio source automatically.

1. Priority order: (1) TTS with active Voice Profile, (2) default TTS voice
2. Fall back to next source if the current one fails
3. Show error with retry option if all sources fail
4. Indicate which audio source is active on the test screen

---

## Voice Letter Dictation (Child speaks letters)

### 17. Speech Recognition Initialization

As a Child, I want the app to listen to my voice when I choose voice mode.

1. Request microphone permission when voice-letter mode is selected
2. Show kid-friendly message with retry button if permission is denied
3. Initialize and begin listening within 1 second of permission grant
4. Support both web (Web Speech API) and native mobile platforms
5. Hide voice-letter mode option if platform doesn't support speech recognition

---

### 18. Single Letter Recognition

As a Child, I want the app to understand which letter I'm saying.

1. Interpret speech and return exactly one uppercase letter (A–Z)
2. Normalize common variations (e.g., "ay" → A, "bee" → B, "see" → C, "double-u" → W)
3. Return "not recognized" status if speech doesn't map to a letter
4. Process each result within 500ms
5. Round-trip property: parsing spoken form → letter → spoken form produces equivalent mapping

---

### 19. Letter Confirmation Flow

As a Child, I want to see which letter the app heard and confirm or fix it.

1. Display recognized letter prominently with highlight animation
2. Provide "Confirm" and "Try Again" buttons
3. Append to letter sequence on confirm, resume listening
4. Discard and resume listening on "Try Again"
5. Pause listening while awaiting confirmation
6. Show confusion set alternatives if the letter belongs to one

---

### 20. Confusion Set Correction

As a Child, I want suggestions for similar-sounding letters.

1. Maintain confusion sets: {B, D, P}, {M, N}, {S, F}, {E, G, T, V}, {A, H, K}
2. Display alternatives as tappable buttons when recognized letter is in a set
3. Replace recognized letter with tapped alternative and append to sequence
4. Confusion set mapping is configurable without code changes

---

### 21. Letter Sequence Display and Editing

As a Child, I want to see all letters I've said and fix mistakes.

1. Display current letter sequence in large, clearly spaced format
2. Provide backspace to remove last letter
3. Update display immediately on backspace
4. Provide "Clear All" to reset sequence
5. Enable "Submit" button when sequence has at least one letter

---

### 22. Answer Submission (Voice Letter Mode)

As a Child, I want to submit my voice-spelled word.

1. Compare letter sequence (joined) against correct word case-insensitively
2. Stop listening on submit until next word is presented
3. Record answer with input mode `voice-letter` in session
4. Display same correct/incorrect feedback as other modes

---

### 23. Mode Selection Integration

As a User, I want to switch between text, letter-keyboard, and voice-letter modes.

1. Display mode selector with three options (text, letter keyboard, voice letter)
2. Show Voice_Letter_Input when voice mode is selected
3. Stop listening and release microphone when switching away from voice mode
4. Clear in-progress input when switching modes
5. Show only text and letter-keyboard options if speech recognition is unsupported

---

### 24. Visual and Audio Feedback (Voice Mode)

As a Child, I want clear visual cues showing when the app is listening.

1. Show animated microphone indicator while listening (pulsing/glowing)
2. Show "thinking" indicator when transitioning from listening to processing
3. Play confirmation sound or haptic on successful letter recognition
4. Show friendly retry prompt on recognition failure/timeout
5. Use same kid-friendly color palette as existing components

---

### 25. Platform Abstraction (Speech Recognition)

As a developer, I want a single interface for speech recognition on web and native.

1. Expose platform-agnostic interface: `start()`, `stop()`, `onResult()`, `onError()`, `isSupported()`
2. Use Web Speech API on web
3. Use compatible React Native speech recognition library on native
4. Configure for single-word/short-phrase mode in English
5. Normalize platform errors into standard error types

---

### 26. Accessibility (Voice Mode)

As a Child using assistive technology, I want voice input to be accessible.

1. Provide accessibility labels for all interactive elements
2. Announce recognized letters via accessibility live regions
3. Minimum touch target size of 48x48 points
4. Maintain WCAG AA color contrast for all text and interactive elements

---

## Gamification & Rewards

### 27. Confetti on Correct Answer

As a Child, I want to see a fun celebration when I get a word right so that spelling feels rewarding.

1. Show a confetti animation on screen when the child submits a correct answer
2. Confetti animation lasts 1–2 seconds and does not block interaction
3. Use colorful, kid-friendly confetti particles
4. No confetti on incorrect answers

---

### 28. Confetti on Test Completion

As a Child, I want a big celebration when I finish a test with a good score.

1. Show a large confetti burst on the results screen when score is 80% or above
2. Show a smaller encouragement animation (e.g., stars or sparkles) for scores below 80%
3. Display a congratulatory message alongside the confetti (e.g., "Amazing job! 🎉")
4. Display an encouraging message for lower scores (e.g., "Great effort! Keep practising! 💪")

---

### 29. Streak Counter

As a Child, I want to see how many words I've gotten right in a row so that I stay motivated.

1. Display a streak counter during the spelling test showing consecutive correct answers
2. Increment the streak on each correct answer
3. Reset the streak to zero on an incorrect answer
4. Show a special animation (e.g., fire emoji, glow effect) when streak reaches 3, 5, and 10
5. Persist the highest streak per test session and display it on the results screen

---

### 30. Star Rating per Test

As a Child, I want to earn stars based on my score so that I have a clear goal to aim for.

1. Award 1 star for 50–69% correct, 2 stars for 70–89%, 3 stars for 90–100%
2. Display stars with an animation on the results screen
3. Show empty/grey stars for unearned levels so the child sees what to aim for
4. Persist the best star rating per word list locally

---

### 31. Encouragement Messages

As a Child, I want positive feedback throughout the test so that I feel supported.

1. Show a random encouragement message after every 3rd correct answer (e.g., "You're on fire! 🔥", "Superstar! ⭐", "Keep going! 🚀")
2. Show a gentle encouragement after an incorrect answer (e.g., "Almost! You'll get it next time 😊")
3. Messages appear briefly (2 seconds) and fade out without blocking input
4. Use at least 5 different messages for variety
