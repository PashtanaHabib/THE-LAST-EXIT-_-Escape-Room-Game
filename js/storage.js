// storage.js — save / load the game with LocalStorage

//    Public API:
//      saveGame()            save the global gameState
//      loadGame()            load it back (returns state or null)
//      newGame(name)         create + save a fresh game
//      hasSavedGame()        true if a game in progress exists
//      clearGame()           delete the saved game
//      saveRecord()          add the finished (won) game to the records
    //  getRecords()          top 5 records (best first)