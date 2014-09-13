/** @preserve getter v0.0.4
 * 2014 - kevin von flotow
 * MIT license
 */
 ;( function ( WIN )
	{
		var DOC = WIN.document

		var LOGGING = true

		// determine which matchesSelector to use once on load
		// if else if else compiles smaller than a bunch of ifs
		var MATCHES = ( function ( DOC_ELEMENT )
			{
				if ( DOC_ELEMENT.matches )
				{
					return 'matches'
				}

				else if ( DOC_ELEMENT.matchesSelector )
				{
					return 'matchesSelector'
				}

				else if ( DOC_ELEMENT.webkitMatchesSelector )
				{
					return 'webkitMatchesSelector'
				}

				else if ( DOC_ELEMENT.mozMatchesSelector )
				{
					return 'mozMatchesSelector'
				}

				else if ( DOC_ELEMENT.msMatchesSelector )
				{
					return 'msMatchesSelector'
				}

				else if ( DOC_ELEMENT.oMatchesSelector )
				{
					return 'oMatchesSelector'
				}

				else
				{
					return false
				}
			}
		)( DOC.documentElement );

		/** @constructor */
		function Getter( selector )
		{
			/* if ( typeof selector === 'undefined' )
			{
				return console.log( 'Getter: selector is not defined' )
			} */

			// allow using Getter without 'new'
			if ( !( this instanceof Getter ) )
			{
				return new Getter( selector )
			}

			this.length = 0

			if ( Array.isArray( selector ) )
			{
				// array passed
				for ( var i = 0, l = selector.length; i < l; ++i )
				{
					Getter_find.call( this, selector[ i ] )
				}
			}

			else if ( selector )
			{
				// assume string
				Getter_find.call( this, selector )
			}
		}

		// enable/disable logging
		Getter.logging = function ( bool )
		{
			// make sure bool is a boolean
			LOGGING = !!bool
		}

		// define regular expressions
		var regexes = [
			{
				regex: /^#[-A-Za-z0-9_][-A-Za-z0-9_:.]*$/,

				fn: function ( id, base )
				{
					var ret = []

					// use querySelector instead of querySelectorAll so we only return one element,
					// since id tag should be unique
					var res = base === DOC ? DOC.getElementById( id.substr( 1 ) ) : base.querySelector( id )

					if ( res )
					{
						ret.push( res )
					}

					return ret
				}
			},

			{
				regex: /^\.[-A-Za-z0-9_:.]*$/,

				fn: function ( cls, base )
				{
					return base.getElementsByClassName( cls.substr( 1 ) )
				}
			},

			{
				regex: /^[A-Za-z][-A-Za-z0-9_:.]*$/,

				fn: function ( tag, base )
				{
					return base.getElementsByTagName( tag )
				}
			},

			// no regex needed for querySelectorAll, just put it last
			{
				fn: function ( selector, base )
				{
					return base.querySelectorAll( selector )
				}
			}
		]

		function Getter_find( selector, base )
		{
			// check for html element
			if ( selector.appendChild )
			{
				this[ this.length++ ] = selector

				return
			}

			base = base || DOC

			// make sure selector is a string
			selector = selector.toString()

			var arr = []

			for ( var i = 0, current; i < 4; ++i )
			{
				current = regexes[ i ]

				if ( current.regex && !current.regex.test( selector ) )
				{
					continue
				}

				arr = current.fn( selector, base )

				break
			}

			for ( var l = arr.length; this.length < l; )
			{
				this[ this.length ] = arr[ this.length++ ]
			}
		}

		Getter.prototype.each = function ( fn )
		{
			for ( var i = 0; i < this.length; ++i )
			{
				fn.call( this, this[ i ], i )
			}

			// chainable
			return this
		}

		Getter.prototype.eq = function ( index )
		{
			return new Getter( this[ index ] ? this[ index ] : undefined )
		}

		// executes the given method with provided arguments
		// first argument is the method name (string),
		// additional arguments are passed to method
		Getter.prototype.exec = function ()
		{
			if ( this.length === 0 )
			{
				return // this Getter instance is empty
			}

			var args = arguments

			if ( args.length === 0 )
			{
				return // must provide at least 1 argument
			}

			var arg1 = Array.prototype.shift.call( args )

			var methodPath = arg1.split( ' ' )

			// subtract 1 from length because we're handling the last item after the loop
			var methodLength = methodPath.length - 1

			for ( var i = 0, path, useThis, i2, res; i < this.length; ++i )
			{
				// set initial path
				path = this[ i ]

				// set initial object to use as this
				useThis = path
				
				// set i2 as 0 on each iteration
				for ( i2 = 0; i2 < methodLength; ++i2 )
				{
					if ( typeof path[ methodPath[ i2 ] ] === 'undefined' )
					{
						// path does not exist
						break
					}

					// update useThis if it's not the last item in the array
					path = useThis = path[ methodPath[ i2 ] ]
				}

				// grab the last path
				path = path[ methodPath[ methodLength ] ]

				// return if result is truthy
				if ( path && ( res = path.apply( useThis, args ) ) )
				{
					return res
				}
			}
		}

		// creates a new Getter instance
		Getter.prototype.filter = function ( selector )
		{
			for ( var i = 0, filtered = []; i < this.length; ++i )
			{
				if ( this[ i ][ MATCHES ]( selector ) )
				{
					filtered.push( this[ i ] )
				}
			}

			// return a new Getter object with filtered elements
			return new Getter( filtered )
		}

		// finds children elements using provided selector
		Getter.prototype.find = function ( selector )
		{
			if ( this.length === 0 )
			{
				return // instance is empty
			}

			var newGetter = Getter()

			for ( var i = 0; i < this.length; ++i )
			{
				// populate new Getter instance with results
				Getter_find.call( newGetter, selector )
			}

			// return new Getter instance with results
			return newGetter
		}

		// attempt to return first element, if it doesn't exist, return this
		// creates a new Getter instance if successful
		// returns existing instance if unsuccessful
		Getter.prototype.first = function ()
		{
			return this[ 0 ] ? new Getter( this[ 0 ] ) : this
		}

		// only operates on the first element in the instance
		// does not create a new instance
		// returns boolean
		Getter.prototype.is = function ( selector )
		{
			return this[ 0 ] ? this[ 0 ][ MATCHES ]( selector ) : false
		}

		// attempt to return last element, if it doesn't exist, return this
		// creates a new Getter instance if succesful
		// returns existing instance if unsuccessful
		Getter.prototype.last = function ()
		{
			return this[ 0 ] ? new Getter( this[ this.length - 1 ] ) : this
		}

		// provide convenience remove method
		Getter.prototype.remove = function ()
		{
			for ( var i = 0, current; i < this.length; ++i )
			{
				current = this[ i ]

				if ( current.remove )
				{
					current.remove()
				}

				else if ( current.parentNode && current.parentNode.removeChild )
				{
					current.parentNode.removeChild( current )
				}
			}

			this.length = 0
		}

		// sets propertyName to propertyValue for all elements in the instance
		// use spaces in propertyName to traverse the object
		Getter.prototype.set = function ( propertyName, propertyValue )
		{
			if ( this.length === 0 )
			{
				return // empty
			}

			propertyName = propertyName.split( ' ' )

			var propertyLength = propertyName.length - 1

			for ( var i = 0, path, i2; i < this.length; ++i )
			{
				path = this[ i ]

				for ( i2 = 0; i2 < propertyLength; ++i2 )
				{
					if ( typeof path[ propertyName[ i2 ] ] === 'undefined' )
					{
						// path does not exist
						break
					}

					path = path[ propertyName[ i2 ] ]
				}

				path[ propertyName[ propertyLength ] ] = propertyValue
			}

			// chainable
			return this
		}

		WIN.Getter = Getter

		// make reference as window.$ only if it's undefined
		if ( typeof WIN.$ === 'undefined' )
		{
			WIN.$ = Getter
		}
	}
)( window );
