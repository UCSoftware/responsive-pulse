exports.defaultChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.string = function( length, chars ) {
    var result = '';
    for( var i = length; i > 0; --i ) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    }
    return result;
};

exports.seededNumber = function( seed, max, min ) {
    max = max || 1;
    min = min || 0;

    seed = ( seed * 9301 + 49297 ) % 233280;
    var rnd = seed / 233280;

    return {
        nextSeed: seed,
        value: min + rnd * (max - min)
    };
};
