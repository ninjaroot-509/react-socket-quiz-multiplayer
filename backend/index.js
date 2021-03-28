const express = require("express"),
    socket = require("socket.io"),
    axios = require("axios"),
    Hashids = require("hashids/cjs"),
    he = require("he");
const { response } = require("express");

const PORT = process.env.PORT || 4000;
const DOMAIN = "http://localhost:3000"

let app = express(),
    server = app.listen(PORT, () => console.log(`listening on port ${PORT}`)),
    io = socket(server, { origins: "*:*" }),
    hashids = new Hashids("get stupid", 4, "ABCDEFGHIJKLMNPQRSTUVWXY3456789"),
    activeGames = {};
const selectInterval = 10000,
    displayInterval = 3500,
    countdownLength = 5;

app.use(function(req, res, next) {
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

io.on("connection", function(socket) {
    console.log(`made connection, ID: ${socket.id}`);
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
});

let emitPlayers = (gameNum) => {
    const players = activeGames[gameNum].players;
    io.in(gameNum).emit(
        "players",
        Object.keys(players).length > 0 ?
        Object.entries(players).map(([id, pl]) => {
            pl.id = id;
            return pl;
        }) :
        undefined
    );
};

let handleJoining = ({ numInc, gameID }) => {
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
        activeGames[gameNum].players[socketID].score++;
    }
    emitPlayers(gameNum);
};

var handleSubmitName = ({ gameID, playerName }, socket) => {
    console.log(`${playerName} submitted name`);
    const gameNum = decode(gameID);
    activeGames[gameNum].players[socket.id] = { name: playerName, score: 0 };
    console.log(`added entry for ${socket.id}`);
    emitPlayers(gameNum);
};

var createNewGame = (socket, callback) => {
    // find unused number
    var j = 0;
    while (activeGames[j]) {
        j++;
    }
    //hash it
    const gameID = hashids.encode(j);
    console.log(`gameID is ${gameID}`);
    callback(gameID);
    activeGames[j] = {
        canJoin: true,
        players: {},
        numJoiners: 0,
        questions: {},
        i: 0,
        numQuestions: undefined,
    };
    socket.join(j);
    handleJoining({ numInc: 1, gameID: gameID }, socket);
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
                errorMsg: "The game you requested was not found. Ensure you have the correct game code and try again.",
            });
        } else if (activeGames[gameNumber].canJoin) {
            callback({
                sucess: true,
                gameID: formattedGameID,
            });
            socket.join(gameNumber);
            console.log(`the socket joined  ${gameNumber}`);
            handleJoining({ numInc: 1, gameID: formattedGameID }, socket);
        } else {
            callback({
                sucess: false,
                errorMsg: "You can't join a game that is already in progress.",
            });
        }
    } catch {
        callback({
            sucess: false,
            errorMsg: "The game you requested was not found. Ensure you have the correct game code and try again.",
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
        currentGame.i < currentGame.numQuestions ?
        sendQuestion(gameNum) :
        io.in(gameNum).emit("game over"),
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