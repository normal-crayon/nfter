// module.exports = function(api) {
//   api.cache(true);

//   const presets = ["es2015", "stage-2", "stage-3"];
//   const plugins = ["@babel/plugin-syntax-import-meta", "@babel/plugin-proposal-class-properties"];


//   return{
//     presets, 
//     plugins
//   };
// }
module.exports = {
  presets:["es2015", "stage-2", "stage-3"], 
  overrides: [
    {
      // test: "./node_modules/@expo/next-adapter/document.js",
      plugins: [["@babel/plugin-proposal-class-properties"]],
    },
  ],
}