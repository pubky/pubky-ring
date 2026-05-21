import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import { memo } from 'react';
const SvgShare = (props: SvgProps) => (
	<Svg fill="none" viewBox="0 0 24 24" {...props}>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M15.97 4.72a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.97-3.97-3.97-3.97a.75.75 0 0 1 0-1.06M3 7.5a.75.75 0 0 1 .75.75V19.5H18a.75.75 0 0 1 0 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V8.25A.75.75 0 0 1 3 7.5"
			clipRule="evenodd"
		/>
		<Path
			fill="currentColor"
			fillRule="evenodd"
			d="M15.75 10.5a8.254 8.254 0 0 0-7.99 6.188.75.75 0 1 1-1.452-.376A9.754 9.754 0 0 1 15.75 9H21a.75.75 0 0 1 0 1.5z"
			clipRule="evenodd"
		/>
	</Svg>
);
const Memo = memo(SvgShare);
export default Memo;
