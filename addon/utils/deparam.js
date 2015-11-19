const COERCE_TYPES = { 'true': true, 'false': false, 'null': null };

export function deparam( params, coerce ) {
  const obj = {};

  const nameValPairs = params.replace(/\+/g, ' ').split('&');
  nameValPairs.forEach((v)=> {
    const param = v.split( '=' );
    let key = decodeURIComponent( param[0] );

    // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
    // into its component parts.
    let keys = key.split( '][' );
    let lastKeyIndex = keys.length - 1;

    // If the first keys part contains [ and the last ends with ], then []
    // are correctly balanced.
    if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ lastKeyIndex ] ) ) {
      // Remove the trailing ] from the last keys part.
      keys[ lastKeyIndex ] = keys[ lastKeyIndex ].replace( /\]$/, '' );

      // Split first keys part into two parts on the [ and add them back onto
      // the beginning of the keys array.
      keys = keys.shift().split('[').concat( keys );
      lastKeyIndex = keys.length - 1;
    } else {
      // Basic 'foo' style key.
      lastKeyIndex = 0;
    }

    // Are we dealing with a name=value pair, or just a name?
    if ( param.length === 2 ) {
      let val = decodeURIComponent( param[1] );

      if ( coerce ) {
        if (val === 'undefined') {
          val = undefined;
        } else if (COERCE_TYPES[val] !== undefined) {
          val = COERCE_TYPES[val];
        } else if (!isNaN(val) && ((+val + '') === val)) {
          val = +val;
        }
      }

      if ( lastKeyIndex ) {
        // Complex key, build deep object structure based on a few rules:
        // * The 'current' pointer starts at the object top-level.
        // * [] = array push (n is set to array length), [n] = array if n is
        //   numeric, otherwise object.
        // * If at the last keys part, set the value.
        // * For each keys part, if the current level is undefined create an
        //   object or array based on the type of the next keys part.
        // * Move the 'current' pointer to the next level.
        // * Rinse & repeat.
        let current = obj;
        for (let i=0; i <= lastKeyIndex; i++ ) {
          key = keys[i] === '' ? current.length : keys[i];
          if (i < lastKeyIndex) {
            current[key] = current[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] );
          } else {
            current[key] = val;
          }
          current = current[key];
        }
      } else {
        // Simple key, simpler rules, since only scalars and shallow arrays allowed.
        if ( Object.prototype.toString.call( obj[key] ) === '[object Array]' ) {
          // val is already an array, so push on the next value.
          obj[key].push( val );

        } else if ( {}.hasOwnProperty.call(obj, key) ) {
          // val isn't an array, but since a second value has been specified,
          // convert val into an array.
          obj[key] = [ obj[key], val ];

        } else {
          // val is a scalar.
          obj[key] = val;
        }
      }

    } else if ( key ) {
      // No value was defined, so set something meaningful.
      obj[key] = coerce ? undefined : '';
    }
  });

  return obj;
}