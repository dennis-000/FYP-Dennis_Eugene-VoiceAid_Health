/**
 * ==========================================
 * VoiceAid i18n — Hardcoded Translations
 * ==========================================
 * Languages: English (en), Twi (twi), Ga (ga)
 *
 * Approach: Hardcoded — no offline model available
 * for Twi/Ga in React Native at this time.
 */

export type Language = 'en' | 'twi' | 'ga';

const translations = {
    // ────────────────────────────────────────
    // COMMON / SHARED
    // ────────────────────────────────────────
    cancel:         { en: 'Cancel',         twi: 'Gyae',            ga: 'Goo' },
    save:           { en: 'Save',           twi: 'Hwɛ',             ga: 'Kɛ' },
    delete:         { en: 'Delete',         twi: 'Popa',            ga: 'Gbɔ' },
    yes:            { en: 'Yes',            twi: 'Aane',            ga: 'Hɛɛ' },
    no:             { en: 'No',             twi: 'Daabi',           ga: 'Daabi' },
    back:           { en: 'Back',           twi: 'San',             ga: 'San' },
    loading:        { en: 'Loading...',     twi: 'Twɛn...',         ga: 'Nyɛ...' },
    error:          { en: 'Error',          twi: 'Nsɛ',             ga: 'Bo' },
    ok:             { en: 'OK',             twi: 'Yoo',             ga: 'Yoo' },
    done:           { en: 'Done',           twi: 'Wie',             ga: 'Wie' },
    add:            { en: 'Add',            twi: 'Ka ho',           ga: 'Ka' },
    remove:         { en: 'Remove',         twi: 'Yi fi hɔ',        ga: 'Gbɔ' },
    settings:       { en: 'Settings',       twi: 'Nhyehyɛe',        ga: 'Nhyehyɛe' },
    history:        { en: 'History',        twi: 'Nkyerɛkyerɛmu',   ga: 'Nkyenekyene' },
    search:         { en: 'Search',         twi: 'Hwehwɛ',          ga: 'Hwehwɛ' },

    // ────────────────────────────────────────
    // DASHBOARD
    // ────────────────────────────────────────
    welcomeBack:    { en: 'Welcome back,',  twi: 'Akwaaba,',        ga: 'Ojekoo,' },
    myTools:        { en: 'My Tools',       twi: 'Me Adwuma Ho',    ga: 'Me Atuu' },
    speakNow:       { en: 'Speak Now',      twi: 'Ka Sɛisei',       ga: 'Ke Sɛisei' },
    startTranscription: { en: 'Start live transcription', twi: 'Hyɛ nsɛm aseɛ', ga: 'Bɔ nsɛm' },
    phraseBoard:    { en: 'Phrase Board',   twi: 'Nsɛm Bɔrd',       ga: 'Nsɛm Bɔrd' },
    quickTTS:       { en: 'Quick text-to-speech', twi: 'Nsɛm ka ntɛm', ga: 'Nsɛm ka' },
    voiceJournal:   { en: 'Voice Journal',  twi: 'Nnwom Nsɛm',      ga: 'Nnwom' },
    dailyRecording: { en: 'Daily recording', twi: 'Da biara nsɛm',  ga: 'Da biara' },
    assignments:    { en: 'Assignments',    twi: 'Adwuma',          ga: 'Adwuma' },
    therapyExercises: { en: 'Therapy exercises', twi: 'Ahoɔden adwuma', ga: 'Ahoɔden' },
    pastConversations: { en: 'Past conversations', twi: 'Nsɛm a atwam', ga: 'Nsɛm atwam' },
    appPreferences: { en: 'App preferences', twi: 'App nhyehyɛe',   ga: 'App' },
    disconnectHospital: { en: 'Disconnect from Hospital', twi: 'Tee wo ho fi ayaresabea hɔ', ga: 'Tse ohe kɛjɛ helatsamɔhe lɛ mli' },
    exitGuestMode:  { en: 'Exit Guest Mode', twi: 'Fi Ɔhɔhoɔ tebea mu',  ga: 'Jee kɛjɛ Gbɔ teemɔ mli' },
    disconnectConfirmTitle: { en: 'Disconnect', twi: 'Fi mu', ga: 'Fi mu' },
    disconnectConfirmMessage: { en: 'Are you sure you want to disconnect from your hospital? You will need an invite code to reconnect.', twi: 'Wo gye di sɛ wopɛ sɛ wotete wo ho fi ayaresabea hɔ? Wobɛhia koodu (invite code) na woatumi asan aka ho biom.', ga: 'Ani oyɛ gbɛimɔ akɛ obaatse ohe kɛjɛ helatsamɔhe lɛ mli? Obaahia koodu koni onyɛ osan okpa he biom.' },
    hospitalPatient: { en: 'Hospital Patient', twi: 'Ayaresabea Yarefoɔ', ga: 'Helatsamɔhe Helatsɛ' },
    guestPatient:    { en: 'Guest Patient',     twi: 'Ɔhɔhoɔ Yarefoɔ',           ga: 'Gbɔ Helatsɛ' },
    visualScanning:  { en: 'Visual Scanning Mode', twi: 'Hwehwɛ mfonini', ga: 'Visual Scanning Mode' },
    scanningSub:     { en: 'Auto-highlights items for switch access', twi: 'Hyehyɛ nneɛma ntɛm', ga: 'Auto-highlights items' },
    exercises:      { en: 'Exercises',      twi: 'Ahoɔden Dwuma',   ga: 'Ahoɔden' },
    guidedTrainer:  { en: 'Guided oral trainer', twi: 'Ano ahoɔden', ga: 'Ano ho' },
    emergencySOS:   { en: 'Emergency SOS',  twi: 'Boa Ntɛm!',       ga: 'Boa!' },
    myCaregiver:    { en: 'My Caregiver',   twi: 'Okyɛfa',          ga: 'Okyɛfa' },
    connectedHospital: { en: 'Connected to Hospital', twi: 'Woaka Ayaresabea ho', ga: 'Okpa he kɛya helatsamɔhe lɛ mli' },
    symbolSpeak:    { en: 'Symbol Speak',   twi: 'Nsɛm Mfonini',    ga: 'Nsɛm Mfonini' },
    buildSentence:  { en: 'Tap pictures to talk', twi: 'Ka mfonini na wɔka', ga: 'Ka mfonini' },

    // ────────────────────────────────────────
    // TRANSCRIPT / SPEAK NOW
    // ────────────────────────────────────────
    transcript:     { en: 'Live Transcription', twi: 'Nsɛm Mmara',  ga: 'Nsɛm' },
    tapMic:         { en: 'Tap the mic to speak', twi: 'Ka mic no', ga: 'Ka mic no' },
    listening:      { en: 'Listening...',      twi: 'Ɔretie...',           ga: 'Miboo toi...' },
    noSpeech:       { en: 'No speech detected', twi: 'Wamfa nsɛm',  ga: 'Nsɛm nni hɔ' },
    speak:          { en: 'Speak',           twi: 'Ka',              ga: 'Ke' },

    // ────────────────────────────────────────
    // SETTINGS
    // ────────────────────────────────────────
    settingsTitle:  { en: 'Settings',        twi: 'Nhyehyɛe',        ga: 'Nhyehyɛe' },
    accessibility:  { en: 'Accessibility & Display', twi: 'Sohwɛ', ga: 'Sohwɛ' },
    darkMode:       { en: 'Dark Mode',       twi: 'Sum Mo',           ga: 'Sumɔ' },
    darkModeOn:     { en: 'On',              twi: 'Da ho',            ga: 'Da ho' },
    darkModeOff:    { en: 'Off',             twi: 'Afiri ho',         ga: 'Afiri' },
    largeText:      { en: 'Large Text Display', twi: 'Nhoma Kɛse',   ga: 'Nhoma Kɛse' },
    largeTextSub:   { en: 'Increases font scaling globally', twi: 'Nhoma no bɛkɛse', ga: 'Nhoma bɛkɛse' },
    reduceMotion:   { en: 'Reduce Motion',   twi: 'Si tumi gu',       ga: 'Si tumi' },
    reduceMotionSub:{ en: 'Limits UI animations', twi: 'Nsakraee kakra', ga: 'Kɛkɛ' },
    hapticFeedback: { en: 'Haptic Feedback', twi: 'Nsa mpaebɔ', ga: 'Vibrate wiemɔ' },
    hapticSub:      { en: 'Vibrate when starting or stopping voice input', twi: 'Vibrate bere a wofiti kasa ase anaa wowie', ga: 'Vibrate kɛ o fiti wiemɔ ase lo o gbe na' },
    languageRegion: { en: 'Language & Region', twi: 'Kasa & Subu',   ga: 'Kasa' },
    appLanguage:    { en: 'App Language',    twi: 'App Kasa',         ga: 'App Kasa' },
    voiceAssistant: { en: 'Voice Assistant Preferences', twi: 'Kasa Dwuma Nhyehyɛe', ga: 'Wiemɔ Nhyehyɛe' },
    voiceSpeed:     { en: 'Voice Speaking Speed', twi: 'Kasa ho ntɛm', ga: 'Kasa ntɛm' },
    voicePitch:     { en: 'Voice Pitch Profile', twi: 'Kasa Pitch',   ga: 'Wiemɔ Pitch' },
    currentSpeed:   { en: 'Current:',         twi: 'Ɛnnɛ:',            ga: 'Sɛisei:' },
    privacyData:    { en: 'Privacy & Data',  twi: 'Nsɛm Sie',         ga: 'Nsɛm Sie' },
    clearHistory:   { en: 'Clear Transcription History', twi: 'Popa Abakɔsɛm Nyinaa', ga: 'Gbɔ Abakɔsɛm Fɛɛ' },
    clearHistorySub:{ en: 'Delete all your personal communication logs', twi: 'Popa nsɛm a woakasa', ga: 'Gbɔ wiemɔ fɛɛ' },
    profileDetails: { en: 'Profile details', twi: 'Nifo nsɛm',        ga: 'Nifo' },
    logout:         { en: 'Log Out',         twi: 'Firii Mu',          ga: 'Fi Mu' },
    logoutSubtitle: { en: 'Return to welcome screen', twi: 'San kɔ', ga: 'San kɔ' },
    account:        { en: 'Account',         twi: 'Akaunt',            ga: 'Akaunt' },

    // ────────────────────────────────────────
    // PHRASE BOARD & AAC SYMBOLS
    // ────────────────────────────────────────
    phraseBoardTitle:    { en: 'Phrase Board',        twi: 'Kasa Pam',    ga: 'Wiemɔ Baa' },
    tapCardToSpeak:      { en: 'Tap a card to speak', twi: 'Mia nsaa na kasa', ga: 'Mia baa kɛ wiemɔ' },
    quickPhrasesTitle:   { en: 'Quick Phrases',       twi: 'Nsɛm Ntɛm',   ga: 'Wiemɔ Ntɛm' },
    quickPhrasesSub:     { en: '30+ ready-made phrases — no typing needed', twi: 'Ka nsɛm ntɛm — keyboard hia a', ga: '30+ wiemɔ yɛ — nɔ bi hia' },
    customPhraseAdd:     { en: 'Custom Phrase',       twi: 'Wo Deɛ Nsɛm', ga: 'Bɔ Deɛ Wiemɔ' },
    noPhrasesCat:        { en: 'No phrases in this category.', twi: 'Nsɛm biara nni kuw yi mu.', ga: 'Wiemɔ bɛ nɛɛ mli.' },
    tapAnyToSelect:      { en: 'TAP ANYWHERE TO SELECT', twi: 'MIA BAABIARA KƐ KANYA', ga: 'MIA NƆ KƐ HALA' },
    addCustomPhraseTitle:{ en: 'Add Custom Phrase',   twi: 'Fa Wo Nsɛm Ka Ho', ga: 'Nɔ Wo Wiemɔ Kɛ' },
    catAll:              { en: 'All',                 twi: 'Nyinaa',      ga: 'Fɛɛ' },
    catBasicNeeds:       { en: 'Basic Needs',         twi: 'Hia Nneɛma',  ga: 'Nɔ hia' },
    catMedical:          { en: 'Medical',             twi: 'Ayaresa',     ga: 'Helatsamɔ' },
    catSocial:           { en: 'Social',              twi: 'Amanfoɔ',     ga: 'Nipa' },
    catCustom:           { en: 'Custom',              twi: 'Wo Deɛ',      ga: 'Bɔ Deɛ' },
    catCommunication:    { en: 'Communication',       twi: 'Nkitahodie',  ga: 'Wiemɔ' },
    catLanguage:         { en: 'Language',            twi: 'Kasa',        ga: 'Wiemɔ' },
    catFluency:          { en: 'Fluency',             twi: 'Kasa Ahoɔden', ga: 'Wiemɔ Hewale' },
    catVoice:            { en: 'Voice',               twi: 'Nne',         ga: 'Gbee' },
    catSpeechSound:      { en: 'Speech Sound',        twi: 'Kasa Nnyegyeeɛ', ga: 'Wiemɔ Gbee' },
    clearSentence:       { en: 'Clear',               twi: 'Popa nsɛm',   ga: 'Naa fɛɛ' },
    speakingBtn:         { en: 'Speaking...',         twi: 'Ɔrekasa...',  ga: 'Ɛkasa...' },
    tabWho:              { en: 'Who',                 twi: 'Hwan',        ga: 'Namɔ' },
    tabAction:           { en: 'Action',              twi: 'Adwuma',      ga: 'Nifeemɔ' },
    tabWhat:             { en: 'What',                twi: 'Deɛn',        ga: 'Mɛni' },

    // ────────────────────────────────────────
    // ASSIGNMENTS / MY ASSIGNMENTS
    // ────────────────────────────────────────
    myAssignments:  { en: 'My Assignments',  twi: 'Nnwuma a Wɔde Ama Me', ga: 'Nifeemɔ Ni Akɛha Mi' },
    todaysTasks:    { en: "Today's tasks",   twi: 'Ɛnnɛ adwuma',      ga: 'Ɛnnɛ nifeemɔ' },
    noAssignments:  { en: 'No assignments yet', twi: 'Adwuma nni hɔ', ga: 'Nifeemɔ bɛ' },
    completed:      { en: 'Completed',       twi: 'Wie',               ga: 'Gbe na' },
    pending:        { en: 'Pending',         twi: 'Twɛn',              ga: 'Twɛn' },
    holdToSpeak:    { en: 'Hold to speak',   twi: 'Twe ka',            ga: 'Mõ mli kɛ wiemɔ' },
    playInstructions: { en: 'Play instructions', twi: 'Ka nhyehyɛe',   ga: 'Ka nhyehyɛe' },
    markDone:       { en: 'Mark as done',    twi: 'Bɔ wie',            ga: 'Gbe na nifeemɔ' },
    fromYourTherapist:   { en: 'From your therapist', twi: 'Firi wo dɔkota hɔ', ga: 'Kɛjɛ onyerɛ ŋɔɔ' },
    viewingPastAssigments: { en: 'Viewing past assignments — read-only', twi: 'Nnwuma a atwam — Kenkan nko ara', ga: 'Nifeemɔ a atwam — Kenkan nko ara' },
    whisperTranscribing: { en: 'Whisper is transcribing...', twi: 'Ɔrekyerɛ ase...', ga: 'Ɛkasa...' },
    listeningTapToStop:  { en: 'Listening... Tap the mic again to stop', twi: 'Mretie... Mia mic no biom', ga: 'Mibo toi... Mia mic gbɛ' },
    noAssignmentsYet:    { en: 'No Assignments Yet',  twi: 'Adwuma biara nni hɔ', ga: 'Nifeemɔ bɛ' },
    noAssignmentsSub:    { en: "Your therapist hasn't assigned any exercises yet. Check back soon!", twi: "W'okyerɛkyerɛfo nnyaa adwuma biara. San bra ɛkyire yi!", ga: "Onyerɛ gbɛ nifeemɔ biara. Kũsɛ yi bɛka!" },
    keepItUp:            { en: 'Keep it up',          twi: 'Kɔ so yɛ dɔm',        ga: 'Ya nɔ' },
    assignmentsDone:     { en: 'assignments done',    twi: 'Nnwuma awie',         ga: 'Nifeemɔ awie' },
    tapSpeakerToHear:    { en: 'Tap 🔊 to hear',      twi: 'Mia 🔊 na tie',      ga: 'Mia 🔊 bo toi' },
    tapMicToSpeak:       { en: 'Tap 🎤 to speak',     twi: 'Mia 🎤 na kasa',     ga: 'Mia 🎤 kɛɛ' },
    hearInstructions:    { en: 'Hear Instructions',   twi: 'Tie nhyehyɛe no',     ga: 'Bo toi nifeemɔ lɛ' },
    stopReading:         { en: 'Stop reading',        twi: 'Gyae akenkan',        ga: 'Kpa kanemɔ' },
    allDoneToday:        { en: 'All done for today!', twi: 'Wa wie adwuma nyinaa!', ga: 'Onyɛ ojwɛ fɛɛ!' },
    amazingWorkProgress: { en: 'Amazing work on your speech goals today.', twi: 'Woayɛ adwuma pa wɔ wo kasa bɔta mu ɛnnɛ.', ga: 'Onyɛ nifeemɔ kpakpa ŋmɛnɛ.' },
    dailyGreetingPending: { en: 'You have {count} assignments for today.', twi: 'Wɔwɔ adwuma {count} ɛnnɛ. Mia na tie.', ga: 'Oyɛ nifeemɔ {count} ŋmɛnɛ.' },
    dailyGreetingDone:    { en: 'Great work! You have completed all your assignments for today.', twi: 'Wa wie adwuma nyinaa! Adwuma pa.', ga: 'Onyɛ ojwɛ fɛɛ ŋmɛnɛ! Nifeemɔ kpakpa.' },
    quickPhrasesSubtitle: { en: 'Tap a phrase to speak', twi: 'Mia asɛm no so kasa', ga: 'Mia wiemɔ lɛ nɔ wiemɔ' },
    myPhrasesTitle:       { en: 'My Phrases',       twi: "W'ankasa nsɛm",      ga: "Mi Wiemɔi" },
    myPhrasesSub:         { en: 'Build your own speech cards', twi: "Hyehyɛ w'ankasa kasa nkrataa", ga: "Kpɛ o wiemɔi" },
    addCustomPhraseBtn:   { en: 'Add Phrase',       twi: 'Fa asɛm ka ho',      ga: 'Ka wiemɔ' },
    selectCategory:       { en: 'Select Category',  twi: 'Yi dibea',           ga: 'Hala Category' },
    newPhraseTitle:       { en: 'New Phrase',       twi: 'Nsɛm Foforɔ',        ga: 'Wiemɔ He' },
    typeYourPhrase:       { en: 'Type your phrase here...', twi: 'Twerɛ wo nsɛm wɔ ha...', ga: 'Ka o wiemɔ yɛ nɛɛ...' },
    chooseAnIcon:         { en: 'Choose an icon',   twi: 'Yi mfonini',         ga: 'Hala icon' },
    chooseAColor:         { en: 'Choose a colour',  twi: 'Yi ntaban',           ga: 'Hala ntaban' },
    missingText:          { en: 'Missing Text',     twi: 'Nsɛm aka',             ga: 'Wiemɔ aka' },
    missingTextSub:       { en: 'Please type something to add as a phrase.', twi: 'Yɛpa wo kyɛw, twerɛ asɛm bi.', ga: 'Ofĩ lɛ, ka wiemɔ bi.' },
    removePhraseTitle:    { en: 'Remove Phrase',    twi: 'Yi asɛm no fi hɔ',    ga: 'Gbɔ wiemɔ lɛ' },
    removePhraseQ:        { en: 'Remove this custom phrase?', twi: 'Wo pɛ sɛ wuyi asɛm yi?', ga: 'Otao ojie wiemɔ nɛɛ?' },
    noPhrasesYet:         { en: 'No phrases yet',   twi: 'Nsɛm nni hɔ',        ga: 'Wiemɔ bɛ' },
    tapAddHint:           { en: 'Tap "+ Add" to create your first personal phrase card.', twi: 'Mia "+ Add" na yɛ wo nsɛm foforɔ.', ga: 'Mia "+ Add" kɛha wiemɔ he.' },
    photoSymbolOptional:  { en: 'Photo Symbol (Optional)', twi: 'Mfonini (hia a)', ga: 'Mfonini' },
    tapToPickPhoto:       { en: 'Tap to pick a photo', twi: 'Mia na yi mfonini', ga: 'Mia hala mfonini' },
    removePhoto:          { en: 'Remove photo',      twi: 'Yi mfonini no fi hɔ', ga: 'Gbɔ mfonini' },
    englishTextLabel:     { en: 'English Text *',    twi: 'Borɔfo kasa *',      ga: 'English wiemɔ *' },
    twiTranslationOptional: { en: 'Twi Translation (Optional)', twi: 'Twi kasa (hia a)', ga: 'Twi wiemɔ' },
    savePhrase:           { en: 'Save Phrase',       twi: 'Sie asɛm no',        ga: 'Hye wiemɔ lɛ' },
    uploading:            { en: 'Uploading...',      twi: 'Ɔreboaboa...',       ga: 'Mitoo upload...' },
    saving:               { en: 'Saving...',         twi: 'Ɔresie...',          ga: 'Mitoo...' },

    // Mood Check-in
    dailyMoodGreeting:    { en: 'Good day! How are you feeling today?', twi: 'Maakye! Wo ho te sɛn ɛnnɛ?', ga: 'Oyiwaladongg! Bo tɛɛ oyɛ lɛ?' },
    dailyMoodSub:         { en: 'Tap one to let us know', twi: 'Fa wo nsa ka baako', ga: 'Mia nɔ nɛɛ' },
    moodResp1:            { en: 'I hear you. Your therapist will be notified.', twi: 'Mete wo ase. Wo dɔkota bɛhu.', ga: 'Menuu bo. Bo doctɔr lɛ abaa.' },
    moodResp2:            { en: 'Thank you for sharing. Take care.', twi: 'Meda wo ase. Hwɛ wo ho so.', ga: 'Oyiwaladongg. Kɛ bo jaŋ.' },
    moodResp3:            { en: 'Got it. Have a good day!', twi: 'Yoo, meda wo ase. Ɛnnɛ nyɛ!', ga: 'Yoo. Lɛ nyɛ ahe!' },
    moodResp4:            { en: 'Great to hear! Keep going!', twi: 'Ɛyɛ! Kɔ so!', ga: 'Ehe hewale! Kɛ ba!' },
    moodResp5:            { en: 'Wonderful! You are doing amazing!', twi: 'Ɛyɛ fɛ paa! Wo yɛ ade kɛse!', ga: 'Ehe hewale tsɛɛ! Bo yɛ sane!' },

    // Daily Tips
    dailyTipPrefix:       { en: "Today's speech tip: ", twi: "Ɛnnɛ nsukuu: ", ga: "Ɛnnɛ wiemɔ: " },
    tip1: { en: 'Take a deep breath before speaking. A relaxed breath gives your voice more power and clarity.', twi: 'Gye mhome kɛse ansa na woakasa. Mhome bɔkɔɔ ma wo kasa ahoɔden.', ga: 'Gye mhome kɛse ansa ni owiemɔ. Mhome bleoo ha o wiemɔ hewale.' },
    tip2: { en: 'Speak slower than you think you need to. Slowing down helps others understand you better.', twi: 'Kasa bɔkɔɔ kyerɛ sɛnea wosusuw sɛ ɛhia. Kasa bɔkɔɔ boa afoforo ma wɔte wo ase yiye.', ga: 'Wiemɔ bleoo kɛ tsɔɔ ni ojwɛ akɛ ehia. Wiemɔ bleoo yeɔ ebuaa mɛi ma amenu bo jogbaŋŋ.' },
    tip3: { en: 'Try the "ahmm" sound and hold it for 5 seconds. This warms up your vocal cords gently.', twi: 'Yɛ "ahmm" nne mma mprempren num. Wei ma wo kasa gya hyia yie.', ga: 'Kɛ "ahmm" mprempren enum. Enɛɛ haa o wiemɔ hewale.' },
    tip4: { en: 'Practice in front of a mirror. Watching your mouth and tongue helps you form sounds correctly.', twi: 'Yɛ nhyiamu wɔ ahwehwɛ anim. Wo mfonini bɛboa wo ma woakasa yie.', ga: 'San wiemɔ yɛ ahwehwɛ hiɛ. Okpɛ wiemɔ lɛ jogbaŋŋ.' },
    tip5: { en: 'Drink water regularly. Hydrated vocal cords are healthier and produce clearer sound.', twi: 'Nom nsuo daa. Nsuo boa ma wo kasa mu ka yie.', ga: 'Nu nyɔŋ daa. Nyɔŋ yeɔ ebuaa o wiemɔ jogbaŋŋ.' },

    // ────────────────────────────────────────
    // EXERCISE TRAINER
    // ────────────────────────────────────────
    exerciseTrainer:{ en: 'Exercise Trainer', twi: 'Ahoɔden Adwuma',  ga: 'Ahoɔden' },
    oralExercises:  { en: 'Oral motor exercises', twi: 'Ano ahoɔden', ga: 'Ano ho' },
    chooseExercise: { en: 'Choose an exercise to start', twi: 'Yi baako', ga: 'Yi baako' },
    noExercises:    { en: 'No exercises today', twi: 'Ahoɔden nni hɔ', ga: 'Ahoɔden nni hɔ' },
    noExercisesSub: { en: "Your therapist hasn't assigned any exercises yet.", twi: 'W\'okyerɛkyerɛfo nnyaa adwuma biara.', ga: 'Onyerɛ adwuma nni.' },
    clinicalSOSTitle: { en: 'Clinical Priority Alert', twi: 'Boa Ntɛm!', ga: 'Boa!' },
    clinicalCallForHelpSub: { en: 'Send live location and status to caregivers', twi: 'Nya mmoa na bɔ okyɛfa amanneɛ', ga: 'Naa yelikɛbuam ni ohale ohwɛlɔ lɛ nɔ' },
    clinicalAlertMsg: { en: 'Attention, I am {name}. I am having a medical difficulty and cannot speak. Please check my location.', twi: 'Mepa w\'akyɛw, me ne {name}. Mehia mmoa mpofirim na mentumi nkasa. Mepa w\'akyɛw boa me.', ga: 'Ofainɛ, miji {name}. Mihaia yelikɛbuam amrɔ nɛɛ ni nyɛmim miewiemɔ. Ofainɛ waami.' },
    medicalIDTitle: { en: 'Medical ID', twi: 'Ayaresabea Yarefoɔ Nifo', ga: 'Helatsamɔhe Nifo' },
    conditionLabel: { en: 'Condition', twi: 'Ɔyarefoɔ', ga: 'Helatsɛ' },
    allergiesLabel: { en: 'Allergies', twi: 'Mewu', ga: 'Mewu' },
    bloodTypeLabel: { en: 'Blood Type', twi: 'Mogya', ga: 'Lā' },
    emergencyContactLabel: { en: 'Emergency Contact', twi: 'Boa Ntɛm Contact', ga: 'Boa Contact' },
    broadcastAlert: { en: 'Broadcast Voice Alert', twi: 'Bɔ amanneɛ ntɛm', ga: 'Bɔ amanneɛ' },
    stopAlert: { en: 'Stop Alert', twi: 'Gyae amanneɛ', ga: 'Gyae' },
    clinicalSosContacts: { en: 'Emergency Contacts', twi: 'Boa Ntɛm!', ga: 'Boa!' },
    clinicalAddContact: { en: 'Add Contact', twi: 'Ka nipa ho', ga: 'Ka mɔ' },
    clinicalAddContactSub: { en: 'Save up to 3 contacts for quick access during emergencies.', twi: 'Hyehyɛ nnipa baasa a wobɛka wɔn ho.', ga: 'Okɛ mɛi etɛ' },
    clinicalAddEmergencyContact: { en: 'Add Emergency Contact', twi: 'Ka Boa Ntɛm nipa ho', ga: 'Ka Boa Contact' },
    clinicalNoContactSet: { en: 'No Contacts Set', twi: 'Nipa biara nni hɔ', ga: 'Mɔ ko nni hɔ' },
    clinicalNoContactSetSub: { en: 'Please add at least one emergency contact to use this feature.', twi: 'Mepa w\'akyɛw ka nipa baako kɛseɛ ho.', ga: 'Ofainɛ ka mɔ ko' },
    clinicalCallingPrefix: { en: 'Calling ', twi: 'Ɔrefrɛ ', ga: 'Mi tswɛ ' },
    clinicalCalling: { en: 'Calling...', twi: 'Ɔrefrɛ...', ga: 'Mi tswɛ...' },
    clinicalCallForHelp: { en: 'Tap to call', twi: 'Mia so na frɛ', ga: 'Tswɛ' },
    hold:           { en: '— Hold! —',       twi: '— So mu! —',        ga: '— Twe! —' },
    rest:           { en: '— Rest —',        twi: '— Gyae kakra —',    ga: '— Gyae —' },
    repOf:          { en: 'Rep',             twi: 'Adeɛ',               ga: 'Adeɛ' },
    of:             { en: 'of',              twi: 'a',                  ga: 'a' },
    greatJob:       { en: 'Great Job!',      twi: 'Ayɛ yie paa!',       ga: 'Ehe hewale!' },
    completedAll:   { en: 'You completed all your reps. Your therapist will see your progress.', twi: 'Woawie adwuma nyinaa. Wo dɔkota bɛhu.', ga: 'Woawie adwuma. Onyerɛ bɛhu.' },
    backToExercises:{ en: 'Back to Exercises', twi: 'San kɔ ahoɔden ho', ga: 'San kɔ' },
    repsHold:       { en: 'reps × hold',    twi: 'mprempren × so mu',  ga: 'mprempren × twe' },
    exerciseStartPrefix: { en: "Let's begin. ", twi: "Yɛ bɛ hyɛ aseɛ. ", ga: "Nyiɛ. " },
    exerciseStartHold: { en: "Hold for ", twi: "So mu mmere ", ga: "Twehe kɛha " },
    exerciseRestPrefix: { en: "Good! Rest. ", twi: "Ɛyɛ! Gyae kakra. ", ga: "Ehe hewale! Gyae. " },
    exerciseRestRepPrefix: { en: "Rep ", twi: "Adeɛ ", ga: "Adeɛ " },
    exerciseGo: { en: "Go!", twi: "Hyɛ aseɛ!", ga: "Nyiɛ!" },
    seconds: { en: "seconds", twi: "mpasua", ga: "seconds" },

    // ────────────────────────────────────────
    // EMERGENCY SOS
    // ────────────────────────────────────────
    emergencySOSTitle: { en: 'Emergency SOS', twi: 'Boa Ntɛm',         ga: 'Boa!' },
    callForHelpSub: { en: 'Call for help quickly', twi: 'Frɛ boa ntɛm', ga: 'Frɛ boa' },
    sosContacts:    { en: 'Emergency contacts:', twi: 'Anammɔfoo a wɔboa:', ga: 'Boa anammɔfoo:' },
    addContact:     { en: 'Add emergency contacts', twi: 'Fa contact ka ho', ga: 'Ka contact' },
    addContactSub:  { en: 'Add up to 3 people to call when you need help.', twi: 'Fa nnipa 3 a wɔfrɛ sɛ yɛhia.', ga: 'Ka nnipa 3 a wɔboa.' },
    calling:        { en: 'Calling...',      twi: 'Mefrɛ...',            ga: 'Miifɛɛ...' },
    callingPrefix:  { en: 'Calling ',         twi: 'Mefrɛ ',              ga: 'Miifɛɛ ' },
    name:           { en: 'Name',            twi: 'Din',                 ga: 'Din' },
    phone:          { en: 'Phone Number',    twi: 'Telefon',             ga: 'Telefon' },
    relation:       { en: 'Relation (Optional)', twi: 'Onipa (hia a)', ga: 'Onipa' },
    addEmergencyContact: { en: 'Add Emergency Contact', twi: 'Fa contact ka', ga: 'Ka contact' },
    pickFromPhone:  { en: 'Pick from contacts', twi: 'Yi fi phone mu',  ga: 'Yi fi phone' },
    removeContact:  { en: 'Remove Contact',  twi: 'Yi fi hɔ',           ga: 'Gbɔ' },
    removeContactQ: { en: 'Remove this emergency contact?', twi: 'Yi contact yi fi hɔ?', ga: 'Gbɔ contact yi?' },
    missingInfo:    { en: 'Missing Info',    twi: 'Nsɛm aka',            ga: 'Wiemɔ aka' },
    missingInfoSub: { en: 'Please enter a name and phone number.', twi: 'Yɛpa wo kyɛw, fa din ne nɔmba ka ho.', ga: 'Ofĩ lɛ, ka gbɛi kɛ phone nɔmba kɛ.' },
    limitReached:   { en: 'Limit Reached',   twi: 'Aduru ano',           ga: 'Ehwɛ' },
    limitReachedSub:{ en: 'You can save up to 3 emergency contacts.', twi: 'Wobɛtumi asie nnipa baasa pɛ.', ga: 'Onyɛ o hye nipa etɛ pɛ.' },
    noContactSet:   { en: 'No contact set',  twi: 'Contact nni hɔ',       ga: 'Contact bɛ' },
    noContactSetSub:{ en: 'Please add at least one emergency contact first.', twi: 'Yɛpa wo kyɛw, fa contact baako ka ho ansa.', ga: 'Ofĩ lɛ, ka contact baako kɛ he.' },
    dialerError:    { en: 'Cannot open the phone dialer on this device.', twi: 'Wuntumi mfrɛ wɔ mfiri yi so.', ga: 'Onyɛ ofrɛ yɛ nɛɛ mli.' },
    callForHelp:    { en: 'Call for help',   twi: 'Frɛ mmoa',            ga: 'Frɛ mmoa' },
    mumPlaceholder: { en: 'e.g. Mum',        twi: 'sɛ Maame',             ga: 'tɛɛ Mami' },
    phonePlaceholder: { en: 'e.g. 0244123456', twi: 'sɛ 0244123456',      ga: 'tɛɛ 0244123456' },
    relationPlaceholder: { en: 'e.g. Mother, Nurse', twi: 'sɛ Maame, Ayaresafoɔ', ga: 'tɛɛ Mami, Ayaresatsɛ' },
    contactDefault: { en: 'Contact',         twi: 'Nipa',                ga: 'Nipa' },

    dailyTipLabel:  { en: "TODAY'S SPEECH TIP", twi: 'ƐNNƐ NSUKUU',    ga: 'ƐNNƐ NSUKUU' },
    tapHearTip:     { en: 'Tap to hear this tip', twi: 'Ka ha na wɔ bɛka', ga: 'Ka ha' },

    // ────────────────────────────────────────
    // PHRASE BOARD (Duplicate Removed)
    // ────────────────────────────────────────

    // ────────────────────────────────────────
    // HISTORY
    // ────────────────────────────────────────
    historyTitle:   { en: 'History',         twi: 'Nkyerɛkyerɛmu',      ga: 'Nkyenekyene' },
    noHistory:      { en: 'No history yet',  twi: 'Nkyerɛkyerɛmu nni hɔ', ga: 'Nkyenekyene nni hɔ' },
    myConversations: { en: 'My Conversations', twi: 'Me Nkitahodie', ga: 'Mi Nifeemɔ' },
    clearHistoryPrompt: { en: 'Are you sure you want to delete all logs?', twi: 'Wo pɛ sɛ wopopa nsɛm no nyinaa ampa?', ga: 'Otao ojie nifeemɔ fɛɛ?' },
    deleteBtn:       { en: 'Delete',          twi: 'Popa',             ga: 'Jiemɔ' },
    noLogsFound:     { en: 'No logs found.',  twi: 'Nsɛm biara nni hɔ.', ga: 'Nifeemɔ bɛ.' },
    clinicalDataAnalytics: { en: 'Clinical Analytics', twi: 'Ayaresa Nkyerɛkyerɛmu', ga: 'Ayaresa Nkyenekyene' },
    noTranscriptionLogs: { en: 'No transcription logs found.', twi: 'Nsɛm biara nni hɔ ma ayarefoɔ no.', ga: 'Nifeemɔ bɛ.' },
    totalPhrases:    { en: 'Total Phrases',   twi: 'Nsɛm nyinaa',     ga: 'Nifeemɔ fɛɛ' },
    primaryMode:     { en: 'Primary Mode',    twi: 'Kasa titiriw',   ga: 'Wiemɔ titiriw' },
    peakActivity:    { en: 'Peak Activity',   twi: 'Aduwma dodoɔ',   ga: 'Nifeemɔ pii' },
    allPatients:     { en: 'All Patients',    twi: 'Ayarefoɔ nyinaa',ga: 'Helatsɛmɛi fɛɛ' },
    communicationAuditLog: { en: 'Communication Audit Log', twi: 'Nkitahodie Nkyerɛkyerɛmu', ga: 'Nkitahodie Nkyenekyene' },

    // ────────────────────────────────────────
    // VOICE JOURNAL
    // ────────────────────────────────────────
    journalTitle:    { en: 'Voice Journal',   twi: 'Nnwom Nsɛm',         ga: 'Nnwom' },
    recordJournal:   { en: 'Record a journal entry', twi: 'Bɔ nnwom nsɛm', ga: 'Bɔ nnwom' },
    howAreYouFeeling:{ en: 'How are you feeling?', twi: 'Wo ho te sɛn?', ga: 'Bo tɛɛ oyɛ lɛ?' },
    journalDesc:     { en: "This is your personal free-speaking space. Talk about your day, practice casual speech, and we'll track your fluency progress.", twi: "Saa kwan yi yɛ wo deɛ. Kasa fa wo dadi so asɛm ho, yɛbɛhwɛ wo nkitahodie ahoɔden.", ga: "Nɛɛ ji ohe gbɛ. Wiemɔ oha nifeemɔ, wɔbaana o nkyenekyene." },
    savingEntry:     { en: 'Saving your entry...', twi: 'Ɔresie nsɛm no...', ga: 'Mitoo nifeemɔ...' },
    tapToFinish:     { en: 'Tap to finish recording', twi: 'Mia na wei', ga: 'Mia kɛha gbɛ' },
    tapToStartJournal: { en: 'Tap to start your journal', twi: 'Mia mic no bɔ nnwom', ga: 'Mia mic bɔ nnwom' },
    yourEntries:     { en: 'Your Entries', twi: 'Wo Nsɛm', ga: 'O Nifeemɔ' },
    noEntriesYet:    { en: 'No journal entries yet.', twi: 'Nsɛm nni hɔ.', ga: 'Nifeemɔ nni hɔ.' },

    // ────────────────────────────────────────
    // HOSPITAL CONNECT
    // ────────────────────────────────────────
    connectTitle:   { en: 'Connect to Hospital', twi: 'Ka Ayaresabea Ho',  ga: 'Kpa he kɛya helatsamɔhe lɛ mli' },
    enterCode:      { en: 'Enter invite code', twi: 'Ka invite code no',  ga: 'Ka code no' },
    connectBtn:     { en: 'Connect',          twi: 'Ka ho',               ga: 'Ka' },
    newOrReturning: { en: 'Are you new or returning?', twi: 'Woyɛ foforɔ anaa wosan ba?', ga: 'Oyɛ he anaa osan ba?' },
    newPatient:     { en: 'New Patient',      twi: 'Ɔyarefoɔ Foforɔ',     ga: 'Helatsɛ He' },
    iHaveACode:     { en: 'I Have a Code',    twi: 'Mewɔ Koodu',          ga: 'Miyɛ Koodu' },
    firstTimeHint:  { en: '👋 First time? Enter your name and the 6-character invite code given by your therapist to get started.', twi: '👋 Woa na woreba? Ka wo din ne koodu (nwoma 6) a wo dɔkota de maa wo no.', ga: '👋 Ofĩ lɛ? Ka o gbɛi kɛ koodu (nini 6) kɛjɛ onyerɛ ŋɔɔ lɛ.' },
    fullNameLabel:  { en: 'Full Name',        twi: 'Din Nyinaa',          ga: 'Gbɛi Fɛɛ' },
    therapistInviteCode: { en: 'Therapist Invite Code', twi: 'Dɔkota Nsafrɛ Koodu', ga: 'Onyerɛ Koodu' },
    connectNow:     { en: 'Connect Now',      twi: 'Ka Ho Seesei',        ga: 'Ka Agbɛnɛ' },
    alreadyPatientHint: { en: '🔄 Already a patient? Enter your Patient ID (e.g. PAT-4829) shown on your profile. This reconnects you on any device without creating a duplicate.', twi: '🔄 Woyɛ ɔyarefoɔ dada? Ka wo ID (sɛ PAT-4829) Pɛɛ. Yɛn mfa wo nto hɔ biom baabiara.', ga: '🔄 Ojina helatsɛ lolo? Ka o ID (tɛɛ PAT-4829) a atsɔɔ mli. Enɛ baaha okpɛ lɛ jogbaŋŋ.' },
    yourPatientId:  { en: 'Your Patient ID',  twi: 'Wo Ɔyarefoɔ ID',      ga: 'O Helatsɛ ID' },
    digitsHint:     { en: 'You can enter just the 4 digits (e.g. 4829) or the full code PAT-4829', twi: 'Wobɛtumi atwerɛ nɔmba 4 nko ara anaa koodu no nyinaa PAT-4829', ga: 'Onyɛ oka ŋmɛ 4 lolo anaa koodu fɛɛ PAT-4829' },
    reconnect:      { en: 'Reconnect',        twi: 'San Ka Ho',           ga: 'San Okpɛ' },

    // ────────────────────────────────────────
    // AUTH / LOGIN
    // ────────────────────────────────────────
    therapistSubtitle: { en: 'For Therapists & Healthcare Professionals', twi: 'Ma Adɔkotafoɔ ne Ayarehwɛfoɔ', ga: 'Kɛha Onyerɛmɛi' },
    emailLabel:        { en: 'Email',            twi: 'Email',               ga: 'Email' },
    passwordLabel:     { en: 'Password',         twi: 'Password',            ga: 'Password' },
    emailPlaceholder:  { en: 'Enter your email',  twi: 'Fa wo email hyɛ mu',   ga: 'Ka o email' },
    passwordPlaceholder:{ en: 'Enter your password', twi: 'Fa wo password hyɛ mu', ga: 'Ka o password' },
    fullNamePlaceholder:{ en: 'Enter your full name', twi: 'Fa wo din hyɛ mu',    ga: 'Ka o gbɛi fɛɛ' },
    orgCodePlaceholder: { en: 'e.g., GH-KATH-2024',  twi: 'sɛ GH-KATH-2024',      ga: 'tɛɛ GH-KATH-2024' },
    orgCodeHelper:      { en: 'Contact your administrator for your organization code', twi: 'Frɛ wo panyin na wɔmma wo koodu no', ga: 'Frɛ onukpa lɛ kɛha o koodu' },
    pleaseWait:         { en: 'Please wait...',   twi: 'Yɛpa wo kyɛw, twɛn...', ga: 'Ofĩ lɛ, nyɛ...' },
    signIn:             { en: 'Sign In',          twi: 'Khyɛ mbra',            ga: 'Botu mli' },
    createAccount:      { en: 'Create Account',   twi: 'Bɔ Akaunt',            ga: 'Bɔ Akaunt' },
    alreadyHaveAccount: { en: 'Already have an account? Sign In', twi: 'Woya akaunt dada? Khyɛ mbra', ga: 'Oyɛ akaunt lolo? Botu mli' },
    newHere:            { en: 'New here? Create Account', twi: 'Woyɛ foforɔ? Bɔ Akaunt', ga: 'He ji bo? Bɔ Akaunt' },
    backToApp:          { en: '← Back to App',    twi: '← San kɔ App no mu',  ga: '← San okyɛ App' },
    loginFailed:        { en: 'Login Failed',     twi: 'Khyɛ mra no anyɛ yie', ga: 'Botu mli anyɛ' },
    signUpFailed:       { en: 'Sign Up Failed',    twi: 'Akaunt bɔ no anyɛ yie', ga: 'Bɔ akaunt anyɛ' },
    accountCreated:     { en: 'Account Created',   twi: 'Akaunt abɔ',           ga: 'Akaunt bɔ' },
    welcomeToVA:        { en: 'Welcome to VoiceAid Health!', twi: 'Akwaaba ba VoiceAid Health!', ga: 'Ojekoo ba VoiceAid Health!' },
    invalidOrgCode:     { en: 'Invalid Organization Code', twi: 'Koodu no nyɛ', ga: 'Koodu lɛ nyɛ' },
    orgCodeInvalidSub:  { en: 'The organization code you entered is not valid or inactive. Please check with your administrator.', twi: 'Koodu a wode hyɛɛ mu no nyɛ. Frɛ wo panyin.', ga: 'Koodu nɛɛ nyɛ. Frɛ onukpa lɛ.' },

    // ────────────────────────────────────────
    // CAREGIVER DASHBOARD
    // ────────────────────────────────────────
    myPatients:         { en: 'My Patients',      twi: 'Me Ayarefoɔ',         ga: 'Me Helatsɛmɛi' },
    noTherapistProfile: { en: 'No therapist profile found', twi: 'Dɔkota profile nni hɔ', ga: 'Onyerɛ profile bɛ' },
    patientHistoryTab:  { en: 'History',          twi: 'Abakɔsɛm',            ga: 'Nkyenekyene' },
    patientAnalyticsTab: { en: 'Analytics',        twi: 'Nkyerɛkyerɛmu',        ga: 'Analytics' },
    patientOverviewTab:  { en: 'Overview',         twi: 'Nhyehyɛe',            ga: 'Overview' },
    patientAssignmentsTab: { en: 'Assignments',     twi: 'Nnwuma',              ga: 'Nifeemɔ' },
    loadingPatients:    { en: 'Loading patients...', twi: 'Ɔreboaboa ayarefoɔ...', ga: 'Mitoo helatsɛmɛi...' },
    noPatientsYet:      { en: 'No Patients Yet',   twi: 'Ayarefoɔ biara nni hɔ', ga: 'Helatsɛmɛi bɛ' },
    noPatientsSubtitle: { en: "You haven't been assigned any patients yet.", twi: 'Wɔnyɛ dodoɔ biara mmaa wo.', ga: 'Okpɛ helatsɛ biara lolo.' },
    unnamedPatient:     { en: 'Unnamed Patient',   twi: 'Ɔyarefoɔ a yɛnnim no', ga: 'Helatsɛ ni bɛ gbɛi' },
    hospitalBadge:      { en: '🏥 Hospital',       twi: '🏥 Ayaresabea',       ga: '🏥 Helatsamɔhe' },
    guestBadge:         { en: '👤 Guest',          twi: '👤 Ɔhɔhoɔ',            ga: '👤 Gbɔ' },
    patientIdLabel:     { en: 'Patient ID',       twi: 'Ɔyarefoɔ ID',         ga: 'Helatsɛ ID' },
    addedDatePrefix:    { en: 'Added',             twi: 'Yɛde kaa ho',          ga: 'Ka he yɛ' },
    phrasesBtn:         { en: 'Phrases',           twi: 'Nsɛm',               ga: 'Wiemɔ' },
    historyBtn:         { en: 'History',           twi: 'Abakɔsɛm',            ga: 'Nkyenekyene' },
    patientProfile:     { en: 'Patient Profile',   twi: 'Ɔyarefoɔ Nkyerɛwee',   ga: 'Helatsɛ Nkyenekyene' },
    activeStatus:       { en: 'Active',            twi: 'Ɔreyɛ adwuma',        ga: 'Ɛyɛ nifeemɔ' },
    dischargedStatus:   { en: 'Discharged',        twi: 'Wapue',              ga: 'Eje helatsamɔhe lɛ mli' },
    fluencyStats:       { en: 'Fluency',           twi: 'Kasa ahoɔden',       ga: 'Wiemɔ hewale' },
    engagementStats:    { en: 'Engagement',        twi: 'Nkitahodie',         ga: 'Engagement' },
    progressStats:      { en: 'Progress',          twi: 'Nkɔsoɔ',             ga: 'Progress' },
    dailyAssignments:   { en: 'Daily Assignments', twi: 'Ɛnnɛ Nnwuma',       ga: 'Nifeemɔ' },
    patientProgressToday: { en: 'Patient Progress Today', twi: 'Ɔyarefoɔ Nkɔsoɔ Ɛnnɛ', ga: 'Helatsɛ Nkɔsoɔ Ɛnnɛ' },
    assignmentsDoneCount: { en: 'done',             twi: 'awie',               ga: 'awie' },
    addGoal:            { en: 'Add Goal',          twi: 'Fa Bɔta Ka Ho',      ga: 'Ka Bɔta' },
    newAssignment:      { en: 'New Assignment',    twi: 'Adwuma Foforɔ',       ga: 'Nifeemɔ He' },
    newAssignmentSub:   { en: 'Set a daily goal or exercise for this patient.', twi: 'Fa bɔta anaa adwuma mma ɔyarefoɔ yi.', ga: 'Ka bɔta anaa nifeemɔ ha helatsɛ nɛɛ.' },
    browseTemplates:    { en: 'Browse Clinical Templates', twi: 'Hwehwɛ Nnwuma Nkyerɛwee', ga: 'Hala Nifeemɔ Gbɛmɛi' },
    assignmentTitleLabel: { en: 'Title *',         twi: 'Atitire *',           ga: 'Atitire *' },
    assignmentInstructionsLabel: { en: 'Instructions (optional)', twi: 'Nhyehyɛe (hia a)', ga: 'Nhyehyɛe' },
    requiresVoiceToggle: { en: 'Requires Voice Recording', twi: 'Ɛhia Nne wɔ nne', ga: 'Ɛhiɔ Wiemɔ' },
    requiresVoiceSub:   { en: 'Patient must speak their response', twi: 'Ɔyarefoɔ no hia sɛ ɔkasa', ga: 'Helatsɛ lɛ hiɔ ni ewiemɔ' },
    slpTemplatesTitle:  { en: 'SLP Templates',     twi: 'Ayaresa Nnwuma',      ga: 'Helatsamɔ Nifeemɔi' },
    recordingBadge:     { en: '🎙️ Recording',      twi: '🎙️ Rekɔɔdin',          ga: '🎙️ Recording' },
    patientSaid:        { en: '🎤 Patient said:',  twi: '🎤 Ɔyarefoɔ no kaa sɛ:', ga: '🎤 Helatsɛ lɛ kɛɛ:' },
    fluencyAnalytics:   { en: 'Fluency Analytics', twi: 'Kasa Nkyerɛkyerɛmu',   ga: 'Wiemɔ Analytics' },
    averageWpm:         { en: 'Average WPM',       twi: 'WPM dodoɔ',           ga: 'WPM dodoɔ' },
    journalHistoryLabel: { en: 'Journal History',   twi: 'Nnwom Nkyerɛkyerɛmu', ga: 'Journal Nkyenekyene' },
    noJournalEntries:   { en: 'No journal entries', twi: 'Nnwom biara nni hɔ',   ga: 'Journal bɛ' },
    noJournalEntriesSub: { en: "The patient hasn't recorded any voice journals yet.", twi: 'Ɔyarefoɔ no nnyaa nregye nne biara ɛ.', ga: 'Helatsɛ lɛ bɔko journal biara lolo.' },
    removeAssignmentTitle: { en: 'Remove Assignment', twi: 'Yi Adwuma yi fi hɔ', ga: 'Gbɔ Nifeemɔ' },
    removeAssignmentQ:  { en: 'Are you sure you want to remove this assignment?', twi: 'Wo gye di sɛ wopɛ sɛ wuyi adwuma yi?', ga: 'Onyɛ ojwɛ akɛ ogbɔ nifeemɔ nɛɛ?' },
    missingTitleError:  { en: 'Missing Title',      twi: 'Atitire biara nni hɔ', ga: 'Atitire bɛ' },
    missingTitleSub:    { en: 'Please enter a title for this assignment.', twi: 'Yɛpa wo kyɛw, fa atitire ma adwuma yi.', ga: 'Ofĩ lɛ, ka atitire ha nifeemɔ nɛɛ.' },
    slpSuggIsolationTitle: { en: 'Repeat target sounds', twi: 'San ka nne no', ga: 'San wiemɔ wiemɔ lɛ' },
    slpSuggIsolationDesc: { en: 'Practice target speech sounds in isolation, then in words (10 reps).', twi: 'San ka nne no mprempren du.', ga: 'San wiemɔ wiemɔ lɛ toi nyɔŋ.' },
    slpSuggTongueTitle: { en: 'Tongue tip exercises',  twi: 'Tɛkrɛma adwuma',    ga: 'Tɛkɛ nifeemɔ' },
    slpSuggTongueDesc: { en: 'Touch tongue tip to roof of mouth 10 times, hold 3 seconds each.', twi: 'Fa wo tɛkrɛma ka wo nsa mprempren du.', ga: 'Ka o tɛkɛ mprempren nyɔŋ.' },
    slpSuggNameObjectsTitle: { en: 'Name 5 objects daily', twi: 'Frɛ nneɛma 5 da biara', ga: 'Tsɛ nibii 5 daa' },
    slpSuggNameObjectsDesc: { en: 'Point to 5 objects in the room and name each one clearly.', twi: 'Kyerɛ nneɛma 5 wɔ mpasua mu na frɛ wɔn yie.', ga: 'Tsɔɔ nibii 5 yɛ tsu lɛ mli.' },
    slpSuggThreeWordTitle: { en: 'Use 3-word phrases', twi: 'Fa nsɛm mmiɛnsa di dwuma', ga: 'Kpɛ wiemɔ etɛ' },
    slpSuggThreeWordDesc: { en: 'Practice communicating using at least 3-word sentences.', twi: 'San kasa fa nsɛm mmiɛnsa hyɛ nkitahodie mu.', ga: 'San wiemɔ kɛ wiemɔ etɛ.' },
    slpSuggSlowSpeechTitle: { en: 'Slow speech practice', twi: 'Kasa bɔkɔɔ',         ga: 'Wiemɔ bleoo' },
    slpSuggSlowSpeechDesc: { en: 'Speak at a deliberately slow pace for 5 minutes to reduce stammering.', twi: 'Kasa bɔkɔɔ mma miniti num na woatumi adi stammering so nimyer.', ga: 'Wiemɔ bleoo kɛha miniti enum.' },
    slpSuggVowelTitle:  { en: 'Sustain vowel for 5s', twi: 'Gyae nne mma mprempren num', ga: 'Gyae wiemɔ mprempren enum' },
    slpSuggVowelDesc:   { en: 'Say "ahhh" steadily for 5 seconds. Repeat 5 times.', twi: 'Ka "ahhh" mma mprempren num. Yɛ no mprempren num.', ga: 'Kɛɛ "ahhh" mprempren enum.' },
    patientSetupTitle:  { en: 'Patient Setup',    twi: 'Ɔyarefoɔ Nhyehyɛe',   ga: 'Helatsɛ Nkyenekyene' },
    howUseVoiceAid:     { en: 'How would you like to use VoiceAid?', twi: 'Ɛwan fa na wopɛ sɛ wode VoiceAid di dwuma?', ga: 'Namɔ okpɛ VoiceAid okpɛ?' },
    choosePatientType:  { en: 'Choose your patient type', twi: 'Yi wo yadeɛ su',   ga: 'Hala o helatsɛ nifeemɔ' },
    useAsGuest:         { en: 'Use as Guest',      twi: 'Fa di dwuma sɛ Ɔhɔhoɔ', ga: 'Okɛtsu nii akɛ Gbɔ' },
    useAsGuestDesc:     { en: 'Use the app independently without hospital affiliation', twi: 'Fa app yi di dwuma wo ho nko ara a wonka ayaresabea biara ho', ga: 'Okɛ app nɛɛ atsu nii kɛjɛ he ni waka he kɛya helatsamɔhe ko' },
    connectToHospitalTitle: { en: 'Connect to Hospital', twi: 'Ka ho wɔ Ayaresabea', ga: 'Kpa he kɛya helatsamɔhe lɛ mli' },
    hospitalAffiliationDesc: { en: "I'm affiliated with a healthcare organization", twi: 'Me ka ayaresabea bi ho', ga: 'Miyɛ gbɛfaŋ kɛya helatsamɔhe ko mli' },
    clinicalManagement: { en: 'Clinical Management', twi: 'Adɔkotafoɔ Nhyehyɛe', ga: 'Therapist Management' },
    defaultFluencyTarget: { en: 'Default Fluency Target (WPM)', twi: 'WPM Bɔta', ga: 'WPM Bɔta' },
    defaultFluencySubtitle: { en: 'Currently set to: 120 WPM', twi: 'Ahyehyɛe: 120 WPM', ga: 'Hye hye we: 120 WPM' },
    preparedDownload:   { en: 'Preparing CSV download...', twi: 'Ɔreboaboa CSV ano...', ga: 'Mitoo CSV download...' },
    targetConfigSub:    { en: 'Change default WPM target for new patients.', twi: 'Sesa WPM bɔta mma ayarefoɔ foforɔ.', ga: 'Sesa WPM bɔta ha helatsɛmɛi hei.' },
    targetConfig:       { en: 'Target Configuration', twi: 'Nhyehyɛe Bɔta', ga: 'Nhyehyɛe Bɔta' },
    globalAuditLogs:    { en: 'Global Audit Logs', twi: 'Abakɔsɛm Nkyerɛkyerɛmu', ga: 'Nkyenekyene Fɛɛ' },
    globalAuditSubtitle: { en: 'Review system-wide activity', twi: 'Hwɛ nhyehyɛe dwumadie nyinaa', ga: 'Kwɛ nifeemɔ fɛɛ' },
    dataCompliance:     { en: 'Data Compliance', twi: 'Nsɛm Mmara', ga: 'Nsɛm Mmara' },
    exportPatientData:  { en: 'Export Patient Data', twi: 'Kɔ nsɛm gu foforɔ', ga: 'Export Patient Data' },
    exportDataSubtitle: { en: 'Download copy of all client profiles', twi: 'Twa ayarefoɔ nyinaa ho mfonini', ga: 'Download copy of all client profiles' },
    roleLabel:          { en: 'Role', twi: 'Dwumadie', ga: 'Nifeemɔ' },
    patientRole:        { en: 'Patient', twi: 'Ɔyarefoɔ', ga: 'Helatsɛ' },
    therapistRole:      { en: 'Therapist', twi: 'Dɔkota', ga: 'Doctɔr' },

    logoutConfirmMessage: { en: 'Are you sure you want to logout? You will return to the welcome screen.', twi: 'Wo gye di sɛ wufi mu? Mobasane akɔ mfitiaseɛ hɔ.', ga: 'Onyɛ ojwɛ akɛ obotue? Obaasane aya welcome page.' },

    analyzingAi:        { en: 'Analyzing with AI...', twi: 'AI nkyerɛkyerɛmu...', ga: 'AI nkyerɛkyerɛmu...' },
    editTextLabel:      { en: 'EDIT TEXT:',       twi: 'SESA NSƐM:',           ga: 'SESA WIEMƆ:' },
    whatYouSaidLabel:   { en: 'WHAT YOU SAID:',   twi: 'DEA WOKAA:',           ga: 'NI OKƐƐ:' },
    edit:               { en: 'Edit',             twi: 'Sesa',               ga: 'Sesa' },
    editTranscriptionPlaceholder: { en: 'Edit transcription...', twi: 'Sesa nkyerɛwee...', ga: 'Sesa nkyerɛwee...' },
    useAiVersion:       { en: 'Use AI Version',   twi: 'Fa AI deɛ no di dwuma', ga: 'Okpɛ AI nɔ lɛ' },
    confirm:            { en: 'Confirm',          twi: 'Gye to mu',           ga: 'Gye to mu' },

    aiRefinedLabel:     { en: 'AI REFINED (BETTER GRAMMAR):', twi: 'AI NKYERƐKYERƐMU (KASA PA):', ga: 'AI NKYERƐKYERƐMU (WIEMƆ PA):' },
    speakAloud:         { en: 'Speak Aloud',      twi: 'Kasa Yie',            ga: 'Wiemɔ jogbaŋŋ' },

    // ────────────────────────────────────────
    // WELCOME
    // ────────────────────────────────────────
    voiceAidSub:    { en: 'Communication Made Easier', twi: 'Kasa Yɛ Mmerɛw', ga: 'Wiemɔ Yɛlɛlɛ' },
    whoUsing:       { en: 'Who will be using this app?', twi: 'Hwan na ɔbɛdi app yi dwuma?', ga: 'Namɔ baakpɛ app nɛɛ mli?' },
    iAmPatient:     { en: 'I am a Patient', twi: 'Me yɛ Ɔyarefoɔ', ga: 'Mi ji Helatsɛ' },
    patientDesc:    { en: 'I need help communicating', twi: 'Mehia mmoa wɔ kasa mu', ga: 'Mihiɔ mmoa ye wiemɔ mli' },
    iAmCaregiver:   { en: 'I am a Caregiver', twi: 'Me yɛ Ɔhwɛfoɔ', ga: 'Mi ji Nɔɔnsi' },
    caregiverDesc:  { en: 'I help patients communicate (requires account)', twi: 'Meboa wɔ kasa mu (ɛhia account)', ga: 'Mio mmoa (ɛkɔ account)' },
    changeAnytime:  { en: 'You can change this anytime in Settings', twi: 'Wobɛtumi asesa wei daa wɔ Nhyehyɛe mu', ga: 'Onyɛ o hye we mli' },
};

