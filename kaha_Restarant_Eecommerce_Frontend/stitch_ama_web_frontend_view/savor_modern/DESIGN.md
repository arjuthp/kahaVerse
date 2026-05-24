---
name: Savor Modern
colors:
  surface: '#fff8f6'
  surface-dim: '#f0d4ce'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ed'
  surface-container: '#ffe9e4'
  surface-container-high: '#ffe2dc'
  surface-container-highest: '#f9dcd6'
  on-surface: '#271814'
  on-surface-variant: '#5b403a'
  inverse-surface: '#3d2c28'
  inverse-on-surface: '#ffede9'
  outline: '#8f7069'
  outline-variant: '#e3beb6'
  surface-tint: '#b52703'
  primary: '#b12401'
  on-primary: '#ffffff'
  primary-container: '#d53e1b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a3'
  secondary: '#586062'
  on-secondary: '#ffffff'
  secondary-container: '#dae1e3'
  on-secondary-container: '#5d6466'
  tertiary: '#5c5c58'
  on-tertiary: '#ffffff'
  tertiary-container: '#757571'
  on-tertiary-container: '#fefcf7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8b1a00'
  secondary-fixed: '#dde4e6'
  secondary-fixed-dim: '#c1c8ca'
  on-secondary-fixed: '#161d1f'
  on-secondary-fixed-variant: '#41484a'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#fff8f6'
  on-background: '#271814'
  surface-variant: '#f9dcd6'
  status-pending: '#F2994A'
  status-processing: '#2F80ED'
  status-shipped: '#9B51E0'
  status-delivered: '#27AE60'
  status-cancelled: '#EB5757'
  slate-gray: '#636E72'
  price-gold: '#B08968'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  container-max: 1200px
---

## Brand & Style

The design system is engineered for a high-end, multi-tenant e-commerce experience that bridges the gap between professional enterprise reliability and the sensory appeal of gourmet dining. It targets urban diners and food enthusiasts who value efficiency without sacrificing aesthetic pleasure.

The chosen style is **Minimalist with Tactile Accents**. It leverages generous whitespace and a refined typographic scale to ensure clarity in complex menu structures, while using soft, organic shadows and vibrant appetite-stimulating color pops to create a "digital tabletop" feel. The interface stays out of the way of the food photography, acting as a clean, sophisticated canvas that makes menu items feel premium and desirable.

## Colors

The palette is anchored by a rich **Terracotta Red** (`#D9411E`), specifically selected for its appetite-whetting qualities and modern warmth. This is paired with an **Off-White** (`#F9F7F2`) background to reduce eye strain and provide a more organic, paper-like feel than pure white.

**Slate Grays** handle the secondary UI hierarchy, ensuring that text remains legible but softer than pure black. The status colors follow a logical functional mapping:
- **Pending:** Warm orange for anticipation.
- **Processing:** Calm blue for active work.
- **Delivered:** Vitality green for completion.
- **Cancelled:** Muted red for finality.

Price points use a specific **Price Gold** or the Primary color to denote value and drive conversion.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

**Manrope** is used for headlines and price displays. Its geometric yet friendly construction provides a modern, structured feel that anchors the page. Large headlines utilize tighter letter spacing and heavy weights to create impact.

**Be Vietnam Pro** is utilized for body copy, labels, and descriptions. Its contemporary humanist traits and generous x-height ensure excellent legibility even at small sizes, such as ingredient lists or calorie counts.

Special attention is given to **Price Display**, which uses a bold weight of Manrope to ensure the cost is the most easily scannable element in a menu card.

## Layout & Spacing

The system follows a **Fluid-Fixed hybrid grid**. While the overall container has a maximum width for desktop readability, the internal menu grids use a fluid column system that reflows based on screen width.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

Spacing follows a strict 4px baseline shift. Use `lg` (24px) for padding within cards and `xl` (32px) for vertical section spacing. Interaction targets (buttons, checkboxes) must maintain a minimum hit area of 44px regardless of visual size.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

The background layer uses the tertiary off-white color. Interactive cards sit one level above on a pure white surface (`#FFFFFF`) with a very soft, diffused shadow (15% opacity of the secondary color with a 20px blur). 

When a user interacts with a card (hover), the shadow deepens slightly and the card lifts (2px translation), providing tactile feedback. Modals and floating action buttons (like "View Cart") use a high-elevation shadow to clearly sit above the main content stream. Ghost borders (1px solid in a light gray) are used for inactive selection states to maintain structure without adding visual weight.

## Shapes

The shape language is **Rounded**, reflecting the organic nature of food. 

Standard components like input fields and buttons use a 0.5rem (8px) radius. Larger containers, such as menu item cards and modals, utilize `rounded-lg` (16px) to create a soft, inviting frame for food photography. 

Buttons that serve as primary CTAs (e.g., "Add to Cart") can optionally use `rounded-xl` (24px) to appear more "pill-like" and approachable, distinguishing them from structural grid elements.

## Components

### Buttons
Primary buttons use the Terracotta Red with white text. Hover states should darken the background color by 10%. Secondary buttons use a slate-gray outline with no fill.

### Menu Cards
Cards are the primary container. They must feature a high-quality image at the top with a fixed aspect ratio (4:3). The bottom section contains the title, a truncated description in `body-md`, and a price badge.

### Price Badges
Price badges sit in the bottom right of cards. Current prices are bold and primary-colored. Original prices (for discounts) are shown in `label-md` with a strikethrough and slate-gray color.

### Selection Controls
- **Radio Buttons (Variants):** Custom circular controls with a thick primary border when selected and a center dot.
- **Checkboxes (Add-ons):** Square with 4px rounded corners. The "checked" state fills the box with the primary color and a white checkmark.
- **Quantity Selector:** A horizontal grouped component with minus/plus icons and a centered count.

### Status Badges
Small, pill-shaped indicators with a 10% opacity background of the status color and 100% opacity text for the label.

### Input Fields
Clean white backgrounds with 1px slate-gray borders. Focus states should trigger a 2px primary-colored border and a subtle glow.