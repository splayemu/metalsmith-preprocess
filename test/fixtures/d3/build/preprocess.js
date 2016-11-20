d3 = require('d3')

module.exports.test = function (body, query_selector) {
    console.log('this.document', this.document);
    console.log('divs', d3.select(this.document).selectAll('div'));
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
