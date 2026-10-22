/**
 * Utility functions to convert between Puck layout JSON and Payload CMS modular blocks.
 * Enables two-way bi-directional synchronization, including synthesizing existing
 * page data (Hero, Content paragraphs, modular blocks) into editable Puck components.
 */

export interface PuckBlockItem {
  type: string
  props: Record<string, any>
}

export interface PuckData {
  content?: PuckBlockItem[]
  root?: {
    props?: Record<string, any>
  }
  zones?: Record<string, PuckBlockItem[]>
}

/**
 * Extracts plain text or formatted string from Payload Lexical richText JSON structure
 */
export function extractTextFromLexical(lexical: any): string[] {
  if (!lexical || typeof lexical !== 'object') return []
  if (typeof lexical === 'string') return [lexical]

  const paragraphs: string[] = []

  function traverse(node: any): string {
    if (!node) return ''
    if (typeof node.text === 'string') {
      return node.text
    }
    if (Array.isArray(node.children)) {
      const childTexts = node.children.map(traverse).join('')
      if (node.type === 'paragraph' && childTexts.trim()) {
        paragraphs.push(childTexts.trim())
      }
      return childTexts
    }
    return ''
  }

  if (lexical.root) {
    traverse(lexical.root)
  }

  return paragraphs
}

/**
 * Converts a Puck layout data structure into Payload CMS modular blocks array.
 */
export function puckToPayloadBlocks(puckData: PuckData | null | undefined): any[] {
  if (!puckData || !Array.isArray(puckData.content)) {
    return []
  }

  const blocks: any[] = []

  for (const item of puckData.content) {
    const { type, props = {} } = item

    switch (type) {
      case 'TextBox':
      case 'textBox':
        blocks.push({
          blockType: 'content',
          layout: 'oneColumn',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: props.text || '' }],
                },
              ],
            },
          },
          background: 'none',
        })
        break

      case 'RichContent':
      case 'richContent':
        blocks.push({
          blockType: 'content',
          layout: props.layout || 'oneColumn',
          richText: props.richText || {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: props.heading ? `${props.heading}\n\n${props.body || ''}` : props.body || '' }],
                },
              ],
            },
          },
          background: props.background || 'none',
        })
        break

      case 'CallToAction':
      case 'cta':
        blocks.push({
          blockType: 'cta',
          heading: props.heading || 'Ready to get started?',
          subheading: props.subheading || '',
          theme: props.theme || 'default',
          backgroundImage: props.backgroundImage || null,
          backgroundOverlay: props.backgroundOverlay || 'dark-subtle',
          links: Array.isArray(props.links)
            ? props.links.map((link: any) => ({
                label: link.label || '',
                url: link.url || '',
                style: link.style || 'primary',
                newTab: Boolean(link.newTab),
              }))
            : [],
        })
        break

      case 'FeatureGrid':
      case 'featureGrid': {
        const VALID_FEATURE_ICONS = new Set([
          'bolt', 'verified', 'shield', 'speed', 'analytics', 'lock',
          'code', 'cloud', 'support_agent', 'auto_awesome', 'rocket_launch',
          'terminal', 'lightbulb', 'devices', 'sync', 'check_circle',
        ])
        blocks.push({
          blockType: 'featureGrid',
          eyebrow: props.eyebrow || '',
          heading: props.heading || 'Features',
          subheading: props.subheading || '',
          columns: String(props.columns || '3'),
          features: Array.isArray(props.features)
            ? props.features.map((f: any) => ({
                icon: VALID_FEATURE_ICONS.has(f.icon) ? f.icon : 'bolt',
                title: f.title || '',
                description: f.description || '',
                linkUrl: f.linkUrl || '',
              }))
            : [],
        })
        break
      }

      case 'Testimonials':
      case 'testimonials':
        blocks.push({
          blockType: 'testimonials',
          eyebrow: props.eyebrow || 'TRUSTED BY LEADERS',
          heading: props.heading || 'What our clients say',
          testimonials: Array.isArray(props.testimonials)
            ? props.testimonials.map((t: any) => ({
                quote: t.quote || '',
                authorName: t.authorName || '',
                authorTitle: t.authorTitle || '',
                company: t.company || '',
                avatar: t.avatar || null,
                companyLogo: t.companyLogo || null,
              }))
            : [],
        })
        break

      case 'MediaBlock':
      case 'mediaBlock':
        blocks.push({
          blockType: 'mediaBlock',
          media: props.media || null,
          caption: props.caption || '',
          size: props.size || 'container',
          enableLightbox: Boolean(props.enableLightbox),
        })
        break

      case 'FAQ':
      case 'faq':
        blocks.push({
          blockType: 'faq',
          eyebrow: props.eyebrow || 'QUESTIONS & ANSWERS',
          heading: props.heading || 'Frequently Asked Questions',
          subheading: props.subheading || '',
          items: Array.isArray(props.items)
            ? props.items.map((i: any) => ({
                question: i.question || '',
                answer:
                  typeof i.answer === 'object' && i.answer !== null
                    ? i.answer
                    : {
                        root: {
                          type: 'root',
                          children: [
                            {
                              type: 'paragraph',
                              children: [{ text: typeof i.answer === 'string' ? i.answer : '' }],
                            },
                          ],
                        },
                      },
              }))
            : [],
        })
        break

      case 'Content':
      case 'content':
        blocks.push({
          blockType: 'content',
          layout: props.layout || 'oneColumn',
          richText: props.richText || {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ text: typeof props.text === 'string' ? props.text : '' }],
                },
              ],
            },
          },
          background: props.background || 'none',
          backgroundImage: props.backgroundImage || null,
          backgroundOverlay: props.backgroundOverlay || 'none',
        })
        break

      default:
        // Pass-through generic custom block
        blocks.push({
          blockType: type,
          ...props,
        })
        break
    }
  }

  return blocks
}

