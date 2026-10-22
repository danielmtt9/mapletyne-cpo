import type { Config } from '@measured/puck'
import React from 'react'
import {
  IconPicker,
  FontPicker,
  ColorPicker,
  MediaPicker,
} from './puck-fields'
import { PuckDropZone } from './puck-dropzone'
import { WHITELIST_FONTS } from './puck-constants'

const Arrow = () => (
  <span aria-hidden="true" style={{ display: 'inline-block', marginLeft: '4px' }}><span className="material-symbols-outlined">arrow_forward</span></span>
)

/** Sanitize CSS color values to prevent XSS via dangerouslySetInnerHTML. */
function sanitizeCssColor(val: string, fallback = '#006948'): string {
  if (!val || typeof val !== 'string') return fallback
  const s = val.replace(/[;{}<>]/g, '')
  if (/^#([0-9a-fA-F]{3,8})$/.test(s)) return s
  if (/^(rgb|hsl)a?\(/.test(s)) return s
  if (/^var\(/.test(s)) return s
  return fallback
}

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary, #006948)', marginBottom: '8px' }}>
    {children}
  </span>
)

const Link: React.FC<any> = ({ href, children, ...props }) => (
  <a href={href} {...props}>{children}</a>
)

// =============================================================================
// UNIVERSAL COMPONENT PROP TYPES
// =============================================================================

export interface FeatureItem {
  icon: string
  title: string
  description: string
  linkUrl?: string
}

export interface LinkItem {
  label: string
  url: string
  style?: 'primary' | 'secondary' | 'outline'
  newTab?: boolean
  icon?: string
}

export interface TestimonialItem {
  quote: string
  authorName: string
  authorTitle?: string
  company?: string
  avatar?: string
  rating?: number
}

export interface FAQItem {
  question: string
  answer: string
}

export interface StatItem {
  title: string
  value: string
  change?: string
  trend?: 'positive' | 'negative' | 'neutral'
  icon?: string
}

export interface AudienceItem {
  icon: string
  title: string
  description: string
  badge?: string
  linkUrl?: string
  linkLabel?: string
}

// Complete Unified Puck Configuration Props
export type CombinedProps = any

export interface RootProps {
  title?: string
  fontFamily?: string
  primaryColor?: string
  showHeader?: boolean
  headerTitle?: string
  headerLogo?: string
  showFooter?: boolean
  footerCopyright?: string
  metaDescription?: string
  noIndex?: boolean
}

// =============================================================================
// MERGED PUCK CONFIGURATION
// Supports Universal CPO blocks + Universal M3 & Material Symbols blocks
// =============================================================================

export const puckConfig: Config<CombinedProps, RootProps> = {
  categories: {
    'Layout & Containers': {
      title: 'Layout & Containers',
      components: ['ColumnsBlock', 'CardContainerBlock'],
    },
    'Brand & Page Intro': {
      title: 'Brand & Page Intro',
      components: ['PageIntroBlock', 'HeroBlock', 'SectionHeadingBlock', 'ProofBandBlock', 'Hero'],
    },
    'Audiences & Commercial': {
      title: 'Audiences & Commercial',
      components: [
        'AudienceListBlock',
        'ScopeNoteBlock',
        'StorySectionBlock',
        'ValuesGridBlock',
        'DeliveryDisciplinesBlock',
        'AboutPartnersBlock',
        'PartnerGridBlock',
        'AudienceCard',
      ],
    },
    'Solutions & Engineering': {
      title: 'Solutions & Engineering',
      components: [
        'CapabilityCardsBlock',
        'SolutionsListBlock',
        'ProcessListBlock',
        'TechnicalSpecsBlock',
        'DeliveryStepsBlock',
        'FeatureGrid',
      ],
    },
    'Energy Flexibility & V2G': {
      title: 'Energy Flexibility & V2G',
      components: [
        'FlexStageBlock',
        'FlexOutcomesBlock',
        'SafeguardsListBlock',
        'EvidenceLinkBlock',
        'CalculatorEmbedBlock',
        'InnovationAreasBlock',
      ],
    },
    'Home & Residential': {
      title: 'Home & Residential',
      components: [
        'HomeDecisionGridBlock',
        'HomeSmartSectionBlock',
        'HomeProcessGridBlock',
        'HomeCtaBannerBlock',
      ],
    },
    'Forms & Conversion': {
      title: 'Forms & Conversion',
      components: [
        'ContactHeroBlock',
        'EnquiryPathsBlock',
        'ContactFormEmbedBlock',
        'TechnologyEnquiryEmbedBlock',
        'ContactNextStepsBlock',
        'ContactDetailsBlock',
        'CallToActionBlock',
        'CallToAction',
      ],
    },
    'Data, Proof & Content': {
      title: 'Data, Proof & Content',
      components: [
        'StatGrid',
        'CaseStudiesBlock',
        'ProjectNoteBlock',
        'InsightsFeedBlock',
        'Testimonials',
        'MediaBlock',
        'FAQ',
        'TextBox',
        'RichContent',
        'SiteMapGridBlock',
        'PolicyIndexBlock',
        'PolicyArticleBlock',
      ],
    },
  },

  components: {
    AudienceListBlock: {
      fields: {
        audiences: {
          type: 'array',
          arrayFields: {
            id: { type: 'text' },
            number: { type: 'text' },
            title: { type: 'text' },
            intro: { type: 'textarea' },
            points: {
              type: 'array',
              arrayFields: {
                text: { type: 'text' },
              },
            },
            cta: { type: 'text' },
            subject: { type: 'text' },
          },
        },
        showJumpNav: {
          type: 'radio',
          options: [
            { label: 'Visible', value: true },
            { label: 'Hidden', value: false },
          ],
        },
        isVisible: {
          type: 'radio',
          options: [
            { label: 'Visible', value: true },
            { label: 'Hidden', value: false },
          ],
        },
      },
      defaultProps: {
        audiences: [
          {
            id: 'homes',
            number: '01',
            title: 'Homes',
            intro: 'A practical route from property assessment to a safe, smart home charger.',
            points: [
              { text: 'Property and parking assessment' },
              { text: 'Vehicle and charging-speed fit' },
              { text: 'Electrical capacity and safe installation' },
              { text: 'Tariff, solar and future flexibility readiness' },
            ],
            cta: 'Plan a home installation',
            subject: 'Home EV charger assessment',
          },
        ],
        showJumpNav: true,
        isVisible: true,
      },
      render: ({ audiences, showJumpNav = true, isVisible = true }: any) => {
        if (!isVisible) return <></>
        return (
          <>
            {showJumpNav !== false && audiences && audiences.length > 0 && (
              <nav className="audience-jump" aria-label="Audience sections">
                {audiences.map((aud: any, idx: number) => (
                  <a href={`#${aud.id || idx}`} key={aud.id || idx}>
                    {aud.title}
                  </a>
                ))}
              </nav>
            )}
            <section className="audience-detail-list">
              {(audiences || []).map((aud: any, idx: number) => (
                <article id={aud.id} key={idx}>
                  <div className="audience-detail-heading">
                    <span>{aud.number}</span>
                    <h2>{aud.title}</h2>
                  </div>
                  <div>
                    <p>{aud.intro}</p>
                    <ul>
                      {(aud.points || []).map((p: any, pIdx: number) => {
                        const txt = typeof p === 'string' ? p : p?.text || ''
                        return <li key={pIdx}>{txt}</li>
                      })}
                    </ul>
                    {aud.cta && (
                      <Link
                        className="button button-lime"
                        href={`/contact?subject=${encodeURIComponent(aud.subject || aud.title)}#enquiry-form`}
                      >
                        {aud.cta} <Arrow />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </section>
          </>
        )
      },
    },

    ScopeNoteBlock: {
      fields: {
        heading: { type: 'text' },
        description: { type: 'textarea' },
        linkText: { type: 'text' },
        linkUrl: { type: 'text' },
        isVisible: {
          type: 'radio',
          options: [
            { label: 'Visible', value: true },
            { label: 'Hidden', value: false },
          ],
        },
      },
      defaultProps: {
        heading: 'The right commercial model for each project.',
        description:
          'We work with clients and partners to identify the right delivery and commercial approach for each project. Depending on the objectives, circumstances and long-term outcome, this may include client resources, grants, concessions, investment, revenue sharing or another structure agreed together.',
        linkText: '',
        linkUrl: '',
        isVisible: true,
      },
      render: ({ heading, description, linkText, linkUrl, isVisible = true }: any) => {
        if (!isVisible) return <></>
        return (
          <section className={`scope-note ${linkText ? 'scope-note-link' : ''}`}>
            {heading && <h2>{heading}</h2>}
            <div>
              {description && <p>{description}</p>}
              {linkText && linkUrl && (
                <Link className="button button-outline" href={linkUrl}>
                  {linkText} <Arrow />
                </Link>
              )}
            </div>
          </section>
        )
      },
    },

    ColumnsBlock: {
      fields: {
        columns: {
          type: 'select',
          label: 'Grid Columns',
          options: [
            { label: '2 Equal Columns (50 / 50)', value: '2-equal' },
            { label: '2 Asymmetric Columns (66 / 33)', value: '2-asym-left' },
            { label: '2 Asymmetric Columns (33 / 66)', value: '2-asym-right' },
            { label: '3 Equal Columns (33 / 33 / 33)', value: '3-equal' },
            { label: '4 Equal Columns (25 / 25 / 25 / 25)', value: '4-equal' },
          ],
        },
        gap: {
          type: 'select',
          options: [
            { label: 'Normal (24px)', value: '24px' },
            { label: 'Large (48px)', value: '48px' },
            { label: 'Tight (12px)', value: '12px' },
          ],
        },
      },
      defaultProps: {
        columns: '2-equal',
        gap: '24px',
      },
      render: ({ columns = '2-equal', gap = '24px' }: any) => {
        const is3Col = columns === '3-equal'
        const is4Col = columns === '4-equal'
        const gridTemplate =
          columns === '4-equal'
            ? 'repeat(4, minmax(0, 1fr))'
            : columns === '3-equal'
            ? 'repeat(auto-fit, minmax(280px, 1fr))'
            : columns === '2-asym-left'
            ? '2fr 1fr'
            : columns === '2-asym-right'
            ? '1fr 2fr'
            : '1fr 1fr'

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              gap,
              margin: '2rem 0',
            }}
          >
            <div style={{ minHeight: '90px' }}>
              <PuckDropZone zone="column-1" />
            </div>
            <div style={{ minHeight: '90px' }}>
              <PuckDropZone zone="column-2" />
            </div>
            {(is3Col || is4Col) && (
              <div style={{ minHeight: '90px' }}>
                <PuckDropZone zone="column-3" />
              </div>
            )}
            {is4Col && (
              <div style={{ minHeight: '90px' }}>
                <PuckDropZone zone="column-4" />
              </div>
            )}
          </div>
        )
      },
    },

    CardContainerBlock: {
      fields: {
        background: {
          type: 'select',
          options: [
            { label: 'White Surface (#ffffff)', value: '#ffffff' },
            { label: 'Subtle Paper (#f8fafc)', value: '#f8fafc' },
            { label: 'Electric Lime Tint (12%)', value: 'rgba(183, 255, 56, 0.12)' },
            { label: 'Dark Carbon (#090c0b)', value: '#090c0b' },
          ],
        },
        padding: {
          type: 'select',
          options: [
            { label: 'Standard (32px)', value: '32px' },
            { label: 'Spacious (48px)', value: '48px' },
            { label: 'Compact (16px)', value: '16px' },
          ],
        },
        border: {
          type: 'radio',
          options: [
            { label: 'Hairline Rule', value: 'hairline' },
            { label: 'No Border', value: 'none' },
          ],
        },
      },
      defaultProps: {
        background: '#ffffff',
        padding: '32px',
        border: 'hairline',
      },
      render: ({ background = '#ffffff', padding = '32px', border = 'hairline' }: any) => (
        <div
          style={{
            padding,
            backgroundColor: background,
            border: border === 'hairline' ? '1px solid var(--rule, rgba(9, 12, 11, 0.14))' : 'none',
            margin: '2rem 0',
            minHeight: '120px',
          }}
        >
          <PuckDropZone zone="card-body" />
        </div>
      ),
    },

    // 2. Universal Custom-Field-Enabled Blocks
    StatGrid: {
      fields: {
        eyebrow: { type: 'text' },
        heading: { type: 'text' },
        subheading: { type: 'textarea' },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          options: [
            { label: '1 Column', value: '1' },
            { label: '2 Columns', value: '2' },
            { label: '3 Columns', value: '3' },
            { label: '4 Columns', value: '4' },
          ],
        },
        stats: {
          type: 'array',
          arrayFields: {
            title: { type: 'text' },
            value: { type: 'text' },
            change: { type: 'text' },
            trend: {
              type: 'select',
              options: [
                { label: 'Positive (Green)', value: 'positive' },
                { label: 'Negative (Red)', value: 'negative' },
                { label: 'Neutral (Gray)', value: 'neutral' },
              ],
            },
            icon: {
              type: 'custom',
              render: ({ value, onChange }) => <IconPicker value={value} onChange={onChange} label="Metric Icon" />,
            },
          },
        },
      },
      defaultProps: {
        eyebrow: 'IMPACT & SCALE',
        heading: 'Proven Performance Metrics',
        subheading: 'Real-time telemetry and operational benchmarks across connected installations.',
        columns: '4',
        stats: [
          { title: 'Carbon Avoided', value: '4,850 tCO2e', change: '+34.2% YoY', trend: 'positive', icon: 'eco' },
          { title: 'Fleet Availability', value: '99.98%', change: '+0.12%', trend: 'positive', icon: 'speed' },
          { title: 'Managed Sites', value: '142 Sites', change: '+18 this month', trend: 'positive', icon: 'ev_station' },
          { title: 'Response SLA', value: '< 15 mins', change: '-4 mins', trend: 'positive', icon: 'timer' },
        ],
      },
      render: ({ eyebrow, heading, subheading, columns = '4', stats }) => (
        <section style={{ padding: '3rem 0', margin: '1rem 0' }}>
          {(eyebrow || heading || subheading) && (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {heading && (
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  {heading}
                </h2>
              )}
              {subheading && (
                <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', color: 'var(--muted, #6c766f)' }}>
                  {subheading}
                </p>
              )}
            </div>
          )}

          {stats && stats.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: '1.25rem',
              }}
            >
              {stats.map((item: any, idx: number) => {
                const trendColor =
                  item.trend === 'negative' ? '#ef4444' : item.trend === 'neutral' ? '#64748b' : '#10b981'
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.75rem',
                      borderRadius: '0px',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      border: '1px solid var(--rule, rgba(9, 12, 11, 0.14))',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted, #6c766f)' }}>{item.title}</span>
                      {item.icon && (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: 'var(--lime, #b7ff38)',
                            color: 'var(--ink, #090c0b)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--ink, #090c0b)', fontFamily: 'var(--font-barlow, sans-serif)', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                      {item.value}
                    </div>
                    {item.change && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: trendColor }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {item.trend === 'negative' ? 'trending_down' : 'trending_up'}
                        </span>
                        <span>{item.change}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ),
    },

    FeatureGrid: {
      fields: {
        eyebrow: { type: 'text' },
        heading: { type: 'text' },
        subheading: { type: 'textarea' },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          options: [
            { label: '1 Column', value: '1' },
            { label: '2 Columns', value: '2' },
            { label: '3 Columns', value: '3' },
            { label: '4 Columns', value: '4' },
          ],
        },
        features: {
          type: 'array',
          arrayFields: {
            icon: {
              type: 'custom',
              render: ({ value, onChange }) => <IconPicker value={value} onChange={onChange} label="Material Symbol" />,
            },
            title: { type: 'text' },
            description: { type: 'textarea' },
            linkUrl: { type: 'text' },
          },
        },
      },
      defaultProps: {
        eyebrow: 'CORE CAPABILITIES',
        heading: 'Engineered for Maximum Reliability',
        subheading: 'Modular architecture designed to power critical distributed enterprise systems.',
        columns: '3',
        features: [
          { icon: 'bolt', title: 'Ultra-low Latency', description: 'Sub-millisecond processing pipelines built with edge-distributed caches.', linkUrl: '#' },
          { icon: 'security', title: 'Enterprise Security', description: 'SOC2 Type II compliant with end-to-end envelope encryption and RBAC.', linkUrl: '#' },
          { icon: 'sync', title: 'Continuous Deployment', description: 'Automated CI/CD workflows and self-healing zero-downtime micro-frontends.', linkUrl: '#' },
        ],
      },
      render: ({ eyebrow, heading, subheading, columns = '3', features }) => (
        <section style={{ padding: '3.5rem 0', margin: '1rem 0' }}>
          {(eyebrow || heading || subheading) && (
            <div style={{ marginBottom: '2.5rem' }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {heading && (
                <h2 style={{ fontSize: 'clamp(50px, 5vw, 78px)', fontWeight: 800, margin: '0 0 0.75rem 0', fontFamily: 'var(--font-barlow, sans-serif)', lineHeight: 0.95 }}>
                  {heading}
                </h2>
              )}
              {subheading && (
                <p style={{ maxWidth: '650px', fontSize: '1.05rem', color: 'var(--muted, #6c766f)', lineHeight: 1.7 }}>
                  {subheading}
                </p>
              )}
            </div>
          )}

          {features && features.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: '1.5rem',
              }}
            >
              {features.map((feat: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '2rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid var(--rule, rgba(9, 12, 11, 0.14))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: 'var(--lime, #b7ff38)',
                      color: 'var(--ink, #090c0b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      {feat.icon || 'star'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--muted, #6c766f)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                    {feat.description}
                  </p>
                  {feat.linkUrl && (
                    <Link
                      href={feat.linkUrl}
                      className="button button-lime"
                      style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                    >
                      <span>Learn more</span> <Arrow />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ),
    },

    AudienceCard: {
      fields: {
        eyebrow: { type: 'text' },
        heading: { type: 'text' },
        subheading: { type: 'textarea' },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          options: [
            { label: '1 Column', value: '1' },
            { label: '2 Columns', value: '2' },
            { label: '3 Columns', value: '3' },
            { label: '4 Columns', value: '4' },
          ],
        },
        audiences: {
          type: 'array',
          arrayFields: {
            icon: {
              type: 'custom',
              render: ({ value, onChange }) => <IconPicker value={value} onChange={onChange} label="Persona Icon" />,
            },
            title: { type: 'text' },
            description: { type: 'textarea' },
            badge: { type: 'text' },
            linkUrl: { type: 'text' },
            linkLabel: { type: 'text' },
          },
        },
      },
      defaultProps: {
        eyebrow: 'TAILORED SOLUTIONS',
        heading: 'Who We Partner With',
        subheading: 'Turnkey charging infrastructure and energy flexibility solutions tailored for every scale.',
        columns: '3',
        audiences: [
          {
            icon: 'corporate_fare',
            title: 'Commercial Fleets & Depots',
            description: 'Turnkey electrification for logistics fleets, depot load balancing, and V2G revenue capture.',
            badge: 'Depot & Fleet',
            linkUrl: '/contact?segment=fleet',
            linkLabel: 'Fleet Solutions',
          },
          {
            icon: 'domain',
            title: 'Real Estate & Landlords',
            description: 'Tenant charging amenities, ESG compliance scoring, and automated revenue collection.',
            badge: 'Property Asset',
            linkUrl: '/contact?segment=real-estate',
            linkLabel: 'Property Solutions',
          },
          {
            icon: 'electric_bolt',
            title: 'Public Charging Networks (CPOs)',
            description: 'White-label roaming integrations, OCPP 2.0.1 compliance, and 99.9% uptime dispatch.',
            badge: 'CPO Network',
            linkUrl: '/contact?segment=cpo',
            linkLabel: 'CPO Solutions',
          },
        ],
      },
      render: ({ eyebrow, heading, subheading, columns = '3', audiences }) => (
        <section style={{ padding: '3.5rem 0', margin: '1rem 0' }}>
          {(eyebrow || heading || subheading) && (
            <div style={{ marginBottom: '2.5rem' }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {heading && (
                <h2 style={{ fontSize: 'clamp(55px, 5.5vw, 84px)', fontWeight: 800, margin: '0 0 0.75rem 0', fontFamily: 'var(--font-barlow, sans-serif)', lineHeight: 0.94 }}>
                  {heading}
                </h2>
              )}
              {subheading && (
                <p style={{ maxWidth: '650px', fontSize: '1.05rem', color: 'var(--muted, #6c766f)', lineHeight: 1.7 }}>
                  {subheading}
                </p>
              )}
            </div>
          )}

          {audiences && audiences.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: '1.5rem',
              }}
            >
              {audiences.map((aud: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '2rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid var(--rule, rgba(9, 12, 11, 0.14))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'var(--lime, #b7ff38)',
                          color: 'var(--ink, #090c0b)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                          {aud.icon || 'star'}
                        </span>
                      </div>
                      {aud.badge && (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '4px 8px',
                            border: '1px solid var(--rule, rgba(9,12,11,0.14))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--muted, #6c766f)',
                          }}
                        >
                          {aud.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                      {aud.title}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--muted, #6c766f)', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                      {aud.description}
                    </p>
                  </div>

                  {aud.linkUrl && (
                    <Link
                      href={aud.linkUrl}
                      className="button button-lime"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <span>{aud.linkLabel || 'Learn more'}</span> <Arrow />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ),
    },

    CallToAction: {
      fields: {
        heading: { type: 'text' },
        subheading: { type: 'textarea' },
        theme: {
          type: 'select',
          options: [
            { label: 'Lime Highlight', value: 'lime' },
            { label: 'Dark Charcoal', value: 'dark' },
            { label: 'Default Paper', value: 'default' },
          ],
        },
        links: {
          type: 'array',
          arrayFields: {
            label: { type: 'text' },
            url: { type: 'text' },
            icon: {
              type: 'custom',
              render: ({ value, onChange }) => <IconPicker value={value} onChange={onChange} label="Button Icon" />,
            },
          },
        },
      },
      defaultProps: {
        heading: 'Turn a charging ambition into an operating network.',
        subheading: 'We work with clients and partners to identify the right delivery and commercial approach for each project.',
        theme: 'lime',
        links: [{ label: 'Plan a project', url: '/contact', icon: 'arrow_forward' }],
      },
      render: ({ heading, subheading, theme = 'lime', links }) => (
        <section
          className={theme === 'dark' ? 'home-smart-section' : theme === 'lime' ? 'scope-note' : 'cta-panel'}
          style={{ margin: '3rem 0' }}
        >
          <div>
            <h2 style={{ fontSize: 'clamp(50px, 5vw, 78px)', lineHeight: 0.95, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)' }}>
              {heading}
            </h2>
            {subheading && (
              <p style={{ marginTop: '1rem', color: theme === 'dark' ? 'rgba(244,247,243,0.7)' : 'inherit', lineHeight: 1.7 }}>
                {subheading}
              </p>
            )}
          </div>
          {links && links.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {links.map((link: any, idx: number) => (
                <Link
                  key={idx}
                  href={link.url || '/contact'}
                  className={theme === 'lime' ? 'button button-dark' : 'button button-lime'}
                >
                  <span>{link.label}</span> <Arrow />
                </Link>
              ))}
            </div>
          )}
        </section>
      ),
    },

    TextBox: {
      fields: {
        text: { type: 'textarea' },
        variant: {
          type: 'select',
          options: [
            { label: 'Display H1 (Barlow 108px)', value: 'h1' },
            { label: 'Section Title (Barlow 72px)', value: 'h2' },
            { label: 'Card Title (Barlow 36px)', value: 'h3' },
            { label: 'Lead Paragraph (17px bold)', value: 'lead' },
            { label: 'Standard Body (Inter)', value: 'body' },
            { label: 'Eyebrow Caption (12px tracked)', value: 'caption' },
          ],
        },
        align: {
          type: 'radio',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
          ],
        },
        color: {
          type: 'select',
          options: [
            { label: 'Default Ink (#090c0b)', value: 'default' },
            { label: 'Muted Slate (#6c766f)', value: 'muted' },
            { label: 'Electric Lime (#b7ff38)', value: 'accent' },
          ],
        },
        fontFamily: {
          type: 'custom',
          render: ({ value, onChange }) => <FontPicker value={value} onChange={onChange} label="Typography Font" />,
        },
      },
      defaultProps: {
        text: 'Dependable EV charging infrastructure, delivered for the real world.',
        variant: 'h2',
        align: 'left',
        color: 'default',
        fontFamily: 'Barlow Condensed',
      },
      render: ({ text, variant = 'h2', align = 'left', color = 'default', fontFamily }) => {
        const textColor =
          color === 'muted' ? 'var(--muted, #6c766f)' : color === 'accent' ? 'var(--lime, #b7ff38)' : 'var(--ink, #090c0b)'
        const customFont = WHITELIST_FONTS.find((f: any) => f.name === fontFamily)?.family || 'var(--font-barlow, sans-serif)'

        const baseStyle: React.CSSProperties = {
          textAlign: align,
          color: textColor,
          fontFamily: customFont,
        }

        if (variant === 'h1') {
          return (
            <h1 style={{ ...baseStyle, fontSize: 'clamp(72px, 7.5vw, 112px)', fontWeight: 800, lineHeight: 0.86, margin: '2rem 0', letterSpacing: '-0.025em' }}>
              {text}
            </h1>
          )
        }
        if (variant === 'h2') {
          return (
            <h2 style={{ ...baseStyle, fontSize: 'clamp(55px, 5.5vw, 84px)', fontWeight: 800, lineHeight: 0.94, margin: '1.5rem 0' }}>
              {text}
            </h2>
          )
        }
        if (variant === 'h3') {
          return (
            <h3 style={{ ...baseStyle, fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0' }}>
              {text}
            </h3>
          )
        }
        if (variant === 'lead') {
          return (
            <p style={{ ...baseStyle, fontSize: '1.25rem', lineHeight: 1.7, margin: '1rem 0', fontWeight: 500 }}>
              {text}
            </p>
          )
        }
        if (variant === 'caption') {
          return (
            <p style={{ ...baseStyle, fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0.5rem 0' }}>
              {text}
            </p>
          )
        }
        return (
          <p style={{ ...baseStyle, fontSize: '17px', lineHeight: 1.75, margin: '1rem 0' }}>
            {text}
          </p>
        )
      },
    },

    MediaBlock: {
      fields: {
        imageUrl: {
          type: 'custom',
          render: ({ value, onChange }) => <MediaPicker value={value} onChange={onChange} label="Payload CMS Media Image" />,
        },
        caption: { type: 'text' },
        size: {
          type: 'select',
          options: [
            { label: 'Container Width', value: 'container' },
            { label: 'Wide Screen', value: 'wide' },
            { label: 'Full Bleed', value: 'fullWidth' },
          ],
        },
      },
      defaultProps: {
        caption: 'EV Infrastructure Installation',
        size: 'container',
        imageUrl: '',
      },
      render: ({ caption, size = 'container', imageUrl }) => (
        <figure
          style={{
            margin: '3rem 0',
            maxWidth: size === 'container' ? '1100px' : size === 'wide' ? '1320px' : '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={caption || 'Payload CMS Media Asset'}
              style={{
                width: '100%',
                maxHeight: '600px',
                objectFit: 'cover',
                border: '1px solid var(--rule, rgba(9, 12, 11, 0.14))',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '320px',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                border: '1px dashed var(--rule, rgba(9, 12, 11, 0.2))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted, #6c766f)',
                gap: '8px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>photo_library</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Select image from Payload CMS Media Library</span>
            </div>
          )}
          {caption && (
            <figcaption style={{ marginTop: '0.75rem', fontSize: '13px', color: 'var(--muted, #6c766f)', fontStyle: 'italic' }}>
              {caption}
            </figcaption>
          )}
        </figure>
      ),
    },

    FAQ: {
      fields: {
        eyebrow: { type: 'text' },
        heading: { type: 'text' },
        items: {
          type: 'array',
          arrayFields: {
            question: { type: 'text' },
            answer: { type: 'textarea' },
          },
        },
      },
      defaultProps: {
        eyebrow: 'FREQUENTLY ASKED QUESTIONS',
        heading: 'Everything You Need to Know',
        items: [
          {
            question: 'How does Puck synchronize with Payload CMS content?',
            answer: 'Puck bidirectional state is saved directly into Payload CMS drafts and published documents, ensuring seamless content workflows.',
          },
          {
            question: 'Can we build custom components with Google Material Symbols?',
            answer: 'Yes! All 4,200+ Google Material Symbols are natively integrated into Puck icon pickers without external icon packages.',
          },
        ],
      },
      render: ({ eyebrow, heading, items }) => (
        <section style={{ padding: '3.5rem 0', margin: '1rem 0' }}>
          {(eyebrow || heading) && (
            <div style={{ marginBottom: '2.5rem' }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {heading && (
                <h2 style={{ fontSize: 'clamp(50px, 5vw, 78px)', fontWeight: 800, margin: '0 0 0.75rem 0', fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  {heading}
                </h2>
              )}
            </div>
          )}

          {items && items.length > 0 && (
            <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column' }}>
              {items.map((item: any, idx: number) => (
                <details
                  key={idx}
                  style={{
                    borderTop: '1px solid var(--rule, rgba(9,12,11,0.14))',
                    padding: '1.5rem 0',
                    cursor: 'pointer',
                  }}
                >
                  <summary
                    style={{
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      fontFamily: 'var(--font-barlow, sans-serif)',
                      color: 'var(--ink, #090c0b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      listStyle: 'none',
                    }}
                  >
                    <span>{item.question}</span>
                    <span className="material-symbols-outlined" style={{ color: 'var(--ink, #090c0b)' }}>expand_more</span>
                  </summary>
                  <p style={{ marginTop: '1rem', color: 'var(--muted, #6c766f)', lineHeight: 1.75, fontSize: '16px' }}>
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          )}
        </section>
      ),
    },

    Testimonials: {
      fields: {
        eyebrow: { type: 'text' },
        heading: { type: 'text' },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          options: [
            { label: '1 Column', value: '1' },
            { label: '2 Columns', value: '2' },
            { label: '3 Columns', value: '3' },
            { label: '4 Columns', value: '4' },
          ],
        },
        testimonials: {
          type: 'array',
          arrayFields: {
            quote: { type: 'textarea' },
            authorName: { type: 'text' },
            authorTitle: { type: 'text' },
            company: { type: 'text' },
            avatar: {
              type: 'custom',
              render: ({ value, onChange }) => <MediaPicker value={value} onChange={onChange} label="Author Avatar" />,
            },
            rating: { type: 'number' },
          },
        },
      },
      defaultProps: {
        eyebrow: 'WHAT PARTNERS SAY',
        heading: 'Trusted by Industry Leaders',
        columns: '3',
        testimonials: [
          {
            quote: 'The visual editing experience transformed our content publishing pipeline. Rapid iteration without code bottlenecks.',
            authorName: 'Alex Mercer',
            authorTitle: 'Head of Infrastructure',
            company: 'NextGen Mobility',
            avatar: '',
            rating: 5,
          },
        ],
      },
      render: ({ eyebrow, heading, columns = '3', testimonials }) => (
        <section style={{ padding: '3.5rem 0', margin: '1rem 0' }}>
          {(eyebrow || heading) && (
            <div style={{ marginBottom: '2.5rem' }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {heading && (
                <h2 style={{ fontSize: 'clamp(50px, 5vw, 78px)', fontWeight: 800, margin: 0, fontFamily: 'var(--font-barlow, sans-serif)' }}>
                  {heading}
                </h2>
              )}
            </div>
          )}

          {testimonials && testimonials.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '1.5rem' }}>
              {testimonials.map((t: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '2rem',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    border: '1px solid var(--rule, rgba(9, 12, 11, 0.14))',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <p style={{ fontStyle: 'italic', color: 'var(--ink, #090c0b)', lineHeight: 1.7, fontSize: '1.1rem', margin: '0 0 1.5rem 0' }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--lime, #b7ff38)', color: 'var(--ink, #090c0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                      {t.authorName ? t.authorName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--ink, #090c0b)', fontSize: '0.95rem' }}>{t.authorName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted, #6c766f)' }}>
                        {[t.authorTitle, t.company].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ),
    },

    RichContent: {
      fields: {
        heading: { type: 'text' },
        body: { type: 'textarea' },
        layout: {
          type: 'radio',
          options: [
            { label: 'One Column', value: 'oneColumn' },
            { label: 'Two Columns', value: 'twoColumns' },
          ],
        },
      },
      defaultProps: {
        heading: 'Strategic Architecture & Implementation',
        body: 'Comprehensive overview detailing delivery evidence, innovation, and long-term operating services.',
        layout: 'oneColumn',
      },
      render: ({ heading, body, layout = 'oneColumn' }) => (
        <section style={{ padding: '2rem 0', margin: '1.5rem 0' }}>
          {heading && (
            <h2 style={{ fontSize: 'clamp(44px, 4.5vw, 64px)', fontWeight: 800, fontFamily: 'var(--font-barlow, sans-serif)', marginBottom: '1.5rem' }}>
              {heading}
            </h2>
          )}
          <div
            style={{
              display: layout === 'twoColumns' ? 'grid' : 'block',
              gridTemplateColumns: layout === 'twoColumns' ? '1.2fr 1fr' : '1fr',
              gap: '3rem',
              lineHeight: 1.75,
              fontSize: '17px',
              color: 'var(--muted, #6c766f)',
            }}
          >
            <div>{body}</div>
          </div>
        </section>
      ),
    },
  },

  // ===========================================================================
  // ROOT PAGE SETTINGS & EXACT SITE SHELL
  // ===========================================================================
  root: {
    fields: {
      fontFamily: {
        type: 'custom',
        render: ({ value, onChange }: any) => <FontPicker value={value} onChange={onChange} label="Heading Font" />,
      },
      primaryColor: {
        type: 'custom',
        render: ({ value, onChange }: any) => <ColorPicker value={value} onChange={onChange} label="Accent Highlight Color" />,
      },
      showHeader: {
        type: 'radio',
        options: [
          { label: 'Show Header', value: true },
          { label: 'Hide Header', value: false },
        ],
      },
      showFooter: {
        type: 'radio',
        options: [
          { label: 'Show Footer', value: true },
          { label: 'Hide Footer', value: false },
        ],
      },
      metaDescription: {
        type: 'textarea',
        label: 'SEO Meta Description (150-160 chars)',
      },
      noIndex: {
        type: 'radio',
        label: 'Search Engine Indexing',
        options: [
          { label: 'Public (Indexed)', value: false },
          { label: 'No Index (Hidden from Google)', value: true },
        ],
      },
    },
    defaultProps: {
      fontFamily: 'Barlow Condensed',
      primaryColor: '#006948',
      showHeader: true,
      showFooter: true,
      metaDescription: '',
      noIndex: false,
    },
    render: ({
      children,
      fontFamily = 'Barlow Condensed',
      primaryColor = '#0284c7',
      showHeader = true,
      showFooter = true,
    }: any) => {
      const activeFont = WHITELIST_FONTS.find((f: any) => f.name === fontFamily)?.family || 'var(--font-barlow, sans-serif)'

      return (
        <>
          {/* Material Symbols Outlined Variable Font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          />

          {/* Theme Tokens CSS */}
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${sanitizeCssColor(primaryColor, '#006948')};
                --lime: ${sanitizeCssColor(primaryColor, '#006948')};
                --font-barlow: 'Barlow Condensed', sans-serif;
                --font-inter: 'Inter', sans-serif;
                --active-font: ${sanitizeCssColor(activeFont, '#006948')};
              }
            `
          }} />

          <div
            className="page-shell page-shell-light puck-canvas-container"
            style={{
              backgroundColor: 'var(--paper, #f8fafc)',
              color: 'var(--ink, #0f172a)',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-inter, sans-serif)',
            }}
          >
            {/* Maple Tyne CPO Dynamic Header */}
            {showHeader !== false && (
              <header
                className="site-header"
                style={{
                  width: 'var(--page, min(1320px, calc(100vw - 96px)))',
                  margin: '0 auto',
                  height: '82px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--rule, rgba(15, 23, 42, 0.08))',
                }}
              >
                <a className="wordmark" href="/" aria-label="Maple Tyne CPO home" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '10px' }}>
                  <img
                    alt="Maple Tyne CPO"
                    className="brand-logo"
                    src="/favicon.svg"
                    style={{ width: '36px', height: '36px', display: 'block' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--ink, #0f172a)', letterSpacing: '-0.02em' }}>
                    Maple Tyne CPO
                  </span>
                </a>

                <nav className="desktop-nav" aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: 500 }}>
                  <a href="/" style={{ color: 'var(--ink, #0f172a)', textDecoration: 'none' }}>Dashboard</a>
                  <a href="/chargers" style={{ color: 'var(--muted, #64748b)', textDecoration: 'none' }}>Chargers</a>
                  <a href="/sessions" style={{ color: 'var(--muted, #64748b)', textDecoration: 'none' }}>Sessions</a>
                  <a href="/tariffs" style={{ color: 'var(--muted, #64748b)', textDecoration: 'none' }}>Tariffs</a>
                  <a href="/fleet" style={{ color: 'var(--muted, #64748b)', textDecoration: 'none' }}>Fleet</a>
                  <a href="/settings" style={{ color: 'var(--muted, #64748b)', textDecoration: 'none' }}>Settings</a>
                  <a
                    className="nav-cta button button-dark"
                    href="/"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7',
                      color: '#ffffff',
                      backgroundColor: '#0284c7',
                      fontWeight: 600,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    Open Platform <span aria-hidden="true"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span></span>
                  </a>
                </nav>
              </header>
            )}

            {/* Main Canvas Body */}
            <main style={{ flex: 1, width: 'var(--page, min(1320px, calc(100vw - 96px)))', margin: '0 auto', minHeight: '60vh' }}>
              {children}
            </main>

            {/* Maple Tyne CPO Footer */}
            {showFooter !== false && (
              <footer
                className="site-footer"
                style={{
                  borderTop: '1px solid var(--rule, rgba(15, 23, 42, 0.08))',
                  marginTop: '5rem',
                  padding: '60px 0 40px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ width: 'var(--page, min(1320px, calc(100vw - 96px)))', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
                  <div style={{ maxWidth: '340px' }}>
                    <a className="wordmark" href="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', gap: '10px' }}>
                      <img src="/favicon.svg" alt="Maple Tyne CPO" style={{ width: '32px', height: '32px' }} />
                      <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Maple Tyne CPO</span>
                    </a>
                    <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                      Next-generation EV charging management, OCPP 1.6/2.0.1 compliance, dynamic tariffs, and enterprise fleet infrastructure.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap', fontSize: '13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', color: '#0f172a' }}>Operations</span>
                      <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Live Dashboard</a>
                      <a href="/chargers" style={{ color: '#64748b', textDecoration: 'none' }}>Charger Farm</a>
                      <a href="/sessions" style={{ color: '#64748b', textDecoration: 'none' }}>Live Sessions</a>
                      <a href="/tariffs" style={{ color: '#64748b', textDecoration: 'none' }}>Tariff Engine</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', color: '#0f172a' }}>Management</span>
                      <a href="/fleet" style={{ color: '#64748b', textDecoration: 'none' }}>RFID &amp; Fleet</a>
                      <a href="/vehicles" style={{ color: '#64748b', textDecoration: 'none' }}>EV Models</a>
                      <a href="/pki-vault" style={{ color: '#64748b', textDecoration: 'none' }}>PKI Security Vault</a>
                      <a href="/roaming" style={{ color: '#64748b', textDecoration: 'none' }}>OCPI Roaming</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', color: '#0f172a' }}>System</span>
                      <a href="/settings" style={{ color: '#64748b', textDecoration: 'none' }}>Settings &amp; Branding</a>
                      <a href="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms &amp; Policies</a>
                      <a href="/profile" style={{ color: '#64748b', textDecoration: 'none' }}>Operator Profile</a>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: 'var(--page, min(1320px, calc(100vw - 96px)))',
                    margin: '40px auto 0',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#64748b',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <span>© {new Date().getFullYear()} Maple Tyne Technologies Ltd. All rights reserved.</span>
                  <span>OpenCPO v2.4 Enterprise Edition</span>
                </div>
              </footer>
            )}
          </div>
        </>
      )
    },
  },
}

export default puckConfig
