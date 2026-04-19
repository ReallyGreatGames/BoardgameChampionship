const translations = {
  login: {
    login: "Log in",
    logout: "Log out",
    enterPin: "Enter PIN",
    welcome: "Welcome",
    password: "Password",
  },
  menu: {
    title: "Boardgame Championship",
    entries: {
      home: "Home",
      dashboard: "Dashboard",
      settings: "Settings",
      info: "Info",
      chooseYourCharacter: "Choose Team",
      schedule: "Schedule",
    },
    dmmib: "DMMiB",
    europemasters: "Europe Masters",
  },
  settings: {
    title: "Settings",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    language: "Language",
    account: "Account",
    currentTeam: "Team",
    currentPlayer: "Player",
    changeTeam: "Change Team / Player",
    languages: {
      en: "English",
      de: "German",
    },
  },
  game: {
    title: "Game Overview",
    actions: {
      lottery: "Lottery",
      rules: "Rules",
      tableBell: "Table Bell",
      timer: "Timer",
      results: "Results",
      confirmRing: {
        title: "Ring Table Bell",
        message: "Alert the judges that your table needs assistance?",
        confirm: "Ring",
        cancel: "Cancel",
      },
      confirmDismiss: {
        title: "Dismiss Bell",
        message: "Clear the table bell notification?",
        confirm: "Dismiss",
        cancel: "Cancel",
      },
    },
  },
  navigation: {
    back: "Back",
  },
  components: {
    schedule: {
      title: "Schedule",
      goToGameButton: "Go to Game",
      addItem: "Add Schedule Item",
      confirmDelete: {
        title: "Delete Item",
        message: "Are you sure you want to delete this schedule item?",
        confirm: "Delete",
        cancel: "Cancel",
      },
      confirmSetActive: {
        title: "Set Active",
        message: "Set this as the currently active schedule item?",
        confirm: "Set Active",
        cancel: "Cancel",
      },
      form: {
        addTitle: "Add Schedule Item",
        editTitle: "Edit Schedule Item",
        save: "Save",
        titleField: "Title",
        titlePlaceholder: "e.g. Opening Ceremony",
        iconField: "Icon",
        startTimeField: "Start Time",
        startTimePlaceholder: "HH:MM",
        durationField: "Duration (min)",
        durationPlaceholder: "e.g. 30",
        descriptionField: "Description",
        descriptionPlaceholder: "Optional details...",
        gameIdField: "Game ID",
        gameIdPlaceholder: "Optional",
        validationStartTime: "Use HH:MM format",
        validationDuration: "Must be a positive number",
        actionTimer: "Default Timer",
        actionRules: "Rules",
        actionLotteries: "Lotteries",
        icons: {
          trophy: "Trophy",
          dice: "Dice",
          break: "Break",
          document: "Document",
          info: "Info",
        },
      },
    }
  }
};

export default translations;
