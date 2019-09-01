#! /usr/bin/env node

const commander = require('commander')
const argv = require('minimist')(process.argv.slice(2))
const ProgressBar = require('progress')
const axios = require('axios').default
const md5 = require('md5')
const qs = require('qs')
const fs = require('fs')
const path = require('path')

// 注册版本号与描述
commander.version('0.0.1').description('A youdao translation API tool')

// 注册参数
commander.option('-q, --query', '要翻译的文本')
commander.option('-k, --key', '您的应用密钥')
commander.option('-a, --appkey', '您的应用ID')
commander.option('-f, --file', '要翻译的文件目录')
commander.option('-o, --output', '翻译输出目录')

const outputKey = {}
const url = 'http://openapi.youdao.com/api'

function main() {
  if (!argv.q && !argv.query && !argv.f && !argv.file) {
    console.warn('翻译结束，缺少翻译内容！！！')
    return
  }
  if (!argv.a && !argv.appkey && !argv.k && !argv.key) {
    console.warn('翻译结束，缺少应用ID与密钥！！！')
    return
  }
  let query = ''
  if (argv.q || argv.query) {
    query = argv.q || argv.query
  } else {
    query = loadFile(argv.f || argv.file)
  }
  const salt = Date.now()
  const appKey = argv.a || argv.appkey
  const key = argv.k || argv.key
  const sign = md5(appKey + query + salt + key)
  const params = {
    q: query,
    appKey: appKey,
    salt: salt,
    from: '',
    to: 'en',
    sign: sign
  }
  const bar = new ProgressBar('loading [:bar] :rate/bps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 10
  })
  axios
    .post(url, qs.stringify(params))
    .then(res => {
      bar.tick(10)
      if (res.data && res.data.translation && res.data.translation.length) {
        outputFile(res.data.translation[0])
      } else {
        console.warn('翻译结束，翻译失败！！！', res.data)
      }
    })
    .catch(err => {
      bar.tick(10)
      console.warn('翻译结束，接口请求失败！！！')
      console.warn(err)
    })
}

// 加载翻译文件
function loadFile(file) {
  let str = ''
  try {
    const data = require(file)
    if (typeof data !== 'object') {
      throw new Error('翻译结束，解析翻译文件失败！！！')
    }
    Object.keys(data).forEach((k, i) => {
      if (typeof data[k] === 'string') {
        str += data[k] + '\n'
      } else {
        str += JSON.stringify(data[k]) + '\n'
      }
      outputKey[i] = k
    })
  } catch (e) {
    console.warn('翻译结束，解析翻译文件失败！！！')
  }
  return str
}

// 输出翻译文件
function outputFile(str) {
  const content = {}
  const arr = str.split('\n')
  arr.forEach((k, i) => {
    content[outputKey[i]] = k
  })
  const name = md5(Date.now() + 'byron')
  const file = path.join(__dirname, `${name}.json`)
  fs.writeFile(file, JSON.stringify(content), function(err) {
    if (err) {
      return console.log(err)
    }
    console.log('翻译结束，输出文件路径：' + file)
  })
}

main()
