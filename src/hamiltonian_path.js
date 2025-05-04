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
    Notes on implementation.

    Comments about the Markov chain used to generate paths using backbiting
    move described in Secondary structures in long compact polymers,
    PHYSICAL REVIEW E 74, 051801 2006, by Richard Oberdorf, Allison
    Ferguson, Jesper L. Jacobsen and Jan\'e Kondev algorithm is believed to
    be ergodic, but this has not been proved.  current implementation is not
    the most efficient possible, O(N) for N step walks, which could be
    improved with more sophisticated data structure heuristic used for
    decision that equilibrium distribution is being sampled from. This
    heuristic is quite conservative, but not certain.  currently using
    default random number generator. This should be `good enough' for
    generating typical walks, but shouldn't be replied upon for serious
    numerical work.

    Adapted to arbitrarily shaped sublattices - just have an 'accept'
    function Simplified reversal procedure - just go through each step (O(N)
    to reverse, anyway) Different initialisation - start from a single
    point, incrementally add.  Simplified checking of neighbours.
*/

function rgbColour(s, c1, c2) {
  var r = Math.floor(s * c1[0] + (1 - s) * c2[0]);
  var g = Math.floor(s * c1[1] + (1 - s) * c2[1]);
  var b = Math.floor(s * c1[2] + (1 - s) * c2[2]);
  return "rgb(" + r + "," + g + "," + b + ")";
}

var path = [];
var xmax = 5;
var ymax = 5;
var n = (xmax + 1) * (ymax + 1);
var left_end = true;
var must_fill = true;
var draw_arrow = false;
//Modes for showing trace of ends. (clumsy name, but can't use trace or
//path)
//either:
//0 - do nothing - neither record nor draw
//1 - record and draw (initialise if just turned on)
//2 - draw but no longer record
var showTraceMode = 0;
var nShowTraceModes = 3;
var leftTrace = [];
var nLeftTrace = 0;
var rightTrace = [];
var nRightTrace = 0;

//useful for showing vector field only
var showWalk = true;

//var xmax = 21;
//var ymax = 41;
//[>var xmax = 5;<]
//[>var ymax = 5;<]
//function inSublattice(x, y)
//{
//if (x<0) return false;
//if (x>xmax) return false;
//if (y<0) return false;
//if (y>ymax) return false;
//if ((x>1) && (x<20) && (y>5) && (y<12)) return false;
//if ((x>3) && (x<18) && (y>25) && (y<33)) return false;
//return true;
//}

//14cmx20cm
//var xmax = 57;
//var ymax = 81;
//[>var xmax = 41;<]
//[>var ymax = 81;<]
//[>var xmax = 5;<]
//[>var ymax = 5;<]
//function inSublattice(x, y)
//{
//var xc;
//var yc;
//var x2;
//var y2;
//var xm = 0.5*xmax;
//var ym = 0.5*ymax;
//if (x<0) return false;
//if (x>xmax) return false;
//if (y<0) return false;
//if (y>ymax) return false;
//[>if ((x>3) && (x<xmax-3) && (y>0.15*ymax) && (y<0.30*ymax)) return false;<]
//[>if ((x>3) && (x<xmax-3) && (y>0.6*ymax) && (y<0.8*ymax)) return false;<]
//[>x2 = (x-xm)*(x-xm);<]
//xc = xm;
//yc = 0.225*ymax;
//x2 = (x-xc)*(x-xc)/(0.88*0.88*xm*xm);
//y2 = (y-yc)*(y-yc)/(0.15*0.15*ym*ym);
//if (Math.pow(x2,2.) + Math.pow(y2,2.) < 1.) return false;
//xc = xm;
//yc = 0.7*ymax;
//x2 = (x-xc)*(x-xc)/(0.88*0.88*xm*xm);
//y2 = (y-yc)*(y-yc)/(0.15*0.15*ym*ym);
//if (Math.pow(x2,2.) + Math.pow(y2,2.) < 1.) return false;
//return true;
//}

//30cmx2cm
//var xmax = 121;
//var ymax = 7;
//var xmax = 41;
//var ymax = 81;
//var xmax = 5;
//var ymax = 5;
function inSublattice(x, y) {
  if (x < 0) return false;
  if (x > xmax) return false;
  if (y < 0) return false;
  if (y > ymax) return false;
  return true;
}

//var xmax = 81;
//var ymax = 81;
//function inSublattice(x, y)
//{
//if (x<0) return false;
//if (x>xmax) return false;
//if (y<0) return false;
//if (y>ymax) return false;
//var xm = 0.5*xmax;
//var ym = 0.5*ymax;
//if ((x-xm)*(x-xm)+(y-ym)*(y-ym) < (0.3*0.3*xmax*xmax)) return false;
//return true;
//}

//var xmax = 3;
//var ymax = 33;
//[>var xmax = 9;<]
//[>var ymax = 801;<]
//function inSublattice(x, y)
//{
//if (x<0) return false;
//if (x>xmax) return false;
//if (y<0) return false;
//if (y>ymax) return false;
//return true;
//}

function reversePath(i1, i2, path) {
  var i, j;
  var jlim = (i2 - i1 + 1) / 2;
  var temp;
  for (j = 0; j < jlim; j++) {
    //slower to use individual values
    //temp = path[i1+j][0];
    //path[i1+j][0] = path[i2-j][0];
    //path[i2-j][0] = temp;
    //temp = path[i1+j][1];
    //path[i1+j][1] = path[i2-j][1];
    //path[i2-j][1] = temp;
    //faster to swap arrays directly
    temp = path[i1 + j];
    path[i1 + j] = path[i2 - j];
    path[i2 - j] = temp;
  }
}

//Naive method, reversing whole walk each time
//function backbite(n,path)
//{
//var i, j;
//var x, y;
//var dx, dy;
//var xedge, yedge;
//var iedge, add_edge;
//[>choose a random end<]
//[>choose a random neighbour<]
//[>check if its in the sublattice<]
//[>check if its in the path<]
//[>if it is - then reverse loop<]
//[>if it is not - add it to the end<]
//[>To make things simple for the bulk of the code,<]
//[>I'll always reverse the walk so that<]
//[>the right hand end is always chosen<]
//if (Math.floor(Math.random()*2) == 0)
//{
//[>choose left hand end - reverse whole walk<]
//[>suboptimal - definitely slower than it needs to be<]
//[>as it forces everything to be O(n)<]
//reversePath(0,n-1,path);
//}
//[>Now choose a random step direction<]
//switch (Math.floor(Math.random()*4))
//{
//case 0:
//step = [1,0];
//break;
//case 1:
//step = [-1,0];
//break;
//case 2:
//step = [0,1];
//break;
//case 3:
//step = [0,-1];
//break;
//}
//var neighbour = [path[n-1][0] + step[0],path[n-1][1] + step[1]];
//[>check to see if neighbour is in sublattice<]
//if (inSublattice(neighbour[0],neighbour[1]))
//{
//[>Now check to see if it's already in path<]
//var inPath = false;
//for (j=n-2; j>=0; j--)
//{
//[>if (neighbour == path[j])<]
//if ((neighbour[0] == path[j][0]) && (neighbour[1] == path[j][1]))
//{
//inPath = true;
//break;
//}
//}
//if (inPath)
//{
//reversePath(j+1,n-1,path);
//}
//else
//{
//n++;
//path[n-1] = neighbour;
//}
//}
//return n;
//}

function backbite_left(step, n, path) {
  //choose left hand end
  var neighbour = [path[0][0] + step[0], path[0][1] + step[1]];
  //check to see if neighbour is in sublattice
  if (inSublattice(neighbour[0], neighbour[1])) {
    //Now check to see if it's already in path
    var inPath = false;
    //for (j=1; j<n; j++)
    var j;
    for (j = 1; j < n; j += 2) {
      //if (neighbour == path[j])
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
  if (showTraceMode == 1) {
    //add new site to the trace for left end
    //not keeping tracking of intermediate site - have the feeling that
    //this will be more clear.
    leftTrace[nLeftTrace] = path[0];
    nLeftTrace++;
  }
  return n;
}

function backbite_right(step, n, path) {
  //choose right hand end
  var neighbour = [path[n - 1][0] + step[0], path[n - 1][1] + step[1]];
  //check to see if neighbour is in sublattice
  if (inSublattice(neighbour[0], neighbour[1])) {
    //Now check to see if it's already in path
    var inPath = false;
    //for (j=n-2; j>=0; j--)
    var j;
    for (j = n - 2; j >= 0; j -= 2) {
      //if (neighbour == path[j])
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
  if (showTraceMode == 1) {
    //add new edge to the trace for right end
    //not keeping tracking of intermediate site - have the feeling that
    //this will be more clear.
    rightTrace[nRightTrace] = path[n - 1];
    nRightTrace++;
  }
  return n;
}

//Slightly more sophisticated, only reversing if new site found
function backbite(n, path) {
  //var i, j;
  //var x, y;
  //var dx, dy;
  //var xedge, yedge;
  //var iedge, add_edge;
  //choose a random end
  //choose a random neighbour
  //check if its in the sublattice
  //check if its in the path
  //if it is - then reverse loop
  //if it is not - add it to the end
  //the right hand end is always chosen
  //Choose a random step direction
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

function path_to_string(n, path) {
  var i;
  var path_string = "[[" + path[0] + "]";
  for (i = 1; i < n; i++) {
    path_string = path_string + ",[" + path[i] + "]";
  }

  path_string += "]";
  return path_string;
}

//function generate_hamiltonian_path(n,q)
export function generate_hamiltonian_path(q) {
  q = Math.random();
  //initialize path
  //var path = new Array(n*n);
  //var path = new Array(100000);
  //var path = new Array((xmax+1)*(ymax+1));
  path[0] = [
    Math.floor(Math.random() * (xmax + 1)),
    Math.floor(Math.random() * (ymax + 1)),
  ];
  //path[0] = [0,0];
  n = 1;
  //nattempts = 1+q*10.0 * (xmax+1) * (ymax+1) * Math.pow(Math.log(2.+(xmax+1)*(ymax+1)),2);
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
      let i;
      for (i = 0; i < nattempts; i++) {
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
    let i;
    for (i = 0; i < nattempts; i++) {
      n = backbite(n, path);
    }
  }
  return [n, path];
}

function generate_hamiltonian_circuit(q) {
  //Generates circuits, but because we are subsampling circuits
  //from the set of paths it is in fact not straightforward to
  //sample uniformly at random from the set of circuits. Quite a subtle
  //argument which I won't reproduce here.
  let result = generate_hamiltonian_path(q);
  var n = result[0];
  var path = result[1];
  //var path = generate_hamiltonian_path(q);
  var nmax = xmax * ymax;
  var success;
  var min_dist = 1 + (n % 2);
  while (
    Math.abs(path[n - 1][0] - path[0][0]) +
      Math.abs(path[n - 1][1] - path[0][1]) !=
    min_dist
  ) {
    n = backbite(n, path);
  }
  return [n, path];
}
