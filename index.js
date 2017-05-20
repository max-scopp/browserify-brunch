const anymatch = require('anymatch')
const { BrowserifyInstance } = require('./browserify-instance')
const { AutoReloadServer } = require('./auto-reload-server')
const sysPath = require('path')
const _ = require('lodash')
const loggy = require('loggy')

const cwd = process.cwd();

const DEFAULTS = {
  extensions: "js json coffee ts jsx hbs jade",
  transforms: [],
  bundles: {
    'app.js': {
      entry: 'app/init.js',
      matcher: /^app/,
      onBrowserifyLoad: undefined,
      onBeforeBundle: undefined,
      onAfterBundle: undefined,
      instanceOptions: undefined
    }
  }
}

class BrowserifyCompiler {
  constructor(brunchConfig) {
    this._brunchConfig = brunchConfig;
    this.publicPath = this._brunchConfig.paths.public;
    this.watching = 'watch' in process.argv;

    this.__initConfig();
    this.__initExtensions();
    this.__initInstances();
  }

  __initConfig () {
    this.config = _.assign({}, DEFAULTS, this._brunchConfig.plugins.browserify || {})
  }

  __initExtensions () {
    this.extensionsList = this.config.extensions.trim().split(/\s+/)
    this.pattern = new RegExp(`\\.(${this.extensionsList.join('|')})$`)
  }

  __initInstances () {
    this.instances = {};

    _.forEach(this.config.bundles, (data, compiledPath) => {
      data.instanceOptions = data.instanceOptions || {}
      data.main = this

      if (!data.instanceOptions) {
        data.instanceOptions = {}
      }

      data.instanceOptions.extensions = (() => {
        let ret = []
        _.forEach(this.extensionsList, (ext) => ret.push("." + ext))
        return ret
      })()

      data.compiledPath = compiledPath
      data.transforms = this.config.transforms

      let instance = new BrowserifyInstance(data)
      instance.matcher = anymatch(data.matcher)

      this.instances[compiledPath] = instance
    })
  }

  getDependencies (file) {
    return new Promise((resolve, reject) => {
      _.forEach(this.config.bundles, (f) => {
        if (f.entry === file.path) {
          if (f.matcher instanceof Array) {
            resolve(f.matcher.concat(f.entry) || [f.entry])
            return
          }
        }
      })
      resolve([])
    })
  }

  compile (params) {
    const { data, path } = params;

    let __triggered = false;
    return new Promise((resolve, reject) => {
      // skip when dev mode
      if (this.watching) {
        resolve({})
        return
      }

      _.forEach(this.instances, (instance, compiledPath) => {
        if (!(instance.matcher(path)) || instance.running) {
          resolve({ data, path })
          return
        }

        __triggered = true;
        instance.handleUpdate.call(instance, data, path, (err, js, path) => {
          resolve({ data: js, path })
        })
      })

      if (!__triggered) {
        resolve({ data, path })
      }
    })
  }
}

BrowserifyCompiler.prototype.brunchPlugin = true;
BrowserifyCompiler.prototype.type = 'javascript';

module.exports = BrowserifyCompiler;