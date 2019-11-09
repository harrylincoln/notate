exports.normalize = function normalize(key) {
    const k = key || '';

    if (k.length > 1) {
        // Uppercase just the first letter
        return k[0].toUpperCase() + k.slice(1);
    } else {
        return k.toUpperCase();
    }
};