/**
 * Converts Payload CMS modular blocks into a Puck layout data structure.
 */
export function payloadBlocksToPuck(blocks: any[] | null | undefined, rootProps: Record<string, any> = {}): PuckData {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      content: [],
      root: { props: rootProps },
    }
  }

  const content: PuckBlockItem[] = []

  for (const block of blocks) {
    const { blockType, ...rest } = block

    switch (blockType) {
      case 'cta':
        content.push({
          type: 'CallToAction',
          props: {
            heading: rest.heading,
            subheading: rest.subheading,
            theme: rest.theme,
            backgroundImage: rest.backgroundImage,
            backgroundOverlay: rest.backgroundOverlay,
            links: rest.links || [],
          },
        })
        break

      case 'featureGrid':
        content.push({
          type: 'FeatureGrid',
          props: {
            eyebrow: rest.eyebrow,
            heading: rest.heading,
            subheading: rest.subheading,
            columns: rest.columns,
            features: rest.features || [],
          },
        })
        break

      case 'testimonials':
        content.push({
          type: 'Testimonials',
          props: {
            eyebrow: rest.eyebrow,
            heading: rest.heading,
            testimonials: rest.testimonials || [],
          },
        })
        break

      case 'mediaBlock':
        content.push({
          type: 'MediaBlock',
          props: {
            media: rest.media,
            caption: rest.caption,
            size: rest.size,
            enableLightbox: rest.enableLightbox,
          },
        })
        break

      case 'faq':
        content.push({
          type: 'FAQ',
          props: {
            eyebrow: rest.eyebrow,
            heading: rest.heading,
            subheading: rest.subheading,
            items: rest.items || [],
          },
        })
        break

      case 'content':
        content.push({
          type: 'RichContent',
          props: {
            layout: rest.layout,
            richText: rest.richText,
            background: rest.background,
            backgroundImage: rest.backgroundImage,
            backgroundOverlay: rest.backgroundOverlay,
          },
        })
        break

      default:
        content.push({
          type: blockType,
          props: rest,
        })
        break
    }
  }

  return {
    content,
    root: { props: rootProps },
  }
}

/**
 * Synthesizes a full Puck layout from an existing Page document that has empty puckData.
 * Converts:
 * 1. hero -> Hero component
 * 2. layout modular blocks -> Puck components (CTA, FeatureGrid, Media, FAQ, etc.)
 * 3. content (Lexical richText) -> Individual TextBox components and RichContent cards
 */
export function synthesizePuckDataFromDoc(pageDoc: any): PuckData {
  if (!pageDoc) return { content: [], root: {} }

  // If puckData is already populated with content, return it directly
  if (
    pageDoc.puckData &&
    Array.isArray(pageDoc.puckData.content) &&
    pageDoc.puckData.content.length > 0
  ) {
    return pageDoc.puckData
  }

  const content: PuckBlockItem[] = []

  // 1. Synthesize Hero Section
  const hero = pageDoc.hero
  const pageTitle = pageDoc.title || 'Page'

  if (hero && hero.type !== 'none') {
    const heroHeading = hero.heading || pageTitle
    const heroEyebrow = hero.eyebrow || ''
    const heroSubheading = hero.richText ? extractTextFromLexical(hero.richText).join('\n\n') : ''
    const heroTheme = hero.type === 'highImpact' ? 'gradient' : hero.type === 'mediumImpact' ? 'dark' : 'light'

    content.push({
      type: 'Hero',
      props: {
        id: `Hero-${pageDoc.id || 'hero'}-0`,
        eyebrow: heroEyebrow,
        heading: heroHeading,
        subheading: heroSubheading,
        theme: heroTheme,
        links: Array.isArray(hero.links) ? hero.links : [],
      },
    })
  }

  // 2. Synthesize Layout Modular Blocks
  if (Array.isArray(pageDoc.layout) && pageDoc.layout.length > 0) {
    const layoutPuck = payloadBlocksToPuck(pageDoc.layout)
    if (layoutPuck.content) {
      layoutPuck.content.forEach((item, idx) => {
        if (item.props && !item.props.id) {
          item.props.id = `${item.type}-${pageDoc.id || 'layout'}-${idx + 1}`
        }
      })
      content.push(...layoutPuck.content)
    }
  }

  // 3. Synthesize Document Body (content field with Lexical richText)
  if (pageDoc.content) {
    const paragraphs = extractTextFromLexical(pageDoc.content)
    if (paragraphs.length > 0) {
      paragraphs.forEach((p, idx) => {
        content.push({
          type: 'TextBox',
          props: {
            id: `TextBox-${pageDoc.id || 'content'}-${idx + 1}`,
            text: p,
            variant: 'body',
            align: 'left',
          },
        })
      })
    }
  }

  return {
    content,
    root: {
      props: {
        title: pageTitle,
        slug: pageDoc.slug || '',
      },
    },
  }
}
