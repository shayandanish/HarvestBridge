const { authenticate } = require('./auth');
const { authorize } = require('./rbac');

module.exports = {
    protect: authenticate,
    authenticate,
    authorize,
    checkRole: authorize
};
