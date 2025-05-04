# Overview
This is a turn-based board game.

# Game rules
- The player puts a turret on the board and the turret will shoot a beam in a straight line.
- The beam direction is left, right, up, or down.
- The beam stops when it hits another turret.
- The beam throughs another beam.
- The beam cannot be shot in the direction in that the next is a wall or another turret.
- The turret cannot be placed on that it cannot shoot a beam.
- The turret cannot be placed on the non-empty cell.

# Specification

## index.html
- title: "Beam"
- Start buttons: init game by the size. There are the sizes: 2x2, 3x3, 4x4, 5x5.
- canvas: show board
- turn captions: show captions "Player 1" and "Player 2". The turn is shown by Blue background color.
- beam buttons: left, right, up, down button in a 3x3 table.
- message box: Show system message.

## main.js
Control game state and UI.

### State machine
There are the states as follows:
- start-game: the game is not stated
  - message = "Select a game size"(at first) or "Player X won!" or "The game was even"
  - if user clicks start button -> start the game with the size selected -> state = put-turret
- put-turret: Player should put a turret
  - message = "Click a cell to put a turret for Player X"
  - if user clicks a valid cell-> draw turret -> state = shoot-beam
- shoot-beam: Player should select a direction to shoot beam in
  - message = "Click a direction to shoot beam in"
  - if user clicks a valid beam button -> draw beam -> state = put-turret or start-game

### others
- enabled buttons shall be painted in Blue.
- disabled buttons shall be painted in White.

## game.js
- Game Object definition.

## style.css
- style sheet.

## index.md
- game description for players

## spec.md
- The specification of the site for the programmers.
