let wateringSchedules=[],schedulesReady=false;
function scheduledDate(p){const schedule=wateringSchedules.find(s=>s.plantId===String(p.id));if(schedule)return new Date(schedule.date+"T"+schedule.time+":00");const date=new Date(p.last+"T09:00:00");date.setDate(date.getDate()+p.interval);return date}

const $=id=>document.getElementById(id),today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`},diff=(a,b)=>Math.floor((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000);
const initial=[{id:1,name:"Misty",type:"Houseplant",emoji:"🪴",interval:6,last:today()},{id:2,name:"Sunny",type:"Flower",emoji:"🌻",interval:3,last:today()},{id:3,name:"Minty",type:"Herb",emoji:"🌿",interval:2,last:today()}];
const notify=message=>{$("appStatus").textContent=message;$("appStatus").hidden=false};
const validDate=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+"T12:00:00"));
const safePhoto=value=>typeof value==="string"&&value.length<=2800000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
function readSaved(key,fallback,valid){try{const raw=localStorage.getItem(key);if(raw===null)return fallback;const data=JSON.parse(raw);if(!Array.isArray(data)||!data.every(valid))throw Error();return data}catch{notify("Some saved data is unavailable or invalid. Bloom is showing a safe starting view.");return fallback}}
let plants=readSaved("bloomPlants",initial,p=>p&&Number.isSafeInteger(p.id)&&typeof p.name==="string"&&p.name.length<=100&&typeof p.type==="string"&&typeof p.emoji==="string"&&Number.isInteger(p.interval)&&p.interval>=1&&p.interval<=60&&validDate(p.last)),diary=readSaved("bloomDiary",[],e=>e&&typeof e.plant==="string"&&typeof e.note==="string"&&e.note.length<=4000&&validDate(e.date)&&(!e.photo||safePhoto(e.photo)));
const save=()=>{try{localStorage.setItem("bloomPlants",JSON.stringify(plants));localStorage.setItem("bloomDiary",JSON.stringify(diary));return true}catch{notify("Your latest change could not be saved. Browser storage may be full or blocked. Keep a separate copy before leaving this page.");return false}},due=p=>scheduledDate(p)<=new Date(),left=p=>Math.max(0,Math.round((new Date(scheduledDate(p).getFullYear(),scheduledDate(p).getMonth(),scheduledDate(p).getDate())-new Date(today()+"T00:00:00"))/86400000));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){$("plantCount").textContent=plants.length;$("dueCount").textContent=plants.filter(due).length;$("diaryCount").textContent=diary.length;
$("plantGrid").innerHTML=plants.length?plants.map(p=>`<article class="card"><div class="planttop"><div class="plantemoji">${esc(p.emoji)}</div><span class="pill ${due(p)?'due':''}">${due(p)?'💧 Water check':'🌿 Growing'}</span></div><h4>${esc(p.name)}</h4><div class="muted">${esc(p.type)}</div><div class="care"><span>${due(p)?'Water may be due':'Next water check'}</span><b>${due(p)?'Today':left(p)+' day(s)'}</b></div><div class="bar"><span style="width:${Math.min(100,Math.max(5,diff(p.last,today())/p.interval*100))}%"></span></div><div class="rowbtn"><button class="primary small" data-action="water" data-id="${p.id}">💧 Watered</button><button class="secondary small" data-action="chat" data-id="${p.id}">💬 Chat</button></div></article>`).join(""):`<div class="empty" style="grid-column:1/-1"><div>🪴</div><b>Your garden is waiting!</b><p>Add your first plant buddy.</p></div>`;
$("gardenPlants").innerHTML=plants.length?plants.map(p=>`<div class="gplant">${esc(p.emoji)}<small>${esc(p.name)}</small></div>`).join(""):'<div class="empty"><div>🌱</div><b>Room for your first leafy friend!</b></div>';
$("diaryList").innerHTML=diary.length?diary.slice().reverse().map(e=>`<div class="entry">${e.photo?`<img src="${esc(e.photo)}" alt="Plant memory">`:'<div class="plantemoji" style="font-size:30px;width:68px;height:68px">📔</div>'}<div><b>${esc(e.plant)}</b><div class="muted">${esc(e.date)}</div><p>${esc(e.note||'A little moment with my plant.')}</p></div></div>`).join(""):'<div class="empty"><div>📸</div><b>No memories yet</b><p>Save a photo or note.</p></div>';
renderReminderList();
$("dPlant").innerHTML=plants.map(p=>`<option>${esc(p.name)}</option>`).join("")}
$("plantGrid").addEventListener("click",event=>{const b=event.target.closest("button[data-action]");if(!b)return;const id=Number(b.dataset.id);if(b.dataset.action==="water")water(id);else chat(id)});
window.water=async id=>{let p=plants.find(x=>x.id===id);if(!p)return;const schedule=wateringSchedules.find(s=>s.plantId===String(id));if(schedule){const next=new Date(today()+"T12:00:00");next.setDate(next.getDate()+schedule.interval);const date=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-${String(next.getDate()).padStart(2,"0")}`;try{await storeSchedule({...schedule,date})}catch{notify("Could not update the reminder. Try Watered again when you are connected.");return}}p.last=today();save();render();chat(id,"Thank you for giving me a drink! 💧")};
window.chat=(id,msg)=>{let p=plants.find(x=>x.id===id);if(!p)return;$("talkName").textContent=p.name+" says:";$("talkText").textContent=msg||(due(p)?"Psst… I might be ready for a little water! 💦":"I'm feeling leafy and lovely today! 🌿");document.querySelector(".talk").scrollIntoView({behavior:"smooth",block:"nearest"})};
let lastFocus;function open(id){lastFocus=document.activeElement;$(id).classList.add("show");$(id).querySelector("input,select,textarea,button")?.focus()}function close(id){$(id).classList.remove("show");lastFocus?.focus()}function add(){ $("pName").value="";$("pLast").value=today();$("pInterval").value=5;open("plantModal")}
["addTop","heroAdd","addHome"].forEach(id=>$(id).onclick=add);document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
$("savePlant").onclick=()=>{let name=$("pName").value.trim(),interval=+$("pInterval").value;if(!name||name.length>100||!Number.isInteger(interval)||interval<1||interval>60||!validDate($("pLast").value)||$("pLast").value>today()){alert("Enter a name (up to 100 characters), an interval of 1–60 whole days, and a valid date no later than today.");return}plants.push({id:Date.now(),name,type:$("pType").value,emoji:$("pEmoji").value,interval,last:$("pLast").value||today()});save();render();checkReminders();close("plantModal")};
$("newEntry").onclick=()=>{if(!plants.length){alert("Add a plant first.");return}$("dNote").value="";$("dPhoto").value="";open("diaryModal")};
$("saveDiary").onclick=()=>{let file=$("dPhoto").files[0],done=photo=>{diary.push({plant:$("dPlant").value,note:$("dNote").value.trim(),date:today(),photo});save();render();close("diaryModal")};if($("dNote").value.length>4000){alert("Keep notes under 4,000 characters.");return}if(file){if(!validFile(file))return;const button=$("saveDiary");button.disabled=true;let r=new FileReader();r.onload=()=>{button.disabled=false;if(safePhoto(r.result))done(r.result);else notify("This photo could not be read safely. Choose a JPEG, PNG or WebP photo.")};r.onerror=()=>{button.disabled=false;notify("Could not read this photo. Please choose it again.")};r.readAsDataURL(file)}else done("")};
function showView(id){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id))}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("tipJump").onclick=()=>{document.querySelector('[data-view="home"]').click();$("tipTitle").scrollIntoView({behavior:"smooth"})};
let tips=[["🌱 Check before you water","Touch the top inch of soil. If it feels dry, your plant may be ready for a drink."],["🍃 Dust your leaves","Wipe broad leaves gently with a soft damp cloth so they can use available light."],["🪴 Let roots breathe","Use pots with drainage holes and empty saucers after watering."],["☀️ Find the right light","Bright, indirect light suits many houseplants. Watch how your plant responds."],["✂️ Trim with care","Remove fully yellow or dead leaves with clean scissors."]],tip=tips[new Date().getDate()%tips.length];$("tipTitle").textContent=tip[0];$("tipText").textContent=tip[1];
function validFile(file){if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2*1024*1024){notify("Choose a JPEG, PNG or WebP photo smaller than 2 MB.");return false}return true}
let previewUrl;
$("plantPhoto").onchange=e=>{if(previewUrl)URL.revokeObjectURL(previewUrl);$("photoPreview").removeAttribute("src");$("photoPreview").style.display="none";$("identifyResult").hidden=true;let f=e.target.files[0];if(f&&validFile(f)){previewUrl=URL.createObjectURL(f);$("photoPreview").src=previewUrl;$("photoPreview").style.display="block"}else e.target.value=""};
$("identifyBtn").onclick=()=>{let shape=$("leafShape").value,clue=$("plantClue").value.toLowerCase(),matches={oval:["Pothos","Rubber plant","Peace lily"],heart:["Heartleaf philodendron","Pothos","Anthurium"],long:["Snake plant","Spider plant","Dracaena"],round:["Chinese money plant","Pilea","String of pearls"],fern:["Boston fern","Maidenhair fern","Asparagus fern"]}[shape];if(clue.includes("thick")||clue.includes("fleshy"))matches=["Jade plant","Echeveria","Aloe vera"];$("identifyResult").hidden=false;$("identifyResult").innerHTML="<b>🔎 Possible matches to investigate:</b><br>"+matches.map((x,i)=>(i+1)+". "+x).join("<br>")+"<br><br>Compare leaf details, stems and growth habit before deciding. These are clue-based suggestions, not a confirmed identification."};
function advice(code,temp,rain){if(rain>.5)return["🌧️ Rainy-day plant check","Outdoor pots may already be getting moisture. Check the soil before watering and make sure pots drain freely."];if(temp>=32)return["☀️ Hot-day plant care","Check outdoor pots more often, protect sensitive plants from harsh midday sun, and water the soil rather than hot leaves."];if(temp<=12)return["🧣 Cool-weather care","Growth may slow in cool weather. Check soil moisture before watering and keep tropical plants away from cold drafts."];return["🌤️ Today's gentle reminder","Check soil before watering. Indoor pots dry at different rates, so follow each plant's needs."]}
function getWeather(){ $("weatherDesc").textContent="Getting your local weather…";if(!navigator.geolocation){$("weatherDesc").textContent="Location is unavailable in this browser.";return}navigator.geolocation.getCurrentPosition(async pos=>{try{let {latitude,longitude}=pos.coords,res=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&current=temperature_2m,precipitation,weather_code&timezone=auto`,{credentials:"omit",referrerPolicy:"no-referrer",signal:AbortSignal.timeout(12000)});if(!res.ok)throw Error();let c=(await res.json()).current,temp=Math.round(c.temperature_2m),rain=c.precipitation||0,labels={0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",51:"Drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",80:"Showers",95:"Thunderstorm"};$("weatherPlace").textContent="Your area";$("weatherTemp").textContent=temp+"°C";$("weatherDesc").textContent=(labels[c.weather_code]||"Current conditions")+" · Rain "+rain+" mm";let a=advice(c.weather_code,temp,rain);$("weatherTipTitle").textContent=a[0];$("weatherTip").textContent=a[1]}catch(e){$("weatherDesc").textContent="Could not load weather. Please try again."}},()=>{$("weatherDesc").textContent="Location permission not granted. Allow access and try again."},{timeout:10000,maximumAge:600000})}
$("weatherBtn").onclick=getWeather;$("weatherRefresh").onclick=getWeather;

document.querySelectorAll(".modal").forEach(modal=>{modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");const heading=modal.querySelector("h3");heading.id=modal.id+"Title";modal.setAttribute("aria-labelledby",heading.id)});
document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll(".modal.show").forEach(modal=>close(modal.id))});
document.addEventListener("keydown",event=>{if(event.key!=="Tab")return;const modal=document.querySelector(".modal.show");if(!modal)return;const controls=[...modal.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]')],first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});

// Sound and delivery state last only for this open page.
let audioContext, soundEnabled=false, desktopEnabled=false;
const remindedChecks=new Set();
function nextWateringDate(p){return scheduledDate(p).toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}
function renderReminderList(){
  $("reminderPlants").innerHTML=plants.length?plants.slice().sort((a,b)=>left(a)-left(b)).map(p=>`<div class="reminder-item"><div><strong>${esc(p.name)}</strong><p class="featuretext">${due(p)?'Watering check due now':`Next watering check: ${esc(nextWateringDate(p))}`} · Every ${wateringSchedules.find(s=>s.plantId===String(p.id))?.interval||p.interval} day(s)</p></div><div class="reminder-controls"><button class="secondary small" data-edit-reminder="${p.id}">Edit reminder</button><button class="${due(p)?'primary':'secondary'} small" data-water-id="${p.id}">Watered</button></div></div>`).join(""):'<p class="featuretext">Add a plant and choose its watering interval to start receiving reminders.</p>';
  const ready=plants.filter(due);
  if(!ready.length)$("wateringAlert").hidden=true;
  else $("wateringMessage").textContent="Watering check due for "+ready.map(p=>p.name).join(", ")+". Check the soil and water if dry.";
}
$("reminderPlants").addEventListener("click",event=>{const button=event.target.closest("button[data-water-id]");if(button)water(Number(button.dataset.waterId))});
async function prepareAudio(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error("unsupported");if(!audioContext)audioContext=new Audio();if(audioContext.state!=="running")await audioContext.resume();if(audioContext.state!=="running")throw Error("blocked")}
function ring(){if(!audioContext||audioContext.state!=="running")return false;const start=audioContext.currentTime;[659.25,783.99,987.77,783.99].forEach((frequency,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),at=start+i*.26;oscillator.type="sine";oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.14,at+.025);gain.gain.exponentialRampToValueAtTime(.001,at+.4);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(at);oscillator.stop(at+.42)});return true}
const visibleChecks=new Set(),notifiedChecks=new Set();
function checkReminders(){
  renderReminderList();
  if(!schedulesReady)return;
  const ready=plants.filter(due),key=p=>`${p.id}:${p.last}:${scheduledDate(p).getTime()}`;
  if(!ready.length)return;
  if(ready.some(p=>!visibleChecks.has(key(p)))){
    $("wateringAlert").hidden=false;
    ready.forEach(p=>visibleChecks.add(key(p)));
  }
  const message="Watering check due for "+ready.map(p=>p.name).join(", ")+". Check the soil and water if dry.";
  if(soundEnabled&&ready.some(p=>!remindedChecks.has(key(p)))){
    if(ring())ready.forEach(p=>remindedChecks.add(key(p)));
    else{
      soundEnabled=false;$("enableSound").textContent="Enable ringtone";$("enableSound").setAttribute("aria-pressed","false");
      $("soundStatus").textContent="Sound is paused by your browser. Press Enable ringtone to resume.";
    }
  }
  if(desktopEnabled&&"Notification" in window&&Notification.permission==="granted"&&ready.some(p=>!notifiedChecks.has(key(p)))){
    try{
      const n=new Notification("Bloom · Time to check watering",{body:message,tag:"bloom-watering",silent:soundEnabled});
      ready.forEach(p=>notifiedChecks.add(key(p)));
      n.onclick=()=>{window.focus();showView("home");$("home").scrollIntoView({block:"start"});n.close()};
    }catch{$("soundStatus").textContent="Browser notifications are unavailable. Watering reminders still appear in Bloom."}
  }
}
$("enableSound").onclick=async()=>{if(soundEnabled){soundEnabled=false;$("enableSound").textContent="Enable ringtone";$("enableSound").setAttribute("aria-pressed","false");$("soundStatus").textContent="Ringtone is off.";return}try{await prepareAudio();soundEnabled=true;$("enableSound").textContent="Turn ringtone off";$("enableSound").setAttribute("aria-pressed","true");$("soundStatus").textContent="Ringtone is on for this visit. Each due watering check rings once.";checkReminders()}catch{$("soundStatus").textContent="Sound could not start. Check browser audio permissions and try again."}};
$("testSound").onclick=async()=>{try{await prepareAudio();ring();$("soundStatus").textContent="Test ringtone played. Ringtone reminders are "+(soundEnabled?"on.":"off; enable them to receive watering reminders.")}catch{$("soundStatus").textContent="Sound is unavailable. Check browser audio permissions and device volume."}};
$("desktopReminders").onclick=async()=>{if(!("Notification" in window)){$("soundStatus").textContent="This browser does not support desktop notifications. Use ringtone reminders in Bloom.";return}try{const permission=await Notification.requestPermission();desktopEnabled=permission==="granted";$("desktopReminders").textContent=desktopEnabled?"Browser notifications enabled":"Enable browser notifications";$("soundStatus").textContent=desktopEnabled?"Browser notifications are on for this visit. Enable ringtone to hear Bloom’s watering alert.":"Notifications were not allowed. You can still enable the ringtone in Bloom.";checkReminders()}catch{$("soundStatus").textContent="Browser notifications are unavailable. You can still enable the ringtone in Bloom."}};
$("dismissReminder").onclick=()=>{$("wateringAlert").hidden=true};
setInterval(()=>{render();checkReminders()},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){render();checkReminders()}});
render();
checkReminders();

$("reminderJump").onclick=()=>{
  $("reminders").scrollIntoView({behavior:"smooth",block:"start"});
  $("enableSound").focus({preventScroll:true});
};

let editingReminder;
async function storeSchedule(schedule){
  const response=await fetch('/api/watering-schedules',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(schedule)});
  if(!response.ok)throw Error('save');
  const saved=await response.json();wateringSchedules=wateringSchedules.filter(s=>s.plantId!==saved.plantId).concat(saved);
}
$("reminderPlants").addEventListener('click',event=>{
  const button=event.target.closest('[data-edit-reminder]');if(!button)return;
  if(!schedulesReady){notify('Reminders are not loaded. Reload Bloom to try again.');return}
  const plant=plants.find(p=>String(p.id)===button.dataset.editReminder);if(!plant)return;
  editingReminder=plant;const schedule=wateringSchedules.find(s=>s.plantId===String(plant.id));
  $("reminderPlantName").textContent=plant.name;
  const next=scheduledDate(plant);const future=next>new Date()?next:new Date(Date.now()+3600000);
  $("reminderDate").value=schedule?.date||`${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')}`;
  $("reminderTime").value=schedule?.time||`${String(future.getHours()).padStart(2,'0')}:${String(future.getMinutes()).padStart(2,'0')}`;
  $("reminderInterval").value=schedule?.interval||plant.interval;$("reminderError").textContent='';open('reminderModal');
});
$("reminderForm").onsubmit=async event=>{
  event.preventDefault();const date=$("reminderDate").value,time=$("reminderTime").value,interval=Number($("reminderInterval").value);
  const next=new Date(date+'T'+time+':00');
  if(!Number.isFinite(next.getTime())||next<=new Date()||!Number.isInteger(interval)||interval<1||interval>60){$("reminderError").textContent='Choose a future date and time and an interval of 1–60 days.';return}
  const [hour,minute]=time.split(':').map(Number);if(next.getHours()!==hour||next.getMinutes()!==minute){$("reminderError").textContent='That time is skipped by a clock change. Choose another time.';return}
  $("saveReminder").disabled=true;
  try{await storeSchedule({plantId:String(editingReminder.id),date,time,interval});render();checkReminders();close('reminderModal');notify('Watering reminder saved. Enable ringtone and keep Bloom open to hear it.');}
  catch{$("reminderError").textContent='Could not save the reminder. Check your connection and try again.'}
  finally{$("saveReminder").disabled=false}
};
fetch('/api/watering-schedules').then(response=>{if(!response.ok)throw Error('load');return response.json()}).then(rows=>{wateringSchedules=rows;schedulesReady=true;render();checkReminders()}).catch(()=>notify('Saved reminders could not load. Reload Bloom to try again.'));
