# devDex ꕤ flashcards TUI

### *hey dev... how's it been?*

*no no, not your code, work, or side projects. how have YOU been.*

### *how long has it really been since you tended to:*

*༝ that language you've always wanted to learn*

*༝ the scriptures you can never seem to memorize*

*༝ those niche interests that just never get your time*

### *i get you with the grind but... there's more to life than that LLM* 😭✌️

<br>

##  devDex is a terminal-based UI that lets you memorize, recall & learn all without leaving your favourite text editor.

[![devDex demo](https://img.youtube.com/vi/If2QzkVFCLk/maxresdefault.jpg)](https://youtu.be/If2QzkVFCLk)


<br>

## Motive

- **claude thinking time:** why scroll when you can flip?

- **no resistance.** imagine: 2 min coding break, 2 mins closer to mastering something.

- **minimalist.** no GUI to see 'round here!

<br>


## Features: current


- **make decks and cards** with a few keystrokes

- tells you what to review with the **spaced repetition** algorithm

- **cloud-synced storage** keeps your cards in your pocket, wherever you go 

    (assuming you have a terminal in your pocket, of course.)


<br>


## Features: V2 (aka stuff i want)

- built-in **note-taker** lets you take a brain dump break alongside the cards
 
- **quick-action hotkeys**, like *q* to exit, to make UX smoother and your life easier

- more flexibility with **deck sections** for organization and **cards with text input** to enhance muscle memory

<br>

## How SM-2 (spaced repetition) works

devDex cards have a property called `ease_factor`.

After reviewing a card, you provide it a rating: **again**, **hard**, **good**, or **easy**.


Each rating maps to a different behaviour:
- **again** = interval resets, you see it again tomorrow.

- **hard / good / easy** = interval grows `1 day / 6 days / interval × ease`, where `ease` (starting at 2.5) gets updated based on the rating you gave.


In short, this algorithm feeds you the cards you keep forgetting more often, and holds off on the ones you've got down pat.

Like a **personal tutor** keeping track of how you've been performing.


<br>

## Try it, run it 🏃‍♂️

```bash
git clone https://github.com/wrufay/devdex.git
cd devdex
npm install
npm link
devdex
```

Run devDex by typing `devdex` into your terminal from any directory.

<br>

## Guide

| where               | keys                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| **everywhere**      | arrow keys + `enter` to navigate · `ctrl-c` to quit                                   |
| **decks**           | `enter` open · `n` new deck · `e` rename · `d` delete (twice to confirm) · `esc` back |
| **inside a deck**   | `n` new card · `e` edit · `r` review · `d` delete card · `esc` back                   |
| **new / edit card** | type the front, `enter`, type the back, `enter` to save · `esc` cancels               |
| **review**          | `space` / `enter` to flip · then rate: `1` again · `2` hard · `3` good · `4` easy     |

<br>

## Built with

- Node.js
- [neo-blessed](https://github.com/embarklabs/neo-blessed)
- Supabase
- GitHub OAuth

<br>

## Got questions or suggestions?

Tell me now. f26wu@uwaterloo[dot]ca
