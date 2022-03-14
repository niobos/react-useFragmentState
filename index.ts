/* Inspired by https://medium.com/swlh/using-react-hooks-to-sync-your-component-state-with-the-url-query-string-81ccdfcb174f
 */

import {useCallback, useState} from 'react';

function getHash(): URLSearchParams {
    let hash = window.location.hash;
    if(hash.length > 1) hash = hash.substring(1);  // remove leading #
    return new URLSearchParams(hash);
}

export function getValueFromHash(key: string): string|null {
    const params = getHash();
    const value = params.get(key);
    if(value === null || value === undefined) return null;
    return value;
}
export function updateHashValue(key: string, value: string|null): void {
    const params = getHash();
    if(value == null) {
        params.delete(key);
    } else {
        params.set(key, value);
    }
    history.replaceState({}, '', '#' + params.toString());
}

export function jsonParserWithDefault<T>(defaultValue: T): (value: string|null) => T {
    return (valueFromHash) => {
        if(valueFromHash == null) {
            return defaultValue;
        } // else:
        try {
            return JSON.parse(valueFromHash);
        } catch(e) {
            return defaultValue;
        }
    }
}

export default function useFragmentState<T>(
    key: string,
    fromString: ((value: string) => T) | T,
    toString?: (value: T) => string,
): [T, (value: T) => void] {
    /* similar to useState() hook, but stores the state in the fragment identifier
     * of the URL as well.
     *
     * The optional functions `fromString` and `toString` can be supplied
     * to customize the conversion from/to the string stored in the URL-hash.
     * By default it output/parses JSON.
     *
     * if `fromString` is not a function, it's considered a default value.
     */
    if(!(fromString instanceof Function)) {  // defaultValue or undefined
        const defaultValue = fromString;
        fromString = jsonParserWithDefault<T>(defaultValue);
    }

    if(toString == null) {
        toString = JSON.stringify;
    }

    const [value, setValue] = useState<T>(fromString(getValueFromHash(key)));

    const onSetValue = useCallback(  // Re-use same callback for same key
        newValue => {
            setValue(newValue);
            updateHashValue(key, toString(newValue));
        },
        [key]
    );

    return [value, onSetValue];
}
