"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={config:null,rounds:[],round:0,lives:3,mistakes:0,wrongThisRound:false,locked:true,sfx:true,currentWord:null,audio:null,timers:[]};
window.__MIR_GAME_STATE__=state;
const screens={start:$("#startScreen"),game:$("#gameScreen"),victory:$("#victoryScreen")};
const sleep=ms=>new Promise(r=>{const id=setTimeout(r,ms);state.timers.push(id)});
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
function showScreen(name){Object.entries(screens).forEach(([key,node])=>node.classList.toggle("active",key===name))}
function stopSpeech(){if(state.audio){state.audio.pause();state.audio.currentTime=0}}
async function play(path,{speech=false,volume=1}={}){if(!speech&&!state.sfx)return;if(speech)stopSpeech();const audio=new Audio(path);audio.volume=volume;if(speech)state.audio=audio;try{await audio.play()}catch{return}return new Promise(r=>{audio.onended=r;audio.onerror=r;setTimeout(r,4000)})}
function prepareGame(){const cfg=state.config;state.rounds=shuffle(cfg.pairs).map(pair=>{const target=pair.options[Math.floor(Math.random()*2)];return{pair,options:shuffle(pair.options),target}});state.round=0;state.lives=cfg.startingLives;state.mistakes=0;state.wrongThisRound=false;state.locked=true;state.journey=null}
function preload(){const c=state.config;const paths=new Set();const walk=v=>{if(typeof v==="string"&&/\.(png|mp3)$/i.test(v))paths.add(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==="object")Object.values(v).forEach(walk)};walk(c);return Promise.all([...paths].map(path=>path.endsWith(".png")?new Promise(r=>{const i=new Image;i.onload=i.onerror=r;i.src=path}):new Promise(r=>{const a=new Audio;a.preload="auto";let done=false;const finish=()=>{if(!done){done=true;r()}};a.oncanplay=a.onloadeddata=a.onerror=finish;a.src=path;a.load();setTimeout(finish,1800)})))}
function renderLives(glow=false){const box=$("#lives");box.innerHTML="";for(let i=0;i<state.config.startingLives;i++){const img=document.createElement("img");img.className="life";img.src=i<state.lives?(glow&&i===state.lives-1?state.config.ui.crystalGlowing:state.config.ui.crystalWhole):state.config.ui.crystalLost;img.alt=i<state.lives?"Целый кристалл":"Потерянный кристалл";box.append(img)}}
const fogPositions=[{x:300,y:850},{x:420,y:835},{x:560,y:815},{x:700,y:790}];
function scenePoint(point){const scene=screens.game.getBoundingClientRect();return{x:point.x*scene.width/1672,y:point.y*scene.height/941}}
function positionFog(){const mist=$("#sceneFog"),point=fogPositions[Math.min(state.mistakes,3)];mist.style.left=`${point.x/1672*100-8.5}%`;mist.style.top=`${point.y/941*100-26.6}%`;mist.dataset.distance=String(Math.min(state.mistakes,3))}
function setSprites(yashka,fog){const mist=$("#sceneFog");if(fog)mist.src=fog;positionFog()}
function positionRunner(path,progress,bob=0){const runner=$("#journeyYashka"),length=path.getTotalLength(),distance=length*progress,point=scenePoint(path.getPointAtLength(distance)),next=scenePoint(path.getPointAtLength(Math.min(length,distance+2))),w=runner.offsetWidth,h=runner.offsetHeight,scale=1-progress*.18,tilt=Math.max(-4,Math.min(4,(next.x-point.x)*1.5));runner.style.transform=`translate(${point.x-w/2}px, ${point.y-h*.82+bob}px) scale(${scale}) rotate(${tilt}deg)`}
function resetJourney(){const runner=$("#journeyYashka"),mist=$("#sceneFog");if(state.motionFrame)cancelAnimationFrame(state.motionFrame);if(state.motionResolve)state.motionResolve();state.motionFrame=null;state.motionResolve=null;runner.removeAttribute('style');runner.src=state.config.yashka.ready;runner.dataset.journeyPhase='idle';delete runner.dataset.journeySide;mist.style.opacity='1';mist.style.visibility='visible';state.journey=null;requestAnimationFrame(()=>positionRunner($("#leftPath"),0))}
function journeyMotion(path,side,duration,reverse=false){const runner=$("#journeyYashka"),direction=reverse?(side==='left'?'right':'left'):side;runner.src=direction==='left'?state.config.yashka.runLeft:state.config.yashka.runRight;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,total=reduced?160:duration,start=performance.now();return new Promise(resolve=>{state.motionResolve=resolve;const frame=now=>{const raw=Math.min(1,(now-start)/total),eased=raw*raw*(3-2*raw),progress=reverse?1-eased:eased,bob=raw===1?0:Math.sin(raw*Math.PI*12)*5;state.journey.progress=progress;positionRunner(path,progress,bob);if(raw<1){state.motionFrame=requestAnimationFrame(frame)}else{state.motionFrame=null;state.motionResolve=null;resolve()}};state.motionFrame=requestAnimationFrame(frame)})}
async function travelTo(button){state.locked=true;$$('.portal').forEach(portal=>portal.disabled=true);const scene=screens.game.getBoundingClientRect(),rect=button.getBoundingClientRect(),side=rect.left+rect.width/2<scene.left+scene.width/2?'left':'right',path=$(side==='left'?"#leftPath":"#rightPath"),runner=$("#journeyYashka");runner.dataset.journeySide=side;runner.dataset.journeyPhase='outbound';state.journey={side,pathId:path.id,progress:0};await journeyMotion(path,side,1450);runner.dataset.journeyPhase='arrived'}
async function returnJourney(){const runner=$("#journeyYashka"),trip=state.journey;if(!trip){resetJourney();return}runner.dataset.journeyPhase='returning';await journeyMotion($("#"+trip.pathId),trip.side,1250,true);resetJourney()}
function hideGameCharacters(){const runner=$("#journeyYashka"),mist=$("#sceneFog");runner.style.opacity='0';runner.style.visibility='hidden';mist.style.opacity='0';mist.style.visibility='hidden'}
function portalMarkup(option,i){return `<button class="portal" data-index="${i}" aria-label="Выбрать картинку ${i+1}"><img src="${state.config.portals.inner}" alt="" class="inner"><img src="${option.image}" alt="Вариант ответа ${i+1}" class="answer"><img src="${state.config.portals.idle}" alt="" class="frame"></button>`}
async function startRound(){state.locked=true;state.wrongThisRound=false;resetJourney();$("#rewardLayer").innerHTML='';const r=state.rounds[state.round];state.currentWord=r.target;$("#roundCounter").textContent=`${state.round+1} / ${state.config.roundsPerGame}`;$("#portalRow").innerHTML=r.options.map(portalMarkup).join("");$$('.portal').forEach(b=>b.addEventListener('click',choose));renderLives();setSprites(state.config.yashka.ready,state.config.fog.chasing);$("#loadingStatus").classList.add("visible");await play(state.config.sounds.roundStart,{volume:.42});await sleep(280);await play(r.target.audio,{speech:true,volume:1});$("#loadingStatus").classList.remove("visible");state.locked=false}
function setFrame(button,path){button.querySelector('.frame').src=path}
async function choose(e){if(state.locked)return;const button=e.currentTarget;const r=state.rounds[state.round];const option=r.options[Number(button.dataset.index)];if(!option)return;const isCorrect=option.audio===r.target.audio;await travelTo(button);if(isCorrect){await correct(button)}else{await wrong(button)}}
async function correct(button){state.locked=true;$$('.portal').forEach(b=>b.disabled=true);setFrame(button,state.config.portals.selected);await sleep(175);setFrame(button,state.config.portals.correct);$("#journeyYashka").src=state.config.yashka.victory;play(state.config.sounds.correct,{volume:.48});reward(button);renderLives(true);setSprites(state.config.yashka.runRight,state.config.fog.blownBack);await sleep(1000);state.round++;if(state.round>=state.config.roundsPerGame)return victory();startRound()}
function reward(button){const rect=button.getBoundingClientRect(),layer=$("#rewardLayer");layer.innerHTML=`<img class="effect burst" src="${state.config.rewardEffects.burst}"><img class="effect trail" src="${state.config.rewardEffects.trail}"><img class="effect light" src="${state.config.rewardEffects.rescuedLight}">`;const x=rect.left/screens.game.getBoundingClientRect().width*100,y=rect.top/screens.game.getBoundingClientRect().height*100;$$('.effect').forEach(el=>{el.style.left=`${x}%`;el.style.top=`${y}%`});setTimeout(()=>layer.innerHTML="",1100)}
async function wrong(button){
  state.locked=true;
  const portals=$$('.portal');
  portals.forEach(portal=>portal.disabled=true);
  setFrame(button,state.config.portals.wrong);
  button.classList.add('shake');
  $("#journeyYashka").src=state.config.yashka.surprised;

  if(!state.wrongThisRound){
    state.wrongThisRound=true;
    state.lives=Math.max(0,state.lives-1);
    state.mistakes++;
    renderLives();
    setSprites(state.config.yashka.surprised,state.config.fog.closer);
    play(state.config.sounds.wrong,{volume:.42});
    await sleep(260);
    play(state.config.sounds.fogApproaches,{volume:.22});
  }

  if(state.lives===0){
    await sleep(650);
    hideGameCharacters();
    $("#defeatModal").hidden=false;
    $("#retryButton").focus();
    return;
  }

  await sleep(420);
  await returnJourney();
  state.round++;
  if(state.round>=state.config.roundsPerGame)return victory();
  await startRound();
}
async function victory(){state.locked=true;hideGameCharacters();showScreen('victory');await play(state.config.sounds.victory,{volume:.5})}
async function begin(){state.locked=true;$("#loadingStatus").textContent="Загружаем лес…";showScreen('game');$("#loadingStatus").classList.add('visible');await preload();prepareGame();$("#loadingStatus").textContent="Слушаем…";startRound()}
function menu(){state.timers.forEach(clearTimeout);state.timers=[];stopSpeech();$("#defeatModal").hidden=true;showScreen('start')}
function openHelp(){$("#helpModal").hidden=false;$("#closeHelp").focus()}
function closeHelp(){$("#helpModal").hidden=true}
$("#startButton").addEventListener('click',begin);$("#repeatButton").addEventListener('click',()=>{if(state.currentWord)play(state.currentWord.audio,{speech:true})});$$('.open-help').forEach(b=>b.addEventListener('click',openHelp));$("#closeHelp").addEventListener('click',closeHelp);$("#helpModal .modal-shade").addEventListener('click',closeHelp);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$("#helpModal").hidden)closeHelp()});$("#retryButton").addEventListener('click',()=>{$("#defeatModal").hidden=true;prepareGame();startRound()});$("#playAgain").addEventListener('click',()=>{showScreen('game');prepareGame();startRound()});$$('.to-menu').forEach(b=>b.addEventListener('click',menu));$("#sfxToggle").addEventListener('click',e=>{state.sfx=!state.sfx;e.currentTarget.textContent=`ЗВУК: ${state.sfx?'ВКЛ':'ВЫКЛ'}`;e.currentTarget.setAttribute('aria-pressed',String(!state.sfx));e.currentTarget.setAttribute('aria-label',state.sfx?'Выключить игровые звуки':'Включить игровые звуки')});
addEventListener('resize',()=>{if(!state.config)return;positionFog();const trip=state.journey,path=$(trip?"#"+trip.pathId:"#leftPath");positionRunner(path,trip?trip.progress:0)});
fetch('game-config.json').then(r=>{if(!r.ok)throw Error('Не удалось загрузить настройки');return r.json()}).then(c=>{state.config=c;document.title=c.title;const params=new URLSearchParams(location.search),preview=params.get('preview');screens.game.classList.toggle('debug-routes',params.get('debugRoutes')==='1');if(preview==='game')begin();if(preview==='victory')showScreen('victory');if(preview==='defeat'){$("#defeatModal").hidden=false}}).catch(err=>{$("#startButton span").textContent='ОШИБКА ЗАГРУЗКИ';console.error(err)});
