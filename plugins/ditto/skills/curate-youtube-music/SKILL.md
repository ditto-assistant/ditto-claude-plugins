---
name: curate-youtube-music
description: Curate and play original YouTube Music playlists grounded in the user's Ditto memories and existing playlists, including genre exploration and requested queue replacement.
---

# Curate YouTube Music

Build a personal listening sequence, not merely a link to someone else's mix.
Use the requested genre, mood, duration, and discovery appetite as the brief.
If the user only requests a queue, a saved playlist is optional; if they request
an original playlist, create one and select its songs individually.

Use the bundled `ditto-memory` skill for this host's connection and memory workflow.
Music actions require a separately available music connector or supported computer/
browser controls; a Ditto memory connection alone cannot create playlists or play
audio. If those controls are absent, return the ordered selections and explain
the missing capability before attempting any music-account action.

Only create a playlist when requested. Queue, playback, shuffle, and autoplay
changes require the user's corresponding listening request; selecting tracks
alone does not authorize changing the current listening session.

## Learn the listener

Search Ditto memories for musical preferences, favorite artists, listening
history, and reactions to recommendations. Fetch the relevant full memories
before attributing a preference. Check authorship: subscribed graphs, another
person's music-production brief, and a friend's recommendation are not evidence
of the listener's taste unless the listener's own reaction supports it.

When authorized library access is available, inspect several existing playlists
in the intended YouTube Music account. If it is unavailable, use the verified
memories and current request without claiming to have inspected the library.
Sample actual saved songs and artists, keeping playlist suggestions separate.
Look for rhythmic complexity, harmony, texture, energy, tolerance for abrasion,
and recurring artists. Playlist titles alone are weak evidence. If memory is
sparse, say so briefly and use the library plus the current request.

Keep the latest brief controlling: IDM and its derivatives can include
braindance, glitch, jazz-electronica, experimental footwork, or breakcore when
the listener's taste supports them. Do not replace a requested electronic set
with unrelated prog or jazz simply because those appear in the library.

## Curate a sequence

Choose specific recordings, balancing recognizable anchors with discoveries.
Avoid substituting whole albums or another user's genre playlist. Shape an arc
with an inviting opener, purposeful transitions, contrasting intensity, and an
intentional ending. Ten to fourteen tracks can make a useful first set when no
length is given; adjust to the brief rather than enforcing a fixed count.

Verify each song's title, artist, version, and availability through live music
search. Prefer the official audio recording when available. Treat remixes,
live takes, fan uploads, and similarly named songs as distinct choices.

## Operate YouTube Music

Prefer an available purpose-built music connector. Otherwise use the supported
computer/browser controls and their current documentation. Discover the user's
existing app or tab and verify the intended account. On macOS, duplicate Chrome
PWA bundle identifiers can require choosing the observed full app path; do not
hard-code another user's account, path, playlist ID, or accessibility indices.

For native YouTube Music controls, these details were observed in practice:

- Replace search text with `setValue` when supported. Clicking the search box
  and typing, even after a selection shortcut, can append to the previous query.
  Verify the submitted query and matching result before saving.
- Re-read the UI after actions and derive fresh control identifiers. Search
  and navigation can initially return the old page; wait for the requested
  query or playlist to appear using the tool's documented state mechanism.
- The first **Save to playlist** action can open a playlist chooser. Subsequent
  saves may immediately target the most recently used playlist. Inspect the
  destination toast every time; use **Change** if it names the wrong playlist.
- When creating a playlist, explicitly select **Private** unless the user asks
  for another visibility. The creation dialog may default to Public. Use a
  descriptive title and a short musical description without private memory
  excerpts or personal conversation details.

Save songs in the intended listening order and verify the finished playlist's
actual contents, count, order, and visibility. After an uncertain save outcome,
inspect the playlist before retrying so a retry does not add duplicates.

## Queue and playback

Honor whether the user requested append, play-next, or replacement. An ordinary
request to queue music does not by itself mean clear the current queue.

When explicitly asked to clear the queue and play the new set from the top,
playing the finished playlist can replace the prior queue. Verify **Up next**
instead of assuming replacement occurred: it must identify the new playlist
and contain its tracks in order, with the previous queue absent. Use a dedicated
clear/replace control if the current interface appends instead.

Ensure shuffle is off for an intentionally sequenced set. For a request to
leave only the curated set queued, disable autoplay if it adds recommendations;
verify that those extra entries disappear and mention the change because it
may persist beyond this session. Otherwise preserve the user's autoplay choice.

Verify playback from track one using the actual title and artist, a Pause
control, and a progressing elapsed-time indicator. Opening a playlist or seeing
a Play button is not proof that audio started. If the user changes the app
during automation, refresh state before acting again.

Finish with the playlist link, track count or duration, what's playing, and a
brief explanation of the selection. Report queue replacement only if checked.
Stop once the requested state is verified; do not keep restarting the opener
or adding songs after completion.

## Ditto MCP plugin packaging

This skill ships in the Ditto plugin as shared curation instructions; it does
not add music playback tools to Ditto. Keep memory retrieval and
musical judgment independent of the playback adapter. Discover tools at runtime;
do not invent music endpoints, bundle credentials, or bake one listener's taste
into the distributable. If a required connector or computer-control capability
is unavailable, provide the ordered selections and name the missing execution
capability without claiming playlist creation or playback.
