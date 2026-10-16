import { Bookmark, ThumbsDown } from "lucide-react"
import React from "react"

import "../../styles/pages/news-insights.css"

const insightCategories = [
  "All",
  "Tech",
  "Productivity",
  "AI",
  "Design",
  "Business",
  "Science"
] as const

const insights = [
  {
    id: "edge-computing",
    title: "The next wave of computing is moving closer to the edge",
    source: "The Verge",
    readTime: "6 min read",
    category: "Tech",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Circuit board"
  },
  {
    id: "calmer-workflows",
    title: "Why calmer workflows are helping teams do better work",
    source: "Worklife",
    readTime: "4 min read",
    category: "Productivity",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Laptop on a desk"
  },
  {
    id: "ai-research",
    title: "How new AI tools are changing the way people find answers",
    source: "MIT Technology Review",
    readTime: "7 min read",
    category: "AI",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Abstract artificial intelligence visualization"
  },
  {
    id: "adaptive-design",
    title: "Designing interfaces that feel more natural to use",
    source: "A List Apart",
    readTime: "5 min read",
    category: "Design",
    image:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Colorful design materials"
  },
  {
    id: "small-business-tools",
    title: "The tools helping small teams find room to grow",
    source: "Fast Company",
    readTime: "5 min read",
    category: "Business",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Business analytics on a laptop"
  },
  {
    id: "new-space-survey",
    title: "A new sky survey is revealing more of the distant universe",
    source: "ScienceDaily",
    readTime: "8 min read",
    category: "Science",
    image:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=160&h=160&q=75",
    imageAlt: "Stars and nebulae in deep space"
  }
]

function NewsInsightsPage() {
  const [activeCategory, setActiveCategory] =
    React.useState<(typeof insightCategories)[number]>("All")
  const [savedArticleIds, setSavedArticleIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [hiddenArticleIds, setHiddenArticleIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const filteredInsights = insights.filter(
    (insight) =>
      !hiddenArticleIds.has(insight.id) &&
      (activeCategory === "All" || insight.category === activeCategory)
  )

  function toggleSavedArticle(articleId: string) {
    setSavedArticleIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(articleId)) nextIds.delete(articleId)
      else nextIds.add(articleId)
      return nextIds
    })
  }

  function hideArticle(articleId: string) {
    setHiddenArticleIds((currentIds) => new Set(currentIds).add(articleId))
  }

  return (
    <section
      className="news-insights-page"
      aria-labelledby="news-insights-title">
      <header className="page-header">
        <h1 id="news-insights-title">News & Insights</h1>
        <p className="page-subtitle">
          Stay updated with the latest tech news, tools, and ideas.
        </p>
      </header>
      <div
        className="insights-filter-row"
        role="group"
        aria-label="Filter insights by topic">
        {insightCategories.map((category) => (
          <button
            className="insights-filter-button"
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}>
            {category}
          </button>
        ))}
      </div>
      <section
        className="insights-article-list"
        aria-label={`${activeCategory} articles`}>
        {filteredInsights.map((insight) => (
          <article className="insights-article" key={insight.id}>
            <img
              className="insights-article-image"
              src={insight.image}
              alt={insight.imageAlt}
              width={140}
              height={100}
              loading="lazy"
            />
            <div className="insights-article-info">
              <div className="insights-article-copy">
                <h2>{insight.title}</h2>
                <p>
                  <span>{insight.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{insight.readTime}</span>
                </p>
              </div>
              <div className="insights-article-footer">
                <span className="insights-article-tag">{insight.category}</span>
              </div>
            </div>
            <div className="insights-article-actions">
              <button
                className="insights-article-action"
                type="button"
                aria-label={`${savedArticleIds.has(insight.id) ? "Unsave" : "Save"} article: ${insight.title}`}
                aria-pressed={savedArticleIds.has(insight.id)}
                title={
                  savedArticleIds.has(insight.id)
                    ? "Unsave article"
                    : "Save article"
                }
                onClick={() => toggleSavedArticle(insight.id)}>
                <Bookmark
                  size={17}
                  fill={
                    savedArticleIds.has(insight.id) ? "currentColor" : "none"
                  }
                  aria-hidden="true"
                />
              </button>
              <button
                className="insights-article-action"
                type="button"
                aria-label={`Don't recommend: ${insight.title}`}
                title="Don't recommend"
                onClick={() => hideArticle(insight.id)}>
                <ThumbsDown size={17} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}

export default NewsInsightsPage
