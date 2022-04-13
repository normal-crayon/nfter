module.exports = function(api) {
  api.cache(true);

  const presets = ["es2015", "stage-2", "stage-3"];
  const plugins = ["@babel/plugin-syntax-import-meta", "@babel/plugin-proposal-class-properties"];


  return{
    presets, 
    plugins
  };
}
