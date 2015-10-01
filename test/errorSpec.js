'use strict';

var assert = require('assert');
var error  = require('../lib/error');

describe('Error Package', function () {

  describe('if', function () {
    it('should throw error when given as first argument', function () {
      assert.throws(function () {
        error.if(new Error());
      }, Error);
    });
    it('should throw error when first argument true', function () {
      assert.throws(function () {
        error.if(true);
      }, Error);
    });
    it('should throw error when first argument truthy', function () {
      assert.throws(function () {
        error.if('testing');
      }, Error);
    });
    it('should not throw error when first argument false', function () {
      assert.doesNotThrow(function () {
        error.if(false);
      });
    });
    it('should throw error when first argument falsey', function () {
      assert.doesNotThrow(function () {
        error.if(null);
      });
    });
    it('puts message in error when first argument truthy and second string', function () {
      assert.throws(function () {
        error.if(true, 'testing');
      }, /testing/);
    });
  });


  describe('ifNot', function () {
    it('should throw error when given as first argument', function () {
      assert.throws(function () {
        error.ifNot(new Error());
      }, Error);
    });
    it('should throw error when first argument false', function () {
      assert.throws(function () {
        error.ifNot(false);
      }, Error);
    });
    it('should not throw error when first argument true', function () {
      assert.doesNotThrow(function () {
        error.ifNot(true);
      });
    });
    it('should throw error when first argument falsey', function () {
      assert.throws(function () {
        error.ifNot(null);
      }, Error);
    });
    it('should not throw error when first argument truthy', function () {
      assert.doesNotThrow(function () {
        error.ifNot('test');
      });
    });
    it('puts message in error when first argument falsey and second string', function () {
      assert.throws(function () {
        error.ifNot(false, 'testing');
      }, /testing/);
    });
  });

});
