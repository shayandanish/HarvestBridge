/**
 * Socket.io instance singleton.
 * Allows any module to get the io instance without circular imports.
 */
let io = null;

module.exports = {
    setIo: (instance) => { io = instance; },
    getIo: () => io,
};
