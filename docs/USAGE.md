# Användarguide för ScreammSSH

## Komma igång

### Starta appen

1. Starta ScreammSSH genom att köra den installerade applikationen eller genom att köra `npm run dev` i utvecklingsmiljön.
2. Du kommer att se huvudskärmen med en terminal och menyalternativ överst.

### Navigering i gränssnittet

- **Menyrad**: Överst i fönstret finns olika menyalternativ:
  - **HEM**: Återgå till huvudskärmen
  - **ANSLUTNINGAR**: Hantera dina SSH-anslutningar
  - **DELAD TERMINAL**: Öppna flera terminaler i samma fönster
  - **DATABASER**: Anslut till och hantera databaser
  - **BYT ROLL**: Ändra layouten baserat på din roll (utvecklare, DevOps, etc.)
  - **INSTÄLLNINGAR**: Anpassa appens utseende och beteende

### Använda terminalen

1. Terminalen fungerar som en vanlig kommandotolk på din lokala dator.
2. Skriv kommandon och tryck på Enter för att köra dem.
3. Använd piltangenterna för att navigera i kommandohistoriken.
4. Skriv `help` för att se tillgängliga kommandon.

### Skapa en SSH-anslutning

1. Klicka på **ANSLUTNINGAR** i menyraden.
2. Välj **NY ANSLUTNING**.
3. Fyll i anslutningsuppgifterna:
   - **Namn**: Ett beskrivande namn för anslutningen
   - **Värd**: IP-adress eller domännamn
   - **Port**: SSH-port (vanligtvis 22)
   - **Användarnamn**: Ditt användarnamn på servern
   - **Autentiseringsmetod**: Välj mellan lösenord eller SSH-nyckel
4. Klicka på **SPARA** för att spara anslutningen.
5. Klicka på **ANSLUT** för att ansluta till servern.

### Filöverföring (SFTP)

1. När du är ansluten till en SSH-server, klicka på **FILER** i sidofältet.
2. Du kommer att se en filhanterare som visar filerna på fjärrservern.
3. Använd drag-and-drop för att överföra filer mellan din lokala dator och servern.
4. Högerklicka på en fil för att se fler alternativ (redigera, ta bort, etc.).

### Anpassa utseendet

1. Klicka på **INSTÄLLNINGAR** i menyraden.
2. Under fliken **UTSEENDE** kan du:
   - Ändra färgschema
   - Justera teckenstorlek
   - Ändra terminalens transparens
   - Välja teckensnitt

### Rollbaserade layouter

1. Klicka på **BYT ROLL** i menyraden.
2. Välj den roll som bäst passar ditt arbetsflöde:
   - **Backend-utvecklare**: Fokus på kodredigering och databashantering
   - **DevOps/SRE**: Fokus på serverövervakning och containerhantering
   - **Systemadministratör**: Fokus på systemunderhåll och säkerhet
   - **Frontend-utvecklare**: Fokus på filsynkronisering och webbserverkonfiguration

## Tips och tricks

- Använd `Ctrl+T` för att öppna en ny terminalflik.
- Använd `Ctrl+Shift+T` för att dela terminalen vertikalt eller horisontellt.
- Använd `Esc` för att stänga popup-fönster.
- Unix-kommandon (ls, pwd, etc.) konverteras automatiskt till motsvarande Windows-kommandon när det behövs.

## Felsökning

Om du stöter på problem med appen, prova följande:

1. Starta om appen.
2. Kontrollera att du har rätt behörigheter för att ansluta till servern.
3. Kontrollera att servern är tillgänglig genom att pinga den.
4. Se till att SSH-tjänsten körs på servern.

För mer avancerad felsökning, se README.md-filen i projektkatalogen. 