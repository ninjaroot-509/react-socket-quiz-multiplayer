import React, { useState } from "react";

function Radio({ displayName, value, target, setTarget }) {
  return (
    <label className="block">
      <input
        type="radio"
        name="difficulty"
        value={value}
        onChange={() => setTarget(value)}
        checked={target === value}
      />
      <span className="ml-2">{displayName}</span>
    </label>
  );
}

export function InitPage({
  gameID,
  players,
  messages,
  numberJoiners,
  isGameCreator,
  categories,
  submitName,
  submitMessage,
  startGame,
  emitJoining,
}) {
  let [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [category, setCategory] = useState("-1"),
    [difficulty, setDifficulty] = useState("-1"),
    [numberQuestions, setNumberQuestions] = useState(10),
    [startError, setStartError] = useState({
      err: false,
      msg: "",
    }),
    [nameSubmitted, setNameSubmitted] = useState(false);
  console.log(
    `numJoiners is ${numberJoiners}, nameSubmitted is ${nameSubmitted}`
  );

  let handleSubmitName = (e) => {
    e.preventDefault();
    if (!nameSubmitted) {
      // the player is submitting name for the first time
      emitJoining();
    }
    setNameSubmitted(true);
    submitName(gameID, name);
  };

  let handleMessage = (e) => {
    e.preventDefault();
    submitMessage(gameID, message);
    setMessage("");
  };

  let handleStartGame = (e) => {
    e.preventDefault();
    // console.log(`name submitted is ${nameSubmitted}`);
    // if (!nameSubmitted) {
    //   setStartError({
    //     error: true,
    //     msg: "Please submit a name for yourself before starting the game.",
    //   });
    //   return;
    // }
    const nQ = +numberQuestions;
    if (isNaN(nQ)) {
      setStartError({
        error: true,
        msg: "Please enter a number in the Number of Questions field.",
      });
      return;
    }
    if (nQ < 1 || nQ > 50) {
      setStartError({
        error: true,
        msg: "Please enter a number of questions that is between 1 and 50.",
      });
      return;
    }
    startGame({ gameID, category, difficulty, numberQuestions });
  };

  return (
    <div className="bg-gray-100 w-screen h-screen absolute overflow-scroll">
      <div className="max-w-md mx-auto px-2 py-1">
        <div className="text-sm uppercase tracking-wide text-gray-700 w-max-content mx-auto">
          your game code:
        </div>
        <span className="block uppercase tracking-wider text-xl font-mono px-3 py-1 rounded border-gray-700 border-2 bg-white shadow text-gray-800 font-hairline mx-auto w-min-content">
          {gameID}
        </span>
        <button
          type="submit"
          className="block mx-auto bg-teal-700 hover:bg-teal-600 text-white uppercase shadow py-2 px-4 tracking-wide text-sm rounded mt-4"
          onClick={handleStartGame}
        >
          start game
        </button>

        <div className="text-gray-600 italic text-xs leading-none text-center mt-2 mb-4">
          share this code with friends who want to join the game
        </div>

        <div className="w-max-content mx-auto">
          <form>
            <input
              className="p-2 shadow rounded-l text-sm"
              name="playerName"
              onChange={(e) => setName(e.target.value)}
              value={name}
              placeholder="your name"
            />
            <button
              type="submit"
              className="bg-purple-800 hover:bg-purple-700 text-white uppercase shadow py-2 px-4 tracking-wider text-sm rounded-r"
              onClick={handleSubmitName}
            >
              submit
            </button>
          </form>
        </div>

        <h2 className="uppercase tracking-wide text-sm text-gray-700 mb-2 mt-4">
          Players:
        </h2>
        {players && (
          <ul>
            {players.map((pl) => {
              return (
                <li key={pl.id}>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="user w-8 h-8 inline pr-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {pl.name} - {pl.active ? "active" : "inactive"}
                </li>
              );
            })}
          </ul>
        )}
        {!players && numberJoiners - (nameSubmitted ? 0 : 1) === 0 && (
          <p className="px-3 py-1 mx-4 bg-gray-200 italic border-l-4 border-gray-800 rounded w-max-content">
            Nobody has joined the game.
          </p>
        )}
        {numberJoiners - (nameSubmitted ? 0 : 1) > 0 && (
          <ul>
            <li className="animate-pulse">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="user w-8 h-8 inline pr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="italic gray-600 text-sm">
                someone is joining...
              </span>
            </li>
          </ul>
        )}

        {isGameCreator && (
          <form>
            <h2 className="uppercase tracking-wide text-sm text-gray-700 mb-2 mt-4">
              Select a category:
            </h2>
            {categories && (
              <select
                className="p-2 rounded shadow max-w-full"
                name="selectedCategory"
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="-1">Any category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <h2 className="uppercase tracking-wide text-sm text-gray-700 mb-2 mt-4">
              Select difficulty:
            </h2>
            <Radio
              className="mb-2"
              name="difficulty"
              value="-1"
              displayName="Any difficulty"
              target={difficulty}
              setTarget={setDifficulty}
            />
            <Radio
              name="difficulty"
              value="easy"
              displayName="Easy"
              target={difficulty}
              setTarget={setDifficulty}
            />
            <Radio
              name="difficulty"
              value="medium"
              displayName="Medium"
              target={difficulty}
              setTarget={setDifficulty}
            />
            <Radio
              name="difficulty"
              value="hard"
              displayName="Hard"
              target={difficulty}
              setTarget={setDifficulty}
            />

            <h2 className="uppercase tracking-wide text-sm text-gray-700 mb-2 mt-4">
              Number of questions:
            </h2>
            <input
              className="p-2 rounded shadow"
              type="number"
              value={numberQuestions}
              name="numberQuestions"
              inputMode="numeric"
              onChange={(e) => setNumberQuestions(e.target.value)}
            ></input>
            {startError.error && (
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
                <span className="flex-1">{startError.msg}</span>
              </div>
            )}
          </form>
        )}
        <br />
        <br />

        <div className="max-w-sm bg-gray-100 mx-4 p-6 shadow-lg rounded-md">
          <div className="message-container">
            {messages?.map((msg) => {
              return (
                <div key={msg.id} className="message">
                  <div className="message-header">
                    <div className="message-header-name">{msg.name}</div>
                    <div className="message-header-time">{msg.date}</div>
                  </div>
                  <div className="message-body">{msg.message}</div>
                  <hr />
                </div>
              );
            })}
          </div>
          <br />
          <br />
          <br />
          <br />
          <form className="w-full mb-4">
            <input
              className={"p-2 shadow rounded-l text-sm"}
              id="message"
              name="message"
              placeholder="enter your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="bg-purple-800 hover:bg-purple-700 text-white uppercase shadow py-2 px-4 pr-10 tracking-wide text-sm rounded-r"
              onClick={handleMessage}
            >
              send
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="user-group w-6 h-6 pl-1 pb-1 absolute inline"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </button>
          </form>
        </div>
        <br />
        <br />
        <br />
        <br />
      </div>
    </div>
  );
}

export default InitPage;
