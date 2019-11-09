exports.normalize = function normalize(key) {
    let k = key || '';

    if (k.length > 1) {
        // Uppercase just the first letter
        k = k[0].toUpperCase() + k.slice(1);
    } else {
        k = k.toUpperCase();
    }
    return k;
};
