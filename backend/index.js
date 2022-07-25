const express = require("express"),
  socket = require("socket.io"),
  axios = require("axios"),
  Hashids = require("hashids/cjs"),
  he = require("he");
const { response } = require("express");

const PORT = process.env.PORT || 4000;
const DOMAIN = "http://localhost:3000";

let app = express(),
  server = app.listen(PORT, () => console.log(`listening on port ${PORT}`)),
  io = socket(server, {
    rememberTransport: false,
    reconnect: true,
    "reconnection delay": 500,
    "max reconnection attempts": 10,
    secure: true,
  }),
  hashids = new Hashids("get stupid", 8, "0123456789ABCDEFGHIJKLMNPQRSTUVWXY"),
  activeGames = {};
const selectInterval = 10000,
  displayInterval = 3500,
  countdownLength = 5;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/categories", (_, res) => {
  axios.get("https://opentdb.com/api_category.php").then((response) => {
    res.send(
      response.data.trivia_categories.sort((a, b) => (a.name > b.name ? 1 : -1))
    );
  });
});

io.of("/games").on("connection", function (socket) {
  console.log(`made connection, ID: ${socket.id}`);
  socket.on("disconnect", () => disconnectUser(socket));
  socket.on("start game", startGame);
  socket.on("create new game", (_, callback) =>
    createNewGame(socket, callback)
  );
  socket.on("join game", (gameID, callback) =>
    joinGame(gameID, socket, callback)
  );
  socket.on("validate answer", (answerInfo, callback) =>
    validateAnswer(socket.id, answerInfo, callback)
  );
  socket.on("submit name", (data) => handleSubmitName(data, socket));
  socket.on("joining", handleJoining);
  socket.on("new-message", (data) => handleMessage(data, socket));
});

var disconnectUser = (socket) => {
  const gameID = socket.gameID;
  if (gameID) {
    const user = activeGames[gameID]?.players?.find(
      (i) => i.socketId == socket.id
    );
    var handleChage = activeGames[gameID].players?.map((obj) => {
      if (obj?.userId == user?.userId) {
        return { ...obj, active: false };
      } else {
        return { ...obj };
      }
    });
    activeGames[gameID].players = handleChage;
    emitPlayers(gameID);
    // console.log(user.name, " disconected", handleChage);
  }
};

let emitPlayers = (gameNum) => {
  const players = activeGames[gameNum].players;
  io.in(gameNum).emit(
    "players",
    Object.keys(players).length > 0
      ? Object.entries(players).map(([id, pl]) => {
          return { ...pl, id: id };
        })
      : undefined
  );
};

let emitMessages = (gameNum) => {
  const messages = activeGames[gameNum].messages;
  io.in(gameNum).emit(
    "messages",
    Object.keys(messages).length > 0
      ? Object.entries(messages).map(([id, pl]) => {
          return { ...pl, id: id };
        })
      : undefined
  );
};

var handleMessage = ({ gameID, message }, socket) => {
  const gameNum = decode(gameID);
  const user = activeGames[gameNum]?.players?.find(
    (i) => i.socketId == socket.id
  );
  data = {
    userId: user.userId,
    name: user.name,
    message: message,
    date: new Date(),
  };
  activeGames[gameNum].messages.push(data);
  emitMessages(gameNum);
  // console.log(activeGames[gameNum].messages)
};

var handleJoining = ({ numInc, gameID }) => {
  const gameNum = decode(gameID);
  activeGames[gameNum].numJoiners += numInc;
  io.in(gameNum).emit("joining", activeGames[gameNum].numJoiners);
  emitPlayers(gameNum);
};

var validateAnswer = (socketID, { answer, questionNum, gameID }, callback) => {
  console.log(
    "VALIDATE SNAWER   " + JSON.stringify({ answer, questionNum, gameID })
  );
  const gameNum = decode(gameID);
  const correctAnsIdx =
    activeGames[gameNum].questions[questionNum].correctAnswerIndex;
  callback({
    isCorrect: correctAnsIdx === +answer,
    correctAnswer: correctAnsIdx,
  });
  if (correctAnsIdx === +answer) {
    var user = activeGames[gameNum].players?.find((i) => i.userId == 1);
    var handleChageName = activeGames[gameNum].players?.map((obj) => {
      if (obj?.userId == user.userId) {
        return { ...obj, score: obj.score + 1 };
      }
    });
    activeGames[gameNum].players = handleChageName;
  }
  emitPlayers(gameNum);
};

var handleSubmitName = ({ gameID, playerName }, socket) => {
  const gameNum = decode(gameID);
  var user = activeGames[gameNum].players?.find((i) => i.userId == -1) || null;
  var userId = Math.floor(Math.random() * 1000);
  if (user) {
    var handleChageName = activeGames[gameNum].players?.map((obj) => {
      if (obj?.userId == user.userId) {
        return { ...obj, name: playerName };
      } else {
        return { ...obj };
      }
    });
    activeGames[gameNum].players = handleChageName;
  } else {
    const dataStatic = activeGames[gameNum].players;
    dataStatic.push({
      userId: userId,
      name: playerName,
      score: 0,
      owner: false,
      socketId: socket.id,
      active: true,
    });
    activeGames[gameNum].players = dataStatic;
  }
  console.log(`${playerName} submitted name`);
  console.log(`added entry for ${socket.id}`);
  emitPlayers(gameNum);
};

