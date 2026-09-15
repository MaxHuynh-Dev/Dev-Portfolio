import type React from 'react';
import type { Props } from 'react-inlinesvg';
import SVG from 'react-inlinesvg';

export default function SvgInsert(props: Props): React.ReactElement {
  return <SVG {...props} />;
}
