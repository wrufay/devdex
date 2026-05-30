import React, { useState } from 'react';
import { useApp } from 'ink';
import MainMenu from './screens/main-menu.js';
import StudySession from './screens/study-session.js';
import QuizMode from './screens/quiz-mode.js';
import Dashboard from './screens/dashboard.js';
import DeckBrowser from './screens/deck-browser.js';
import CreateCard from './screens/create-card.js';
import CramMode from './screens/cram-mode.js';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const { exit } = useApp();

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
