var JsonResponse = function (ok, message, data) {
    return {
        ok: ok,
        message: message,
        data: data
    }
}

var FormatResponse = function () {
}
FormatResponse.prototype._sendResponse = function (res, jsonResponse) {
    res.json(jsonResponse)
    res.end();
}
FormatResponse.prototype.sendError = function (res, message) {
    this._sendResponse(res, new JsonResponse(false, message, null));
}
FormatResponse.prototype.sendOk = function (res) {
    this._sendResponse(res, new JsonResponse(true, null, null));
}
FormatResponse.prototype.sendOkData = function (res, data) {
    this._sendResponse(res, new JsonResponse(true, null, data));
}

module.exports = FormatResponse;