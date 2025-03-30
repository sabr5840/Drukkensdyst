

const admin = require('firebase-admin');

// Initialiser Firebase Admin SDK
const serviceAccount = require('/Users/sabrinahammerichebbesen/Desktop/Privat/Druk/backend/drukkensdyst-firebase-adminsdk-fbsvc-6a495fd00d.json'); // Husk at sætte den rigtige sti!

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Funktion til at tilføje spørgsmål til en bestemt samling
const addQuestion = async (collectionName, questionObj) => {
  try {
    const { question, answer, truth, dare, undercover } = questionObj;

    // Forbered data, så vi kun tilføjer de relevante felter
    const data = {
      question: question,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Hvis der er svar, så tilføj det også
    if (answer && answer.length > 0) {
      data.answers = answer;
    }

    // Hvis spørgsmålet er relateret til 'sandhed' eller 'konsekvens', tilføj disse felter
    if (truth) {
      data.truth = truth;
    }
    if (dare) {
      data.dare = dare;
    }

    // Hvis spørgsmålet har undercover, tilføj det
    if (undercover) {
      data.undercover = undercover;
    }

    // Tilføj data til Firestore
    await db.collection(collectionName).add(data);
    console.log(`✅ Tilføjet til ${collectionName}: ${question}`);
  } catch (error) {
    console.error(`❌ Fejl ved tilføjelse til ${collectionName}:`, error);
  }
};
// Data til hver samling
const data = {
  "storemester-udfordringer": [
    { "question": "Smelt en isterning hurtigst muligt. Du må ikke bruge ild, komfur eller radiatorer. Den, der smelter sin isterning hurtigst, vinder." },
    { "question": "Få en genstand til at snurre rundt. Den, der får genstanden til at snurre i længst tid, vinder. Du har 5 minutter." },
    { "question": "Udregn stormesterens alder i måneder. Du må ikke bruge din egen telefon som lommeregner. Den, der kommer tættest på, vinder." },
    { "question": "Byg det højeste tårn med én hånd. Alle skal bygge et tårn kun med én hånd ved hjælp af tilfældige genstande fra huset. I har 3 minutter. Tårnet skal stå selvstændigt i 10 sekunder for at blive godkendt." },
    { "question": "Find den længste genstand i huset på 2 minutter. Den, der finder den længste, vinder." },
    { "question": "Prøv at bære en skål med vand på hovedet i 1 minut uden at spilde. Den, der gør det bedst, vinder." },
    { "question": "Du har 3 minutter til at finde så mange ting som muligt, der starter med samme bogstav. Den, der finder flest, vinder." },
    { "question": "Vælg et hverdagsobjekt og find på tre kreative måder at bruge det på. Den mest opfindsomme måde vinder. I har 5 minutter." },
    { "question": "Genskab et berømt øjeblik fra historien. Find genstande i rummet og genskab et berømt øjeblik fra historien. Det kræver kreativitet og improvisation. Den bedste genskabelse vinder." },
    { "question": "Flyt væske fra en beholder til en anden uden at bruge hænderne. Den med den største mængde væske i deres beholder vinder." },
    { "question": "Rejs dig op, når du tror, at der er gået præcis 100 sekunder. Den, der er tættest på, vinder. Stormesteren tager tid på sin telefon." },
    { "question": "Den, der siger alfabetet baglæns uden fejl på kortest tid, vinder. En fra gruppen udvælges og har 2 forsøg." },
    { "question": "Lav en 1-minuts reklame for et absurd, men opfindsomt produkt, og brug ting fra rummet som rekvisitter. Den bedste reklame vinder. Du har 6 minutter." },
    { "question": "Arranger et mini-mode-show med de skøreste eller mest uventede beklædningsgenstande, du kan finde. Du har 3 minutter til forberedelse og opvisning." },
    { "question": "Én person i gruppen skal bruge sin krop til at forme bogstaver, der tilsammen danner et ord på mindst 4 bogstaver. Ordet vælges af stormesteren, men resten af gruppen må ikke kende det på forhånd. De andre deltagere skal gætte ordet, og den første, der gætter rigtigt, vinder." },
    { "question": "Hver gruppe vælger en repræsentant, der skal deltage i en stirrekonkurrence mod den modsatte gruppe. Deltagerne skiftes til at forsøge at få modstanderen til at grine. Den, der holder masken længst, vinder!" },
    { "question": "Stormesteren vælger et ord, som hver gruppe skal forsøge at skrive. Hver gruppe udpeger en repræsentant, der skal skrive ordet på et papir – med lukkede øjne! Den deltager, der kommer tættest på at skrive ordet korrekt, vinder." },
    { "question": "Stormesteren vælger tre vilkårlige ord, som hvert hold skal bruge til at skabe en historie. I har 10 minutter til at finde på den mest kreative og underholdende fortælling. Den sjoveste og mest opfindsomme præstation vinder!" },
    { "question": "Find en lille genstand og kast den op i luften. Udfordringen er at fange den med den skøreste genstand, I kan finde! Hver deltager har 2 minutter og 10 forsøg. Den, der fanger flest gange uden at tabe, vinder!" },
    { "question": "Stormesteren vælger et emne, og deltagerne har 1 minut til at fortælle en historie om det, uden at sige ordet 'jeg'. Historien skal bestå af præcis 15 ord, og den skal have en start, en midte og en slutning. Alle i gruppen skal stå på ét ben, og historien kan laves, så længe balancen holdes. Hvis nogen mister balancen og står på to ben, er tiden slut. Den, der klarer det bedst, vinder!" }
  ],
"undercover": [
    { "question": "Film", "undercover": "Serie" },
    { "question": "Paraply", "undercover": "Regntøj" },
    { "question": "Højtaler", "undercover": "Høretelefoner" },
    { "question": "Regn", "undercover": "Storm" },
    { "question": "Bamse", "undercover": "Dukke" },
    { "question": "Morgenmad", "undercover": "Aftensmad" },
    { "question": "Lommelygte", "undercover": "Tændstik" },
    { "question": "Afføring", "undercover": "Urin" },
    { "question": "Eksperimentere", "undercover": "Rollespil" },
    { "question": "Film", "undercover": "Popcorn" },
    { "question": "Skov", "undercover": "Træer" },
    { "question": "Tandpasta", "undercover": "Hvidt smil" },
    { "question": "Brandmand", "undercover": "Superhelt" },
    { "question": "Astronaut", "undercover": "Måne" },
    { "question": "Lærer", "undercover": "Skolebøger" },
    { "question": "Skuespiller", "undercover": "Hollywood" },
    { "question": "Revisor", "undercover": "Excel" },
    { "question": "Pilot", "undercover": "Cockpit" },
    { "question": "Gamer", "undercover": "Xbox" },
    { "question": "Forretningsmand", "undercover": "Møder" },
    { "question": "London", "undercover": "Big Ben" },
    { "question": "Los Angeles", "undercover": "Hollywood" },
    { "question": "Tennis", "undercover": "Ketsjer" },
    { "question": "Faldskærmsudspring", "undercover": "Højde" },
    { "question": "Telefon", "undercover": "Oplader" },
    { "question": "Skat", "undercover": "Penge" },
    { "question": "Stjerne", "undercover": "Galakse" },
    { "question": "Køleskab", "undercover": "Mad" },
    { "question": "Juleaften", "undercover": "Gaver" },
    { "question": "Bord", "undercover": "Tallerken" },
    { "question": "Sand", "undercover": "Strand" },
    { "question": "Grill", "undercover": "Pølse" },
    { "question": "Kaffe", "undercover": "Kop" },
    { "question": "Sommer", "undercover": "Solbriller" }
],
"jeopardy": [
    { "question": "Hvilken film fra 1994, instrueret af Robert Zemeckis, indeholder en berømt sætning: 'Life is like a box of chocolates.'", "answer": "Forrest Gump" },
    { "question": "Denne flod er den længste i verden og flyder gennem flere afrikanske lande, herunder Egypten.", "answer": "Nilen" },
    { "question": "Hvilken basketballspiller blev kaldt 'His Airness' og er betragtet som den bedste spiller i NBA-historien?", "answer": "Michael Jordan" },
    { "question": "Hvad hedder det amerikanske tech-selskab, grundlagt af Steve Jobs, Steve Wozniak og Ronald Wayne?", "answer": "Apple" },
    { "question": "Hvilken italiensk maler og opfinder malede 'Mona Lisa' og 'The Last Supper'?", "answer": "Leonardo da Vinci" },
    { "question": "Hvad hedder USA's 16. præsident, som også er kendt for sin rolle under borgerkrigen for at frigive slaverne?", "answer": "Abraham Lincoln" },
    { "question": "Hvilken hændelse markerede starten på Anden Verdenskrig?", "answer": "Invasionen af Polen" },
    { "question": "Hvad hedder bandet, ledet af Freddie Mercury, som er kendt for sange som 'Bohemian Rhapsody' og 'We Will Rock You'?", "answer": "Queen" },
    { "question": "Hvad er verdens største ø, som ligger i det nordlige Atlanterhav og tilhører Danmark?", "answer": "Grønland" },
    { "question": "Hvilket australsk pattedyr er kendt for sin evne til at hoppe højt og for sin pung, hvor dens unge vokser op?", "answer": "Kænguru" },
    { "question": "Hvilken nordisk gud er kendt for sin hammer, Mjölnir, og er også guden for torden?", "answer": "Thor" },
    { "question": "Hvilken by er kendt som 'The Big Apple' og er en af de mest berømte byer i USA?", "answer": "New York City" },
    { "question": "Hvilken sanger og musiker er kendt for hits som ’Purple Rain’ og ’When Doves Cry’?", "answer": "Prince" },
    { "question": "Hvilken skuespiller spillede Iron Man i Marvel-filmene?", "answer": "Robert Downey Jr." },
    { "question": "Hvilken skuespillerinde spillede Hermione Granger i Harry Potter-filmene?", "answer": "Emma Watson" },
    { "question": "Hvem udgav 'Thriller', det bedst sælgende album nogensinde?", "answer": "Michael Jackson" },
    { "question": "Hvilken britisk popgruppe blev berømt med sangen 'Wannabe' i 1996?", "answer": "Spice Girls" },
    { "question": "Hvilken komiker og skuespiller blev berømt med serien 'The Office'?", "answer": "Steve Carell" },
    { "question": "Hvilken TV-serie har karaktererne Jon Snow og Daenerys Targaryen?", "answer": "Game of Thrones" },
    { "question": "Hvad er hovedstaden i Japan?", "answer": "Tokyo" },
    { "question": "Hvad er det højeste bjerg på Jorden?", "answer": "Mount Everest" },
    { "question": "Hvilket land producerer den største mængde kaffe i verden?", "answer": "Brasilien" },
    { "question": "Hvilket dyr er kendt for at være det største landdyr på Jorden?", "answer": "Elefanten" },
    { "question": "Hvor taler man portugisisk?", "answer": "Brasilien" },
    { "question": "Hvilken type træ bruges til at lave whiskyfade?", "answer": "Egetræ" },
    { "question": "Hvilken film blev den første til at tjene over én milliard dollars?", "answer": "Titanic" },
    { "question": "Hvad kaldes den proces, hvor planter omdanner sollys til energi?", "answer": "Fotosyntese" },
    { "question": "Hvem var den første mand på månen?", "answer": "Neil Armstrong" },
    { "question": "Hvilket år faldt Berlinmuren?", "answer": "1989" },
    { "question": "Hvem sagde 'I have a dream'?", "answer": "Martin Luther King Jr." },
    { "question": "Hvad hedder den mest solgte bog i verden?", "answer": "Bibelen" },
    { "question": "Hvem har været gift med Brad Pitt og Justin Theroux?", "answer": "Jennifer Aniston" }
],
"margretheskaal": [
    "Beyoncé",
    "Leonardo DiCaprio",
    "Elon Musk",
    "Kim Kardashian",
    "Taylor Swift",
    "Brad Pitt",
    "Oprah Winfrey",
    "Harry Styles",
    "Selena Gomez",
    "Justin Bieber",
    "Dwayne 'The Rock' Johnson",
    "Rihanna",
    "Barack Obama",
    "Donald Trump",
    "Queen Elizabeth II",
    "Kylie Jenner",
    "Tom Cruise",
    "Angelina Jolie",
    "Cristiano Ronaldo",
    "Will Smith",
    "Emma Watson",
    "Ryan Reynolds",
    "Kim Jong-un",
    "Meghan Markle",
    "Billie Eilish",
    "Tom Hanks",
    "Lady Gaga",
    "Drake",
    "Adele",
    "Keanu Reeves"
],
"hot-seat": [
    { "question": "Hvad er den største hemmelighed, du har holdt for dine venner?" },
    { "question": "Hvad er det mærkeligste, du har gjort for opmærksomhed?" },
    { "question": "Hvis du kunne ændre én ting ved dig selv, hvad ville det så være?" },
    { "question": "Synes du selv, du er en god person? Nævn, hvad der gør dig til en god person." },
    { "question": "Har du nogensinde gjort noget, du mente var godt, men som andre ikke kunne forstå? Hvad var det?" },
    { "question": "Hvilken værdi er vigtigst for dig i et venskab, og hvorfor? Synes du selv, du overholder det?" },
    { "question": "Hvad er noget, du har gjort for en anden, som du mener, de ikke har værdsat nok?" },
    { "question": "Hvad er den største fejl, du har lært af, og hvordan har den ændret dig?" },
    { "question": "Hvordan håndterer du kritik, og har du haft en oplevelse, hvor du har ændret noget ved dig selv efter at have modtaget kritik?" },
    { "question": "Synes du, du er den flotteste i dette rum? Rank alle i rummet fra den grimmeste til den flotteste." },
    { "question": "Hvad tror du, folk værdsætter mest ved dig som ven?" },
    { "question": "Er du god til at tilgive? Fortæl om en gang, du har tilgivet nogen, selvom det var svært." },
    { "question": "Hvordan vil du beskrive dit forhold til dig selv? Er du tilfreds med, hvordan du ser på dig selv?" },
    { "question": "Hvad er en egenskab, du beundrer hos andre, som du gerne selv vil udvikle?" },
    { "question": "Har du nogensinde haft en oplevelse, der ændrede din måde at se verden på?" },
    { "question": "Hvordan håndterer du konflikter med venner eller kollegaer?" },
    { "question": "Hvordan vil du gerne blive husket?" },
    { "question": "Hvilken ting har du gjort i dit liv, som du skammer dig allermest over?" },
    { "question": "Hvilket personlighedstræk kan du bedst lide ved dig selv, men som andre måske ser som en fejl?" },
    { "question": "Er du nogensinde blevet jaloux på en ven eller et familiemedlem? Hvordan håndterede du det?" },
    { "question": "Hvilken person i dit liv fortjener du måske at miste, men har holdt fast ved?" },
    { "question": "Har du nogensinde ønsket, at du kunne undgå en bestemt person i dit liv? Hvad har forhindret dig i det?" },
    { "question": "Føler du, at du er en bedre person end nogen i dette rum? Du behøver ikke at fortælle hvem, men forklar hvorfor." },
    { "question": "Er der nogen, du virkelig burde have tilgivet, men som du stadig holder fast på vrede overfor?" },
    { "question": "Hvilken dårlig egenskab tror du, dine venner ser hos dig?" },
    { "question": "Hvilken ting, som du har gjort, får dig til at undre dig over, hvad der gik galt i den situation?" },
    { "question": "Er der nogen, som du føler dig overlegen overfor, selvom du ved, det ikke er rigtigt?" },
    { "question": "Hvilken person tror du, du ville kunne manipulere i dette rum, hvis du ønskede det, og hvorfor?" },
    { "question": "Hvornår har du sidst løjet, og hvad var årsagen?" }
],
"jeg-har-aldrig": [
    { "question": "Jeg har aldrig sendt en seksuel besked, jeg senere har fortrudt." },
    { "question": "Jeg har aldrig haft sex i en offentlig park eller på et offentligt toilet." },
    { "question": "Jeg har aldrig haft et one-night-stand." },
    { "question": "Jeg har aldrig haft sex på et badeværelse." },
    { "question": "Jeg har aldrig haft et crush på en kollega." },
    { "question": "Jeg har aldrig set porno sammen med en partner." },
    { "question": "Jeg har aldrig eksperimenteret med rollespil i sengen." },
    { "question": "Jeg har aldrig haft sex med nogen, der var i et forhold med en anden." },
    { "question": "Jeg har aldrig prøvet at flirte med nogen for at få noget gratis." },
    { "question": "Jeg har aldrig haft sex på en festival." },
    { "question": "Jeg har aldrig haft sex på en første date." },
    { "question": "Jeg har aldrig brugt sexlegetøj sammen med en partner." },
    { "question": "Jeg har aldrig haft sex med mere end én person på samme dag." },
    { "question": "Jeg har aldrig haft sex i et offentligt transportmiddel." },
    { "question": "Jeg har aldrig sendt en besked, der var ment til én, men blev sendt til den forkerte person." },
    { "question": "Jeg har aldrig haft sex et sted, hvor jeg kunne blive opdaget." },
    { "question": "Jeg har aldrig haft et crush på en person, der ikke kunne lide mig tilbage." },
    { "question": "Jeg har aldrig været forelsket i en, jeg ikke burde have været." },
    { "question": "Jeg har aldrig haft en hemmelig forelskelse, som jeg aldrig fortalte nogen om." },
    { "question": "Jeg har aldrig lavet noget pinligt, mens jeg var fuld." },
    { "question": "Jeg har aldrig sendt en fræk besked til en person, jeg ikke rigtig kender." },
    { "question": "Jeg har aldrig sagt 'Jeg elsker dig' uden at mene det." },
    { "question": "Jeg har aldrig været på en date, der var så dårlig, at jeg ønskede at forlade den midt i." },
    { "question": "Jeg har aldrig flirtet med en bartender for at få gratis drinks." },
    { "question": "Jeg har aldrig haft sex med nogen, som jeg ikke kunne huske navnet på dagen efter." },
    { "question": "Jeg har aldrig været til en fest og indset, at jeg måske skulle være blevet hjemme." },
    { "question": "Jeg har aldrig været på en date og opdaget, at vi havde alt for lidt til fælles." },
    { "question": "Jeg har aldrig kysset nogen bare for at få dem til at holde mund." },
    { "question": "Jeg har aldrig haft sex i en situation, der føltes helt forkert, men gjorde det alligevel." },
    { "question": "Jeg har aldrig lavet et pinligt forsøg på at flirte, som bare faldt helt igennem." },
    { "question": "Jeg har aldrig sendt en besked til en gruppe, der var ment til én person, og haft svært ved at rette op på det." },
    { "question": "Jeg har aldrig taget et screenshot af en samtale og ved et uheld sendt det til den person, det handlede om." },
    { "question": "Jeg har aldrig fået et kompliment, der var så akavet, at jeg ikke vidste, hvordan jeg skulle svare." },
    { "question": "Jeg har aldrig været i en situation, hvor jeg sagde noget rigtig sjovt, men ingen reagerede, og jeg blev helt flov." },
    { "question": "Jeg har aldrig sendt en besked, der skulle være sjov, men som endte med at være akavet." }
],
"sandhed-eller-konsekvens": [
  { truth: "Hvilken fysisk egenskab finder du mest attraktiv hos en partner?" },
  { truth: "Hvad er noget, du har gjort i fuld beruselse, som du aldrig vil gøre igen?" },
  { truth: "Har du nogensinde været forelsket i en, der ikke vidste, du eksisterede?" },
  { truth: "Hvad er din største frygt i et forhold?" },
  { truth: "Hvad er den mest mærkelige ting, du har gjort for opmærksomhed?" },
  { truth: "Hvem har du været mest jaloux på i dette rum og hvorfor?" },
  { truth: "Hvad er den vildeste ting, du har gjort under sex?" },
  { truth: "Hvad er den største sexfantasi, du har, som du aldrig har delt med nogen?" },
  { truth: "Hvad er det mest pinlige, der er sket for dig under sex?" },
  { truth: "Hvilket sexposition har du prøvet, som du ikke kunne lide, og hvorfor?" },
  { truth: "Hvad er den sjoveste, mærkeligste eller mest akavede ting, du har sagt i sengen?" },
  { truth: "Hvis du skulle vælge én person i rummet til en date, hvem ville det så være, og hvorfor?" },
  { truth: "Hvilken 'sexlege' har du altid haft lyst til at prøve, men ikke haft modet til?" },
  { truth: "Har du nogensinde brugt et sexlegetøj, og hvordan var oplevelsen?" },
  { truth: "Hvis du kunne vælge at have sex med en kendis, hvem ville det så være, og hvorfor?" },
  { truth: "Har du nogensinde haft en sexuel oplevelse, der fik dig til at grine midt i det hele?" },
  { truth: "Hvad er det vildeste, du har gjort for at score nogen til en fest?" },
  { dare: "Sig én ting, du elsker ved dig selv, og hvorfor."},
  { dare: "Imitere en romantisk filmscene, hvor du spiller begge roller i en kærlighedsreplik."},
  { dare: "Bliv siddende og kig ind i den andens øjne i 60 sekunder, uden at sige noget."},
  { dare: "Find en random skuespiller, og efterlign en af deres mest ikoniske linjer, mens du sidder stille."},
  { dare: "Sig en kompliment til den person, der sidder tættest på dig, men gør det på en overdrevet, teatralsk måde (som en skuespiller)."},
  { dare: "Vælg en person i rummet og giv dem en lapdance til sangen ’min kat den sanger tango’"},
  { dare: "Hold øjenkontakt med én person i et minut (måske en han/hun godt kan lide)"},
  { dare: "Simulér din yndlingssexstilling med personen til højre for dig"},
  { dare: "Kys den fyr, du finder mest tiltrækkende"},
  { dare: "Kys den kvinde, du finder mest tiltrækkende"},
  { dare: "Søg på “lækker/bitch/kælling” i dine beskeder, og læs den seneste med ordet i op for resten af deltagerne"},
  { dare: "Søg på “lækker” i dine beskeder, og læs den seneste med ordet i op for resten af deltagerne"},
  { dare: "Nævn tre dårlige egenskaber ved personen, der sidder til venstre for dig"},
  { dare: "Personen til højre for dig må gå ind på din Instagramprofil og like et virkelig gammelt billede af en vilkårlig person"},
  { dare: "Beskriv udseendet på din drømmepartner"},
  { dare: "Lav en historie, hvor du udfordrer folk til at gætte noget om dig."},
  { dare: "Lav en TikTok med personen til din højre."},
  { dare: "Del et pinligt barndomsbillede."},
  { dare: "Send en direkte besked til nogen, du ikke har talt med i over et år"}
],
"sandhed-eller-konsekvens": [
  { question: "Hvilken fysisk egenskab finder du mest attraktiv hos en partner?", truth: "Hvilken fysisk egenskab finder du mest attraktiv hos en partner?" },
  { question: "Hvad er noget, du har gjort i fuld beruselse, som du aldrig vil gøre igen?", truth: "Hvad er noget, du har gjort i fuld beruselse, som du aldrig vil gøre igen?" },
  { question: "Har du nogensinde været forelsket i en, der ikke vidste, du eksisterede?", truth: "Har du nogensinde været forelsket i en, der ikke vidste, du eksisterede?" },
  { question: "Hvad er din største frygt i et forhold?", truth: "Hvad er din største frygt i et forhold?" },
  { question: "Hvad er den mest mærkelige ting, du har gjort for opmærksomhed?", truth: "Hvad er den mest mærkelige ting, du har gjort for opmærksomhed?" },
  { question: "Hvem har du været mest jaloux på i dette rum og hvorfor?", truth: "Hvem har du været mest jaloux på i dette rum og hvorfor?" },
  { question: "Hvad er den vildeste ting, du har gjort under sex?", truth: "Hvad er den vildeste ting, du har gjort under sex?" },
  { question: "Hvad er den største sexfantasi, du har, som du aldrig har delt med nogen?", truth: "Hvad er den største sexfantasi, du har, som du aldrig har delt med nogen?" },
  { question: "Hvad er det mest pinlige, der er sket for dig under sex?", truth: "Hvad er det mest pinlige, der er sket for dig under sex?" },
  { question: "Hvilket sexposition har du prøvet, som du ikke kunne lide, og hvorfor?", truth: "Hvilket sexposition har du prøvet, som du ikke kunne lide, og hvorfor?" },
  { question: "Hvad er det sjoveste, mærkeligste eller mest akavede ting, du har sagt i sengen?", truth: "Hvad er det sjoveste, mærkeligste eller mest akavede ting, du har sagt i sengen?" },
  { question: "Hvis du skulle vælge én person i rummet til en date, hvem ville det så være, og hvorfor?", truth: "Hvis du skulle vælge én person i rummet til en date, hvem ville det så være, og hvorfor?" },
  { question: "Hvilken 'sexlege' har du altid haft lyst til at prøve, men ikke haft modet til?", truth: "Hvilken 'sexlege' har du altid haft lyst til at prøve, men ikke haft modet til?" },
  { question: "Har du nogensinde brugt et sexlegetøj, og hvordan var oplevelsen?", truth: "Har du nogensinde brugt et sexlegetøj, og hvordan var oplevelsen?" },
  { question: "Hvis du kunne vælge at have sex med en kendis, hvem ville det så være, og hvorfor?", truth: "Hvis du kunne vælge at have sex med en kendis, hvem ville det så være, og hvorfor?" },
  { question: "Har du nogensinde haft en sexuel oplevelse, der fik dig til at grine midt i det hele?", truth: "Har du nogensinde haft en sexuel oplevelse, der fik dig til at grine midt i det hele?" },
  { question: "Hvad er det vildeste, du har gjort for at score nogen til en fest?", truth: "Hvad er det vildeste, du har gjort for at score nogen til en fest?" },
  { dare: "Sig én ting, du elsker ved dig selv, og hvorfor." },
  { dare: "Imitere en romantisk filmscene, hvor du spiller begge roller i en kærlighedsreplik." },
  { dare: "Bliv siddende og kig ind i den andens øjne i 60 sekunder, uden at sige noget." },
  { dare: "Find en random skuespiller, og efterlign en af deres mest ikoniske linjer, mens du sidder stille." },
  { dare: "Sig en kompliment til den person, der sidder tættest på dig, men gør det på en overdrevet, teatralsk måde (som en skuespiller)." },
  { dare: "Vælg en person i rummet og giv dem en lapdance til sangen ’min kat den sanger tango’." },
  { dare: "Hold øjenkontakt med én person i et minut (måske en han/hun godt kan lide)." },
  { dare: "Simulér din yndlingssexstilling med personen til højre for dig." },
  { dare: "Kys den fyr, du finder mest tiltrækkende." },
  { dare: "Kys den kvinde, du finder mest tiltrækkende." },
  { dare: "Søg på 'lækker/bitch/kælling' i dine beskeder, og læs den seneste med ordet i op for resten af deltagerne." },
  { dare: "Søg på 'lækker' i dine beskeder, og læs den seneste med ordet i op for resten af deltagerne." },
  { dare: "Nævn tre dårlige egenskaber ved personen, der sidder til venstre for dig." },
  { dare: "Personen til højre for dig må gå ind på din Instagramprofil og like et virkelig gammelt billede af en vilkårlig person." },
  { dare: "Beskriv udseendet på din drømmepartner." },
  { dare: "Lav en historie, hvor du udfordrer folk til at gætte noget om dig." },
  { dare: "Lav en TikTok med personen til din højre." },
  { dare: "Del et pinligt barndomsbillede." },
  { dare: "Send en direkte besked til nogen, du ikke har talt med i over et år." },
],
"hvem-er-mest-tilbøjelig-til": [
    { "question": "Hvem er mest tilbøjelig til at blive smidt ud af en bar for at være for fuld?" },
    { "question": "Hvem er mest tilbøjelig til at sende en besked til deres eks, når de er stive?" },
    { "question": "Hvem er mest tilbøjelig til at sige noget upassende på det værst tænkelige tidspunkt?" },
    { "question": "Hvem er mest tilbøjelig til at falde i søvn under sex?" },
    { "question": "Hvem er mest tilbøjelig til at tage med en fremmed hjem efter en bytur?" },
    { "question": "Hvem er mest tilbøjelig til at skide i bukserne offentligt?" },
    { "question": "Hvem er mest tilbøjelig til at have den mærkeligste pornohistorik?" },
    { "question": "Hvem er mest tilbøjelig til at komme for sent til deres eget bryllup?" },
    { "question": "Hvem er mest tilbøjelig til at tage en impulsiv tatovering?" },
    { "question": "Hvem er mest tilbøjelig til at have haft en trekant?" },
    { "question": "Hvem er mest tilbøjelig til at sende et nøgenbillede ved et uheld til den forkerte person?" },
    { "question": "Hvem er mest tilbøjelig til at have haft sex på et upassende sted?" },
    { "question": "Hvem er mest tilbøjelig til at lyve om antallet af sexpartnere?" },
    { "question": "Hvem er mest tilbøjelig til at blive taget i at onanere?" },
    { "question": "Hvem er mest tilbøjelig til at have sex i en bil?" },
    { "question": "Hvem er mest tilbøjelig til at gå commando (uden undertøj) til en fest?" },
    { "question": "Hvem er mest tilbøjelig til at have prøvet flest kinky ting i soveværelset?" },
    { "question": "Hvem er mest tilbøjelig til at falde for en kollega?" },
    { "question": "Hvem er mest tilbøjelig til at bruge håndjern eller blindfold under sex?" },
    { "question": "Hvem er mest tilbøjelig til at blive forelsket i en, de lige har mødt?" }
],
"hvad-vil-du-helst": [
    { "question": "Kunne tale alle sprog flydende eller kunne tale med dyr?" },
    { "question": "Aldrig kunne bruge sociale medier igen eller aldrig kunne se fjernsyn igen?" },
    { "question": "Have en million kroner nu, eller få én krone, der fordobles hver dag i 30 dage?" },
    { "question": "Have en perfekt hukommelse eller kunne glemme alle dine problemer?" },
    { "question": "Kunne læse din partners tanker i sengen, eller kunne få din partner til at gøre præcis, hvad du vil uden at sige noget?" },
    { "question": "Være i et forhold, hvor sex altid er spontan og vild, eller et forhold med planlagte, men meget intime og romantiske stunder?" },
    { "question": "Prøve en ny sexstilling hver gang, eller finde én, der virker, og bare bruge den?" },
    { "question": "Have sex, hvor du altid er i kontrol, eller lade din partner tage fuld kontrol?" },
    { "question": "Kunne pause tiden, men kun i ét minut ad gangen, eller kunne spole tiden tilbage, men kun 10 sekunder?" },
    { "question": "Have menstruationssmerter eller diarré hver dag i en måned?" },
    { "question": "Drukne i tis eller i lort?" },
    { "question": "Have morgensex eller sex om aftenen?" },
    { "question": "Blive fuld af en enkelt tår alkohol eller aldrig blive fuld, uanset hvor meget du drikker?" },
    { "question": "Altid have højlydt sex, uanset hvor du er, eller aldrig kunne lave en lyd under sex?" },
    { "question": "Have sex med nogen, der er virkelig dårlig til det, men superentusiastisk, eller med en, der er teknisk perfekt, men virker uengageret?" },
    { "question": "Blive opdaget, mens du har sex et offentligt sted, eller ved et uheld sende en fræk besked til din chef?" },
    { "question": "Slikke en brugt toiletbørste eller tage en slurk af en tilfældig persons sved?" },
    { "question": "Vågne op med en kæmpe bums midt på næsen hver dag eller altid have dårlig ånde, uanset hvor meget du børster tænder?" },
    { "question": "Træde barfodet i en hundelort eller få en fugl til at skide direkte i din mund?" },
    { "question": "Skide i bukserne i en elevator med mennesker eller kaste op ud over dit crush på en date?" }
],
};

// Funktion til at indsætte alle spørgsmål i Firestore
const insertAllQuestions = async () => {
  for (const [collectionName, questions] of Object.entries(data)) {
    for (const item of questions) {
      await addQuestion(collectionName, item);
    }
  }
};

// Kør scriptet
insertAllQuestions().then(() => {
  console.log("🎉 Alle spørgsmål er tilføjet til Firestore!");
});
