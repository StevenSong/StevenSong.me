let d3 = Plotly.d3;

Array.prototype.contains = function(v) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === v) return true;
  }
  return false;
};

Array.prototype.unique = function() {
  var arr = [];
  for (var i = 0; i < this.length; i++) {
    if (!arr.contains(this[i])) {
      arr.push(this[i]);
    }
  }
  return arr;
}

let neighborhoods = {}

// These files are also provided, but it was easier to host them somewhere...
let fetch = new Promise((resolve, reject) => {
  d3.csv('https://stevensong.me/files/minute.csv', (err, minute_csv) => {
    if (err) throw err;
    d3.csv('https://stevensong.me/files/hour.csv', (err, hour_csv) => {
      if (err) throw err;
      d3.csv('https://stevensong.me/files/day.csv', (err, day_csv) => {
        if (err) throw err;
        d3.csv('https://stevensong.me/files/neighborhoods.csv', (err, neighborhoods_csv) => {
          if (err) throw err;

          neighborhoods_csv.map(row => neighborhoods[row.distance] = row.neighborhood);

          resolve({
            minute: transform_csv(minute_csv),
            hour: transform_csv(hour_csv),
            day: transform_csv(day_csv)
          });
        });
      });
    });
  });
});

let plots;
fetch.then((p) => {
  console.log(p);
  plots = p;
  changeView('minute');
});

function changeView(interval) {
  Plotly.purge('plot');

  let x = plots[interval].x;
  let y = plots[interval].y;
  let z = plots[interval].z;

  let text = y.map((yi, i) => x.map((xi, j) => `
    Time: ${xi}<br>
    Neighborhood: ${neighborhoods[yi]}<br>
    Distance: ${yi} mi<br>
    Shake Intensity: ${z[i][j].toFixed(2)}
  `));

  let data = {
    type: 'surface',
    hoverinfo: 'text',
    x: x,
    y: y,
    z: z,
    text: text
  };

  let layout = {
    title: 'St Himark Earthquake',
    scene: {
      xaxis:{title: 'time'},
      yaxis:{title: 'distance'},
      zaxis:{title: 'shake intensity'},
      camera: {
        up: { x: 0, y: 0, z: 1 },
        eye: { x: 1, y: -1.5, z: 1.75 }
      }
    },
  };

  console.log(data);
  Plotly.plot('plot', [data], layout);
}

function parseFloatX(num) {
  if (num === undefined || num === null || num === '') {
    return 0;
  }

  return parseFloat(num);
}

function transform_csv(csv) {
  let x = csv.map(row => row.time).unique().sort((a, b) => a - b);
  let y = csv.map(row => parseFloat(row.distance)).unique().sort((a, b) => a - b);

  let x_idxs = {};
  x.map((time, idx) => x_idxs[time] = idx);

  let y_idxs = {};
  y.map((distance, idx) => y_idxs[String(distance)] = idx);

  let z = new Array(y.length).fill(0).map(e => new Array(x.length).fill(0));

  csv.map(row => {
    let y_idx = y_idxs[row.distance]
    let x_idx = x_idxs[row.time]

    z[y_idx][x_idx] = parseFloatX(row.shake_intensity)
  });

  return {
    z: z,
    x: x,
    y: y
  };
}
