'use strict';
var path = require('path');

function HtmlWebpackLocalCachePlugin (options) {
  this.options = options;
}

HtmlWebpackLocalCachePlugin.prototype.apply = function (compiler) {
  var self = this;

  // Hook into the html-webpack-plugin processing
  // for webpack4 rewrite  by viewport.group@outlook.com
  compiler.hooks.compilation.tap('HtmlWebpackLocalCache', function (compilation) {
    compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('HtmlWebpackLocalCache', function (htmlPluginData, callback) {
      // Skip if the plugin configuration didn't set `inlineSource`
      if (!self.options) {
        return callback(null, htmlPluginData);
      }
      var regexStr = self.options.cacheSource;
      var result = self.processTags(compilation, regexStr, htmlPluginData);
      callback(null, result);
    });

    // 原文件在webpack/lib/JsonMainTemplatePlugin.js
    self.options.cacheEnsure && compilation.mainTemplate.plugin("jsonp-script", function(_, chunk, hash) {
        var chunkFilename = this.outputOptions.chunkFilename;
        var chunkMaps = chunk.getChunkMaps();
        var crossOriginLoading = this.outputOptions.crossOriginLoading;
        var chunkLoadTimeout = this.outputOptions.chunkLoadTimeout || 120000;
        return this.asString([
/*                "var script = document.createElement('script');",
            "script.type = 'text/javascript';",
            "script.charset = 'utf-8';",
            "script.async = true;",
            "script.timeout = " + chunkLoadTimeout + ";",
            crossOriginLoading ? "script.crossOrigin = '" + crossOriginLoading + "';" : "",
            "if (" + this.requireFn + ".nc) {",
            this.indent("script.setAttribute(\"nonce\", " + this.requireFn + ".nc);"),
            "}",*/
            // 使用localCache代理
            "localCache.load([" + this.requireFn + ".p + " +
            this.applyPluginsWaterfall("asset-path", JSON.stringify(chunkFilename), {
                hash: "\" + " + this.renderCurrentHashCode(hash) + " + \"",
                hashWithLength: function(length) {
                    return "\" + " + this.renderCurrentHashCode(hash, length) + " + \"";
                }.bind(this),
                chunk: {
                    id: "\" + chunkId + \"",
                    hash: "\" + " + JSON.stringify(chunkMaps.hash) + "[chunkId] + \"",
                    hashWithLength: function(length) {
                        var shortChunkHashMap = {};
                        Object.keys(chunkMaps.hash).forEach(function(chunkId) {
                            if(typeof chunkMaps.hash[chunkId] === "string")
                                shortChunkHashMap[chunkId] = chunkMaps.hash[chunkId].substr(0, length);
                        });
                        return "\" + " + JSON.stringify(shortChunkHashMap) + "[chunkId] + \"";
                    },
                    name: "\" + (" + JSON.stringify(chunkMaps.name) + "[chunkId]||chunkId) + \""
                }
            }) + "], true);",
            'localCache.clean();'
            /*,
            "var timeout = setTimeout(onScriptComplete, " + chunkLoadTimeout + ");",
            "script.onerror = script.onload = onScriptComplete;",
            "function onScriptComplete() {",
            this.indent([
                "// avoid mem leaks in IE.",
                "script.onerror = script.onload = null;",
                "clearTimeout(timeout);",
                "var chunk = installedChunks[chunkId];",
                "if(chunk !== 0) {",
                this.indent([
                    "if(chunk) chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));",
                    "installedChunks[chunkId] = undefined;"
                ]),
                "}"
            ]),
            "};",*/
        ]);
    });

    compilation.mainTemplate.plugin("require-ensure", function(_, chunk, hash) {
        return this.asString([
            "if(installedChunks[chunkId] === 0)",
            this.indent([
                "return Promise.resolve();"
            ]),
            "",
            "// a Promise means \"currently loading\".",
            "if(installedChunks[chunkId]) {",
            this.indent([
                "return installedChunks[chunkId][2];"
            ]),
            "}",
            "",
            "// setup Promise in chunk cache",
            "var promise = new Promise(function(resolve, reject) {",
            this.indent([
                "installedChunks[chunkId] = [resolve, reject];"
            ]),
            "});",
            "installedChunks[chunkId][2] = promise;",
            "",
            "// start chunk loading",
            // 去除使用script添加
            // "var head = document.getElementsByTagName('head')[0];",
            this.applyPluginsWaterfall("jsonp-script", "", chunk, hash),
            // "head.appendChild(script);",
            "",
            "return promise;"
        ]);
    });
  });
};

HtmlWebpackLocalCachePlugin.prototype.processTags = function (compilation, regexStr, pluginData) {
  var self = this;

  var body = [];
  var head = [];

  var regex = new RegExp(regexStr);

  pluginData.head.forEach(function (tag) {
    head.push(self.processTag(compilation, regex, tag));
  });

  pluginData.body.forEach(function (tag) {
    body.push(self.processTag(compilation, regex, tag));
  });

  if (this.injectCacheJs) {
    var fs = require('fs');
    var localCache = fs.readFileSync(path.resolve(__dirname, './localCache.js'), 'utf-8');
    var tag = {
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript'
      },
      innerHTML: localCache +
      ';var localCache = new LocalCache({cssSync: ' +
      (self.options.cssSync ? 'true' : 'false') +
      ', jsSync: ' +
      (self.options.jsSync ? 'true' : 'false') +
      ' });'
    };
    head.unshift(tag);
    body.push({
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript'
      },
      innerHTML: 'localCache.clean();'
    });
  }

  return { head: head, body: body, plugin: pluginData.plugin, chunks: pluginData.chunks, outputName: pluginData.outputName };
};

HtmlWebpackLocalCachePlugin.prototype.processTag = function (compilation, regex, tag) {
  var assetUrl;

  // inline js
  if (tag.tagName === 'script' && regex.test(tag.attributes.src)) {
    assetUrl = tag.attributes.src;
    tag = {
      tagName: 'script',
      closeTag: true,
      attributes: {
        type: 'text/javascript'
      }
    };

  // inline css
  } else if (tag.tagName === 'link' && regex.test(tag.attributes.href)) {
    assetUrl = tag.attributes.href;
    tag = {
      tagName: 'style',
      closeTag: true,
      attributes: {
        type: 'text/css'
      }
    };
  }

  if (assetUrl) {
    this.injectCacheJs = true;
    tag.innerHTML = 'localCache.load(' + JSON.stringify(assetUrl) + ');'
  }

  return tag;
};

module.exports = HtmlWebpackLocalCachePlugin;
