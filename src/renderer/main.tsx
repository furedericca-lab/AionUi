/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import './utils/ui/runtimePatches';
import '@/common/adapter/browser';

import type { PropsWithChildren } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from './hooks/context/AuthContext';
import { ThemeProvider } from './hooks/context/ThemeContext';
import { PreviewProvider } from './pages/conversation/Preview/context/PreviewContext';
import { ConversationTabsProvider } from './pages/conversation/hooks/ConversationTabsContext';

import { ConfigProvider } from '@arco-design/web-react';
import '@arco-design/web-react/es/_util/react-19-adapter';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import jaJP from '@arco-design/web-react/es/locale/ja-JP';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import { useTranslation } from 'react-i18next';

import 'uno.css';
import './styles/arco-override.css';
import './styles/themes/index.css';

import './services/i18n';
import { registerPwa } from './services/registerPwa';

import Layout from './components/layout/Layout';
import Router from './components/layout/Router';
import Sider from './components/layout/Sider';
import { useAuth } from './hooks/context/AuthContext';
import { ConversationHistoryProvider } from './hooks/context/ConversationHistoryContext';
import HOC from './utils/ui/HOC';

const arcoLocales: Record<string, typeof enUS> = {
  'zh-CN': zhCN,
  'ja-JP': jaJP,
  'en-US': enUS,
};

const AppProviders: React.FC<PropsWithChildren> = ({ children }) =>
  React.createElement(
    AuthProvider,
    null,
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(PreviewProvider, null, React.createElement(ConversationTabsProvider, null, children))
    )
  );

const Config: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    i18n: { language },
  } = useTranslation();
  const arcoLocale = arcoLocales[language] ?? enUS;

  return React.createElement(ConfigProvider, { theme: { primaryColor: '#4E5969' }, locale: arcoLocale }, children);
};

const Main = () => {
  const { ready } = useAuth();

  if (!ready) {
    return null;
  }

  return (
    <Router
      layout={
        <ConversationHistoryProvider>
          <Layout sider={<Sider />} />
        </ConversationHistoryProvider>
      }
    />
  );
};

const App = HOC.Wrapper(Config)(Main);

void registerPwa();

const root = createRoot(document.getElementById('root')!);
root.render(React.createElement(AppProviders, null, React.createElement(App)));
