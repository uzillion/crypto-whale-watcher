module.exports = (pricePoints) => {
  let sum = 0;
  let dif = [];
  for(let i=0; i<pricePoints.length-1 ; i++) {
    let difference = parseFloat(pricePoints[i+1][0]) - parseFloat(pricePoints[i][0]);
    sum += difference;
    dif.push(difference);
  }
  let mean = sum/dif.length;
  let v =0;
  dif.forEach(d => {
    v += Math.pow(d-mean, 2);
  })
  return Math.sqrt(v/dif.length);
};