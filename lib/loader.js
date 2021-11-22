/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file loader.js
 * @author clark-t
 */

const getHandler = require('./get-handler');
const loaderUtils = require('loader-utils');
const parse = require('./utils/ast-parser');
 
module.exports = async function (source, inputSourceMap) {
    this.cachable = true;
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    const rawQuery = this.resourceQuery.slice(1);
    const query = new URLSearchParams(rawQuery);
    const isFakeSanFile = query.get('san') === '' && !!query.get('lang');

    if (options.enable === false || isFakeSanFile) {
        callback(null, source, inputSourceMap);
        return;
    }

    const resourcePath = this.resourcePath;
    const needMap = this.sourceMap;

    let ast;
    try {
        ast = parse(source, {resourcePath});
    }
    catch (e) {
        callback(null, source, inputSourceMap);
        return;
    }

    const matchOptions = {
        ast,
        source,
        options,
        resourcePath,
        needMap,
        inputSourceMap,
        warning: this.emitWarning.bind(this)
    };

    let handler = getHandler(matchOptions);
    if (handler) {
        const {code, map} = await handler.genCode();
        callback(null, code, map);
    }
    else {
        callback(null, source, inputSourceMap);
    }

};
