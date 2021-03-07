var canvas,ctx,done=false,img,m={x:0,y:0};//m is mouse
var codeOutElement = document.getElementById("codeOut");
var waypoints = [];
var mode = 0;//curve (1) or line (0)
var LANG = 'java';
var info;
var TIMER = 'm_timer', DRIVER = 'm_robotDrive', POWER = 1,
 SPEED=1, TURNSPEED=10, INITANGLE = 0, ROBOTWIDTH=3.5,
 PIXTOFEET=24.5333333333333334,PATHONLY=false;
function loaded(){
  info = document.getElementById('info');
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
      waypoints.push({x:m.x,y:m.y,type:mode});
      recalculateCode();
    }
    else done=true;
  });
  canvas.addEventListener("mouseleave",e=>{done=true});
  canvas.addEventListener("mouseenter",e=>{done=false});
  ctx = canvas.getContext("2d");
  changeBackgroundImage("GLD");
  setInterval(()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.beginPath();
    let x=0,y=0,w=0,h=0;
    if(getSet('orientation') == 90 || getSet('orientation') == 270){
      w=ftToPix(ROBOTWIDTH);
      h=ftToPix(getSet('robotlength')*2);
    }
    else{
      h=ftToPix(ROBOTWIDTH);
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
    let p1,p2;
    let lastAngle = INITANGLE==0?0:(INITANGLE==90?Math.PI/2:(INITANGLE==180?Math.PI:-Math.PI/2));
    if(waypoints.length > 0) for(let i = 0; i < waypoints.length; i++){
        // if(i==0){
        //   ctx.moveTo(waypoints[i].x, waypoints[i].y);
        // }
        // if(i == waypoints.length-1){
        //   if(!done) ctx.lineTo(m.x, m.y);
        // }
        // else ctx.lineTo(waypoints[i+1].x, waypoints[i+1].y);
        p1 = {x:waypoints[i].x,y:waypoints[i].y};
        p2 = {x:m.x,y:m.y};
        let drawit = false;
        if(i == waypoints.length-1){
          if(!done){
            p2 = {x:m.x,y:m.y};
            drawit = true;
            let dst = Math.dist(p1.x,p1.y,p2.x,p2.y);
            info.innerText = `Linear distance: ${dst.toFixed(3)}px (~${pixToFt(dst).toFixed(1)}')`;
          }
        }
        else{
          p2 = {x:waypoints[i+1].x,y:waypoints[i+1].y};
          drawit = true;
        }

        if(drawit){
          let type = waypoints[i].type;
          if(i == waypoints.length-1) type = mode;

          if(type == 1){
            let arc = drawArc(p1.x,p1.y,p2.x,p2.y,lastAngle);
            lastAngle = arc.endAngle;
          }else if(type == 0){
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(p2.x,p2.y);
            lastAngle = getPangle(getAngle2(p2,p1)*-1+Math.PI);
          }
        }
    }
    ctx.lineWidth = 5;
    ctx.strokeStyle="#000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    if(!PATHONLY){
      ctx.lineWidth = ftToPix(ROBOTWIDTH);//radius
      ctx.strokeStyle="rgba(255, 0, 0,0.1)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      if(waypoints.length > 0) for(let i = 0; i < waypoints.length; i++){
        ctx.beginPath();
        ctx.ellipse(waypoints[i].x,waypoints[i].y,8,8, 0, 0, Math.PI * 2, false);
        ctx.fill();
      }
    }

    if(!done && mode == 1){
      ctx.lineWidth = 5;
      ctx.strokeStyle="#AAA";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(p2.x,p2.y);
      console.log(lastAngle);
      ctx.lineTo(p2.x+Math.cos(lastAngle)*2000,p2.y-Math.sin(lastAngle)*2000);
      ctx.setLineDash([5, 15]);
      ctx.stroke();
      ctx.setLineDash([]);
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
  return PIXTOFEET*ft; //height of arena in pixels / 15ft
}
function pixToFt(pix){
  return pix/PIXTOFEET; //height of arena in pixels / 15ft
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

function drawArc(a,b, c,d, _theta){
  let theta = _theta*-1+Math.PI/2+0.0000001;
  let center = {x:0,y:0};
  let tan = Math.tan(theta);
  let acbd = (a-c)/(b-d);
  center.x = (acbd*a+(acbd*(c-a)-(b-d))/2+tan*a)/(tan+acbd);
  center.y = tan*(center.x-a)+b;
  let rad = Math.dist(a,b,center.x,center.y);
  let angleA = getAngle2(center,{x:a,y:b});
  let angleB = getAngle2(center,{x:c,y:d});
  let ls = isLeft({x:a,y:b},{x:c,y:d},center);

  let leftside = Math.sign(getAngleChange2(theta,angleB)*180/Math.PI)==1?ls:!ls;
  let tc = getAngleChange2(theta,angleB);
  // console.log(tc*180/Math.PI);
  let circ = 0;
  if(leftside){
  if(tc < 0){
    circ = tc*-1;
  }else{
    circ = Math.PI*2 - tc;
  }
  }else{
      circ = Math.PI+tc;
  }
  ctx.arc(center.x,center.y,rad,angleA,angleB,leftside);
  return {circ:circ,radius:rad,side: leftside, center:center,endAngle:getPangle(angleB+Math.PI/2+(leftside?Math.PI:0))*-1};
}
//all radians
function getAngle2(a,b){
  return Math.atan2(b.y-a.y,b.x-a.x);
}
function getAngleChange2(_i,_j){
  let i = _i*180/Math.PI;
  let j = _j*180/Math.PI;
  var diff = ( j - i + 180 ) % 360 - 180;
  return (diff < -180 ? diff + 360 : diff)*Math.PI/180;
}
function getPangle(arad){
  adeg = arad*180/Math.PI;
  a = (Math.abs(adeg)%360)*Math.sign(adeg);
  if(Math.abs(a) <= 180) return a*Math.PI/180;
  else{
    if(a > 180){
      a -= 360;
    }
    else if(a < -180){
      a += 360;
    }
    return a*Math.PI/180;
  }
}
function isLeft(a,b,c){
     return ((b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)) > 0;
}

function setMode(m){
  mode = m;
  waypoints[waypoints.length-1].type = m;
}
function toggleCurveMode(){
  if(mode == 0){
    setMode(1);
  }else{
    setMode(0);
  }
}
window.addEventListener('keydown',e=>{
  if(document.activeElement.tagName != 'INPUT'){
    if(e.key == 'w') toggleCurveMode();
    if(e.keyCode == 8 || e.keyCode == 46){
      waypoints.pop();
      mode = waypoints[waypoints.length-1].type;
      recalculateCode();
    }
  }
});
//ENCODER
let TIME = 0;
let ELSENEEDED = false;
let INSTRUCTIONS = 0;
function recalculateCode(){
  TIME = 0;
  ELSENEEDED = false;
  INSTRUCTIONS = 0;
  let code = '';
  let lastAngle = INITANGLE==0?0:(INITANGLE==90?Math.PI/2:(INITANGLE==180?Math.PI:-Math.PI/2));
  if(waypoints.length > 0) for(let i = 0; i < waypoints.length-1; i++){
      let p1 = {x:waypoints[i].x,y:waypoints[i].y};
      let p2 = {x:waypoints[i+1].x,y:waypoints[i+1].y};
      let type = waypoints[i].type;
      let oldAngle = lastAngle;
      if(type == 1){
        let arc = drawArc(p1.x,p1.y,p2.x,p2.y,lastAngle);
        lastAngle = arc.endAngle;
        code += generateJavaArc(arc);
      }else if(type == 0){
        ctx.moveTo(p1.x,p1.y);
        ctx.lineTo(p2.x,p2.y);
        lastAngle = getPangle(getAngle2(p2,p1)*-1+Math.PI);
        code += generateJavaTurn(getPangle(getAngleChange(oldAngle,lastAngle))*180/Math.PI);
        code += generateJavaLine(pixToFt(Math.dist(p1.x,p1.y,p2.x,p2.y)));
      }
  }
  codeOut.innerHTML = beginCode() + code + endCode();
}

function generateJavaArc(arc){
  INSTRUCTIONS++;
  console.log(arc);
  let timeTaken = pixToFt((arc.radius + ftToPix(ROBOTWIDTH)/2)*arc.circ)/SPEED;
  TIME += timeTaken;
  let sp = (arc.radius - ftToPix(ROBOTWIDTH)/2)/(arc.radius + ftToPix(ROBOTWIDTH)/2);
  let x = arc.side?(sp).toFixed(8):1;
  let y = arc.side?1:(sp).toFixed(8);
  let code = '';
  if(LANG == 'java'){
  code = `${ELSENEEDED?'else ':''}if(${TIMER}.get() < ${TIME.toFixed(8)}){ // curve radius ${pixToFt(arc.radius).toFixed(1)}' for ${timeTaken.toFixed(1)}s
  ${DRIVER}.tankDrive(${x},${y});
}
`;
} else if(LANG = 'python'){
  code = `${ELSENEEDED?'elif ':'if'}(${TIMER}.get() < ${TIME.toFixed(8)}): # curve radius ${pixToFt(arc.radius).toFixed(1)}' for ${timeTaken.toFixed(1)}s
  ${DRIVER}.tankDrive(${x},${y})\n
`;
}
ELSENEEDED = true;
  return code;
}
function generateJavaTurn(angledeg){
  INSTRUCTIONS++;
  let timeTaken = Math.abs(angledeg)/TURNSPEED;
  TIME += timeTaken;
  let x = Math.sign(angledeg)*-1;
  let y = Math.sign(angledeg);
  let code = '';
  if(LANG == 'java'){
  code = `${ELSENEEDED?'else ':''}if(${TIMER}.get() < ${TIME.toFixed(5)}){ // turn ${angledeg.toFixed(2)}&deg (${timeTaken.toFixed(1)}s)
  ${DRIVER}.tankDrive(${x},${y});
}
`;
}else if(LANG == 'python'){
code = `${ELSENEEDED?'elif ':'if'}(${TIMER}.get() < ${TIME.toFixed(5)}): # turn ${angledeg.toFixed(2)}&deg (${timeTaken.toFixed(1)}s)
  ${DRIVER}.tankDrive(${x},${y})\n
`;
}
ELSENEEDED = true;
  return code;
}
function generateJavaLine(ft){
  INSTRUCTIONS++;
  let timeTaken = ft/SPEED;
  TIME += timeTaken;
  let x = 1;
  let y = 1;
  let code = '';
  if(LANG == 'java'){
  code = `${ELSENEEDED?'else ':''}if(${TIMER}.get() < ${TIME.toFixed(5)}){ // move ${ft.toFixed(2)}' (${timeTaken.toFixed(1)}s)
  ${DRIVER}.tankDrive(${x},${y});
}
`;
}else if(LANG == 'python'){
  code = `${ELSENEEDED?'elif ':'if'}(${TIMER}.get() < ${TIME.toFixed(5)}): # move ${ft.toFixed(2)}' (${timeTaken.toFixed(1)}s)
  ${DRIVER}.tankDrive(${x},${y})\n
`;
}
ELSENEEDED = true;
  return code;
}
function beginCode(){
  let comment = LANG=='python'?'#':'//';
  return(`${comment}Total running time: ${fmtMSS(~~TIME)}s
${comment}Total instructions: ${INSTRUCTIONS}\n\n`);
}
function endCode(){
  let date = new Date().toDateString();
  if(waypoints.length < 2) return '';
  let code = ''
  if(LANG == 'java'){
    code = `else{
  ${DRIVER}.stopMotor();
}
//sequence generated by Mark Skinner on ${date}`;
}else{
  code = `else:
  ${DRIVER}.stopMotor()
#sequence generated by markskinner92.github.io/autoBot on ${date}`;
}
  return code;
}
function fmtMSS(s){return(s-(s%=60))/60+(9<s?':':':0')+s}

document.getElementById('bkimage').addEventListener('change', (event) => {
  const strDataURI = window.URL.createObjectURL(event.target.files[0]);
  var image = new Image;
  image.src = strDataURI;
  img = image;
  clearDrawing();
  ctx.drawImage(img, 0, 0);
  done=false;
});
