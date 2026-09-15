import {
  APP_DESCRIPTION,
  APP_KEYWORDS,
  APP_NAME,
  APP_OG_IMAGE,
  APP_TITLE_TEMPLATE,
  DOMAIN_URL,
  EMAIL_CONTACT
} from '@Constants/common';
import type { Metadata } from 'next';

export const DEFAULT_METADATA: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: APP_TITLE_TEMPLATE
  },
  metadataBase: new URL(DOMAIN_URL),
  description: APP_DESCRIPTION,
  keywords: APP_KEYWORDS,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    emails: [EMAIL_CONTACT],
    url: DOMAIN_URL,
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE
    },
    images: [
      {
        url: APP_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: APP_NAME
      }
    ],
    description: APP_DESCRIPTION
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE
    },
    images: [
      {
        url: APP_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: APP_NAME
      }
    ],
    description: APP_DESCRIPTION
  }
};
