const audio=document.getElementById("audio");
const songList=document.getElementById("songList");
const title=document.getElementById("songTitle");
const artist=document.getElementById("artistName");
const cover=document.getElementById("coverImage");
const lyricsBox=document.getElementById("lyricsBox");
const progress=document.getElementById("progress");
const timeDisplay=document.getElementById("time");
const volumeSlider=document.getElementById("volumeSlider");

const SUPABASE_URL="https://pnysywzorgsomfvpuvic.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueXN5d3pvcmdzb21mdnB1dmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MTU2NTcsImV4cCI6MjA4OTQ5MTY1N30.8_trlRVo5AtedeVEIT6ZDg2i3qVe11QBK-NZKC86xHI";
const SONGS_ENDPOINT=`${SUPABASE_URL}/rest/v1/songs`;
const SUPABASE_HEADERS={
apikey:SUPABASE_ANON_KEY,
Authorization:`Bearer ${SUPABASE_ANON_KEY}`,
};

let songs=[];
let currentIndex=-1;

/* Format time to mm:ss */
function formatTime(seconds){
if(!seconds || isNaN(seconds)) return "0:00";
const mins=Math.floor(seconds/60);
const secs=Math.floor(seconds%60);
return `${mins}:${secs<10?"0":""}${secs}`;
}

async function getErrorMessage(response){
try{
const payload=await response.json();
return payload?.error||payload?.message||`Request failed (${response.status})`;
}catch{
return `Request failed (${response.status})`;
}
}

/* Fetch songs */
async function fetchSongs(){
const res=await fetch(`${SONGS_ENDPOINT}?select=*&order=id.asc`,{
headers:SUPABASE_HEADERS,
});

if(!res.ok){
throw new Error(await getErrorMessage(res));
}

songs=await res.json();
renderSongs();
}

fetchSongs().catch(err=>{
console.error("Error fetching songs:",err);
alert("Failed to load songs. Check your internet connection and Supabase permissions.");
});

function renderSongs(){
songList.innerHTML="";

songs.forEach((s,i)=>{
const div=document.createElement("div");
div.className="song";

const titleSpan=document.createElement("span");
titleSpan.innerText=s.title;
titleSpan.style.cursor="pointer";
titleSpan.onclick=()=>loadSong(i);
titleSpan.style.flex="1";

const deleteBtn=document.createElement("button");
deleteBtn.innerText="X";
deleteBtn.className="delete-btn";
deleteBtn.onclick=(e)=>{
e.stopPropagation();
deleteSong(s.id);
};

div.appendChild(titleSpan);
div.appendChild(deleteBtn);
div.style.display="flex";
div.style.alignItems="center";
div.style.justifyContent="space-between";

songList.appendChild(div);
});
}

function loadSong(i){
currentIndex=i;
const s=songs[i];
if(!s) return;

audio.src=s.file;
title.innerText=s.title;
artist.innerText=s.artist;
cover.src=s.cover;
lyricsBox.innerText=s.lyrics||"";

audio.play().catch(()=>{});
}

function togglePlay(){
if(audio.paused) audio.play();
else audio.pause();
}

function nextSong(){
if(currentIndex<songs.length-1) loadSong(currentIndex+1);
}

function prevSong(){
if(currentIndex>0) loadSong(currentIndex-1);
}

audio.addEventListener("timeupdate",()=>{
progress.max=audio.duration||0;
progress.value=audio.currentTime;
timeDisplay.innerText=`${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

audio.addEventListener("loadedmetadata",()=>{
timeDisplay.innerText=`0:00 / ${formatTime(audio.duration)}`;
});

progress.addEventListener("input",()=>{
audio.currentTime=progress.value;
});

/* Delete Song Function */
async function deleteSong(songId){
if(!confirm("Are you sure you want to delete this song?")) return;

try{
const response=await fetch(`${SONGS_ENDPOINT}?id=eq.${encodeURIComponent(songId)}`,{
method:"DELETE",
headers:{
...SUPABASE_HEADERS,
Prefer:"return=minimal",
},
});

if(!response.ok){
throw new Error(await getErrorMessage(response));
}

await fetchSongs();
if(currentIndex>=songs.length) currentIndex=-1;
}catch(err){
console.error("Delete error:",err);
alert("Failed to delete song");
}
}

/* Handle Add Song Form Submission */
const addSongForm=document.getElementById("addSongForm");
if(addSongForm){
addSongForm.addEventListener("submit",async (e)=>{
e.preventDefault();

const newSong={
title:document.getElementById("newSongTitle").value,
artist:document.getElementById("newSongArtist").value,
file:document.getElementById("newSongFile").value,
cover:document.getElementById("newSongCover").value,
lyrics:document.getElementById("newSongLyrics").value,
};

try{
const response=await fetch(SONGS_ENDPOINT,{
method:"POST",
headers:{
...SUPABASE_HEADERS,
"Content-Type":"application/json",
Prefer:"return=representation",
},
body:JSON.stringify([newSong]),
});

if(!response.ok){
throw new Error(await getErrorMessage(response));
}

await fetchSongs();
closeAddSongModal();
}catch(err){
console.error("Add song error:",err);
alert("Failed to add song");
}
});
}

/* Modal open/close */
function openAddSongModal(){
const modal=document.getElementById("addSongModal");
if(modal) modal.style.display="block";
}

function closeAddSongModal(){
const modal=document.getElementById("addSongModal");
if(!modal) return;

modal.style.display="none";

/* reset form for next use */
const form=document.getElementById("addSongForm");
if(form) form.reset();
}

/* Close modal when clicking outside (addEventListener so we don't overwrite other handlers) */
window.addEventListener("click",(event)=>{
const modal=document.getElementById("addSongModal");
if(event.target===modal) closeAddSongModal();
});

/* Close modal on Esc */
window.addEventListener("keydown",(event)=>{
if(event.key==="Escape") closeAddSongModal();
});

if(volumeSlider){
volumeSlider.value="100";
audio.volume=1;
volumeSlider.addEventListener("input",(event)=>{
audio.volume=Number(event.target.value)/100;
});
}
