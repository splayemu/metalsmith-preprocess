d3 = require('d3')

module.exports.test = function (query_selector) {
  var circle = d3.select(this.document).select('#test')
    .append('svg:svg')
      .attr('width', 600)
      .attr('height', 300)
      .append('circle')
        .attr('cx', 300)
        .attr('cy', 150)
        .attr('r', 10)
        .attr('fill', '#26963c');
}
