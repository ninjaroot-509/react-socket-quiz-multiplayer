module.exports = {
  purge: {
    enabled: true,
    content: [
      "./src/App.js",
      "./src/GamePage.js",
      "./src/InitPage.js",
      "./src/JoinPage.js",
    ],
  },
  theme: {
    extend: {
      width: {
        "min-content": "min-content",
        "max-content": "max-content",
      },
    },
  },
  variants: {},
  plugins: [],
};
