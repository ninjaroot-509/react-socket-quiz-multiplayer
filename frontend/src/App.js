import React, { Component } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./tailwind.css";
import InitPage from "./InitPage";
import JoinPage from "./JoinPage";
import GamePage from "./GamePage";

function GameCountdown({ number }) {
  return (
    <div className="absolute w-screen h-screen flex items-center">
      <div className="max-w-sm mx-auto content-center font-thin text-purple-700">
        <h3>Jeu démare dans</h3>
        <div className="text-6xl font-black text-gray-900 text-center">{number}</div>
      </div>
    </div>
  );
}

export class App extends Component {
  constructor(props) {
    super(props);
    this.SERVER = "http://localhost:4000"
    this.socket = io.connect(this.SERVER);
    this.state = {
      userAnswer: "-1",
      gameID: "",
      appState: "init",
      isGameCreator: false,
      numJoiners: 0,
      updatedIndex: 0,
      gameOver: false,
    };
  }

  componentDidMount() {
    this.socket.on(
      "start countdown",
      ({ countdownLength, questionLength, numberQuestions }) => {
        this.countdownTimer(countdownLength, "gameCountdown");
        this.setState({
          appState: "countdown",
          questionLength: questionLength,
          countdownLength: countdownLength,
          numberQuestions: numberQuestions,
        });
      }
    );
    this.socket.on("question", (q) => {
      console.log(`recieved question:  ${JSON.stringify(q)}`);
      this.setState({
        appState: "play",
        currentQuestion: q,
        correctAnswer: undefined,
        userAnswer: "-1",
      });
      this.countdownTimer(this.state.questionLength, "questionCountdown");
    });
    this.socket.on("request answer", () => {
      this.socket.emit(
        "validate answer", {
        answer: this.state.userAnswer,
        questionNum: this.state.currentQuestion.index,
        gameID: this.state.gameID,
      },
        ({ isCorrect, correctAnswer }) => {
          this.setState((prevState) => {
            return {
              correctAnswer: correctAnswer,
              updatedIndex: prevState.updatedIndex + 1,
            };
          });
        }
      );
    });
    this.socket.on("players", (p) => {
      console.log(`update players:  ${JSON.stringify(p)}`);
      this.setState({ players: p });
    });
    this.socket.on("joining", (n) => {
      this.setState({ numJoiners: n });
    });
    this.socket.on("game over", () => {
      this.setState({
        currentQuestion: undefined,
        // correctAnswer: undefined,
        userAnswer: "-1",
        gameOver: true,
      });
    });
  }

  emitJoining = () => {
    this.socket.emit("joining", { numInc: -1, gameID: this.state.gameID });
  };

  countdownTimer = (n, timerName) => {
    this.setState({
      [timerName]: n
    });
    if (n > 0) {
      setTimeout(() => this.countdownTimer(n - 1, timerName), 1000);
    }
  };

  handleNewGameID = (gameID) => {
    this.setState({ gameID: gameID });
  };

  joinGame = (gameID, joinGameCallback) => {
    console.log(`join game, game id: ${gameID}`);
    this.setState({ gameID: gameID });
    this.socket.emit("join game", gameID, (callbackData) => {
      if (callbackData.sucess) {
        this.setState({ isGameCreator: callbackData.owner })
        this.setState({ appState: "join", gameID: callbackData.gameID }, () =>
          console.log(`gameID changed to ${this.state.gameID}`)
        );
        axios.get(`${this.SERVER}/categories`).then((cats) => {
          this.setState({ categories: cats.data });
        });
      } else {
        this.setState({
          initError: { error: true, msg: callbackData.errorMsg },
        });
      }
    });
  };

  // joinGameCallback = ;

  createNewGame = () => {
    this.setState({ isGameCreator: true, appState: "join" });
    this.socket.emit("create new game", {}, (gameID) => {
      console.log(`got gameid from callback: ${gameID}`);
      this.setState({ gameID: gameID });
    });
    axios.get(`${this.SERVER}/categories`).then((cats) => {
      this.setState({ categories: cats.data });
    });
  };

  startGame = (gameProps) => {
    this.socket.emit("start game", gameProps);
    this.setState({ appState: "countdown" });
  };

  submitName = (gameID, playerName) => {
    this.socket.emit("submit name", {
      gameID: gameID,
      playerName: playerName,
    });
  };

  render() {
    if (this.state.appState === "init") {
      return (
        <JoinPage
          joinGame={this.joinGame}
          createGame={this.createNewGame}
          cont={() => this.setState({ appState: "join" })}>
        </JoinPage>
      );
    } else if (this.state.appState === "join") {
      return (
        <InitPage
          gameID={this.state.gameID}
          players={this.state.players}
          numberJoiners={this.state.numJoiners}
          isGameCreator={this.state.isGameCreator}
          categories={this.state.categories}
          submitName={this.submitName}
          startGame={this.startGame}
          emitJoining={this.emitJoining}>
        </InitPage>
      );
    } else if (this.state.appState === "countdown") {
      return <GameCountdown number={this.state.gameCountdown} />;
    }
    return (
      <GamePage
        currentQuestion={this.state.currentQuestion}
        correctAnswer={this.state.correctAnswer}
        numberQuestions={this.state.numberQuestions}
        questionCountdown={this.state.questionCountdown}
        gameOver={this.state.gameOver}
        players={this.state.players}
        updatedIndex={this.state.updatedIndex}
        userAnswer={this.state.userAnswer}
        setUserAnswer={(idx) => this.setState({ userAnswer: idx })}>
      </GamePage>
    );
  };
};

export default App;