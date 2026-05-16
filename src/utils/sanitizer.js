const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

module.exports = { sanitizeString };