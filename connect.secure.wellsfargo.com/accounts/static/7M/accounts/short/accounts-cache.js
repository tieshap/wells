(function main() {
    var hashedNames = [
        "runtime.72f40c45d61e7f4ab0c7.js",
        "vendor.aa878227d6dbc54a2684.js",
        "main.847c6f647be38fe7852b.js",
        "wfui.45585d45fe6f9b7b2989.js",
        "main.63d24707eeef5b54b8d6.css",
        "wfui.50698972ee91a83f3627.css"
    ]

    function miniGET(src) {
        var xhr = new XMLHttpRequest()
        xhr.open('GET', src)
        xhr.send()
    }

    function getSelfScriptSrc() {
        var allScripts = document.getElementsByTagName('script')
        var scriptCount
        for (scriptCount = 0; scriptCount < allScripts.length; ++scriptCount) {
            if (
                allScripts[scriptCount].src &&
                allScripts[scriptCount].getAttribute('src').indexOf('accounts-cache') !== -1
            ) {
                return allScripts[scriptCount].getAttribute('src').replace('short/accounts-cache.js', '')
            }
        }
        return ''
    }
    (function cacheAccountsAssetsInJs() {
        var commonPath = getSelfScriptSrc()
        hashedNames.forEach(function nameHandler(name) {
            if (name.indexOf('.js') !== -1) {
                miniGET(commonPath.concat('public/js/', name))
            }
            if (name.indexOf('.css') !== -1) {
                miniGET(commonPath.concat('public/stylesheets/', name))
            }
        })
    }())
}())