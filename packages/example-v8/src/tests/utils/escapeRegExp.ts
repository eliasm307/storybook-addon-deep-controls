/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 *
 * @link https://github.com/lodash/lodash/blob/master/escapeRegExp.js
 */
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

/**
  * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
  * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
  *
  * @since 3.0.0
  * @category String
  * @param {string} [string=''] The string to escape.
  * @returns {string} Returns the escaped string.
  * @see escape, escapeRegExp, unescape
  * @example
  *
  * escapeRegExp('[lodash](https://lodash.com/)')
  * // => '\[lodash\]\(https://lodash\.com/\)'
  */
export default function escapeRegExp(string: string): string {
    return (string && reHasRegExpChar.test(string))
        ? string.replace(reRegExpChar, '\\$&')
        : (string || '');
}
