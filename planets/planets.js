/**
 * Philip Strachan
 * planets.js
 * Creates a space scene that you can move around in a 2d space. 
 */

//GL global references and config.
var gl;
var canvas;
var cameraTranslation = [0,0,0,0];

/* function initGL
 *
 * Sets the global context reference, and sets event handlers.
 */
function initGL(){
  canvas=document.getElementById('webgl');
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  function ResizeWindow(){
    canvas.height=window.innerHeight;
    canvas.width=window.innerHeight;
  };
  window.onresize = ResizeWindow;
  ResizeWindow();
  gl=getWebGLContext(canvas);
  if(!gl){
    console.log('Failed to get rendering context for WebGL');
    return;
  }
}

/* function DoShaders
 *
 * Initialize shaders.
 */
function initShaders(){
  stars.program = createShaderProgram("vstar.glsl", "fstar.glsl");
  gl.bindAttribLocation(stars.program, 0, 'a_Position');
  if(!stars.program){
    console.log('Failed to initialize shaders.');
    return;
  }

  //Get attribute locations
  stars.program.a_Position = gl.getAttribLocation(stars.program, 'a_Position');
  stars.program.a_Size = gl.getAttribLocation(stars.program, 'a_Size');
  stars.program.a_Color = gl.getAttribLocation(stars.program, 'a_Color');
  if(stars.program.a_Position<0 || stars.program.a_Size<0 || stars.program.a_Color<0){
    console.log('Failed to get the storage location of attributes');
    return;
  }

  //Get uniform locations.
  stars.program.u_Translation = gl.getUniformLocation(stars.program, "u_Translation");
  if(stars.program.u_Translation < 0){ 
    console.log("Translation location not found.");
    return;
  }

  grid.program = createShaderProgram("vgrid.glsl", "fgrid.glsl");
  gl.bindAttribLocation(grid.program, 0, 'a_Position');
  if(!grid.program){
    console.log('Failed to initialize shaders.');
    return;
  }

  //Get attribute locations
  grid.program.a_Position = gl.getAttribLocation(grid.program, 'a_Position');
  if(grid.program.a_Position<0){
    console.log('Failed to get the storage location of attributes');
    return;
  }

  //Get uniform locations.
  grid.program.u_Color = gl.getUniformLocation(grid.program, 'u_Color');
  grid.program.u_Translation = gl.getUniformLocation(grid.program, "u_Translation");
  if(grid.program.u_Color < 0 || grid.program.u_Translation < 0){ 
    console.log("Translation location not found.");
    return;
  }
  
  ship.program = createShaderProgram("vship.glsl", "fship.glsl");
  gl.bindAttribLocation(grid.program, 0, 'a_Position');
  if(!ship.program){
    console.log('Failed to initialize shaders.');
    return;
  }

  //Get attribute locations
  ship.program.a_Position = gl.getAttribLocation(ship.program, 'a_Position');
  if(ship.program.a_Position<0){
    console.log('Failed to get the storage location of attributes');
    return;
  }

  //Get uniform locations.
  ship.program.u_Color = gl.getUniformLocation(ship.program, 'u_Color');
  if(ship.program.u_Color < 0){ 
    console.log("Translation location not found.");
    return;
  }

  shooter.program = createShaderProgram("vshoot.glsl", "fshoot.glsl");
  gl.bindAttribLocation(shooter.program, 0, 'a_Position');
  if(!shooter.program){
    console.log('Failed to initialize shaders.');
    return;
  }

  //Get attribute locations
  shooter.program.a_Position = gl.getAttribLocation(shooter.program, 'a_Position');
  if(shooter.program.a_Position<0){
    console.log('Failed to get the storage location of attributes');
    return;
  }

  //Get uniform locations.
  shooter.program.u_Color = gl.getUniformLocation(shooter.program, 'u_Color');
  if(shooter.program.u_Color < 0){ 
    console.log("Translation location not found.");
    return;
  }

}

/* function initBuffers
 *
 * Sets up star absolute position buffer, size buffer, and color buffer.
 */
