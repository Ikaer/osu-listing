
var authentificator = function(req, res, next){
    if(req.session.isAuthenticated === true){
        //res.setHeader('ao-user', JSON.stringify(req.session.simplifiedUser));
    }
    next();
}
module.exports = authentificator;