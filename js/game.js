// game.js — room + game state management
// Public API (other files):
// requireGame()            load the save; redirect if there is none
// isSolved(puzzleId)       true if the puzzle was solved
// completeRoom(roomId)     +150, unlock next room
// finishGame(won)          end the game (won / lost) and go to result
// initGamePage()           start the game.html page

var currentRoom = null;
var modalOnClose = null;
var puzzleState = null; 
 // temporary UI state of the open puzzle