var createNewGame = (socket, callback) => {
  const playerName = "Owner";
  // find unused number
  var j = Math.floor(Math.random() * 9999999999);
  while (activeGames[j]) {
    j++;
  }
  //hash it
  const gameID = hashids.encode(j);
  console.log(`gameId est ${gameID}`);
  callback(gameID);
  activeGames[j] = {
    canJoin: true,
    players: [],
    messages: [],
    numJoiners: 0,
    questions: [],
    i: 0,
    numQuestions: undefined,
  };
  socket.join(j);
  // handleJoining({ numInc: 1, gameID: gameID }, socket);
  console.log(`${playerName} is the owner game`);
  const gameNum = decode(gameID);
  socket.gameID = gameNum;
  activeGames[gameNum].players.push({
    userId: 1,
    name: playerName,
    score: 0,
    owner: true,
    socketId: socket.id,
    active: true,
  });
  emitPlayers(gameNum);
  emitMessages(gameNum);
};

var formatGameID = (gameID) => {
  return gameID.toUpperCase().replace(/\s+/g, "");
};

var decode = (gameID) => {
  return hashids.decode(gameID)[0];
};

var joinGame = (gameID, socket, callback) => {
  try {
    const formattedGameID = formatGameID(gameID);
    const gameNumber = decode(formattedGameID);
    if (!activeGames[gameNumber]) {
      callback({
        sucess: false,
        errorMsg:
          "Le jeu que vous avez demandé n'a pas été trouvé. Assurez-vous d'avoir le code de jeu correct et réessayez.",
      });
    } else if (activeGames[gameNumber].canJoin) {
      var user =
        activeGames[gameNumber].players?.find((i) => i.userId == -1) || null;
      callback({
        sucess: true,
        gameID: formattedGameID,
        owner: user?.owner || false,
      });
      socket.join(gameNumber);
      if (user) {
        var handleChage = activeGames[gameNumber].players?.map((obj) => {
          if (obj?.userId == user.userId) {
            return { ...obj, socketId: socket.id, active: true };
          } else {
            return { ...obj };
          }
        });
        activeGames[gameNumber].players = handleChage;
      } else {
        const dataStatic = activeGames[gameNumber].players;
        dataStatic.push({
          userId: 2,
          name: "test",
          score: 0,
          owner: false,
          socketId: socket.id,
          active: true,
        });
        activeGames[gameNumber].players = dataStatic;
      }
      console.log(`the socket joined  ${gameNumber}`);
      socket.gameID = gameNumber;
      handleJoining({ numInc: 1, gameID: formattedGameID }, socket);
      emitMessages(gameNumber);
    } else {
      callback({
        sucess: false,
        errorMsg: "Vous ne pouvez pas rejoindre un jeu qui est déjà en cours.",
      });
    }
  } catch {
    callback({
      sucess: false,
      errorMsg:
        "Le jeu que vous avez demandé n'a pas été trouvé. Assurez-vous d'avoir le code de jeu correct et réessayer.",
    });
  }
};

var startGame = ({ gameID, category, difficulty, numberQuestions }) => {
  const gameNum = decode(gameID);
  const d = difficulty === "-1" ? "" : `&difficulty=${difficulty}`;
  const c = category === "-1" ? "" : `&category=${category}`;
  io.in(gameNum).emit("start countdown", {
    countdownLength: countdownLength,
    questionLength: selectInterval / 1000,
    numberQuestions: numberQuestions,
  });
  i = 0;
  // handle questions when the come back from endpt and convert them to appropriate format
  axios
    .get(`https://opentdb.com/api.php?amount=${numberQuestions}${c}${d}`)
    .then((response) => {
      console.log(
        `sent response: https://opentdb.com/api.php?amount=${numberQuestions}${c}${d}`
      );
      const r = response.data.results;
      console.log(`got response from trivia API: ${JSON.stringify(r)}`);
      r.forEach((q, idx) => {
        let answers = [q.correct_answer]
          .concat(Object.values(q.incorrect_answers))
          .map((a) => he.decode(a));
        activeGames[gameNum].questions[idx] = {
          questionPrompt: he.decode(q.question),
          correctAnswerIndex: shuffle2(answers),
          shuffledAnswers: answers,
        };
      });

      setTimeout(() => sendQuestion(gameNum), countdownLength * 1000);
    });
  activeGames[gameNum].canJoin = false;
  activeGames[gameNum].numQuestions = numberQuestions;
};

let sendQuestion = (gameNum) => {
  let currentGame = activeGames[gameNum];
  var currentIdx = currentGame.i;
  io.in(gameNum).emit("question", {
    index: currentIdx,
    question: currentGame.questions[currentIdx].questionPrompt,
    answers: currentGame.questions[currentIdx].shuffledAnswers,
  });
  setTimeout(() => requestAnswer(gameNum), selectInterval);
  activeGames[gameNum].i = currentIdx + 1;
  setTimeout(
    () =>
      currentGame.i < currentGame.numQuestions
        ? sendQuestion(gameNum)
        : io.in(gameNum).emit("game over"),
    selectInterval + displayInterval
  );
};

function shuffle2(array) {
  var correctAnsIdx = 0;
  for (let idx = array.length - 1; idx > 0; idx--) {
    let j = Math.floor(Math.random() * (idx + 1));
    if (j === 0) {
      correctAnsIdx = JSON.parse(JSON.stringify(idx));
    }
    [array[idx], array[j]] = [array[j], array[idx]];
  }
  return correctAnsIdx;
}

var requestAnswer = (gameNum) => {
  io.in(gameNum).emit("request answer");
};

io.of("/").on("connection", function (socket) {
  console.log(`user connected ${socket.id}`);
  socket.on("request-play", (data) => emitRequestPlay(data));
});

let emitRequestPlay = ({ userId, name, socketID }) => {
  io.to(socketID).emit("request-play", { userId, name });
};