function initBuffers(){

  //Create buffers
  grid.vertexBuffer=createBuffer();

  ship.vertexBuffer=createBuffer();
  ship.windowBuffer=createBuffer();
  ship.thrustBuffer=createBuffer();
  ship.flameBuffer=createBuffer();

  stars.vertexBuffer = createBuffer();
  stars.colorBuffer = createBuffer();
  stars.sizeBuffer = createBuffer();
  
  shootBuffer.vertexBuffer=createBuffer();

  //GRID
  //Set up position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, grid.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, grid.points, gl.STATIC_DRAW);

  //SHIP
  //Set up position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, ship.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ship.points, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, ship.windowBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ship.wind, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, ship.thrustBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ship.thruster, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, ship.flameBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, ship.flame, gl.STATIC_DRAW);

  //STARS
  //Set up position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, stars.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, stars.points, gl.STATIC_DRAW);

  //Set up size buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, stars.sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, stars.sizes, gl.STATIC_DRAW);

  //Set up color buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, stars.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, stars.colors, gl.STATIC_DRAW);
  
  //SHOOTING STAR
  //Set up position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, shootBuffer.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shooter.getPoints()), gl.STREAM_DRAW);
}

/**
 * Gets camera location and draws the scene.
 */
function drawScene(){
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawGrid();
  drawStars();
  setUniform(stars.program.u_Translation, [0,0,0,0], true);
  drawShip();
  drawShoot();
}

/**
 * Draw grid. 
 */
function drawGrid(){
  gl.useProgram(grid.program);
  setUniform(grid.program.u_Translation, cameraTranslation, true);
  setUniform(grid.program.u_Color, grid.color, true);
  initAttribute(grid.program.a_Position, grid.vertexBuffer, 2, gl.FLOAT);
  gl.drawArrays(gl.LINES, 0, grid.points.length/2);
}

/**
 * Draw Stars 
 */
function drawStars(){ 
  gl.useProgram(stars.program);
  setUniform(stars.program.u_Translation, cameraTranslation, true);
  initAttribute(stars.program.a_Position, stars.vertexBuffer, 2, gl.FLOAT);
  initAttribute(stars.program.a_Color, stars.colorBuffer, 3, gl.FLOAT);
  initAttribute(stars.program.a_Size, stars.sizeBuffer, 1, gl.FLOAT);
  gl.drawArrays(gl.POINTS, 0, starCount);
}

/**
 * Draw Ship 
 */
function drawShip(){
  gl.useProgram(ship.program);
  initAttribute(ship.program.a_Position, ship.windowBuffer, 2, gl.FLOAT);
  setUniform(ship.program.u_Color, ship.windowColor, true);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 69);
  initAttribute(ship.program.a_Position, ship.vertexBuffer, 2, gl.FLOAT);
  setUniform(ship.program.u_Color, ship.color, true);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  initAttribute(ship.program.a_Position, ship.thrustBuffer, 2, gl.FLOAT);
  setUniform(ship.program.u_Color, ship.thrustColor, true);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);
  initAttribute(ship.program.a_Position, ship.flameBuffer, 2, gl.FLOAT);
  setUniform(ship.program.u_Color, ship.flameColor, true);
  for(i=0; i<numFlames; ++i){
    gl.drawArrays(gl.LINE_LOOP, flameDegrees*i, flameDegrees);
  }
  gl.disableVertexAttribArray(ship.program.a_Position);
}

/**
 * Draw shooting star. 
 */
function drawShoot(){ 
  gl.useProgram(shooter.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, shootBuffer.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shooter.getPoints()), gl.STREAM_DRAW);
  initAttribute(shooter.program.a_Position, shootBuffer.vertexBuffer, 2, gl.FLOAT);
  setUniform(shooter.program.u_Color, shooter.color, true);
  gl.drawArrays(gl.LINES, 0, 2);
}

/**
 * Updates all animated parameters.
 */
function animate(){
  var shootRoll=Math.random()*1000; 
  if(shootRoll>shootChance && shooter.length<=0){
    shooter.x=Math.random()*2-1;    
    shooter.y=1;
    shooter.color=shooterColor;
    shooter.speed=Math.random()/10+.1;
    shooter.size=Math.random()*3;
    shooter.length=Math.random()/2+.02;
    shooter.angle=Math.random()*30-15;
  } else if(shooter.length>0){
    if(shooter.y+length<=-1){
      shooter.x=galaxySize;
      shooter.y=galaxySize;
      color=[0,0,0,0];
      shooter.length=0;
    } else{
      shooter.x+=shooter.speed*Math.sin(shooter.angle*(Math.PI/180));
      shooter.y-=shooter.speed*Math.cos(shooter.angle*(Math.PI/180));
    }
  }
}

/**
 * Main loop
 */
function tick(){
  requestAnimationFrame(tick);
  drawScene();
  animate();
}

/**
 *  Entry point.
 *   Initialization
 *   Set up Shaders
 *   Set up Data
 *   Create and set up buffers
 *   Begin loop
 */
function main(){
  initGL(); 
  initShaders();
  initBuffers();
  tick();
}
