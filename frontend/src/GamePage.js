import React from "react";

function GamePage({
  currentQuestion,
  correctAnswer,
  numberQuestions,
  questionCountdown,
  gameOver,
  players,
  updatedIndex,
  userAnswer,
  setUserAnswer,
}) {
  return (
    <div className="bg-gray-100 w-screen h-screen absolute">
      {currentQuestion && (
        <div className="absolute w-full uppercase bg-purple-900 text-gray-300 text-xs tracking-wider shadow">
          <div className="max-w-sm mx-auto px-2 py-1">
            question {currentQuestion.index + 1} of {numberQuestions}
          </div>
        </div>
      )}

      <div className="max-w-sm mx-auto my-8 p-2">
        <div
          className={
            typeof correctAnswer === "number"
              ? "hidden"
              : "fixed bottom-0 right-0 lg:absolute lg:-ml-16 lg:-mt-1 lg:bottom-auto lg:right-auto font-black text-2xl h-12 w-12 m-4 rounded-full bg-teal-700 text-gray-100 shadow"
          }
        >
          <div className="mx-auto min-w-0 pt-1 w-min-content">
            {questionCountdown}
          </div>
        </div>

        {currentQuestion && (
          <div>
            <p>{currentQuestion.question}</p>
            <form>
              {currentQuestion.answers.map((a, idx) => (
                <label
                  key={idx}
                  className={
                    "transition relative block bg-white py-2 px-4 border-solid rounded my-2 box-border border-2 cursor-pointer " +
                    (userAnswer === idx
                      ? "shadow-xl z-40 border-l-8 "
                      : "shadow z-20 ") +
                    (typeof correctAnswer === "number"
                      ? correctAnswer === idx
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-800")
                  }
                >
                  <input
                    className="hidden"
                    type="radio"
                    name="userAnswer"
                    value={idx}
                    onChange={() => setUserAnswer(idx)}
                    checked={userAnswer === idx}
                    disabled={typeof correctAnswer === "number"}
                  />
                  {typeof correctAnswer === "number" && correctAnswer !== idx && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="x w-6 h-6 inline text-red-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {correctAnswer === idx && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="check w-6 h-6 inline text-green-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="pl-2">{a}</span>
                </label>
              ))}
            </form>
            <hr className="my-1" />
          </div>
        )}
        {gameOver && <h1 className="text-3xl mx-2 font-black">Game over</h1>}
        {players && (
          <ul>
            <h2 className="uppercase tracking-wide text-sm m-1 text-gray-700">
              Leaderboard:
            </h2>
            {players.map((pl) => {
              const width =
                updatedIndex === 0 ? 0 : (pl.score / updatedIndex) * 100;
              return (
                <li
                  key={pl.id}
                  className="bg-pink-300 overflow-hidden relative rounded shadow mb-2"
                >
                  <span
                    className="bg-pink-600 pl-2 py-1 whitespace-no-wrap inline-block text-white font-bold"
                    style={{ width: width + "%" }}
                  >
                    {pl.name}
                  </span>
                  <span className="py-1 pr-2 text-white right-0 absolute">
                    {pl.score} / {updatedIndex}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default GamePage;
