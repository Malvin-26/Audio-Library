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

/* File input label updates */
document.getElementById("newSongFile").addEventListener("change",function(){
const label=document.getElementById("songFileLabel");
if(this.files&&this.files[0]){
label.innerText="🎵 "+this.files[0].name;
}else{
label.innerText="🎵 Choose MP3 File";
}
});

document.getElementById("newSongCover").addEventListener("change",function(){
const label=document.getElementById("coverFileLabel");
const preview=document.getElementById("coverPreview");
if(this.files&&this.files[0]){
label.innerText="🖼️ "+this.files[0].name;
/* Show cover preview */
const reader=new FileReader();
reader.onload=function(e){
preview.innerHTML=`<img src="${e.target.result}" alt="Cover preview">`;
};
reader.readAsDataURL(this.files[0]);
}else{
label.innerText="🖼️ Choose Cover Image (JPG/PNG)";
preview.innerHTML="";
}
});

/* Handle Add Song Form Submission with file uploads */
document.getElementById("addSongForm").addEventListener("submit",(e)=>{
e.preventDefault();

const formData=new FormData();
formData.append("title",document.getElementById("newSongTitle").value);
formData.append("artist",document.getElementById("newSongArtist").value);
formData.append("lyrics",document.getElementById("newSongLyrics").value);

const songFileInput=document.getElementById("newSongFile");
const coverFileInput=document.getElementById("newSongCover");

if(songFileInput.files&&songFileInput.files[0]){
formData.append("songFile",songFileInput.files[0]);
}else{
alert("Please select an MP3 file");
return;
}

if(coverFileInput.files&&coverFileInput.files[0]){
formData.append("coverFile",coverFileInput.files[0]);
}else{
alert("Please select a cover image");
return;
}

/* Disable submit button during upload */
const submitBtn=e.target.querySelector("button[type=submit]");
submitBtn.disabled=true;
submitBtn.innerText="Uploading...";

fetch("/api/songs",{
method:"POST",
body:formData
})
.then(r=>{
if(!r.ok) return r.json().then(err=>{throw new Error(err.error||"Upload failed")});
return r.json();
})
.then(()=>{
fetch("/api/songs")
.then(r=>r.json())
.then(data=>{
songs=data;
renderSongs();
closeAddSongModal();
});
})
.catch(err=>{
console.error("Upload error:",err);
alert("Failed to add song: "+err.message);
})
.finally(()=>{
submitBtn.disabled=false;
submitBtn.innerText="Add Song";
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

/* Reset file labels and preview */
document.getElementById("songFileLabel").innerText="🎵 Choose MP3 File";
document.getElementById("coverFileLabel").innerText="🖼️ Choose Cover Image (JPG/PNG)";
document.getElementById("coverPreview").innerHTML="";
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
