(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const speedEl = document.getElementById('speed');
  const coinsEl = document.getElementById('coins');
  const statusEl = document.getElementById('status');
  const overlay = document.getElementById('overlay');
  const gameOver = document.getElementById('gameOver');
  const finalScore = document.getElementById('finalScore');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const leftBtn = document.getElementById('leftBtn');
  const rightBtn = document.getElementById('rightBtn');
  const boostBtn = document.getElementById('boostBtn');

  let W=800,H=600,dpr=1,last=0,running=false,score=0,coins=0,best=Number(localStorage.getItem('neonTaxiBest')||0);
  let roadOffset=0,spawnTimer=0,coinTimer=0,traffic=[],pickups=[],particles=[],keys={},boosting=false;
  let player={x:0,y:0,w:43,h:70,lane:1,invincible:0};
  const lanes=[0.34,0.5,0.66];
  bestEl.textContent=String(best).padStart(4,'0');

  function resize(){
    const r=canvas.getBoundingClientRect(); dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(320,r.width);H=Math.max(390,r.height);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    player.y=H*.75; player.x=laneX(player.lane);
  }
  function laneX(lane){return W*lanes[lane];}
  function roadBounds(){return {left:W*.22,right:W*.78,width:W*.56};}
  function reset(){
    score=0;coins=0;roadOffset=0;spawnTimer=.4;coinTimer=1;traffic=[];pickups=[];particles=[];
    player.lane=1;player.x=laneX(1);player.y=H*.75;player.invincible=0;
    scoreEl.textContent='0000';coinsEl.textContent='0';speedEl.textContent='1x';
  }
  function start(){reset();running=true;overlay.classList.add('hidden');gameOver.classList.add('hidden');statusEl.textContent='SHIFT AKTIF';last=performance.now();}
  function endGame(){
    running=false;const s=Math.floor(score);finalScore.textContent=String(s).padStart(4,'0');
    if(s>best){best=s;localStorage.setItem('neonTaxiBest',best);bestEl.textContent=String(best).padStart(4,'0');}
    gameOver.classList.remove('hidden');statusEl.textContent='SHIFT SELESAI';
  }
  function roundedRect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
  function drawCar(x,y,w,h,color,isPlayer=false){
    ctx.save();ctx.translate(x,y);
    // soft glow
    ctx.shadowColor=color;ctx.shadowBlur=isPlayer?18:7;
    roundedRect(-w/2,-h/2,w,h,9,color);
    ctx.shadowBlur=0;
    roundedRect(-w*.34,-h*.28,w*.68,h*.34,5,isPlayer?'#193f4a':'#233446');
    roundedRect(-w*.32,h*.13,w*.64,h*.25,4,isPlayer?'#b6fff3':'#9aafc1');
    // roof highlight
    ctx.fillStyle=isPlayer?'#f8df75':'#d4e0e8';ctx.fillRect(-w*.28,-h*.04,w*.56,3);
    ctx.fillStyle='#fff4c0';ctx.fillRect(-w*.36,-h*.43,w*.2,4);ctx.fillRect(w*.16,-h*.43,w*.2,4);
    ctx.fillStyle='#ff496b';ctx.fillRect(-w*.36,h*.4,w*.2,4);ctx.fillRect(w*.16,h*.4,w*.2,4);
    // wheels
    ctx.fillStyle='#070d15';ctx.fillRect(-w*.57,-h*.28,w*.15,h*.2);ctx.fillRect(w*.42,-h*.28,w*.15,h*.2);ctx.fillRect(-w*.57,h*.2,w*.15,h*.2);ctx.fillRect(w*.42,h*.2,w*.15,h*.2);
    if(isPlayer){ctx.fillStyle='#f6c84b';roundedRect(-w*.23,-h*.08,w*.46,h*.18,3,'#f6c84b');ctx.fillStyle='#111b28';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('TAXI',0,h*.045);}
    ctx.restore();
  }
  function drawWorld(dt){
    ctx.clearRect(0,0,W,H);
    // night sky / city silhouettes
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#101d32');bg.addColorStop(1,'#101c26');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const b=roadBounds();
    for(let side=0;side<2;side++){
      const x0=side===0?0:b.right, x1=side===0?b.left:W;
      ctx.fillStyle='#111e2b';ctx.fillRect(x0,0,x1-x0,H);
      for(let i=0;i<10;i++){
        const bw=(x1-x0)/7, bx=x0+i*bw+(i%2)*5, bh=35+((i*31)%85), by=((i*67+roadOffset*.25)%(H+100))-bh;
        ctx.fillStyle=i%2?'#172b3a':'#1b293c';ctx.fillRect(bx,by,bw*.65,bh);
        for(let wy=by+8;wy<by+bh-5;wy+=13)for(let wx=bx+5;wx<bx+bw*.55;wx+=10){ctx.fillStyle=((i+Math.floor(wy))%3===0)?'#55f4db':'#f4bc67';ctx.globalAlpha=.45;ctx.fillRect(wx,wy,3,5);ctx.globalAlpha=1;}
      }
    }
    // road
    ctx.fillStyle='#27313e';ctx.fillRect(b.left,0,b.width,H);
    ctx.fillStyle='#3a4856';ctx.fillRect(b.left,0,4,H);ctx.fillRect(b.right-4,0,4,H);
    // lane dashes
    ctx.strokeStyle='#71818f';ctx.lineWidth=2;ctx.setLineDash([25,25]);ctx.lineDashOffset=-roadOffset;
    ctx.beginPath();ctx.moveTo(W*.405,0);ctx.lineTo(W*.405,H);ctx.moveTo(W*.595,0);ctx.lineTo(W*.595,H);ctx.stroke();ctx.setLineDash([]);
    // curb lights
    for(let y=-30+(roadOffset%55);y<H;y+=55){ctx.fillStyle='#55f4db';ctx.globalAlpha=.7;ctx.fillRect(b.left-7,y,2,13);ctx.fillRect(b.right+5,y+22,2,13);ctx.globalAlpha=1;}
  }
  function spawnTraffic(){
    const lane=Math.floor(Math.random()*3);
    traffic.push({lane,x:laneX(lane),y:-90,w:39+Math.random()*5,h:62+Math.random()*10,color:['#ff4f92','#7c8dff','#f39c57','#7ee0b2'][Math.floor(Math.random()*4)],speed:.82+Math.random()*.28});
  }
  function spawnCoin(){
    const lane=Math.floor(Math.random()*3);
    pickups.push({lane,x:laneX(lane),y:-30,r:11,spin:Math.random()*6});
  }
  function moveLane(dir){if(!running)return;player.lane=Math.max(0,Math.min(2,player.lane+dir));}
  function setBoost(v){boosting=v;}
  function update(dt){
    const boost=boosting?1.65:1,base=260;
    const velocity=base*boost+Math.min(score*.025,130);
    roadOffset=(roadOffset+velocity*dt)%1000;
    if(keys.ArrowLeft||keys.a)moveLane(-1),keys.ArrowLeft=false,keys.a=false;
    if(keys.ArrowRight||keys.d)moveLane(1),keys.ArrowRight=false,keys.d=false;
    player.x+=(laneX(player.lane)-player.x)*Math.min(1,dt*13);
    player.invincible=Math.max(0,player.invincible-dt);
    spawnTimer-=dt;if(spawnTimer<=0){spawnTraffic();spawnTimer=Math.max(.42,1.15-score/6000)*(Math.random()*.45+.75);}
    coinTimer-=dt;if(coinTimer<=0){spawnCoin();coinTimer=1.05+Math.random()*.75;}
    traffic.forEach(t=>t.y+=(velocity*t.speed)*dt);
    pickups.forEach(c=>{c.y+=velocity*dt;c.spin+=dt*5;});
    traffic=traffic.filter(t=>t.y<H+100);pickups=pickups.filter(c=>c.y<H+40);
    // collisions
    for(const t of traffic){
      if(Math.abs(t.x-player.x)<(t.w+player.w)*.39 && Math.abs(t.y-player.y)<(t.h+player.h)*.39 && player.invincible<=0){endGame();return;}
    }
    pickups=pickups.filter(c=>{
      if(Math.abs(c.x-player.x)<32&&Math.abs(c.y-player.y)<45){coins++;score+=100;coinsEl.textContent=coins;for(let i=0;i<7;i++)particles.push({x:c.x,y:c.y,vx:(Math.random()-.5)*100,vy:(Math.random()-.5)*100,life:.45});return false;}return true;
    });
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});particles=particles.filter(p=>p.life>0);
    score+=dt*(boosting?18:12);scoreEl.textContent=String(Math.floor(score)).padStart(4,'0');speedEl.textContent=(boosting?'2x':(1+Math.min(1,score/8000)).toFixed(1)+'x');
  }
  function render(){
    drawWorld(0);
    pickups.forEach(c=>{ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.spin);ctx.shadowColor='#ffdb72';ctx.shadowBlur=18;ctx.fillStyle='#ffdb72';ctx.beginPath();ctx.moveTo(0,-c.r);ctx.lineTo(c.r*.75,0);ctx.lineTo(0,c.r);ctx.lineTo(-c.r*.75,0);ctx.closePath();ctx.fill();ctx.restore();});
    traffic.forEach(t=>drawCar(t.x,t.y,t.w,t.h,t.color));
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/.45);ctx.fillStyle='#ffdb72';ctx.fillRect(p.x,p.y,3,3);ctx.globalAlpha=1;});
    if(player.invincible<=0||Math.floor(performance.now()/90)%2===0)drawCar(player.x,player.y,player.w,player.h,'#f5c842',true);
    // tiny speed lines while boosting
    if(boosting&&running){ctx.strokeStyle='#55f4db66';ctx.lineWidth=2;for(let i=0;i<12;i++){let x=W*.22+Math.random()*W*.56,y=Math.random()*H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+18+Math.random()*30);ctx.stroke();}}
  }
  function loop(now){const dt=Math.min((now-last)/1000||0,.04);last=now;if(running)update(dt);render();requestAnimationFrame(loop);}
  startBtn.addEventListener('click',start);restartBtn.addEventListener('click',start);
  leftBtn.addEventListener('pointerdown',e=>{e.preventDefault();moveLane(-1)});rightBtn.addEventListener('pointerdown',e=>{e.preventDefault();moveLane(1)});
  boostBtn.addEventListener('pointerdown',e=>{e.preventDefault();setBoost(true)});['pointerup','pointerleave','pointercancel'].forEach(ev=>boostBtn.addEventListener(ev,()=>setBoost(false)));
  window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a')moveLane(-1);if(e.key==='ArrowRight'||e.key==='d')moveLane(1);if(e.key===' '||e.key==='Shift')setBoost(true);if(e.key==='Enter'&&!running)start();});
  window.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Shift')setBoost(false);});
  window.addEventListener('resize',resize);
  resize();reset();requestAnimationFrame(t=>{last=t;loop(t);});
})();