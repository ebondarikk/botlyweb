import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './app/page';
import LoginPage from './app/login/page';
import BotPage from './app/bot/page';
import { BotProvider } from './context/BotContext.jsx';
import ProductList from './app/bot/products/page';
import ProductFormPage from './app/bot/products/product/page';
import UsersList from './app/bot/users/page';
import CategoriesList from './app/bot/categories/page';
import CategoryFormPage from './app/bot/categories/category/page';
import MailingsList from './app/bot/mailings/page';
import MailingFormPage from './app/bot/mailings/mailing/page';
import ManagersList from './app/bot/managers/page';
import ManagerFormPage from './app/bot/managers/manager/page';
import CreateBot from './app/create-bot/page';
import SettingsPage from './app/bot/settings/page';
import BillingPage from './app/billing/page';
import SubscriptionPage from './app/bot/subscription/page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут кэш считается свежим
      cacheTime: 10 * 60 * 1000, // 10 минут кэш хранится перед удалением
    },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/add" element={<CreateBot />} />
          <Route
            path="/:bot_id"
            element={
              <BotProvider>
                <BotPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/products"
            element={
              <BotProvider>
                <ProductList />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/products/add"
            element={
              <BotProvider>
                <ProductFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/products/:product_id"
            element={
              <BotProvider>
                <ProductFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/users"
            element={
              <BotProvider>
                <UsersList />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/categories"
            element={
              <BotProvider>
                <CategoriesList />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/categories/:category_id"
            element={
              <BotProvider>
                <CategoryFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/categories/add"
            element={
              <BotProvider>
                <CategoryFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/mailings"
            element={
              <BotProvider>
                <MailingsList />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/mailings/:mailing_id"
            element={
              <BotProvider>
                <MailingFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/mailings/add"
            element={
              <BotProvider>
                <MailingFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/managers"
            element={
              <BotProvider>
                <ManagersList />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/managers/:manager_id"
            element={
              <BotProvider>
                <ManagerFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/managers/add"
            element={
              <BotProvider>
                <ManagerFormPage />
              </BotProvider>
            }
          />
          <Route
            path="/:bot_id/settings"
            element={
              <BotProvider>
                <SettingsPage />
              </BotProvider>
            }
          />
          <Route path="/:bot_id/billing" element={<BillingPage />} />
          <Route
            path="/:bot_id/subscription"
            element={
              <BotProvider>
                <SubscriptionPage />
              </BotProvider>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
