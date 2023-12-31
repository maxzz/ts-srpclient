/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Copyright (C) Paul Johnston 2000.
 * See http://pajhome.org.uk/site/legal.html for details.
 *
 * Modified by Tom Wu (tjw@cs.stanford.edu) for the
 * SRP JavaScript implementation.
 */
// function sha1Factory() {

/*
 * Convert a 32-bit number to a hex string with ms-byte first
 */
const hex_chr = "0123456789abcdef";

function hex(num: number): string {
    var str = "";
    for (var j = 7; j >= 0; j--)
        str += hex_chr.charAt((num >> (j * 4)) & 0x0F);
    return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the SHA1 standard.
 */
function str2blks_SHA1(str: string): any[] {
    var nblk = ((str.length + 8) >> 6) + 1;
    var blks = new Array(nblk * 16);
    for (var i = 0; i < nblk * 16; i++)
        blks[i] = 0;
    for (i = 0; i < str.length; i++)
        blks[i >> 2] |= str.charCodeAt(i) << (24 - (i % 4) * 8);
    blks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    blks[nblk * 16 - 1] = str.length * 8;
    return blks;
}

/*
 * Input is in hex format - trailing odd nibble gets a zero appended.
 */
function hex2blks_SHA1(hex: string): any[] {
    var len = (hex.length + 1) >> 1;
    var nblk = ((len + 8) >> 6) + 1;
    var blks = new Array(nblk * 16);
    for (var i = 0; i < nblk * 16; i++)
        blks[i] = 0;
    for (i = 0; i < len; i++)
        blks[i >> 2] |= parseInt(hex.substr(2 * i, 2), 16) << (24 - (i % 4) * 8);
    blks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    blks[nblk * 16 - 1] = len * 8;
    return blks;
}

function ba2blks_SHA1(ba: number[], off: number, len: number): number[] {
    var nblk = ((len + 8) >> 6) + 1;
    var blks = new Array(nblk * 16);
    for (var i = 0; i < nblk * 16; i++)
        blks[i] = 0;
    for (i = 0; i < len; i++)
        blks[i >> 2] |= (ba[off + i] & 0xFF) << (24 - (i % 4) * 8);
    blks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    blks[nblk * 16 - 1] = len * 8;
    return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function add(x: number, y: number): number {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function ft(t: number, b: number, c: number, d: number): number {
    if (t < 20)
        return (b & c) | ((~b) & d);
    if (t < 40)
        return b ^ c ^ d;
    if (t < 60)
        return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function kt(t: number): number {
    return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
}

/*
 * Take a string and return the hex representation of its SHA-1.
 */
export function calcSHA1(str: string) {
    return calcSHA1Blks(str2blks_SHA1(str));
}

export function calcSHA1Hex(str: string) {
    return calcSHA1Blks(hex2blks_SHA1(str));
}

export function calcSHA1BA(ba: number[]) {
    return calcSHA1Blks(ba2blks_SHA1(ba, 0, ba.length));
}

export function calcSHA1BAEx(ba: number[], off: number, len: number): string {
    return calcSHA1Blks(ba2blks_SHA1(ba, off, len));
}

function calcSHA1Blks(x: number[]): string {
    var s = calcSHA1Raw(x);
    return hex(s[0]) + hex(s[1]) + hex(s[2]) + hex(s[3]) + hex(s[4]);
}

function calcSHA1Raw(x: number[]): number[] {
    var w = new Array(80);

    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    var e = -1009589776;

    for (var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;
        var olde = e;

        for (var j = 0; j < 80; j++) {
            var t;
            if (j < 16)
                w[j] = x[i + j];
            else
                w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            t = add(add(rol(a, 5), ft(j, b, c, d)), add(add(e, w[j]), kt(j)));
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = t;
        }

        a = add(a, olda);
        b = add(b, oldb);
        c = add(c, oldc);
        d = add(d, oldd);
        e = add(e, olde);
    }
    return new Array(a, b, c, d, e);
}

function core_sha1(x: number[], len: number): number[] {
    x[len >> 5] |= 0x80 << (24 - len % 32);
    x[((len + 64 >> 9) << 4) + 15] = len;
    return calcSHA1Raw(x);
}
