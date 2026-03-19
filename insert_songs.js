const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./music.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
    process.exit(1);
  }
  console.log("Connected to database");
});

const songs = [
  {
    title: "Raasathi Unna Kaanatha Nenju",
    artist:"By Ilayaraja",
    file: "https://dl.masswala.com/Vijayakanth/Vaidehi_Kathirunthal/Rasathi_Unnai_[MassWala.Com].mp3",
    cover: "https://i1.sndcdn.com/artworks-000069625654-t5p3jn-t1080x1080.jpg",
    lyrics: `Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu
Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu

Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu
Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu

Pozhudhaagi pochu
Velakethiyaachu
Ponmaanae onna theduthu

Raasaathi unna kaannadha nenju

Kaathaadi polaadudhu


Kannukkoru vannakilii
Kaadhukkoru gaanakkuyil
Nenjukkoru vanjikkodi needhaanamma
Kannukkoru vannakilii
Kaadhukkoru gaanakkuyil
Nenjukkoru vanjikkodi needhaanamma

Thathi thavalum thangha chimizhae
Ponghi perghum sangha tamizhae
Mutham thara nitham varum natchathiram
Yaarodu inghu ennaku enna pechu
Nee thaanae kannae naan vanghum moochu
Vazhnthaga vendum vaa vaa kannae


Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu
Pozhudhaagi pochu
Velakethiyaachu
Ponmaanae onna theduthu
Raasaathi unna kaannadha nenju

Kaathaadi polaadudhu

Mangai oru gangai ena
Mannan oru kannan ena
Kaadhil oru kaadhal kadhai
Sonnaal enna
Mangai oru gangai ena
Mannan oru kannan ena
Kaadhil oru kaadhal kadhai
Sonnaal enna

Athai magaloo..maaman magaloo
Sondham edhuvoo..bandham edhuvoo
Sandhithathum sindhithadhum thithithida
Ammaadi needhaan illaadha naanum
Venmegam vandhu neendhaadha vaanam
Thangaadha ekkam podhum podhum

Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu
Pozhudhaagi pochu
Velakethiyaachu
Ponmaanae onna theduthu
Raasaathi unna kaannadha nenju
Kaathaadi polaadudhu
Kaathaadi polaadudhu`
  },
  {
    title: "The Nights",
    artist:"By Avicii",
    file: "https://archive.org/download/01-avicii-the-nights-audio/01%20-%20Avicii%20-%20The%20Nights%20%28Audio%29.mp3",
    cover: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%2Fid%2FOIP.5dNhPGusv9iK0A-vSflZvgAAAA%3Fpid%3DApi&f=1&ipt=e10860754e8dde5a8425d6cce9d4f3539eb51bcc91b5d84111fcbb8eb4625edb&ipo=images",
    lyrics: `[Intro]
(Hey)

[Verse 1]
Once upon a younger year
When all our shadows disappeared
The animals inside came out to play
(Hey) Went face to face with all our fears
Learned our lessons through the tears
Made memories we knew would never fade

[Pre-Chorus]
One day my father he told me
"Son, don't let it slip away"
He took me in his arms, I heard him say (Hey)
"When you get older
Your wild heart will live for younger days
Think of me if ever you're afraid"

[Chorus]
He said, "One day you'll leave this world behind
So live a life you will remember"
My father told me when I was just a child
"These are the nights that never die"
My father told me
You might also like
7 Minute Drill
J. Cole
loml
Taylor Swift
Who's Afraid of Little Old Me?
Taylor Swift
[Build]
(Hey, hey)
(Hey, hey)
(Hey, hey)

[Drop]
(Hey, hey)
(Hey, hey)
(Hey, hey)
(Hey, hey)

[Verse 2]
When thunderclouds start pouring down
Light a fire they can't put out
Carve your name into those shining stars
He said, "Go venture far beyond the shores
Don't forsake this life of yours
I'll guide you home no matter where you are"

[Pre-Chorus]
One day my father, he told me
"Son, don't let it slip away"
When I was just a kid, I heard him say
"When you get older
Your wild heart will live for younger days
Think of me if ever you're afraid"
[Chorus]
He said, "One day you'll leave this world behind
So live a life you will remember"
My father told me when I was just a child
"These are the nights that never die"
My father told me

[Build]
(Hey, hey)
(Hey, hey)
(Hey, hey)
"These are the nights that never die"
My father told me

[Drop]
(Hey, hey)
(Hey, hey)
(Ooh-woah, oh-oh-oh-oh-oh-oh, oh-oh)
(Hey, hey)
(Hey)
(Hey, hey)
(Hey, hey)
(Ooh-woah, oh-oh-oh-oh-oh-oh, oh-oh)
(Hey, hey)

[Outro]
My father told me`
  },
  {
    title: "Ambarsariya",
    artist:"By Arijit Singh",
    file: "https://cdnsongs.com/dren/music/data/Punjabi_Movies/201403/Fukrey/128/Ambarsariya_6.mp3/Ambarsariya%206.mp3",
    cover: "data:image/jpeg;base64,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",
    lyrics: `Chords: Am G F E 
 
 
[Verse]
 
               
Gali mein maare phere paas aane ko mere..
                      
..gali mein maare phere paas aane ko mere
              
kabhi parakhta nain mere tu
       
kabhi parakhta tor

kabhi parakhta nain mere tu
 
kabhi parakhta tor..
 
 
[Chorus]
 
                       
..Ambarsariya mundave kachiya kaliyaan na tod
                       
..Ambarsariya mundave kachiya kaliyaan na tod
                        
..Teri Maane bole hain mujhe teekhe se bol
                            
..Teri Maane bole hain mujhe teekhe se bol Ambarsariya..Aa
                          
..Ho ambarsariya..Aa..
 
 
[Verse]
 
                        
Main kaliyon ke jaisi meri alhad umar niyadi
                       
chhoti si yeh jaan meri aur joban behta (paani} (2x)
                      
Jab se chadhi jawaani dhoondhti dil da haani..
                            
..jab se chadhi jawaani dhoondhti dil da haani

main anjani ko ye pani lena jaave rod

Ho..Oogori gori meri kalai haaye..aey..aey.. 

Oo..gori gori meri kalai choodiyaan kaali kaali

main sharmati roz lagati kaajal surma laali..
`
  }
];

let inserted = 0;

songs.forEach((song) => {
  db.run(
    "INSERT INTO songs (title, artist, file, cover, lyrics) VALUES (?, ?, ?, ?, ?)",
    [song.title,song.artist, song.file, song.cover, song.lyrics],
    (err) => {
      if (err) {
        console.error(`Error inserting ${song.title}:`, err);
      } else {
        inserted++;
        console.log(`✓ Inserted: ${song.title}`);
        if (inserted === songs.length) {
          console.log("\n✓ All songs inserted successfully!");
          db.close();
        }
      }
    }
  );
});
