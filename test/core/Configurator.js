/*jshint white: false, strict: false, plusplus: false, onevar: false,
  nomen: false */
/*global gladius: false, document: false, window: false, module: false, start,
  test: false, expect: false, ok: false, notEqual: false, stop, QUnit: false */

/***
 * Configurator Test Suite
 *
 * A test suite for the Configurator subsystem.
 *
 * Initially written by Hasan (northWind) Kamal-Al-Deen
 */

(function() {

    var engine = null;

    module( 'Configurator', {
        setup: function () {
            stop();

            gladius.create( { debug: true }, function( instance ) {
                engine = instance;
                start();
            });
        },

        teardown: function () {
            engine = null;
        }
    });


    // Configurator should be automatically created by the Engine
    test( 'Construction', function() {
        expect( 1 );

        ok(
            engine.configurator,
            'Engine creates configurator'
        );
    });

    // Test Get/Set
    test( 'Get and set', function() {
        expect( 12 );

        var keyVals = [
            ['/foo/bar/key1',   'val1', 'resetVal1'],
            ['/foo/bar/key2',   'val2', 'resetVal2'],
            ['/key3',           'val3', 'resetVal3'],
            ['/key4',           'val4', 'resetVal4']
        ];

        // All keys initially return the empty string
        for ( var i = 0, iMax = keyVals.length; i < iMax; ++ i ) {
            equal(
                engine.configurator.get(keyVals[i][0]),
                '',
                'Key ' + keyVals[i][0] + ' initially set to empty string'
            );
        }

        // Set all keys then test
        for ( var i = 0, iMax = keyVals.length; i < iMax; ++ i ) {
            engine.configurator.set( keyVals[i][0], keyVals[i][1] );

            var val = engine.configurator.get( keyVals[i][0] );

            equal(
                val,
                keyVals[i][1],
                'Value of key ' + keyVals[i][0] + ', expected ' + keyVals[i][1] + ', found ' + val
            );

            // Reset values then test
            engine.configurator.set( keyVals[i][0], keyVals[i][2] );

            val = engine.configurator.get( keyVals[i][0] );

            equal(
                val,
                keyVals[i][2],
                'Value of key ' + keyVals[i][0] + ' reset, expected ' + keyVals[i][2] + ', found ' + val
            );
        }
    });

    // Test JSON object loading
    test( 'Update and apply JSON object', function() {
        expect( 2 );

        var myJSON = {
            '/foo'      : 'value',
            '/foo/bar'  : 'otherValue'
        };

        engine.configurator.update( myJSON );

        equal( engine.configurator.get( '/foo' ), 'value', 'Retrieved value ' + myJSON['/foo'] + ' through key /foo' );
        equal( engine.configurator.get( '/foo/bar' ), 'otherValue', 'Retrieved value ' + myJSON['/foo/bar'] + ' through key /foo/bar' );
    });

    // Test default configuration loading
    test( 'Default configuration loading', function() {
        expect( 6 );

        var defaultConfig = {
            '/'             :   'firstVal',
            '/foo'          :   'secondVal',
            '/foo/bar'      :   'thirdVal',
            '/hello'        :   'fourthVal',
            '/hello/world'  :   'fifthVal',
            '/hello/world2' :   'sixthVal'
        },

        config = new engine.core.Configurator( defaultConfig );

        for ( var key in defaultConfig ) {
            if ( defaultConfig.hasOwnProperty( key ) ) {
                var val = config.get( key );
                equal( val, defaultConfig[key], 'Retrieve default configuration value, expected ' + defaultConfig[key] + ', found ' + val + ', through key ' + key);
            }
        }
    });

    // Test getPath
    test( 'getPath and separator apprehension', function() {
        expect( 21 );

        var rootConfig = engine.core.Configurator(),
            childConfigs = [],
            vals = [
                'first_val',
                'second_val',
                'third_val',
                'fourth_val',
                'fifth_val',
                'sixth_val'
            ];

        childConfigs.push( engine.configurator.getPath( '/foo' ) );
        childConfigs.push( engine.configurator.getPath( '/foo/bar' ) );

        equal( engine.configurator.get( '/foo' ), '' )
        equal( engine.configurator.get( '/foo/bar' ), '' )
        equal( rootConfig.get( '/foo' ), '' )
        equal( rootConfig.get( '/foo/bar' ), '' )
        equal( childConfigs[0].get( '/' ), '' )
        equal( childConfigs[1].get( '/' ), '' )

        // We will test Configurator's ability to read and write through the
        // engine configurator, getPath() configurators and
        // engine.core.Configurator() configurators

        // Set through engine configurator
        engine.configurator.set( '/foo', vals[0] );
        equal( rootConfig.get( '/foo' ), vals[0] );
        equal( childConfigs[0].get( '/' ), vals[0], 'Read value from first child configurator set through engine configurator' );

        // Set through engine configurator
        engine.configurator.set( '/foo/bar', vals[4] );
        equal( rootConfig.get( '/foo/bar' ), vals[4] );
        equal( childConfigs[1].get( '/' ), vals[4], 'Read value from second child configurator set through engine configurator' );

        // Set through first child configurator
        childConfigs[0].set( '/bar', vals[1]);
        equal( rootConfig.get( '/foo/bar' ), vals[1] );
        equal( engine.configurator.get( '/foo/bar' ), vals[1] );
        equal( childConfigs[1].get( '/' ), vals[1], 'Read value from second child configurator set through first child configurator' );

        // Set through second child configurator
        childConfigs[1].set( '/', vals[2] )
        equal( rootConfig.get( '/foo/bar' ), vals[2] );
        equal( engine.configurator.get( '/foo/bar' ), vals[2], 'Read value from engine configurator set through second child configurator' );
        equal( childConfigs[0].get( '/bar' ), vals[2], 'Read value from first child configurator set through second child configurator' );

        // Set through first child configurator
        childConfigs[0].set( '/', vals[3] );
        equal( rootConfig.get( '/foo' ), vals[3] );
        equal( engine.configurator.get( '/foo' ), vals[3], 'Read value from engine configurator set through first child configurator' );

        // Set through engine.core.Configurator() constructed instance
        rootConfig.set( '/foo/bar', vals[5] );
        equal( engine.configurator.get( '/foo/bar' ), vals[5] );
        equal( childConfigs[0].get( '/bar' ), vals[5] );
        equal( childConfigs[1].get( '/' ), vals[5] );
    });

    // Test listen/ignore
    test( 'Listen/ignore', function() {
        expect( 3 );

        // Test listen on creation -- listen-able path
        var testKey1 = '/listener/should/get/called',
            testKey2 = '/listener/should',
            testKey3 = '/listener',
            childConfig = engine.configurator.getPath( '/listener/should', function( path ) {
                var myTestKey = '/get/called';
                equal( path, myTestKey, '/listener/should listener found ' + path + ', expected ' + myTestKey );
                start();
            });
        stop();
        engine.configurator.set( testKey1, 'ALERT!' );

        // try again at /listener/should level
        childConfig.listen( function( path ) {
            var myTestKey = '/';
            equal( path, myTestKey, '/listener/should bound listener found ' + path + ', expected ' + myTestKey );
            start();
        });
        stop();
        engine.configurator.set( testKey2, 'ALERT!' );

        // ignored path
        childConfig.listen( function( path ) {
            ok( false, 'Listener called unexpectedly, received path ' + path );
        });
        engine.configurator.set( testKey3, 'NoOneShouldCareThatIWasSet:) -- 1' );


        // Test ignore after listen on creation
        childConfig.ignore();

        childConfig = engine.configurator.getPath( testKey2, function( path ) {
            ok( false, 'Ignored listener called incorrectly, received path ' + path );
        });
        childConfig.ignore();
        engine.configurator.set( testKey1, 'NoOneShouldCareThatIWasSet:) -- 2' );

        // Test listen post-creation
        childConfig.listen( function( path ) {
            var myTestKey = '/get/called';
            equal( path, myTestKey, 'Child-bound listener found ' + path + ', expected ' + myTestKey );
            start();
        });
        stop();
        engine.configurator.set( testKey1, 'ALERT!' );

        // Test ignore after listen post-creation
        childConfig.listen( function( path ) {
            ok( false, 'Ignored listener called incorrectly, received path ' + path );
        });
        childConfig.ignore()
        engine.configurator.set( testKey1, 'NoOneShouldCareThatIWasSet:) -- 3' );
    });

    // Test load
    // Test store
}());
