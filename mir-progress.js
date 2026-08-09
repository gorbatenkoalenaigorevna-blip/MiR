(function(){
  "use strict";
  const KEY="mir.children.v1",ATTEMPT_PREFIX="mir.attempt.";
  const games={forest:"Лес звуков",river:"Речка слов",volcano:"Говорящий вулкан",flower:"Цветочная полянка",cliff:"Скала артикуляции"};
  const ranks=[
    {min:0,max:19,name:"Юный слушатель",image:"01-young-listener.png"},
    {min:20,max:49,name:"Искатель звуков",image:"02-sound-seeker.png"},
    {min:50,max:99,name:"Собиратель слов",image:"03-word-collector.png"},
    {min:100,max:179,name:"Строитель предложений",image:"04-sentence-builder.png"},
    {min:180,max:299,name:"Хранитель историй",image:"05-story-keeper.png"},
    {min:300,max:Infinity,name:"Мастер МИРа",image:"06-mir-master.png"}
  ];
  function empty(){return{version:1,activeId:null,profiles:[]}}
  function load(){try{const data=JSON.parse(localStorage.getItem(KEY));return data&&Array.isArray(data.profiles)?data:empty()}catch{return empty()}}
  function save(data){localStorage.setItem(KEY,JSON.stringify(data));dispatchEvent(new CustomEvent("mir:profile-change",{detail:data}));return data}
  function cleanNick(value){return String(value||"").replace(/[^А-Яа-яЁёA-Za-z0-9 _-]/g,"").trim().replace(/\s+/g," ").slice(0,18)}
  function create(nick,avatar){const data=load(),safe=cleanNick(nick);if(safe.length<2)throw Error("Введите игровой ник — от 2 до 18 символов");const profile={id:`child-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,nick:safe,avatar:Math.max(1,Math.min(16,Number(avatar)||1)),sparks:0,best:{forest:0,river:0,volcano:0},completed:{forest:0,river:0,volcano:0},attempts:{},daily:{},createdAt:Date.now(),updatedAt:Date.now()};data.profiles.push(profile);data.activeId=null;save(data);return profile}
  function select(id){const data=load();if(!data.profiles.some(p=>p.id===id))return null;data.activeId=id;save(data);return active()}
  function active(){const data=load();return data.profiles.find(p=>p.id===data.activeId)||null}
  function rankFor(sparks){return ranks.find(r=>sparks>=r.min&&sparks<=r.max)||ranks[0]}
  function nextRank(sparks){const index=ranks.indexOf(rankFor(sparks));return ranks[index+1]||null}
  function dayKey(){const d=new Date;return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function attemptKey(game){return ATTEMPT_PREFIX+game}
  function startAttempt(game){if(!games[game]||!active())return null;const attempt={id:`${game}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,game,correct:0,finished:false};sessionStorage.setItem(attemptKey(game),JSON.stringify(attempt));return attempt.id}
  function getAttempt(game){try{return JSON.parse(sessionStorage.getItem(attemptKey(game)))||null}catch{return null}}
  function mutateActive(callback){const data=load(),profile=data.profiles.find(p=>p.id===data.activeId);if(!profile)return null;callback(profile,data);profile.updatedAt=Date.now();save(data);return profile}
  function correct(game){const attempt=getAttempt(game);if(!attempt||attempt.finished)return null;attempt.correct++;sessionStorage.setItem(attemptKey(game),JSON.stringify(attempt));return mutateActive(profile=>{profile.sparks++;profile.attempts[attempt.id]=profile.attempts[attempt.id]||{correct:0,finished:false};profile.attempts[attempt.id].correct=attempt.correct})}
  function finish(game,{score=0,completed=true}={}){const attempt=getAttempt(game);if(!attempt||attempt.finished)return{awarded:0,duplicate:true,profile:active()};let awarded=0,newRecord=false,firstToday=false;const profile=mutateActive(profile=>{const saved=profile.attempts[attempt.id]||{};if(saved.finished)return;attempt.finished=true;saved.finished=true;saved.correct=attempt.correct;saved.score=Number(score)||0;saved.completed=!!completed;profile.attempts[attempt.id]=saved;if(completed){profile.sparks+=5;awarded+=5;profile.completed[game]=(profile.completed[game]||0)+1}const value=Math.max(0,Number(score)||0);if(value>(profile.best[game]||0)){profile.best[game]=value;profile.sparks+=3;awarded+=3;newRecord=true}const day=dayKey();if(completed&&!profile.daily[day]){profile.daily[day]=attempt.id;profile.sparks+=2;awarded+=2;firstToday=true}});sessionStorage.setItem(attemptKey(game),JSON.stringify(attempt));return{awarded,newRecord,firstToday,duplicate:false,profile}}
  function clearActive(){const data=load();data.activeId=null;save(data)}
  function deleteProfile(id){const data=load(),before=data.profiles.length;data.profiles=data.profiles.filter(profile=>profile.id!==id);if(data.profiles.length===before)return false;for(let index=sessionStorage.length-1;index>=0;index--){const key=sessionStorage.key(index);if(key&&key.startsWith(ATTEMPT_PREFIX))sessionStorage.removeItem(key)}if(data.profiles.length){data.activeId=null;save(data);["mir.volcano.lastScore","mir.volcano.bestScore"].forEach(key=>localStorage.removeItem(key))}else{for(let index=localStorage.length-1;index>=0;index--){const key=localStorage.key(index);if(key&&key.startsWith("mir."))localStorage.removeItem(key)}dispatchEvent(new CustomEvent("mir:profile-change",{detail:empty()}))}return true}
  window.MirProgress={KEY,games,ranks,load,save,create,select,active,rankFor,nextRank,startAttempt,correct,finish,clearActive,deleteProfile,cleanNick};
})();
