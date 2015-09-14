'use strict';

module.exports = {

  "if": function(check, string) {
    if (!check || check instanceof Error) {
      throw check instanceof Error ? check : new Error(string);
    }
  }

};
