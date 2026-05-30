import React, { useState, useEffect } from 'react';
import { useApp } from 'ink';
import { supabase } from './db/connection.js';
import Auth from './screens/auth.js';
import MainMenu from './screens/main-menu.js';
import StudySession from './screens/study-session.js';
import QuizMode from './screens/quiz-mode.js';
import Dashboard from './screens/dashboard.js';
import DeckBrowser from './screens/deck-browser.js';
import CreateCard from './screens/create-card.js';
import CramMode from './screens/cram-mode.js';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { exit } = useApp();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) return null;

  if (!authed) {
    return <Auth onAuth={() => setAuthed(true)} />;
  }

  const navigate = (target) => {
    if (target === 'quit') {
      exit();
      return;
    }
    setScreen(target);
  };

  const goBack = () => setScreen('menu');

  switch (screen) {
    case 'menu':
      return <MainMenu onNavigate={navigate} />;
    case 'create':
      return <CreateCard onNavigate={navigate} />;
    case 'study':
      return <StudySession onBack={goBack} />;
    case 'quiz':
      return <QuizMode onBack={goBack} />;
    case 'cram':
      return <CramMode onBack={goBack} />;
    case 'dashboard':
      return <Dashboard onBack={goBack} />;
    case 'decks':
      return <DeckBrowser onBack={goBack} />;
    default:
      return <MainMenu onNavigate={navigate} />;
  }
}
