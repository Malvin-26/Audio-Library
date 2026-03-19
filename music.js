const audio=document.getElementById("audio");
const songList=document.getElementById("songList");
const title=document.getElementById("songTitle");
const artist=document.getElementById("artistName");
const cover=document.getElementById("coverImage");
const lyricsBox=document.getElementById("lyricsBox");
const progress=document.getElementById("progress");
const timeDisplay=document.getElementById("time");

let songs=[];
let currentIndex=-1;

/* Format time to mm:ss */
function formatTime(seconds){
if(!seconds || isNaN(seconds)) return "0:00";
const mins=Math.floor(seconds/60);
const secs=Math.floor(seconds%60);
return `${mins}:${secs<10?"0":""}${secs}`;
}

/* Fetch songs */
fetch("/api/songs")
.then(r=>r.json())
.then(data=>{
songs=data;
renderSongs();
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
deleteBtn.innerText="✕";
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

audio.src=s.file;
title.innerText=s.title;
artist.innerText=s.artist; 
cover.src=s.cover;
lyricsBox.innerText=s.lyrics;

audio.play();
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
function deleteSong(songId){
if(confirm("Are you sure you want to delete this song?")){
fetch("/api/songs/"+songId,{
method:"DELETE"
})
.then(r=>{
if(!r.ok) throw new Error("Failed to delete");
return r.json();
})
.then(()=>{
fetch("/api/songs")
.then(r=>r.json())
.then(data=>{
songs=data;
if(currentIndex>=songs.length) currentIndex=-1;
renderSongs();
})
.catch(err=>console.error("Error fetching songs:",err));
})
.catch(err=>{
console.error("Delete error:",err);
alert("Failed to delete song");
});
}
}

/* Handle Add Song Form Submission */
document.getElementById("addSongForm").addEventListener("submit",(e)=>{
e.preventDefault();

const newSong={
title:document.getElementById("newSongTitle").value,
artist:document.getElementById("newSongArtist").value,
file:document.getElementById("newSongFile").value,
cover:document.getElementById("newSongCover").value,
lyrics:document.getElementById("newSongLyrics").value
};

fetch("/api/songs",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(newSong)
})
.then(r=>r.json())
.then(()=>{
fetch("/api/songs")
.then(r=>r.json())
.then(data=>{
songs=data;
renderSongs();
closeAddSongModal();
});
});
});

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
