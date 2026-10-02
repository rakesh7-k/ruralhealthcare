import React, { createContext, useContext, useState } from 'react';
import { Globe } from 'lucide-react';

export type LanguageCode = 'en' | 'ta' | 'hi';

interface TranslationDictionary {
  appName: string;
  emergency: string;
  emergencyCall: string;
  nextStepTitle: string;
  whereToGo: string;
  whenToArrive: string;
  expectedService: string;
  yourCareJourney: string;
  needHelp: string;
  callWorker: string;
  audioListen: string;
  careInstructions: string;
  activeStatus: string;
  journeyStages: {
    start: string;
    triage: string;
    consult: string;
    referral: string;
    treatment: string;
    followup: string;
    complete: string;
  };
}

const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'SETHU Health',
    emergency: 'EMERGENCY / AMBULANCE',
    emergencyCall: 'CALL 108',
    nextStepTitle: 'Your Next Care Step',
    whereToGo: 'Where to Go',
    whenToArrive: 'Expected Date / Time',
    expectedService: 'Expected Service',
    yourCareJourney: 'Your Care Journey Progress',
    needHelp: 'Need help or transport?',
    callWorker: 'Call Health Worker',
    audioListen: 'Listen in Voice',
    careInstructions: 'Care Instructions',
    activeStatus: 'Current Status',
    journeyStages: {
      start: 'Initiated',
      triage: 'Triage',
      consult: 'Doctor Review',
      referral: 'Hospital Visit',
      treatment: 'Treatment',
      followup: 'Follow-up',
      complete: 'Completed',
    },
  },
  ta: {
    appName: 'சேது நல்வாழ்வு',
    emergency: 'அவசர சிகிச்சை / ஆம்புலன்ஸ்',
    emergencyCall: '108 அழைக்க',
    nextStepTitle: 'உங்கள் அடுத்த சிகிச்சை நடவடிக்கை',
    whereToGo: 'எங்கு செல்ல வேண்டும்',
    whenToArrive: 'நேரம் மற்றும் தேதி',
    expectedService: 'எதிர்பார்க்கப்படும் பரிசோதனை',
    yourCareJourney: 'உங்கள் சிகிச்சை முன்னேற்றம்',
    needHelp: 'உதவி அல்லது வாகனம் தேவையா?',
    callWorker: 'ஆஷா பணியாளரை அழைக்க',
    audioListen: 'குரல் வழியே கேட்க',
    careInstructions: 'மருத்துவ வழிகாட்டுதல்',
    activeStatus: 'தற்போதைய நிலை',
    journeyStages: {
      start: 'தொடக்கம்',
      triage: 'பரிசோதனை',
      consult: 'மருத்துவர் ஆலோசனை',
      referral: 'மருத்துவமனை பயணம்',
      treatment: 'சிகிச்சை',
      followup: 'தொடர் கண்காணிப்பு',
      complete: 'நிறைவு',
    },
  },
  hi: {
    appName: 'सेतु स्वास्थ्य',
    emergency: 'आपातकालीन / एम्बुलेंस',
    emergencyCall: '108 कॉल करें',
    nextStepTitle: 'आपका अगला देखभाल कदम',
    whereToGo: 'कहाँ जाना है',
    whenToArrive: 'अपेक्षित तिथि / समय',
    expectedService: 'अपेक्षित सेवा',
    yourCareJourney: 'आपकी स्वास्थ्य यात्रा',
    needHelp: 'मदद या वाहन की आवश्यकता है?',
    callWorker: 'आशा कार्यकर्ता को कॉल करें',
    audioListen: 'आवाज़ में सुनें',
    careInstructions: 'देखभाल निर्देश',
    activeStatus: 'वर्तमान स्थिति',
    journeyStages: {
      start: 'शुरुआत',
      triage: 'प्रारंभिक जांच',
      consult: 'डॉक्टर परामर्श',
      referral: 'अस्पताल रेफरल',
      treatment: 'इलाज',
      followup: 'फॉलो-अप',
      complete: 'पूर्ण',
    },
  },
};

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: TRANSLATIONS.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>('en');

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center bg-white/90 backdrop-blur rounded-lg p-1 border border-slate-200 shadow-sm text-xs font-semibold">
      <Globe className="w-3.5 h-3.5 text-slate-500 mr-1.5 ml-1" />
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang('ta')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        தமிழ்
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-2 py-1 rounded transition-colors ${
          lang === 'hi' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
