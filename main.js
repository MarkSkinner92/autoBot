var canvas,ctx,done=false,img,m={x:0,y:0};//m is mouse
var codeOutElement = document.getElementById("codeOut");
var waypoints = [];
var TIMER = 'm_timer', DRIVER = 'm_robotDrive', POWER = 1, SPEED=1, TURNSPEED=10, INITANGLE = 0;
function loaded(){
  canvas = document.getElementById("canvas");
  canvas.addEventListener("mousemove",e=>{
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left; //x position within the element.
    var y = e.clientY - rect.top;  //y position within the element.
    m.x=x;
    m.y=y;
  });
  canvas.addEventListener("mousedown",e=>{
    let wp = waypoints[waypoints.length-1];
    if(waypoints.length == 0 || Math.dist(m.x,m.y,wp.x,wp.y) > 20){
      waypoints.push({x:m.x,y:m.y});
      recalculateCode();
    }
    else done=true;
  });
  canvas.addEventListener("mouseleave",e=>{done=true});
  canvas.addEventListener("mouseenter",e=>{done=false});
  ctx = canvas.getContext("2d");
  changeBackgroundImage("GLD");
  setInterval(()=>{
    ctx.drawImage(img, 0, 0);
    ctx.beginPath();
    let x=0,y=0,w=0,h=0;
    if(getSet('orientation') == 90 || getSet('orientation') == 270){
      w=ftToPix(getSet('robotwidth'));
      h=ftToPix(getSet('robotlength')*2);
    }
    else{
      h=ftToPix(getSet('robotwidth'));
      w=ftToPix(getSet('robotlength')*2);
    }
    if(waypoints.length == 0){
      x=m.x;y=m.y;
    }else{
      x=waypoints[0].x;
      y=waypoints[0].y;
    }
    x-=w/2;
    y-=h/2;
    ctx.rect(x,y,w,h);

    ctx.lineWidth = 1;
    ctx.strokeStyle="#000";
    ctx.lineCap = "square";
    ctx.lineJoin = "square";
    ctx.stroke();
    ctx.beginPath();
    if(waypoints.length > 0) for(let i = 0; i < waypoints.length; i++){
        if(i==0){
          ctx.moveTo(waypoints[i].x, waypoints[i].y);
        }
        if(i == waypoints.length-1){
          if(!done) ctx.lineTo(m.x, m.y);
        }
        else ctx.lineTo(waypoints[i+1].x, waypoints[i+1].y);
    }
    ctx.lineWidth = ftToPix(parseFloat(document.getElementById('robotwidth').value));//radius
    ctx.strokeStyle="rgba(255, 0, 0,0.1)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle="#000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    if(waypoints.length > 0) for(let i = 0; i < waypoints.length; i++){
      ctx.beginPath();
      ctx.ellipse(waypoints[i].x,waypoints[i].y,8,8, 0, 0, Math.PI * 2, false);
      ctx.fill();
    }
  },1000/20);
}
function clearDrawing(){
  waypoints = [];
  document.getElementById("codeOut").innerHTML = '';
  done=false;
}
function changeBackgroundImage(value){
  img = document.getElementById(value);
  clearDrawing();
  ctx.drawImage(img, 0, 0);
  done=false;
}

Math.dist=function(x1,y1,x2,y2){
  if(!x2) x2=0;
  if(!y2) y2=0;
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function ftToPix(ft){
  return 24.5333333333333334*ft; //height of arena in pixels / 15ft
}
function pixToFt(pix){
  return pix/24.5333333333333334; //height of arena in pixels / 15ft
}
function getSet(s){
  return parseFloat(document.getElementById(s).value);
}
function getAngle(a,b){
  return Math.atan2(b.y-a.y,b.x-a.x)*-180/Math.PI;
}
function getAngleChange(i,j){
  var diff = ( j - i + 180 ) % 360 - 180;
  return diff < -180 ? diff + 360 : diff;
}
function copyCode(){
  codeOut.select();
  document.execCommand("copy");
}


//ENCODER
function recalculateCode(){
  if(waypoints.length > 1){
    var code = '';
    var runningTime = 0;
    var angle = INITANGLE;
    var codeOut = codeOutElement;
    for(let i = 0; i < waypoints.length; i++){
      if(i > 0){
        let segAngle = getAngleChange(angle,getAngle(waypoints[i-1],waypoints[i]));
        angle += segAngle;
        let time = Math.abs(segAngle)/TURNSPEED;
        runningTime += time;
        code += constructIf(i==1?'':'else ',runningTime,POWER*segAngle>0?-1:1,POWER*segAngle>0?1:-1,` // turn ${segAngle.toFixed(1)}&deg`);
        let dist = pixToFt(Math.dist(waypoints[i-1].x,waypoints[i-1].y,waypoints[i].x,waypoints[i].y));
        time = dist/SPEED;
        runningTime += time;
        code += constructIf('else ',runningTime,POWER,POWER,` // move ${dist.toFixed(1)}\'`);
      }
    }
    code += `else{
  ${DRIVER}.stopMotor(); // stop robot
}`
    const stats = `//Total Running Time: ${fmtMSS(~~runningTime)}\n\n`;
    codeOut.innerHTML = stats+code;
  }
}
function constructIf(Else,i,x,y,c){
  return(
`${Else}if(${TIMER}.get() < ${i.toFixed(5)}){${c}
  ${DRIVER}.tankDrive(${x},${y});
}\n`);
}
function fmtMSS(s){return(s-(s%=60))/60+(9<s?':':':0')+s}
