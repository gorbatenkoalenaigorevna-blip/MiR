"use strict";
const soundButton=document.querySelector("#siteSound"),modal=document.querySelector("#storyModal"),modalCard=modal.querySelector(".story-card"),closeButton=document.querySelector("#storyClose"),storyImage=document.querySelector("#storyImage"),storyStage=document.querySelector("#storyStage"),storyTitle=document.querySelector("#storyTitle"),storyText=document.querySelector("#storyText"),storyAction=document.querySelector("#storyAction");
const storyBase="assets/ui/station-stories/";
const stations={
  kindergarten:{stage:"Этап 1",title:"Домик исследователя",image:"01-kindergarten-start.png",text:"В тёплом домике Яшка нашёл карту МИРа. Тропинка уже светится — пора отправляться в путешествие!",action:"Открыть личное пространство",next:"forest"},
  forest:{stage:"Этап 2",title:"Лес звуков",image:"02-forest-path-sounds.png",text:"В лес пробрался Туман и перепутал звуки. Помоги Яшке услышать их правильно и добраться до волшебных ворот.",action:"Играть",href:"forest-sounds-game/index.html"},
  meadow:{stage:"Этап 3",title:"Цветочная поляна",image:"03-flower-meadow-breathing.png",text:"Пять больших цветов уснули без ветерка. Яшка учится дышать плавно, чтобы лепестки снова закружились.",action:"Вернуться на карту"},
  cliff:{stage:"Этап 4",title:"Скала артикуляции",image:"04-articulation-cliff.png",text:"Скала хранит девять волшебных знаков зарядки для язычка. Яшка уже нашёл первый — сможешь заметить остальные?",action:"Вернуться на карту"},
  bridge:{stage:"Этап 5",title:"Волшебный мостик",image:"05-magic-bridge-syllables.png",text:"Мостик просыпается, когда звуки дружат и превращаются в слоги. Каждая верная пара зажигает новую дощечку.",action:"Вернуться на карту"},
  volcano:{stage:"Этап 6",title:"Говорящий вулкан",image:"06-talking-volcano-voice.png",text:"В вершине вулкана спрятан кристалл голоса. Произнеси звук — и голос поможет Яшке подняться выше.",action:"Играть",href:"talking-volcano-game-package-v1/index.html"},
  river:{stage:"Этап 7",title:"Речка слов",image:"07-river-of-words.png",text:"Речка пропускает только слова, в которых звук занял правильное место. Проведи лодку Яшки через все ворота.",action:"Играть",href:"river-words-game-package-v1/index.html"},
  sea:{stage:"Этап 8",title:"Море предложений",image:"08-sea-of-sentences.png",text:"У моря слова соединяются и оживают. Скоро Яшка соберёт из них целые предложения и свою первую историю.",action:"Вернуться на карту"}
};
const lockedMessages={
  meadow:"Цветы ещё собирают волшебное дыхание… Скоро полянка распустится для нового приключения!",
  cliff:"Тайная тропа пока скрыта туманом… Скоро Скала откроет испытания для ловких язычков!",
  bridge:"Слоговые ступеньки ещё зажигаются… Скоро Волшебный мостик откроет путь дальше!",
  sea:"Море ещё собирает слова в удивительные истории… Скоро здесь поднимутся паруса нового приключения!"
};
const lockedStations=new Set(Object.keys(lockedMessages));
let soundEnabled=localStorage.getItem("mir.site.sound")!=="off",audioContext=null,lastStationButton=null,currentStation=null;
function syncSound(){soundButton.textContent=soundEnabled?"♪":"×";soundButton.setAttribute("aria-pressed",String(!soundEnabled));soundButton.setAttribute("aria-label",soundEnabled?"Выключить звуки":"Включить звуки")}
function chime(){if(!soundEnabled)return;const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;if(!audioContext)audioContext=new AudioCtx;if(audioContext.state==="suspended")audioContext.resume();const now=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type="sine";osc.frequency.setValueAtTime(680,now);osc.frequency.exponentialRampToValueAtTime(920,now+.12);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.2);osc.connect(gain).connect(audioContext.destination);osc.start(now);osc.stop(now+.21)}
function openStory(key,button){const story=stations[key];if(!story||!lockedStations.has(key))return;currentStation=key;lastStationButton=button;modal.classList.add("locked-story-modal");modalCard.classList.add("locked-story-card");modalCard.dataset.lockedMessage=lockedMessages[key];storyImage.src=storyBase+story.image;storyImage.alt=`Иллюстрация станции «${story.title}»`;storyStage.textContent=story.stage;storyTitle.textContent=story.title;storyText.textContent="";storyAction.textContent="";storyAction.removeAttribute("href");modal.hidden=false;requestAnimationFrame(()=>closeButton.focus());chime()}
function closeStory({restoreFocus=true}={}){if(modal.hidden)return;modal.hidden=true;modal.classList.remove("locked-story-modal");modalCard.classList.remove("locked-story-card");delete modalCard.dataset.lockedMessage;storyImage.removeAttribute("src");if(restoreFocus&&lastStationButton)lastStationButton.focus();currentStation=null}
function highlightStation(key){const station=document.querySelector(`[data-station="${key}"]`);if(!station)return;station.classList.remove("story-next");requestAnimationFrame(()=>station.classList.add("story-next"));setTimeout(()=>station.classList.remove("story-next"),3000)}
document.querySelectorAll(".story-station").forEach(button=>{const key=button.dataset.station,story=stations[key];button.addEventListener("click",()=>{if(story?.href){chime();window.location.href=story.href;return}if(lockedStations.has(key))openStory(key,button)});button.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;event.preventDefault();button.click()})});
closeButton.addEventListener("click",()=>closeStory());modal.querySelector("[data-close-story]").addEventListener("click",()=>closeStory());
storyAction.addEventListener("click",event=>{event.preventDefault();closeStory()});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!modal.hidden)closeStory()});
soundButton.addEventListener("click",()=>{soundEnabled=!soundEnabled;localStorage.setItem("mir.site.sound",soundEnabled?"on":"off");syncSound();if(soundEnabled)chime()});
window.addEventListener("pagehide",()=>{if(audioContext)audioContext.close().catch(()=>{})});
syncSound();
