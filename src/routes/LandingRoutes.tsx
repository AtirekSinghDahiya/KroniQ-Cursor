import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../components/Landing/HomePage';
import { AboutPage } from '../components/Landing/AboutPage';
import { PricingPage } from '../components/Landing/PricingPage';
import { ContactPage } from '../components/Landing/ContactPage';
import { ServicesPage } from '../components/Landing/ServicesPage';
import { CareersPage } from '../components/Landing/CareersPage';
import { DocsPage } from '../components/Landing/DocsPage';
import { LegalPages } from '../components/Legal/LegalPages';
import PromoLandingPage from '../components/Promo/PromoLandingPage';

interface LandingRoutesProps {
  onGetStarted: () => void;
}

export const LandingRoutes: React.FC<LandingRoutesProps> = ({ onGetStarted }) => {
  return (
    <Routes>
      <Route path="/" element={<HomePage onGetStarted={onGetStarted} />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage onGetStarted={onGetStarted} />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/privacy" element={<LegalPages page="privacy" />} />
      <Route path="/terms" element={<LegalPages page="terms" />} />
      <Route path="/cookies" element={<LegalPages page="cookies" />} />
      <Route path="/security" element={<LegalPages page="security" />} />
      <Route path="/promo" element={<PromoLandingPage />} />
      <Route path="/first100" element={<PromoLandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
