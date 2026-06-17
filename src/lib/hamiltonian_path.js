/*
    hamiltonian_paths.js implements a method for Monte Carlo sampling of Hamiltonian paths.

    Copyright (C) 2012, 2018, 2019 Nathan Clisby

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    See https://www.gnu.org/licenses/ for details of the GNU General
    Public License.
*/

/*
    VENDORED THIRD-PARTY CODE — adapted with light cleanup (dead code removed)
    from Nathan Clisby's reference implementation. The algorithm is left
    intact; lint is disabled here because we intentionally preserve the
    original numerical style.

    Uses the backbiting move described in "Secondary structures in long compact
    polymers", PHYSICAL REVIEW E 74, 051801 (2006), by Richard Oberdorf,
    Allison Ferguson, Jesper L. Jacobsen and Jané Kondev. The path is built up
    from a single point by incrementally adding sites.
*/

/* eslint-disable */

var path = [];
var xmax = 5;
var ymax = 5;
var n = (xmax + 1) * (ymax + 1);
var left_end = true;
var must_fill = true;

// Set the lattice to a `size` x `size` grid before generating. The algorithm
// reads (xmax+1)*(ymax+1) directly, so updating these module globals is all
// that is needed; the algorithm itself is left untouched.
export function setLatticeSize(size) {
  xmax = size - 1;
  ymax = size - 1;
  n = (xmax + 1) * (ymax + 1);
}

function inSublattice(x, y) {
  if (x < 0) return false;
  if (x > xmax) return false;
  if (y < 0) return false;
  if (y > ymax) return false;
  return true;
}

function reversePath(i1, i2, path) {
  var j;
  var jlim = (i2 - i1 + 1) / 2;
  var temp;
  for (j = 0; j < jlim; j++) {
    // faster to swap array references directly than element-by-element
    temp = path[i1 + j];
    path[i1 + j] = path[i2 - j];
    path[i2 - j] = temp;
  }
}

function backbite_left(step, n, path) {
  // choose left hand end
  var neighbour = [path[0][0] + step[0], path[0][1] + step[1]];
  if (inSublattice(neighbour[0], neighbour[1])) {
    var inPath = false;
    var j;
    for (j = 1; j < n; j += 2) {
      if (neighbour[0] == path[j][0] && neighbour[1] == path[j][1]) {
        inPath = true;
        break;
      }
    }
    if (inPath) {
      reversePath(0, j - 1, path);
    } else {
      left_end = !left_end;
      reversePath(0, n - 1, path);
      n++;
      path[n - 1] = neighbour;
    }
  }
  return n;
}

function backbite_right(step, n, path) {
  // choose right hand end
  var neighbour = [path[n - 1][0] + step[0], path[n - 1][1] + step[1]];
  if (inSublattice(neighbour[0], neighbour[1])) {
    var inPath = false;
    var j;
    for (j = n - 2; j >= 0; j -= 2) {
      if (neighbour[0] == path[j][0] && neighbour[1] == path[j][1]) {
        inPath = true;
        break;
      }
    }
    if (inPath) {
      reversePath(j + 1, n - 1, path);
    } else {
      n++;
      path[n - 1] = neighbour;
    }
  }
  return n;
}

// One backbiting move: pick a random end and a random step direction, then
// either extend the path or reverse a loop.
function backbite(n, path) {
  var step;
  switch (Math.floor(Math.random() * 4)) {
    case 0:
      step = [1, 0];
      break;
    case 1:
      step = [-1, 0];
      break;
    case 2:
      step = [0, 1];
      break;
    case 3:
      step = [0, -1];
      break;
  }
  if (Math.floor(Math.random() * 2) == 0) {
    n = backbite_left(step, n, path);
  } else {
    n = backbite_right(step, n, path);
  }
  return n;
}

export function generate_hamiltonian_path(q) {
  q = Math.random();
  // initialize path at a random site
  path[0] = [
    Math.floor(Math.random() * (xmax + 1)),
    Math.floor(Math.random() * (ymax + 1)),
  ];
  n = 1;
  let nattempts;
  if (must_fill) {
    nattempts =
      1 +
      q *
        10.0 *
        (xmax + 1) *
        (ymax + 1) *
        Math.pow(Math.log(2 + (xmax + 1) * (ymax + 1)), 2);
    while (n < (xmax + 1) * (ymax + 1)) {
      for (let i = 0; i < nattempts; i++) {
        n = backbite(n, path);
      }
    }
  } else {
    nattempts =
      q *
      10.0 *
      (xmax + 1) *
      (ymax + 1) *
      Math.pow(Math.log(2 + (xmax + 1) * (ymax + 1)), 2);
    for (let i = 0; i < nattempts; i++) {
      n = backbite(n, path);
    }
  }
  return [n, path];
}
