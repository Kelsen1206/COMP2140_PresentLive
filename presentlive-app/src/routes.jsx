import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { HelpPage } from './pages/HelpPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

import { PresentationListPage } from './pages/manage/PresentationListPage.jsx';
import { PresentationNewPage } from './pages/manage/PresentationNewPage.jsx';
import { PresentationEditPage } from './pages/manage/PresentationEditPage.jsx';
import { PresentationDetailPage } from './pages/manage/PresentationDetailPage.jsx';
import { SlideNewPage } from './pages/manage/SlideNewPage.jsx';
import { SlideEditPage } from './pages/manage/SlideEditPage.jsx';
import { AudiencePage } from './pages/manage/AudiencePage.jsx';

import { JoinPage } from './pages/attendee/JoinPage.jsx';
import { SlidePage } from './pages/attendee/SlidePage.jsx';
import { FinishPage } from './pages/attendee/FinishPage.jsx';

/**
 * The route table for the whole application.
 *
 * Routes fall into two groups. Everything under `/presentations` belongs to the
 * presenter who owns the deck. Everything under `/present/:presentationId` is
 * the audience side, reached by a shared link and identified only by the id in
 * the URL -- there is no sign-in anywhere in the app.
 *
 * The table is kept apart from the router that hosts it so the same routes can
 * be mounted under a different router when they are rendered outside a browser.
 */
export const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<HomePage />} />
      <Route path="help" element={<HelpPage />} />

      {/* Presenter workflow: create, organise and publish a deck. */}
      <Route path="presentations">
        <Route index element={<PresentationListPage />} />
        <Route path="new" element={<PresentationNewPage />} />
        <Route path=":presentationId" element={<PresentationDetailPage />} />
        <Route path=":presentationId/edit" element={<PresentationEditPage />} />
        <Route path=":presentationId/audience" element={<AudiencePage />} />
        <Route path=":presentationId/slides/new" element={<SlideNewPage />} />
        <Route path=":presentationId/slides/:slideId/edit" element={<SlideEditPage />} />
      </Route>

      {/* Audience workflow: the unique presentation link and the guided flow. */}
      <Route path="present/:presentationId">
        <Route index element={<JoinPage />} />
        <Route path="slide/:position" element={<SlidePage />} />
        <Route path="done" element={<FinishPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
