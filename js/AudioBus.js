function AudioBus(context, nodes) {
  this.context = context;
  this.nodes = nodes;

  this.input = this.context.createGainNode();
  this.output = this.context.createGainNode();

  for (var i = 0; i < this.nodes.length; i++) {
    
  }
}

AudioBus.prototype.connect = function(target) {
  output.connect(target);
}
