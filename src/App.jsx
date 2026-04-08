import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SectionPage from './pages/SectionPage'
import TopicPage from './pages/TopicPage'
import SearchPage from './pages/SearchPage'
import NotFoundPage from './pages/NotFoundPage'
import KnowledgePage from './pages/KnowledgePage'
import ArticleListPage from './pages/ArticleListPage'
import ArticleCategoryPage from './pages/ArticleCategoryPage'
import ArticleDetailPage from './pages/ArticleDetailPage'

function ScrollToTopOnNav() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTopOnNav />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="articles" element={<ArticleListPage />} />
          <Route path="articles/category/:categoryId" element={<ArticleCategoryPage />} />
          <Route path="articles/:articleSlug" element={<ArticleDetailPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="section/:sectionSlug" element={<SectionPage />} />
          <Route path="section/:sectionSlug/:subSlug" element={<TopicPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
