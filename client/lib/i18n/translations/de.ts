const translations = {
  login: {
    login: "Einloggen",
    logout: "Ausloggen",
    enterPin: "Pin eingeben",
    welcome: "Willkommen",
    password: "Passwort",
  },
  menu: {
    title: "Brettspielmeisterschaft",
    entries: {
      home: "Startseite",
      dashboard: "Dashboard",
      settings: "Einstellungen",
      info: "Informationen",
      chooseYourCharacter: "Team auswählen",
      schedule: "Zeitplan",
      activeBells: "Aktive Klingeln",
      game: "Spiel",
    },
    dmmib: "DMMiB",
    europemasters: "Europe Masters",
  },
  settings: {
    title: "Einstellungen",
    appearance: "Erscheinungsbild",
    darkMode: "Dunkelmodus",
    language: "Sprache",
    account: "Konto",
    currentTeam: "Team",
    currentPlayer: "Spieler",
    changeTeam: "Team / Spieler wechseln",
    languages: {
      en: "Englisch",
      de: "Deutsch",
    },
  },
  game: {
    title: "Spielübersicht",
    actions: {
      lottery: "Auslosung",
      rules: "Regeln",
      tableBell: "Tischklingel",
      timer: "Timer",
      results: "Ergebnisse",
      confirmRing: {
        title: "Tischklingel läuten",
        message: "Die Schiedsrichter:innen auf euren Tisch aufmerksam machen?",
        confirm: "Klingeln",
        cancel: "Abbrechen",
      },
      confirmDismiss: {
        title: "Klingel entfernen",
        message: "Tischklingel-Benachrichtigung entfernen?",
        confirm: "Entfernen",
        cancel: "Abbrechen",
      },
    },
  },
  navigation: {
    back: "Zurück",
  },
  activeBells: {
    title: "Aktive Klingeln",
    table: "Tisch",
    empty: "Keine aktiven Klingeln",
    confirmAcknowledge: {
      title: "Klingel bestätigen",
      message: "Als bestätigt markieren? Ein Schiedsrichter ist unterwegs.",
      confirm: "Bestätigen",
      cancel: "Abbrechen",
    },
    confirmDelete: {
      title: "Klingel löschen",
      message: "Diesen Klingeleintrag entfernen?",
      confirm: "Löschen",
      cancel: "Abbrechen",
    },
  },
  components: {
    schedule: {
      title: "Zeitplan",
      goToGameButton: "Zum Spiel",
      addItem: "Zeitplan-Eintrag hinzufügen",
      confirmDelete: {
        title: "Eintrag löschen",
        message: "Diesen Zeitplan-Eintrag wirklich löschen?",
        confirm: "Löschen",
        cancel: "Abbrechen",
      },
      confirmSetActive: {
        title: "Aktiv setzen",
        message: "Diesen Eintrag als aktiven Zeitplan-Eintrag setzen?",
        confirm: "Aktiv setzen",
        cancel: "Abbrechen",
      },
      form: {
        addTitle: "Zeitplan-Eintrag hinzufügen",
        editTitle: "Zeitplan-Eintrag bearbeiten",
        save: "Speichern",
        titleField: "Titel",
        titlePlaceholder: "z.B. Eröffnungsfeier",
        iconField: "Symbol",
        startTimeField: "Startzeit",
        startTimePlaceholder: "HH:MM",
        durationField: "Dauer (min)",
        durationPlaceholder: "z.B. 30",
        descriptionField: "Beschreibung",
        descriptionPlaceholder: "Optionale Details...",
        gameIdField: "Spiel-ID",
        gameIdPlaceholder: "Optional",
        validationStartTime: "Format: HH:MM",
        validationDuration: "Positive Zahl erforderlich",
        actionTimer: "Standard-Timer",
        actionRules: "Regeln",
        actionLotteries: "Lotterien",
        icons: {
          trophy: "Pokal",
          dice: "Würfel",
          document: "Dokument",
          break: "Pause",
          info: "Info",
        },
      },
    }
  }
};

export default translations;
