import React, { useState } from "react";

function JoinPage({ joinGame, createGame, cont }) {
  let [gameID, setGameID] = useState(""),
    [gameIDError, setGameIDError] = useState({ error: false, msg: "" });

  let handleJoinGame = (e) => {
    e.preventDefault();
    joinGame(gameID, (callbackData) => {
      if (callbackData.sucess) {
        console.log('success?')
        // this.setState({ appState: "join" });
        cont();
      } else {
        setGameIDError({ error: true, msg: callbackData.errorMsg });
      }
    });
  };

  return (
    <div className="prism-bg object-cover h-screen w-screen absolute flex items-center justify-center">
      <div className="max-w-sm bg-gray-100 mx-4 p-6 shadow-lg rounded-md">
        <h1 className="font-hairline mb-2 text-4xl">Multiplayer Trivia</h1>
        <form className="w-full mb-4">
          <label htmlFor="gameID" className="block font-bold mx-2">
            Join a game:
          </label>
          <input
            className={
              "p-2 shadow rounded-l text-sm " +
              (gameIDError.error ? " border-2 border-red-800" : "")
            }
            id="gameID"
            name="gameID"
            placeholder="game code"
            value={gameID}
            onChange={(e) => setGameID(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="bg-purple-800 hover:bg-purple-700 text-white uppercase shadow py-2 px-4 pr-10 tracking-wide text-sm rounded-r"
            onClick={handleJoinGame}
          >
            join
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="user-group w-6 h-6 pl-1 pb-1 absolute inline"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </button>
          {gameIDError.error && (
            <div className="rounded border-red-800 border-l-4 bg-red-200 p-2 my-2 flex items-center text-red-800 text-sm leading-tight">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="exclamation w-8 h-8 inline pr-2 flex-initial"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">{gameIDError.msg}</span>
            </div>
          )}
        </form>
        <hr className="my-2" />
        <div className="font-bold mx-2">Start a game:</div>
        <button
          className="w-full bg-teal-600 hover:bg-teal-500 text-white uppercase shadow py-2 px-4 tracking-wide rounded text-sm"
          onClick={createGame}
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="plus-circle w-6 h-6 pr-1 inline"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
          create new game
        </button>
      </div>
    </div>
  );
}

export default JoinPage;
