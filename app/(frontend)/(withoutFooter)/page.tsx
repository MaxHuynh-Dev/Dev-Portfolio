import Studio from '@Modules/Studio';
import type React from 'react';

// No metadata export here on purpose: the root layout already sets
// DEFAULT_METADATA, and re-exporting it applies the layout's title template
// to this page's own default, yielding "Name | Role" instead of "Name".

export default function Home(): React.ReactElement {
  return <Studio />;
}