/**
 * Returns the translated string for a given key and language.
 * Falls back to English if the key or language is not found.
 */
export function t(key: keyof typeof translations, lang: Language): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry['en'] ?? key;
}

/**
 * Converts a number to its word representation in the target language.
 * Primary used for natural-sounding TTS.
 */
export function formatCount(count: number, lang: Language): string {
    const numbers: Record<Language, string[]> = {
        en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
        twi: ['hwee', 'baako', 'mmienu', 'mmiɛnsa', 'nnan', 'nnum', 'nsia', 'nson', 'nwɔtwe', 'nkron', 'ndu'],
        ga: ['hwee', 'ekome', 'enyɔ', 'etɛ', 'ejwɛ', 'enum', 'ekpaa', 'kpawo', 'kpaanyɔ', 'nehu', 'nyɔŋma']
    };

    if (count >= 0 && count <= 10) {
        return numbers[lang][count];
    }
    return count.toString();
}

/**
 * Returns a bound translator function for the given language.
 * Usage: const tr = useT(language); tr('speakNow')
 */
export function useT(lang: Language) {
    const tr = (key: keyof typeof translations) => t(key, lang);

    /**
     * Cleans, normalizes, and translates English goal/exercise titles or descriptions
     * into Twi or Ga when the app language is switched.
     */
    const translateText = (text: string | null | undefined): string => {
        if (!text) return '';
        const clean = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"“”‘’]/g, "").replace(/\s+/g, " ");
        
        const map: Record<string, keyof typeof translations> = {
            'repeat target sounds': 'slpSuggIsolationTitle',
            'practice target speech sounds in isolation then in words 10 reps': 'slpSuggIsolationDesc',
            'tongue tip exercises': 'slpSuggTongueTitle',
            'touch tongue tip to roof of mouth 10 times hold 3 seconds each': 'slpSuggTongueDesc',
            'name 5 objects daily': 'slpSuggNameObjectsTitle',
            'point to 5 objects in the room and name each one clearly': 'slpSuggNameObjectsDesc',
            'use 3-word phrases': 'slpSuggThreeWordTitle',
            'practice communicating using at least 3-word sentences': 'slpSuggThreeWordDesc',
            'slow speech practice': 'slpSuggSlowSpeechTitle',
            'speak at a deliberately slow pace for 5 minutes to reduce stammering': 'slpSuggSlowSpeechDesc',
            'sustain vowel for 5s': 'slpSuggVowelTitle',
            'say ahhh steadily for 5 seconds repeat 5 times': 'slpSuggVowelDesc'
        };

        const key = map[clean];
        if (key) {
            return t(key, lang);
        }
        return text;
    };

    return Object.assign(tr, {
        formatCount: (count: number) => formatCount(count, lang),
        translateText
    });
}
